# FactoryPilot Standard Technical Operating Manual
## Document ID: SOP-CNC-SPINDLE-002 | Revision: 5.1
### High-Precision Electro-Spindle Subsystem (Series HSK-A63 / 30kW)

---

## 1. Operating Specifications & Maximum RPM Ratings

The HSK-A63 Direct-Drive Electro-Spindle is designed for 5-axis simultaneous high-speed machining (HSM) of aerospace titanium alloys, nickel superalloys, and hardened tool steels.

| Operational Parameter | Baseline Rating | Maximum Envelope Limit |
| :--- | :--- | :--- |
| **Maximum Continuous Speed** | $24,000\text{ RPM}$ | $24,000\text{ RPM}$ (S1 Continuous Duty) |
| **Peak Intermittent Speed** | $30,000\text{ RPM}$ | Max $10\text{ minutes}$ runtime (S6-40% Duty) |
| **Rated Motor Power Output** | $30.0\text{ kW}$ | $38.0\text{ kW}$ Peak (S6-40%) |
| **Continuous Torque ($S1$)** | $28.6\text{ N}\cdot\text{m}$ up to $10,000\text{ RPM}$ | Peak torque: $36.0\text{ N}\cdot\text{m}$ |
| **Tool Holder Interface** | HSK-A63 (DIN 69893-1) | Clamping Retention Force: $18.0\text{ kN} \pm 1.0\text{ kN}$ |
| **Dynamic Balance Quality** | ISO 1940-1 Grade G 0.4 | Residual unbalance $< 0.15\text{ g}\cdot\text{mm}$ |

---

## 2. Geometric Tolerances & Spindle Nose Runout Limits

Micron-level geometric alignment is paramount to prevent premature cutting tool chatter, harmonic vibration, and bearing raceway indentation.

### Runout Tolerances:
All measurements must be conducted at ambient temperature ($20^\circ\text{C} \pm 1^\circ\text{C}$) using an electronic dial test indicator (LVDT / dial gauge with $0.001\text{ mm}$ resolution) clamped rigidly to the machine Z-axis saddle:

1. **Internal Tool Taper Radial Runout**:
   - Total Indicated Runout (TIR) on internal HSK taper: $\le 0.0015\text{ mm}$ ($1.5\text{ }\mu\text{m}$).
2. **Standard Test Arbor Radial Runout**:
   - At spindle nose ($L=0\text{ mm}$): $\le 0.0020\text{ mm}$ ($2.0\text{ }\mu\text{m}$).
   - At extended distance ($L=300\text{ mm}$ from gauge line): $\le 0.0060\text{ mm}$ ($6.0\text{ }\mu\text{m}$).
3. **Axial Float / Face Runout**:
   - Axial face runout of spindle nose collar: $\le 0.0015\text{ mm}$ ($1.5\text{ }\mu\text{m}$).

*Diagnostic Action: If radial runout exceeds $0.004\text{ mm}$ at the nose, check for microscopic chips inside the taper, examine HSK drawbar collet fingers for galling, and inspect clamping ring pre-load.*

---

## 3. Electrical Current Draw & Overload Spike Diagnostics

The spindle motor is driven by a regenerative Variable Frequency Drive (VFD) operating on closed-loop vector control.

### Current Draw Profiles:
- **Nominal Full Load Amps (FLA)**: $18.5\text{ A}$ RMS at $400\text{ V}$ 3-phase.
- **Unloaded Free-Running Current**:
  - At $6,000\text{ RPM}$: $3.8\text{ A} - 4.5\text{ A}$.
  - At $24,000\text{ RPM}$: $6.2\text{ A} - 7.8\text{ A}$.
- **Cutting Load Operation**:
  - Roughing cuts: $14.0\text{ A} - 17.5\text{ A}$ (75% to 95% FLA).

### Current Spike Classifications & Automated Fault Actions:
```
+---------------------------------------------------------------------------------------+
|  Current Draw Threshold           |  Duration Window   |  VFD Protective Trip Action  |
+-----------------------------------+--------------------+------------------------------+
|  100% to 115% FLA (18.5A - 21.2A) |  Continuous        |  Amber Advisory on CNC Screen|
|  115% to 125% FLA (21.3A - 23.1A) |  > 30 seconds      |  Feed Rate Override drop 50% |
|  125% to 150% FLA (23.2A - 27.7A) |  > 5 seconds       |  Feed Hold + Tool Retract    |
|  > 150% FLA (> 27.8A)             |  > 50 milliseconds |  Instantaneous E-Stop Trip   |
+---------------------------------------------------------------------------------------+
```

#### Diagnostic Causes for Unexpected Spikes:
- Cutter breakage or chip packing in deep pocket milling.
- Spindle bearing cage collapse or rolling element seizure.
- VFD phase imbalance exceeding $3\%$ between phases $U$, $V$, and $W$.

---

## 4. Coolant Flow Diagnostics & De-airing Protocols

The electro-spindle utilizes two independent fluid circuits: **Spindle Housing Chiller Jacket** (closed glycol loop) and **Thru-Spindle Coolant (TSC)** (cutting fluid emulsion).

### Circuit 1: Motor Stator Chiller Circuit
- **Cooling Medium**: Deionized water with $30\%$ corrosion-inhibited ethylene glycol.
- **Chiller Supply Temperature**: Maintained strictly at $20.0^\circ\text{C} \pm 0.5^\circ\text{C}$ to match the machine tool coordinate frame thermal baseline.
- **Flow Rate**: Min $8.0\text{ L/min}$ at $3.5\text{ bar}$.
- **Interlock**: Temperature difference between chiller inlet and outlet must not exceed $\Delta T = 3.5^\circ\text{C}$. Exceeding $4.0^\circ\text{C}$ halts the machining program.

### Circuit 2: High-Pressure Thru-Spindle Coolant (TSC)
- **Minimum Operating Pressure**: $20.0\text{ bar}$ ($290\text{ PSI}$).
- **Maximum System Pressure**: $70.0\text{ bar}$ ($1,015\text{ PSI}$).
- **Nominal Flow Rate**: $22.0 - 35.0\text{ L/min}$.
- **Filtration Standard**: Double cyclonic filter bag rated for $< 5.0\text{ }\mu\text{m}$ absolute filtration to prevent rotary union ceramic seal erosion.
- **Diagnostics**:
  - If TSC pressure drops below $18.0\text{ bar}$ while flow is demanded, the digital flow switch triggers a CNC Feed Hold to protect carbide tool tips.
  - Rotary union leakage sensor (proximity sensor at drainage port) detects seal degradation when drain leakage exceeds $15\text{ mL/min}$.

---

## 5. High-Precision Hybrid Ceramic Bearing Replacement Procedure

Spindle bearing overhaul must strictly take place in a **Class 10,000 (ISO 7) Cleanroom Environment** to prevent airborne particulate contamination.

### Required Bearing Set:
- **Nose Tandem Set**: Matched triplex set of super-precision angular contact hybrid ceramic bearings ($\text{Si}_3\text{N}_4$ silicon nitride ceramic balls, vacuum-melted steel rings, P4S/ABEC-9 tolerance class, $15^\circ$ contact angle).
- **Rear Floating Set**: Matched duplex pair of angular contact bearings with precision spring preload pack.

### Step-by-Step Replacement Sequence:

#### Step 1: Teardown & Dimensional Metrology
1. Dismount electro-spindle from machine Z-slide after completing electrical and fluid LOTO.
2. Remove rotary union, HSK drawbar cylinder, and unclamp shaft locking rings using specialized spanner wrenches.
3. Support spindle housing vertically on hydraulic press fixture. Press rotor core out with steady pressure not exceeding $15\text{ kN}$.
4. Thoroughly clean spindle housing bore with petroleum solvent and measure bore roundness and cylindricity using an air gauge. Total taper/ovality must not exceed $0.0015\text{ mm}$.

#### Step 2: Bearing Inspection & Preload Verification
1. Inspect new bearing packages. Verify matched serial numbers and V-shaped match marking etched across bearing outer rings.
2. Ensure correct mounting orientation (Back-to-Back "DB" or Tandem-Back-to-Back "TBT" arrangement).
3. Verify pre-calibrated axial preload ($350\text{ N} \pm 25\text{ N}$ for front cluster).

#### Step 3: Controlled Thermal Expansion (Induction Heating)
1. Clean bearing seats on spindle shaft with lint-free lintless wipes and heptane.
2. Heat bearing inner rings uniformly using a calibrated industrial induction heater equipped with magnetic temperature probe.
3. Target heating temperature: **Strictly between $75^\circ\text{C}$ and $80^\circ\text{C}$ ($167^\circ\text{F} - 176^\circ\text{F}$)**.
4. *Warning: Never use open flames or oil baths. Never exceed $90^\circ\text{C}$, as ceramic ball fit and ring temper will be irreversibly degraded.*
5. Slide heated bearing smoothly onto the shaft seat until it seats solidly against the precision shoulder ground. Hold axial seating pressure until cooled below $35^\circ\text{C}$.

#### Step 4: High-Speed Grease Metering
1. Using an automated micro-syringe or calibrated pneumatic dispenser, inject high-speed spindle grease (Klüber Isoflex NBU 15).
2. Distribute grease precisely: **$15\% \pm 1\%$ of free bearing cavity volume** (approx. $1.2\text{ mL}$ per bearing).
3. *Overgreasing will induce severe hydrodynamic friction, thermal runaway, and immediate destruction upon high-speed spin-up.*

#### Step 5: Final Housing Insertion & Dynamic Run-In Cycling
1. Carefully lower shaft and bearing assembly into housing bore using guide studs.
2. Torque spindle front labyrinth seal cap screws diagonally in three stages ($30\%$, $60\%$, $100\%$) to $4.8\text{ N}\cdot\text{m}$.
3. Mount spindle on test stand with chiller fluid circulating at $20^\circ\text{C}$.
4. **Automated Run-In Protocol**:
   - $3,000\text{ RPM}$ for 30 minutes. Verify bearing temp $< 32^\circ\text{C}$.
   - $6,000\text{ RPM}$ for 30 minutes. Verify bearing temp $< 38^\circ\text{C}$.
   - $12,000\text{ RPM}$ for 30 minutes. Verify bearing temp $< 45^\circ\text{C}$.
   - $18,000\text{ RPM}$ for 45 minutes. Verify bearing temp $< 52^\circ\text{C}$.
   - $24,000\text{ RPM}$ for 60 minutes. Maximum steady state temp must stabilize under $58^\circ\text{C}$.
5. Perform final radial and axial runout check on test arbor. Confirm runout $\le 0.0020\text{ mm}$ TIR. Sign off quality certification sheet.
