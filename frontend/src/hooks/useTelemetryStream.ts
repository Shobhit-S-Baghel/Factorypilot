"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TelemetryPoint } from "@/components/TelemetryChart";
import { AnomalyRecord } from "@/components/AnomalyTable";

export type ConnectionState = "Live" | "Reconnecting" | "Offline";
export type SpeedMultiplier = 1 | 2 | 5;

export interface TelemetryTickFrame {
  type: string;
  tick: number;
  total_ticks: number;
  scenario: string;
  machine_id: string;
  timestamp: string;
  rotational_speed_rpm: number;
  vibration_rms_mms: number;
  bearing_temperature_c: number;
  current_draw_amps: number;
  acoustic_db: number;
  is_anomaly: boolean;
  risk_score: number;
  iso_10816_zone: string;
  thermal_status: string;
  alerts: string[];
}

export interface UseTelemetryStreamOptions {
  url?: string;
  defaultScenario?: string;
  defaultSpeed?: SpeedMultiplier;
  bufferSize?: number; // default 60
  autoStart?: boolean;
}

export function useTelemetryStream(options: UseTelemetryStreamOptions = {}) {
  const {
    url = (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WS_URL)
      ? `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/telemetry/ws/stream`
      : "ws://localhost:8000/api/v1/telemetry/ws/stream",
    defaultScenario = "centrifugal_pump_cavitation",
    defaultSpeed = 1,
    bufferSize = 60,
    autoStart = true,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("Offline");
  const [isPlaying, setIsPlaying] = useState<boolean>(autoStart);
  const [scenario, setScenarioState] = useState<string>(defaultScenario);
  const [speedMultiplier, setSpeedMultiplierState] = useState<SpeedMultiplier>(defaultSpeed);
  const [latestFrame, setLatestFrame] = useState<TelemetryTickFrame | null>(null);
  const [telemetryBuffer, setTelemetryBuffer] = useState<TelemetryPoint[]>([]);
  const [anomalyTimeline, setAnomalyTimeline] = useState<AnomalyRecord[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [totalTicks, setTotalTicks] = useState<number>(120);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isManuallyClosedRef = useRef<boolean>(false);

  // Sync refs to avoid stale closure in WS event handlers
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  const speedToIntervalMs = (speed: SpeedMultiplier): number => {
    switch (speed) {
      case 5:
        return 50;
      case 2:
        return 125;
      case 1:
      default:
        return 250;
    }
  };

  const sendCommand = useCallback((payload: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
      } catch (err) {
        console.warn("[TelemetryStream] Failed to send WebSocket message:", err);
      }
    }
  }, []);

  const formatTimeString = (isoTimestamp: string) => {
    try {
      const d = new Date(isoTimestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoTimestamp.slice(11, 19);
    }
  };

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
    }

    setConnectionState((prev) => (prev === "Live" ? "Reconnecting" : prev === "Offline" ? "Reconnecting" : prev));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnectionState("Live");

        // Immediately start or request state based on isPlaying
        if (isPlayingRef.current) {
          sendCommand({
            action: "start",
            scenario: scenarioRef.current,
            interval_ms: speedToIntervalMs(speedRef.current),
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "telemetry_tick") {
            const frame = data as TelemetryTickFrame;
            setLatestFrame(frame);
            setCurrentTick(frame.tick);
            setTotalTicks(frame.total_ticks || 120);

            if (frame.alerts && frame.alerts.length > 0) {
              setAlerts(frame.alerts);
            }

            const timeLabel = formatTimeString(frame.timestamp);

            const point: TelemetryPoint = {
              time: timeLabel,
              timestamp: frame.timestamp,
              vibration_rms: frame.vibration_rms_mms,
              bearing_temp: frame.bearing_temperature_c,
              rpm: frame.rotational_speed_rpm,
              current_amps: frame.current_draw_amps,
              acoustic_db: frame.acoustic_db,
              is_anomaly: frame.is_anomaly,
              anomaly_score: frame.risk_score ? frame.risk_score / 100 : undefined,
            };

            // Rolling circular ring buffer retaining last `bufferSize` items
            setTelemetryBuffer((prev) => {
              const next = [...prev, point];
              if (next.length > bufferSize) {
                return next.slice(next.length - bufferSize);
              }
              return next;
            });

            // If anomaly, append to timeline log
            if (frame.is_anomaly) {
              let primaryMetric = "vibration_rms_mms";
              if (frame.acoustic_db > 85.0) primaryMetric = "acoustic_db";
              else if (frame.bearing_temperature_c > 80.0) primaryMetric = "bearing_temperature_c";

              const anomRecord: AnomalyRecord = {
                timestamp: frame.timestamp,
                machine_id: frame.machine_id,
                is_anomaly: true,
                anomaly_score: (frame.risk_score || 50) / 100,
                risk_score: frame.risk_score || 50,
                iso_10816_zone: frame.iso_10816_zone,
                thermal_status: frame.thermal_status,
                primary_contributor: primaryMetric,
                affected_metrics: frame.alerts || [primaryMetric],
              };

              setAnomalyTimeline((prev) => {
                // Keep the last 50 anomalies, newest first
                const updated = [anomRecord, ...prev.filter((item) => item.timestamp !== frame.timestamp)];
                return updated.slice(0, 50);
              });
            }
          } else if (data.type === "control_ack") {
            if (data.current_tick !== undefined) {
              setCurrentTick(data.current_tick);
            }
          } else if (data.type === "connection_established") {
            // Connection ready
          }
        } catch (err) {
          console.warn("[TelemetryStream] Error parsing frame:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("[TelemetryStream] WebSocket error:", err);
      };

      ws.onclose = () => {
        if (isManuallyClosedRef.current) {
          setConnectionState("Offline");
          return;
        }

        setConnectionState("Reconnecting");

        // Exponential backoff formula: min(1000 * 2^attempts, 10000)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.warn("[TelemetryStream] Connection initiation failed:", err);
      setConnectionState("Offline");
    }
  }, [url, bufferSize, sendCommand]);

  // Connect on mount
  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Controls API
  const play = useCallback(
    (newScenario?: string, newSpeed?: SpeedMultiplier) => {
      const activeScen = newScenario || scenarioRef.current;
      const activeSpd = newSpeed || speedRef.current;
      setIsPlaying(true);
      if (newScenario) setScenarioState(newScenario);
      if (newSpeed) setSpeedMultiplierState(newSpeed);

      sendCommand({
        action: "start",
        scenario: activeScen,
        interval_ms: speedToIntervalMs(activeSpd),
      });
    },
    [sendCommand]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
    sendCommand({ action: "pause" });
  }, [sendCommand]);

  const resume = useCallback(() => {
    setIsPlaying(true);
    sendCommand({ action: "resume" });
  }, [sendCommand]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    sendCommand({ action: "stop" });
    setCurrentTick(0);
    setTelemetryBuffer([]);
    setAnomalyTimeline([]);
    setAlerts([]);
  }, [sendCommand]);

  const seek = useCallback(
    (tick: number) => {
      setCurrentTick(tick);
      sendCommand({ action: "seek", tick });
    },
    [sendCommand]
  );

  const setSpeed = useCallback(
    (speed: SpeedMultiplier) => {
      setSpeedMultiplierState(speed);
      if (isPlayingRef.current) {
        sendCommand({
          action: "start",
          scenario: scenarioRef.current,
          interval_ms: speedToIntervalMs(speed),
        });
      }
    },
    [sendCommand]
  );

  const setScenario = useCallback(
    (newScenario: string) => {
      setScenarioState(newScenario);
      setTelemetryBuffer([]);
      setAnomalyTimeline([]);
      setAlerts([]);
      sendCommand({
        action: "start",
        scenario: newScenario,
        interval_ms: speedToIntervalMs(speedRef.current),
      });
      setIsPlaying(true);
    },
    [sendCommand]
  );

  return {
    connectionState,
    isPlaying,
    scenario,
    speedMultiplier,
    latestFrame,
    telemetryBuffer,
    anomalyTimeline,
    alerts,
    currentTick,
    totalTicks,
    play,
    pause,
    resume,
    reset,
    seek,
    setSpeed,
    setScenario,
    reconnect: connect,
  };
}
