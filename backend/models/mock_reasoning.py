import asyncio
from backend.models.base import ModelProvider, CAPABILITY_REASONING

class MockReasoningModel(ModelProvider):
    @property
    def capability(self) -> str:
        return CAPABILITY_REASONING
        
    @property
    def name(self) -> str:
        return "mock-reasoning"
        
    async def execute(self, task: str, content: str, **kwargs) -> str:
        # Ultra-fast non-blocking simulation (50ms)
        await asyncio.sleep(0.05)
        
        return f"""<think>
1. Deconstruct incoming instruction: "{task}"
2. Retrieve MRPL refinery operational tolerances, thermodynamic balances, and safety envelopes.
3. Formulate stoichiometric heat-duty calculations and verify HazOp safety constraints.
4. Synthesize remediation checklist and execute parameter safety verification.
5. All pipeline safety criteria validated nominal.
</think>

[MOCK REASONING OUTPUT] Sovereign Technical Reasoning (Qwen3-4B-Thinking-2507 Local Standby Engine)

### Executive Summary
Processed task: **"{task}"**

### Operational Parameters & Boundary Evaluation

| Parameter | Current Value | Safe Operating Envelope | Unit Status |
| :--- | :--- | :--- | :--- |
| Distillation Tray Temp (T-102) | 168.5 °C | 150.0 - 180.0 °C | In-Spec |
| Overhead Vapor Pressure | 2.45 bar | 2.00 - 3.20 bar | Stable |
| Reflux Drum Liquid Level | 58.2 % | 40.0 - 75.0 % | Optimal |
| Reboiler Steam Heat Input | 14.2 MW | 12.0 - 16.5 MW | Nominal |

### Diagnostic Analysis & Actions
1. **Fractionation Efficiency**: Temperature gradient across the rectification zone indicates clean separation of light naphtha fractions with negligible heavy carryover.
2. **Hydraulic Loading**: Downcomer liquid velocity is calculated at 0.32 m/s, well below the flooding threshold (0.65 m/s).
3. **Safety Interlock Status**: High-pressure automated vent valves (PSV-201A/B) and nitrogen purge systems confirmed armed and responsive.

```python
# MRPL Sovereign Process Envelope Validation Routine
def check_safety_envelope(tray_temp: float, pressure: float) -> dict:
    MAX_TEMP = 180.0
    MAX_PRESSURE = 3.2
    safe = (tray_temp <= MAX_TEMP) and (pressure <= MAX_PRESSURE)
    return {{
        "status": "APPROVED" if safe else "INTERLOCK_TRIGGERED",
        "temp_margin": round(MAX_TEMP - tray_temp, 2),
        "pressure_margin": round(MAX_PRESSURE - pressure, 2)
    }}

metrics = check_safety_envelope(168.5, 2.45)
print(f"Safety Verification: {{metrics['status']}} (Temp Margin: +{{metrics['temp_margin']}}°C)")
```

> **Operational Directive**: Maintain current reflux ratio of 2.4. Continue normal continuous process monitoring under DCS supervision.
"""
