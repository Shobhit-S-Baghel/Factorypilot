import io
import logging
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime
import pandas as pd
import numpy as np

from app.schemas.sensor_schemas import (
    RawSensorRecord,
    SensorChannelStats,
    TelemetryUploadResponse,
)

logger = logging.getLogger(__name__)

REQUIRED_SENSOR_CHANNELS = [
    "timestamp",
    "machine_id",
    "rotational_speed_rpm",
    "vibration_rms_mms",
    "bearing_temperature_c",
    "current_draw_amps",
    "acoustic_db",
]

NUMERIC_SENSOR_CHANNELS = [
    "rotational_speed_rpm",
    "vibration_rms_mms",
    "bearing_temperature_c",
    "current_draw_amps",
    "acoustic_db",
]


class TelemetryProcessingError(Exception):
    """Custom exception raised when telemetry CSV validation or ingestion fails."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class TelemetryService:
    """Production ingestion and rolling feature extraction pipeline for industrial telemetry."""

    def parse_and_validate_csv(self, file_content: bytes) -> pd.DataFrame:
        """Parse raw CSV bytes, validate required channels, handle missing values, and verify timestamps."""
        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise TelemetryProcessingError(f"Malformed CSV file format: {str(e)}", status_code=400)

        # 1. Channel presence validation
        missing_channels = [col for col in REQUIRED_SENSOR_CHANNELS if col not in df.columns]
        if missing_channels:
            raise TelemetryProcessingError(
                f"Missing required sensor channels: {missing_channels}. Required: {REQUIRED_SENSOR_CHANNELS}",
                status_code=400,
            )

        if len(df) == 0:
            raise TelemetryProcessingError("Uploaded CSV is empty and contains no records.", status_code=400)

        # 2. Timestamp parsing & monotonic verification
        try:
            df["parsed_timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
        except Exception as e:
            raise TelemetryProcessingError(
                f"Invalid timestamp format in CSV. Timestamps must be valid ISO-8601 or standard datetimes: {str(e)}",
                status_code=400,
            )

        # Verify monotonicity or chronologically sort
        if not df["parsed_timestamp"].is_monotonic_increasing:
            logger.warning("Uploaded telemetry timestamps are not strictly monotonic increasing. Sorting chronologically.")
            df = df.sort_values(by="parsed_timestamp").reset_index(drop=True)

        # 3. Numeric type conversion and missing-value handling
        for col in NUMERIC_SENSOR_CHANNELS:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Forward-fill then backward-fill missing sensor values
        df[NUMERIC_SENSOR_CHANNELS] = df[NUMERIC_SENSOR_CHANNELS].ffill().bfill()

        # If any rows still contain NaN (e.g. column entirely null), fill with safe median or drop
        for col in NUMERIC_SENSOR_CHANNELS:
            if df[col].isna().any():
                col_median = df[col].median()
                df[col] = df[col].fillna(col_median if not np.isnan(col_median) else 0.0)

        # Clean string machine_id
        df["machine_id"] = df["machine_id"].astype(str).str.strip()
        return df

    def compute_channel_stats(self, series: pd.Series) -> SensorChannelStats:
        """Compute standard summary metrics including peak-to-peak variance and crest factor."""
        values = series.dropna().to_numpy()
        if len(values) == 0:
            return SensorChannelStats(mean=0.0, std=0.0, min=0.0, max=0.0, peak_to_peak=0.0, crest_factor=1.0)

        mean_val = float(np.mean(values))
        std_val = float(np.std(values))
        min_val = float(np.min(values))
        max_val = float(np.max(values))
        peak_to_peak = float(max_val - min_val)

        # Crest factor = Peak Amplitude / RMS
        peak_amp = float(np.max(np.abs(values)))
        rms_val = float(np.sqrt(np.mean(values ** 2)))
        crest_factor = float(peak_amp / rms_val) if rms_val > 1e-6 else 1.0

        return SensorChannelStats(
            mean=round(mean_val, 3),
            std=round(std_val, 3),
            min=round(min_val, 3),
            max=round(max_val, 3),
            peak_to_peak=round(peak_to_peak, 3),
            crest_factor=round(crest_factor, 3),
        )

    def extract_rolling_5min_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract rolling 5-minute statistical window metrics (mean, std, peak-to-peak, crest factor)."""
        feature_df = df.copy()
        feature_df = feature_df.set_index("parsed_timestamp")

        for col in NUMERIC_SENSOR_CHANNELS:
            # 5-minute time window rolling
            rolling_window = feature_df[col].rolling("5min", min_periods=1)
            
            feature_df[f"{col}_rolling_mean"] = rolling_window.mean()
            feature_df[f"{col}_rolling_std"] = rolling_window.std().fillna(0.0)
            feature_df[f"{col}_rolling_min"] = rolling_window.min()
            feature_df[f"{col}_rolling_max"] = rolling_window.max()
            feature_df[f"{col}_peak_to_peak"] = feature_df[f"{col}_rolling_max"] - feature_df[f"{col}_rolling_min"]

            # Rolling crest factor: max(abs(x)) / sqrt(mean(x^2))
            rolling_rms = (feature_df[col] ** 2).rolling("5min", min_periods=1).mean().apply(np.sqrt)
            rolling_peak = feature_df[col].abs().rolling("5min", min_periods=1).max()
            feature_df[f"{col}_crest_factor"] = (rolling_peak / (rolling_rms.replace(0.0, 1e-6))).fillna(1.0)

        feature_df = feature_df.reset_index()
        return feature_df

    def process_csv_upload(self, file_content: bytes) -> Tuple[TelemetryUploadResponse, pd.DataFrame]:
        """Full pipeline executing CSV parsing, validation, rolling feature extraction, and payload summary."""
        df = self.parse_and_validate_csv(file_content)
        features_df = self.extract_rolling_5min_features(df)

        machine_id = str(df["machine_id"].iloc[0])
        time_start = df["parsed_timestamp"].iloc[0].to_pydatetime()
        time_end = df["parsed_timestamp"].iloc[-1].to_pydatetime()

        # Compute sampling rate
        duration_sec = (time_end - time_start).total_seconds()
        sampling_rate = round(duration_sec / max(1, len(df) - 1), 2) if len(df) > 1 else 1.0

        # Channel summary
        summary_stats: Dict[str, SensorChannelStats] = {}
        for col in NUMERIC_SENSOR_CHANNELS:
            summary_stats[col] = self.compute_channel_stats(df[col])

        # Preview records (first 5 records formatted cleanly)
        preview_records = []
        for _, row in df.head(5).iterrows():
            preview_records.append({
                "timestamp": row["parsed_timestamp"].isoformat(),
                "machine_id": str(row["machine_id"]),
                "rotational_speed_rpm": float(row["rotational_speed_rpm"]),
                "vibration_rms_mms": float(row["vibration_rms_mms"]),
                "bearing_temperature_c": float(row["bearing_temperature_c"]),
                "current_draw_amps": float(row["current_draw_amps"]),
                "acoustic_db": float(row["acoustic_db"]),
            })

        response = TelemetryUploadResponse(
            status="success",
            message=f"Successfully ingested and processed {len(df)} telemetry records for asset {machine_id}.",
            machine_id=machine_id,
            total_records_ingested=len(df),
            time_window_start=time_start,
            time_window_end=time_end,
            sampling_rate_seconds=sampling_rate,
            feature_summary=summary_stats,
            preview_records=preview_records,
        )

        return response, features_df


telemetry_service = TelemetryService()
