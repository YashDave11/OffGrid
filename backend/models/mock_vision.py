import asyncio
from backend.models.base import ModelProvider, CAPABILITY_VISION

class MockVisionModel(ModelProvider):
    @property
    def capability(self) -> str:
        return CAPABILITY_VISION
        
    @property
    def name(self) -> str:
        return "mock-vision"
        
    async def execute(self, task: str, content: str) -> str:
        # Ultra-fast non-blocking simulation (50ms)
        await asyncio.sleep(0.05)
        
        is_data_url = content.startswith("data:image")
        img_info = "Base64 Image Telemetry" if is_data_url else "Visual Buffer"
        
        return f"""[MOCK VISION OUTPUT] Sovereign Visual Inspection Analysis (Gemma-3-4B-IT Local Standby Engine)

### Visual Telemetry & Geometry Assessment
- **Input Stream**: {img_info} ({len(content)} bytes)
- **Target Instruction**: {task or 'Equipment visual integrity analysis'}
- **Detection Model**: Gemma-3-4B-IT (Sovereign Industrial Vision Core)

| Inspection Point | Observed Value | Nominal Threshold | Severity Rating | Status |
| :--- | :--- | :--- | :--- | :--- |
| Surface Corrosion Rate | 0.08 mm/yr | < 0.20 mm/yr | Low | **Nominal** |
| Thermal Gradient Disparity | +3.4°C ΔT | < 15.0°C ΔT | Minimal | **Safe** |
| Structural Weld Profilometry | 99.1% Uniformity | > 95.0% | None | **Pass** |
| Flange Seal Compression | 2.1 mm deflection | 1.8 - 2.5 mm | Zero | **Compliant** |

### Engineering Diagnostics
1. **Surface Topology**: Optical analysis confirms no localized pitting, stress-corrosion cracking, or heat-affected zone (HAZ) micro-fractures.
2. **Component Alignment**: Flange alignment and bolt pitch circles meet API 610 industrial standards with zero detectable eccentric distortion.
3. **Environmental Containment**: Zero visual traces of fugitive volatile organic compound (VOC) emissions or packing gland leaks.

> **Operational Verdict**: Inspection target meets all refinery process safety criteria. Unit is cleared for uninterrupted operational duty.
"""
