# FactoryPilot Architecture & Data Pipeline Specification

## 1. Data Ingestion & Signal Processing Pipeline

The FactoryPilot platform processes telemetry inputs from physical machinery and maps them into diagnostic indicators:

1. **Vibration Severity (ISO 10816)**:
   - Root-Mean-Square (RMS) vibration velocity $v_{\text{rms}}$ calculated over $10\text{ Hz} - 1,000\text{ Hz}$:
     $$v_{\text{rms}} = \sqrt{\frac{1}{T} \int_0^T v(t)^2 \, dt}$$
   - Evaluated against standard ISO 10816 boundaries:
     - **Zone A**: Good condition ($< 1.4\text{ mm/s}$ for Class II).
     - **Zone B**: Acceptable continuous duty ($1.4 - 2.8\text{ mm/s}$).
     - **Zone C**: Alert / maintenance advisory ($2.8 - 4.5\text{ mm/s}$).
     - **Zone D**: Critical vibration excursion ($> 4.5\text{ mm/s}$).

2. **Thermal Monitoring**:
   - Continuous RTD temperature telemetry.
   - $> 80^\circ\text{C}$: Advisory warning.
   - $> 95^\circ\text{C}$: Emergency trip.

3. **ChromaDB Vector Embeddings**:
   - Standard Operating Procedures (SOPs) and industrial manuals are parsed and indexed as semantic chunks.
   - Operators can retrieve precise torque specs, runout limits, and LOTO steps via natural language queries.
