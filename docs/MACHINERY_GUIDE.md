# FactoryPilot: Domain & Machinery Plain-Language Guide

> A practical, plain-language engineering reference explaining the industrial machinery, sensor channels, and failure mechanisms monitored by **FactoryPilot**.

---

## 1. Introduction: Why Plain-Language Machinery Guides Matter

Modern industrial plants rely on rotating turbomachinery and precision motorized spindles that operate under immense thermal, mechanical, and hydraulic stress. When machines fail unexpectedly, the consequences include catastrophic downtime, worker safety hazards, and tens of thousands of dollars per hour in halted production.

FactoryPilot monitors two flagship asset types:
1. **`PUMP-01` (Centrifugal Slurry Booster Pump)** — The heavy lifter of fluid transportation.
2. **`CNC-SPINDLE-01` (HSK-A63 High-Speed Electro-Spindle)** — The micrometric heart of precision manufacturing.

This guide explains what each machine does, how its physical parts work, how sensors detect distress, and what technicians must do to prevent breakdowns.

---

## 2. Asset Profile: `PUMP-01` (Centrifugal Slurry Booster Pump)

### 2.1 What PUMP-01 Does
**`PUMP-01`** is a heavy-duty centrifugal booster pump designed to transport high-density, abrasive fluid-solid mixtures ("slurries") across mineral processing, chemical processing, and wastewater treatment lines. Unlike clean water pumps, a slurry pump handles suspended rocks, grit, sand, and chemical reagents that relentlessly abrade internal surfaces.

* **Asset Identifier:** `PUMP-01`
* **Model Class:** Heavy Slurry Booster Pump (Class II Industrial Machine)
* **Operating Speed:** Nominal 1,750 RPM
* **Drive:** 75 kW 3-Phase Induction Motor (480V, 60 Hz)
* **Nominal Current:** 115 A – 125 A (Full Load Amps: 135 A)

```
                       ┌─────────────────────────┐
Suction Inlet ───────►│ Impeller & Volute Casing │───────► Discharge Line
(Fluid + Solids)       │ (Converts RPM to Head)  │         (Pressurized Slurry)
                       └────────────┬────────────┘
                                    │ Shaft & Mechanical Seals
                       ┌────────────┴────────────┐
                       │ Bearing Pedestal (6205) │
                       └────────────┬────────────┘
                                    │ Flexible Coupling
                       ┌────────────┴────────────┐
                       │ 75 kW Induction Motor   │
                       └─────────────────────────┘
```

### 2.2 Critical Physical Subsystems
1. **Centrifugal Impeller & Volute Liner:**
   A high-chrome alloy rotating wheel with backwards-curved vanes. It imparts kinetic energy to the slurry, throwing it outward into the volute casing to generate discharge pressure.
2. **Mechanical Shaft Seals & Expeller:**
   Prevents pressurized, abrasive slurry from escaping along the rotating shaft into the atmosphere or the bearing housing.
3. **Bearing Assembly (Drive-End & Non-Drive-End):**
   Heavy-duty angular contact and deep-groove ball bearings lubricated with grease or oil bath. They support radial hydraulic loads and axial thrust forces.
4. **Suction Strainer & Piping:**
   Intake basket designed to filter out oversized debris that could jam the impeller vanes.

---

### 2.3 Primary Failure Modes & Sensor Signatures

#### A. Impeller Cavitation
* **What Happens:** When suction pressure drops below the fluid's vapor pressure (often caused by an obstructed intake, closed valve, or low tank level), vapor bubbles rapidly form in the low-pressure eye of the impeller. As these bubbles travel into higher pressure regions near the vane tips, they implode violently with micro-jets reaching up to 1,000 m/s and 10,000 bar local pressure.
* **Physical Effect:** "Pitting" and erosion of the metal impeller vanes, destroyed hydraulic efficiency, and severe mechanical vibration.
* **Audible Signature:** Sounds like gravel, marbles, or rattling rocks swirling inside the pump casing.
* **Sensor Correlates:**
  - **Acoustic Intensity:** Spikes above **85.0 dB** (ultrasonic emissions between 10 kHz – 35 kHz).
  - **Vibration RMS:** Escalates into **ISO Zone C/D (>4.5 mm/s to >7.1 mm/s)**.
  - **Current Draw:** Mild hunting or fluctuations ($\pm 10\text{ A}$) due to unstable hydraulic loading.

#### B. Suction Strainer Blockage / Flow Starvation
* **What Happens:** Heavy debris or slurry slurry cake clogs the intake basket, restricting flow into the pump suction port.
* **Physical Effect:** Severe Net Positive Suction Head available ($NPSH_a$) deficit, accelerating cavitation and causing motor undercurrent or erratic surging.
* **Sensor Correlates:**
  - Elevated acoustic emissions ($>80\text{ dB}$).
  - Low or unstable motor current with erratic head pressure.

#### C. Bearing Journal & Lubricant Breakdown
* **What Happens:** Slurry grit penetrates worn labyrinth seals into the bearing pedestal, or high ambient heat oxidizes the grease. Without an adequate hydrodynamic lubricant film, steel-on-steel contact occurs between balls and raceways.
* **Physical Effect:** Rapid friction heating, race spalling, and eventual seizure of the pump shaft.
* **Sensor Correlates:**
  - **Bearing Temperature:** Rises sharply through **80°C (Warning)** toward **95°C (Critical Trip)**.
  - **Vibration RMS:** Steady progression into **ISO Zone D (>7.1 mm/s)**.
  - **Current Draw:** Increases as mechanical friction creates motor drag.

---

## 3. Asset Profile: `CNC-SPINDLE-01` (HSK-A63 High-Speed Electro-Spindle)

### 3.1 What CNC-SPINDLE-01 Does
**`CNC-SPINDLE-01`** is a state-of-the-art motorized electro-spindle installed on a 5-axis Computer Numerical Control (CNC) milling center (such as a DMG Mori or Makino). It directly rotates cutting tools (end mills, drills, face cutters) at speeds up to **24,000 RPM** to carve aerospace-grade titanium, aluminum impellers, and hardened tool steels to tolerances within $\pm 0.003\text{ mm}$ (3 microns).

* **Asset Identifier:** `CNC-SPINDLE-01`
* **Spindle Interface:** HSK-A63 Hollow Shank Taper
* **Maximum Speed:** 24,000 RPM (Variable Frequency Drive controlled)
* **Drive:** Built-in Synchronous AC Motor (30 kW)
* **Nominal Current:** 12 A – 16 A (Full Load Amps: 22 A)

```
                ┌──────────────────────────────────────┐
Tool Holder ───►│ HSK-A63 Taper & Drawbar Mechanism    │
(Micro-Clamped) ├──────────────────────────────────────┤
                │ Hybrid Ceramic Front Bearing Set     │◄── Accelerometer & RTD
                ├──────────────────────────────────────┤
                │ Water-Cooled Stator Housing          │◄── Coolant Jacket
                ├──────────────────────────────────────┤
                │ Hybrid Ceramic Rear Bearing Set      │◄── RTD Sensor
                ├──────────────────────────────────────┤
                │ Optical Rotary Encoder & Purge Air   │
                └──────────────────────────────────────┘
```

### 3.2 Critical Physical Subsystems
1. **HSK-A63 Hollow Shank Taper & Collet Drawbar:**
   A high-rigidity 1:10 taper with dual-face and taper contact. Hydraulic or spring-actuated drawbars clamp the tool with up to 18 kN of retention force.
2. **Hybrid Ceramic Angular Contact Bearings:**
   Silicon nitride ($Si_3N_4$) ceramic balls with steel raceways. Ceramic balls are 40% lighter and generate significantly less centrifugal force and heat at 24,000 RPM than steel balls.
3. **Integral Liquid Cooling Jacket:**
   Closed-loop water-glycol fluid circulating through the spindle housing to remove motor stator heat and maintain thermal equilibrium.
4. **Pneumatic Air Purge Seal:**
   Positive internal air pressure (2.0 – 2.5 bar) that constantly blows outward around the nose to prevent cutting chips and coolant mist from entering the bearings.

---

### 3.3 Primary Failure Modes & Sensor Signatures

#### A. Bearing Raceway Spalling & Ball Skidding
* **What Happens:** Heavy roughing cuts or interrupted tool paths cause micro-fatigue cracks on the ultra-smooth inner and outer bearing raceways. At 24,000 RPM, rolling elements pass over these micro-defects hundreds of times per second.
* **Physical Effect:** Degradation of spindle rotational stiffness, poor workpiece surface finish ("chatter marks"), and geometric out-of-roundness.
* **Sensor Correlates:**
  - **Crest Factor ($CF$):** Rises above **4.5** (sharp, periodic impact pulses).
  - **Vibration Velocity:** Crosses **2.8 mm/s (Alert)** and progresses into **ISO Zone D**.
  - **Rotational Speed:** Micro-fluctuations under cut load.

#### B. Thermal Runaway & Stator Overheating
* **What Happens:** The external chiller fails, coolant channels develop biological scale buildup, or excessive preload friction overheats the front bearings.
* **Physical Effect:** Differential thermal expansion causes the rotating shaft to grow axially, destroying machining $Z$-depth tolerances and eventually seizing the ceramic balls inside the steel raceways.
* **Sensor Correlates:**
  - **Bearing Temperature:** Exceeds **80.0°C (Warning)** and climbs above **85°C**.
  - **Current Draw:** Spikes above **18.5 A (120% Full Load Amps)** due to rotor thermal expansion drag.
  - **Vibration:** May remain low initially, distinguishing thermal overload from mechanical unbalance.

#### C. Tool Clamp Runout & Spindle Misalignment
* **What Happens:** Fine aluminum or iron dust contaminates the HSK taper face, preventing full seating. Alternatively, a severe tool collision slightly unseats the spindle cartridge bearings.
* **Physical Effect:** Excessive radial runout ($>3\ \mu\text{m}$), accelerated uneven bearing wear, tool chatter, and premature carbide tool breakage.
* **Sensor Correlates:**
  - High vibration RMS directly proportional to RPM squared ($v \propto \omega^2$).
  - Elevated 1X and 2X rotational harmonic vibration frequencies.

---

## 4. Machine Condition Threshold Matrix

FactoryPilot monitors machinery using standardized international criteria combined with calibrated physics bounds:

| Metric Channel | Normal / Nominal | Warning / Alert | Critical Emergency Trip | Standard / Basis |
| :--- | :--- | :--- | :--- | :--- |
| **Vibration RMS (`vibration_rms_mms`)** | $< 2.80\text{ mm/s}$ (Zone A/B) | $2.80 - 7.10\text{ mm/s}$ (Zone C) | $> 7.10\text{ mm/s}$ (Zone D) | **ISO 10816-3 (Class II)** |
| **Bearing Temperature (`bearing_temperature_c`)** | $< 70.0^\circ\text{C}$ | $70.0^\circ\text{C} - 80.0^\circ\text{C}$ | $> 85.0^\circ\text{C} - 95.0^\circ\text{C}$ | **DIN 43760 / SKF Limits** |
| **Acoustic Intensity (`acoustic_db`)** | $< 75.0\text{ dB}$ | $75.0 - 85.0\text{ dB}$ | $> 85.0\text{ dB}$ (Ultrasonic) | **Hydraulic Institute / Cavitation** |
| **Motor Current - Pump (`current_draw_amps`)** | $110.0 - 125.0\text{ A}$ | $126.0 - 135.0\text{ A}$ | $> 135.0\text{ A}$ ($>120\%\text{ FLA}$) | **NEMA MG-1 Motor Standards** |
| **Motor Current - Spindle (`current_draw_amps`)** | $10.0 - 16.0\text{ A}$ | $16.5 - 18.5\text{ A}$ | $> 20.0\text{ A}$ (Overload Trip) | **Spindle Drive VFD Envelope** |
| **Crest Factor (`crest_factor`)** | $< 3.50$ | $3.50 - 4.50$ | $> 5.00$ (Severe Impact) | **Bearing Defect Diagnostics** |

---

## 5. Standard Safety & Intervention Protocols (OSHA 1910.147)

Whenever FactoryPilot detects an anomaly in **Zone D** or an impending mechanical seizure:
1. **Never attempt inspection while the machine is energized or rotating.**
2. **Execute Mandatory OSHA 29 CFR 1910.147 LOTO Protocol:**
   - **Step 1 (Notify):** Inform affected production area supervisor and floor operators.
   - **Step 2 (Shut Down):** Normal controlled stop sequence via local HMI.
   - **Step 3 (Isolate):** Open the 480V motor control center (MCC) disconnect switch.
   - **Step 4 (Lock & Tag):** Place personalized lockout padlock and danger tag on the breaker handle.
   - **Step 5 (Dissipate Stored Energy):**
     - For `PUMP-01`: Close suction and discharge isolation valves, open casing bleed valve to drop fluid pressure to 0.00 bar.
     - For `CNC-SPINDLE-01`: Vent pneumatic purge pressure, wait for spindle to stop rotating completely, disconnect tool drawbar cylinder.
   - **Step 6 (Verify Zero Energy):** Test with a calibrated CAT-IV multimeter across all phase lines (L1-L2, L2-L3, L1-L3, and phases to ground) to confirm 0.00V. Attempt a manual local start to prove isolation.
