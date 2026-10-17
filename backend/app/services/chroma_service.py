import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.models.schemas import ManualSearchResult

logger = logging.getLogger(__name__)


class ChromaService:
    def __init__(self) -> None:
        self.client: Optional[chromadb.ClientAPI] = None
        self.collection: Any = None
        self._is_connected: bool = False

    def connect(self) -> bool:
        """Attempt connection to ChromaDB server with graceful in-memory fallback."""
        try:
            logger.info(
                f"Connecting to ChromaDB at host: {settings.CHROMA_HOST}, port: {settings.CHROMA_PORT}"
            )
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            # Test connectivity
            self.client.heartbeat()
            self.collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME
            )
            self._is_connected = True
            logger.info("Successfully connected to ChromaDB cluster.")
            return True
        except Exception as e:
            logger.warning(
                f"Could not connect to external ChromaDB service: {e}. Falling back to ephemeral in-memory client."
            )
            try:
                self.client = chromadb.EphemeralClient(
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
                self.collection = self.client.get_or_create_collection(
                    name=settings.CHROMA_COLLECTION_NAME
                )
                self._is_connected = True
                self._seed_default_manual_vectors()
                return True
            except Exception as inner_e:
                logger.error(f"Failed to initialize fallback ChromaDB: {inner_e}")
                self._is_connected = False
                return False

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def query_manuals(
        self, query_text: str, n_results: int = 3, machine_filter: Optional[str] = None
    ) -> List[ManualSearchResult]:
        if not self._is_connected or self.collection is None:
            # Return baseline industrial knowledge snippet if disconnected
            return self._fallback_knowledge_search(query_text)

        try:
            where_clause = {"machine": machine_filter} if machine_filter else None
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where_clause,
            )

            formatted: List[ManualSearchResult] = []
            if results and "documents" in results and results["documents"]:
                docs = results["documents"][0]
                ids = results["ids"][0] if "ids" in results else []
                metadatas = results["metadatas"][0] if "metadatas" in results else []
                distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)

                for i, doc in enumerate(docs):
                    meta = metadatas[i] if i < len(metadatas) else {}
                    score = 1.0 - distances[i] if i < len(distances) and distances[i] is not None else 0.85
                    formatted.append(
                        ManualSearchResult(
                            document_id=ids[i] if i < len(ids) else f"doc-{i}",
                            source_manual=str(meta.get("source", "Technical Manual")),
                            title=str(meta.get("title", "Instruction Section")),
                            content_snippet=doc,
                            score=max(0.0, min(1.0, float(score))),
                            metadata=meta,
                        )
                    )
            return formatted
        except Exception as ex:
            logger.error(f"Error querying ChromaDB: {ex}")
            return self._fallback_knowledge_search(query_text)

    def _seed_default_manual_vectors(self) -> None:
        """Seed initial industrial knowledge chunks for offline/testing readiness."""
        try:
            if not self.collection:
                return
            count = self.collection.count()
            if count > 0:
                return

            documents = [
                (
                    "ISO 10816 vibration severity standards define: Zone A (<1.4 mm/s RMS for Class II): Newly commissioned; "
                    "Zone B (1.4-2.8 mm/s): Unrestricted long-term operation; Zone C (2.8-4.5 mm/s): Restricted operation alert; "
                    "Zone D (>4.5 mm/s): Unacceptable risk of catastrophic structural damage. Immediate shutdown required."
                ),
                (
                    "Centrifugal Pump thermal threshold: Bearing temperatures exceeding 80°C trigger Level 2 Amber alert. "
                    "Temperatures exceeding 95°C require immediate emergency trip to prevent bearing seizure and shaft galling."
                ),
                (
                    "Centrifugal Pump Cavitation: Identified by 10-15 kHz high-frequency ultrasonic noise resembling gravel pumping, "
                    "discharge pressure flutter, and drop in net positive suction head available (NPSHa < NPSHr). "
                    "Throttling discharge valve or raising suction head restores flow lamina."
                ),
                (
                    "OSHA 1910.147 Lockout/Tagout (LOTO): 1. Notify affected personnel. 2. Orderly shutdown. "
                    "3. De-energize 480V 3-phase MCC breaker and apply padlock. 4. Double block and bleed suction/discharge lines. "
                    "5. Dissipate residual stored energy. 6. Verify zero energy state using calibrated multimeter and test run."
                ),
                (
                    "CNC Milling Spindle tolerances: Maximum continuous rating 24,000 RPM, peak 30,000 RPM. "
                    "Axial and radial runout must not exceed 0.002 mm (2 µm) TIR at spindle nose taper."
                ),
                (
                    "CNC Milling Spindle Coolant & Current: Thru-Spindle Coolant (TSC) minimum pressure 20 bar, flow 15 L/min. "
                    "Full Load Amps (FLA) normal idle 4.2A, peak cutting 18.5A. Spikes exceeding 125% FLA for >5 seconds "
                    "trigger instantaneous feed hold to prevent spindle stall and taper burn."
                ),
            ]

            ids = [f"iso-chunk-{i+1}" for i in range(len(documents))]
            metas = [
                {"source": "centrifugal_pump_manual.md", "title": "ISO 10816 Vibration Zones", "machine": "PUMP-01"},
                {"source": "centrifugal_pump_manual.md", "title": "Thermal Operational Limits", "machine": "PUMP-01"},
                {"source": "centrifugal_pump_manual.md", "title": "Cavitation Diagnostics", "machine": "PUMP-01"},
                {"source": "centrifugal_pump_manual.md", "title": "Mandatory LOTO Protocol", "machine": "PUMP-01"},
                {"source": "cnc_milling_spindle_manual.md", "title": "Spindle RPM & Runout Tolerances", "machine": "CNC-SPINDLE-01"},
                {"source": "cnc_milling_spindle_manual.md", "title": "Current Draw Spikes & Coolant Flow", "machine": "CNC-SPINDLE-01"},
            ]

            self.collection.add(
                documents=documents,
                ids=ids,
                metadatas=metas,
            )
            logger.info("Seeded initial industrial knowledge vectors into ChromaDB.")
        except Exception as e:
            logger.warning(f"Chroma initial vector seeding skipped: {e}")

    def _fallback_knowledge_search(self, query: str) -> List[ManualSearchResult]:
        q = query.lower()
        results = []
        if "vibration" in q or "iso" in q or "10816" in q or "zone" in q:
            results.append(
                ManualSearchResult(
                    document_id="fb-1",
                    source_manual="centrifugal_pump_manual.md",
                    title="ISO 10816 Vibration Standards",
                    content_snippet="ISO 10816 defines Zone A (<1.4 mm/s), Zone B (1.4-2.8 mm/s), Zone C (2.8-4.5 mm/s Alert), and Zone D (>4.5 mm/s Trip/Danger).",
                    score=0.92,
                )
            )
        if "temp" in q or "thermal" in q or "80" in q or "bearing" in q:
            results.append(
                ManualSearchResult(
                    document_id="fb-2",
                    source_manual="centrifugal_pump_manual.md",
                    title="Bearing Thermal Thresholds",
                    content_snippet="Bearings exceeding 80°C warrant preventative lubrication check. Exceeding 95°C demands emergency shutdown.",
                    score=0.88,
                )
            )
        if "spindle" in q or "rpm" in q or "runout" in q or "cnc" in q:
            results.append(
                ManualSearchResult(
                    document_id="fb-3",
                    source_manual="cnc_milling_spindle_manual.md",
                    title="Spindle Runout and RPM Limits",
                    content_snippet="Maximum RPM is 24,000 RPM continuous. Radial and axial runout must remain under 0.002 mm (2 µm).",
                    score=0.85,
                )
            )
        if not results:
            results.append(
                ManualSearchResult(
                    document_id="fb-def",
                    source_manual="general_plant_manual.md",
                    title="FactoryPilot Diagnostics Index",
                    content_snippet="Machinery operating under standard OSHA LOTO protocols and ISO 10816 vibration guidelines.",
                    score=0.70,
                )
            )
        return results


chroma_service = ChromaService()
