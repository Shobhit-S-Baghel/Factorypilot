# FactoryPilot Standard Technical Operating Manual
## Document ID: SOP-MEC-PUMP-001 | Revision: 4.2
### Heavy Duty Industrial Centrifugal Slurry Booster Pump (Series CP-4000)

---

## 1. General Machinery Specification & Operating Envelopes

The CP-4000 Series Centrifugal Slurry Pump is engineered for continuous transport of abrasive and corrosive slurries, chemical feedstocks, and industrial effluent.

| Parameter | Operational Rating | Safety Limit / Trip Threshold |
| :--- | :--- | :--- |
| **Rated Capacity ($Q$)** | $450\text{ m}^3/\text{h}$ | $520\text{ m}^3/\text{h}$ Max |
| **Total Dynamic Head ($H$)** | $58\text{ meters}$ | $68\text{ meters}$ Max |
| **Nominal Operating Speed** | $1,750\text{ RPM}$ | $1,800\text{ RPM}$ (Trip at $>1,850\text{ RPM}$) |
| **Impeller Diameter** | $355\text{ mm}$ (Hi-Chrome 28%) | Min wear limit $330\text{ mm}$ |
| **Driver Power Output** | $75\text{ kW}$ 3-Phase Induction Motor | Full Load Amps: $132\text{ A}$ @ $415\text{ V}$ |
| **Suction / Discharge Flanges** | ANSI Class 150 / PN16 (DN200 / DN150) | Hydrostatic Test: $24\text{ bar}$ |

---

## 2. ISO 10816 Vibration Severity Standards & Zoning

Vibration analysis is the primary predictive maintenance diagnostic for impeller unbalance, shaft misalignment, and bearing raceway degradation. All vibration monitoring must comply with **ISO 10816-3 (Mechanical vibration — Evaluation of machine vibration by measurements on non-rotating parts)**.

### Machine Classification
- **Class I**: Individual parts of engines and machines, connected integrally with the complete machine in normal operating condition ($<15\text{ kW}$).
- **Class II**: Medium-sized machines without special foundations ($15\text{ kW} - 75\text{ kW}$) or rigid machines on special foundations (Applicable to **CP-4000 on Concrete Base**).
- **Class III**: Large prime-movers and other large machines with rotating masses on rigid and heavy foundations ($>75\text{ kW}$).
- **Class IV**: Large prime-movers and other large machines with rotating masses on foundations which are relatively soft in the direction of vibration measurements.

### Severity Boundaries for Class II (Rigid Mount)
Measured in Overall Root-Mean-Square (RMS) Vibration Velocity ($10\text{ Hz}$ to $1,000\text{ Hz}$):

```
+---------------------------------------------------------------------------------+
|  Vibration RMS Velocity (mm/s)    |  ISO 10816 Zone  |  Condition Status        |
+-----------------------------------+------------------+--------------------------+
|  0.00 to 1.40 mm/s                |  Zone A          |  Good (New Commission)   |
|  1.41 to 2.80 mm/s                |  Zone B          |  Acceptable (Continuous) |
|  2.81 to 4.50 mm/s                |  Zone C          |  Alert / Restricted      |
|  > 4.50 mm/s                      |  Zone D          |  Danger / Immediate Trip |
+---------------------------------------------------------------------------------+
```

#### Diagnostic Protocols:
1. **Zone A ($< 1.40\text{ mm/s}$)**: Baseline condition. Routine monthly recording.
2. **Zone B ($1.41 - 2.80\text{ mm/s}$)**: Machine is considered acceptable for unrestricted long-term operation.
3. **Zone C ($2.81 - 4.50\text{ mm/s}$)**: Advisory Alert triggered on SCADA. Machine is unfit for prolonged continuous duty; schedule maintenance within 72 hours. Inspect coupling alignment, soft foot, and foundation bolt torque.
4. **Zone D ($> 4.50\text{ mm/s}$)**: High severity. Vibration severity is of sufficient magnitude to cause catastrophic structural and bearing damage. **Automatic interlock must trigger emergency shutdown within 10 seconds.**

---

## 3. Thermal Thresholds & Bearing Housing Monitoring

Temperature transducers (Pt100 RTDs) are embedded inside both Inboard (Radial) and Outboard (Thrust) bearing housings.

### Temperature Bands:
- **Normal Operating Range**: $45^\circ\text{C}$ to $65^\circ\text{C}$ ($113^\circ\text{F} - 149^\circ\text{F}$).
- **Stage 1 Cautionary Alert ($> 75^\circ\text{C}$)**: Inspect cooling water circulation through the bearing bracket jacket. Check grease condition for emulsification or oil bleed.
- **Stage 2 Warning Threshold ($> 80^\circ\text{C} / 176^\circ\text{F}$)**:
  - Bearing temperatures exceeding $80^\circ\text{C}$ trigger an audible advisory on the central annunciator panel.
  - Operators must immediately verify lubricant viscosity, check for excessive grease pack (over-lubrication causes churn heating), and monitor FFT vibration spectrum for cage frequency fault harmonics.
- **Critical Trip Limit ($> 95^\circ\text{C} / 203^\circ\text{F}$)**:
  - Automatic motor trip occurs. At this temperature, mineral lubricants experience rapid thermal oxidation, elastohydrodynamic film collapse occurs, and catastrophic bearing seizure is imminent.

---

## 4. Cavitation Warning Patterns & Acoustic Signature

Cavitation occurs when localized static liquid pressure drops below the saturated vapor pressure ($P_{\text{vap}}$), forming vapor cavities that violently collapse upon entering higher-pressure impeller regions.

### Key Indicators:
1. **Acoustic Noise Signature**:
   - Distinctive crackling or rattling sound, characteristically described as "pumping gravel or marbles" through the casing.
   - High-frequency ultrasonic emissions between $10\text{ kHz}$ and $35\text{ kHz}$ on acoustic emission probes.
2. **Hydraulic Fluctuations**:
   - Discharge pressure gauge oscillations greater than $\pm 1.2\text{ bar}$.
   - Unexplained drop in volumetric flow rate despite constant shaft speed.
   - Motor current fluctuations between $-15\%$ and $+10\%$ of steady state.
3. **Net Positive Suction Head Margin**:
   - Condition arises when Net Positive Suction Head Available ($\text{NPSH}_a$) falls below Net Positive Suction Head Required ($\text{NPSH}_r$) plus $0.8\text{ meters}$:
     $$\text{Margin} = \text{NPSH}_a - \text{NPSH}_r < 0.8\text{ m}$$
4. **Impeller Erosion Profile**:
   - Pitting and sponge-like metallurgical erosion on the low-pressure trailing edges of the impeller vanes.

### Remedial Operating Procedure:
- Immediately check suction strainer for fouling or cake buildup.
- Increase suction head (liquid level in feeding sump/tank).
- Slightly throttle discharge valve to increase system backpressure and shift duty point leftwards on the pump Q-H curve.

---

## 5. Lubrication Specifications & Maintenance Schedules

Precision lubrication ensures optimum elastohydrodynamic film separation between rolling elements and raceways.

### Lubricant Specifications:
- **Grease Formulation**: NLGI Grade 2 Lithium-Complex synthetic base oil with extreme pressure (EP) additives (viscosity $220\text{ cSt}$ at $40^\circ\text{C}$).
- **Approved Equivalents**: Mobilith SHC 220, Shell Gadus S3 V220C 2, Klüberplex BEM 41-141.

### Lubrication Intervals:
| Component | Lubricant Volume | Operational Interval | Inspection Task |
| :--- | :--- | :--- | :--- |
| **Inboard Drive Bearing** | $45\text{ grams}$ | Every $2,000\text{ hours}$ | Check seal lip integrity, purge grease drain |
| **Outboard Thrust Bearing** | $65\text{ grams}$ | Every $2,000\text{ hours}$ | Thermal inspection, purge grease drain |
| **Mechanical Seal Barrier Fluid** | ISO VG 32 Synthetic | Continuous ($1.5\text{ bar}$ over seal chamber) | Check reservoir level and thermal siphoning |

*Note: For ambient operating temperatures exceeding $40^\circ\text{C}$, reduce regreasing intervals by $30\%$. Never mix lithium-complex greases with polyurea or calcium-sulfonate thickeners.*

---

## 6. Mandatory OSHA 1910.147 Lockout/Tagout (LOTO) Sequence

Any maintenance, gland adjustment, bearing inspection, or internal casing entry requires strict compliance with **OSHA Standard 29 CFR 1910.147 (The Control of Hazardous Energy)**.

### Six-Step LOTO Execution Protocol:

#### Step 1: Preparation & Personnel Notification
- Notify all affected shift supervisors, operators, and downstream processing cells that Pump CP-4000 is being taken out of service.
- Review energy control procedures (ECP-PUMP-4000) and inspect all personal padlocks, hasps, and tags.

#### Step 2: Orderly Machinery Shutdown
- Initiate normal stop sequence from HMI/SCADA console to avoid water hammer in discharge piping.
- Confirm motor has come to a complete mechanical standstill before proceeding.

#### Step 3: Isolation of Primary Energy Sources
- **Electrical Isolation**: Open the 480V 3-phase molded-case circuit breaker at Motor Control Center (MCC-B-04). Pull disconnect lever to OFF position.
- **Hydraulic Isolation**: 
  - Close suction isolation knife gate valve (V-SUC-101) and apply mechanical chain/cable lock.
  - Close discharge isolation check/gate valve (V-DIS-102) and apply mechanical wheel lock.
  - Close seal flush barrier fluid lines and cooling water jackets.

#### Step 4: Application of Padlocks & Danger Tags
- Every authorized employee working on the asset must affix their individual, standardized personal padlock and standardized "DANGER - DO NOT OPERATE" tag to the multi-lock hasp at MCC-B-04 and the mechanical valve lockouts.
- Keys must remain in the physical custody of each authorized technician throughout the entire intervention.

#### Step 5: Dissipation of Stored Residual Energy
- Open pump casing drain ball valve (V-DRN-103) into the sump collector to depressurize casing. Confirm pressure gauge reads $0.00\text{ bar}$.
- Vent any trapped air/gas pockets through high-point vent cock.
- Drain corrosive or toxic slurries into certified containment totes.

#### Step 6: Zero Energy State Verification ("Try Step")
- **Electrical Verification**: Qualified electrical technician uses a calibrated, CAT-IV multimeter to verify zero voltage across all phase-to-phase and phase-to-ground connections ($L1-L2$, $L2-L3$, $L1-L3$, $L1-G$).
- **Mechanical Verification**: Depress the local manual "START" pushbutton on the field control station. The motor must fail to jog or energize. Return switch to "OFF" position.
- Only upon successful verification of zero energy state may maintenance personnel begin physical teardown.
