# FactoryPilot: 3-Minute Live Hackathon Pitch & Demo Walkthrough

> **Presenters:** Reliability Engineering & AI Team  
> **Target Audience:** Hackathon Judges, Plant Operations Directors, Reliability Managers  
> **Duration:** Exactly 3 Minutes (180 Seconds)  
> **Demo URL:** `http://localhost:3000` | **Backend Docs:** `http://localhost:8000/docs`

---

## Pitch Hook (15 Seconds)
> *"Every minute an industrial slurry booster pump or CNC electro-spindle fails unexpectedly costs manufacturing plants over $15,000 in unplanned downtime. Today, technicians must manually decipher complex multi-channel sensor logs and search through 400-page paper operating manuals.  
> **Meet FactoryPilot**: the real-time AI copilot that unifies high-frequency telemetry streaming, automated ISO 10816-3 anomaly detection, and semantic vector RAG to dispatch certified OSHA work orders in seconds."*

---

## Minute 1: Telemetry Ingestion & Instant Anomaly Detection (0:15 - 1:00)

### On-Screen Action:
1. Open dashboard at [http://localhost:3000](http://localhost:3000).
2. Point out the matte industrial interface, ISO 10816-3 status banner, and the 5 precision metric cards.
3. Scroll to the **Data Ingestion Panel**, click **Select Sample CSV**, and choose:
   `centrifugal_pump_cavitation.csv` (or drag-and-drop the file).
4. Click **Ingest & Run Diagnostics**.

### Speaker Script:
> *"Let's look at a real-world scenario. A reliability technician on shift suspects abnormal pump behavior. Rather than manually plotting CSV logs in Excel, they drop the 6-channel sensor capture directly into FactoryPilot.  
> Behind the scenes, our FastAPI engine validates the monotonic time-series, extracts rolling 5-minute statistical windows (RMS velocity, crest factor, and acoustic energy), and runs an unsupervised Isolation Forest model.  
> Within 180 milliseconds, look at the dashboard:  
> - Our **Equipment Health Index** immediately drops to **54% (Degraded)**.  
> - The **ISO 10816-3 Severity Matrix** flags the machine in **Zone C Alert** at 4.4 mm/s.  
> - And our attribution model instantly identifies that **vibration RMS (58%)** and **acoustic intensity (24%)** are the root drivers of the anomaly, while motor current remains nominal."*

---

## Minute 2: Real-Time WebSocket Telemetry Playback & Condition Gauges (1:00 - 2:00)

### On-Screen Action:
1. Navigate to the **Stream Controls** toolbar at the top of the dashboard.
2. Select the scenario dropdown: **"CNC Bearing Wear"** (`CNC-SPINDLE-01`).
3. Set speed multiplier to **2x** and click **Play Stream**.
4. Observe the **Precision Plant Floor Gauges**:
   - The **Vibration Severity Dial** needle sweeps dynamically into **Zone D (>7.1 mm/s)**.
   - The **Bearing Thermal Monitor** color shifts from teal to warning amber, then to crimson as it crosses **80°C**.
   - The **Acoustic VU Meter** pulses with high-frequency cavitation pings (**>85 dB**).
5. Watch the **Emergency Alert Ribbon** trigger across the top of the screen with a visual pulsing red banner and optional audio beacon.

### Speaker Script:
> *"Now, let's switch from static batch analysis to **live machine telemetry emulation**. FactoryPilot features a bidirectional WebSocket engine streaming 4 frames per second with a 60-point rolling circular buffer.  
> As we trigger the **CNC Spindle Bearing Wear** failure mode at 2x speed, watch our plant-floor condition gauges react in real time:  
> - Notice the **ISO 10816-3 Vibration Meter** transitioning through Zone B, into Zone C, and now tripping into **Zone D at 7.8 mm/s**.  
> - The **Bearing Housing RTD** dynamically warms up, crossing the critical 80°C boundary.  
> - And immediately, our **Critical Emergency Alert Ribbon** activates, pinpointing the offending channel and issuing an automatic **LOTO Protocol Advised** badge under OSHA 29 CFR 1910.147."*

---

## Minute 3: Vector RAG Manual Copilot & Work Order Dispatch (2:00 - 3:00)

### On-Screen Action:
1. Scroll down to the **Diagnostic AI Copilot Dock** on the right side.
2. Type or select the preloaded query:  
   *"Severe vibration and cavitation noise in suction line. What are the ISO 10816 limits and mandatory LOTO steps?"*
3. Click **Ask Copilot**.
4. Review the RAG response:
   - Root-cause ranking (Cavitation 88%, Impeller Unbalance 74%).
   - Direct manual chapter citation (`centrifugal_pump_manual.md` - Section 4.3).
   - Sequential field inspection steps with safety precautions.
5. Click **Export Work Order** in the top banner or emergency ribbon.
6. In the **TicketModal**:
   - Show live sensor telemetry snapshot.
   - Check off Step 1 (*480V MCC Breaker Locked Out*) and Step 2 (*Hydraulic Double Block & Bleed*).
   - Click **Download Work Order (.MD)**.
7. Show downloaded file: `WORK_ORDER_PUMP-01_20261018.md`.

### Speaker Script:
> *"Now that the fault is isolated, what does the technician do? In a traditional plant, they would dig through binders for hours.  
> With FactoryPilot, they ask our **Vector RAG Diagnostic Copilot**. In real time, the copilot queries our semantic ChromaDB vector index over the plant operating manuals. It returns:  
> 1. Exact root-cause probabilities.  
> 2. Specific chapter citations from Section 4.3 of the manufacturer manual.  
> 3. And mandatory OSHA 1910.147 zero-energy safety precautions.  
> Finally, with a single click on **Export Work Order**, the technician opens our standardized work order generator. The system automatically captures the live sensor readings, completed isolation steps, and AI mitigation procedures into an official, signed Markdown work order ready for field deployment.  
> From raw sensor vibration to a certified, safe maintenance intervention in under 3 minutes. That is the power of FactoryPilot."*

---

## Judge Q&A Cheat Sheet

| Question | Winning Answer |
| :--- | :--- |
| **How does FactoryPilot handle offline / air-gapped manufacturing environments?** | *"Both the ML anomaly engine and vector RAG copilot include zero-cloud fallback modes. If external ChromaDB or OpenAI servers are unreachable, our embedded TF-IDF cosine index and local Isolation Forest run 100% on-premise on edge gateways."* |
| **Why ISO 10816-3 instead of arbitrary thresholding?** | *"ISO 10816-3 is the globally accepted industrial standard for mechanical vibration severity on industrial pumps, motors, and turbines. Calibrating against Class II boundaries guarantees zero false trips during nominal startup while reliably catching Zone D excursions."* |
| **How do you ensure chart rendering performance over WebSockets?** | *"We maintain a fixed 60-point circular ring buffer in React state and set `isAnimationActive={false}` on Recharts lines, maintaining 60 FPS on standard laptop hardware without memory leaks."* |
| **How does this integrate into existing SCADA / CMMS systems?** | *"FactoryPilot exposes standard RESTful endpoints and WebSockets that integrate directly into SAP PM, Maximo, or ignition SCADA systems using clean JSON work orders."* |
