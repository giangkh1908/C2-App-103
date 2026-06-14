"""
mappers.py – Chuyển đổi dữ liệu từ agent/tool sang format SimulationResponse.

Không chứa business logic của agent hay router.
Chỉ làm mapping một chiều: visual_data → SimulationResponse.
"""

from typing import Any

from src.api.schemas import SimulationResponse


def map_visual_data_to_simulation(
    visual_data: dict[str, Any] | None,
) -> SimulationResponse | None:
    """Chuyển visual_data từ tool sang SimulationResponse cho frontend.

    Args:
        visual_data: Dict trả về từ tool (field ``visual_data`` trong
            ``AgentResponse``). Truyền ``None`` nếu agent không dùng tool.

    Returns:
        :class:`SimulationResponse` phù hợp với từng loại tool, hoặc
        ``None`` nếu không có dữ liệu.
    """
    if not visual_data:
        return None

    visual_type: Any = visual_data.get("type")

    if visual_type == "candy_multiplication":
        return SimulationResponse(
            type="candy",
            payload={
                "primaryCount": visual_data.get("groups"),
                "secondaryCount": visual_data.get("items_per_group"),
                "totalCount": visual_data.get("total"),
            },
        )

    if visual_type == "fraction_visual":
        return SimulationResponse(
            type="fraction",
            payload={
                "numerator": visual_data.get("numerator"),
                "denominator": visual_data.get("denominator"),
            },
        )

    # Fallback: trả nguyên dữ liệu để frontend vẫn nhận được gì đó.
    # Áp dụng cho: rectangle_area, number_line, pie_chart_fraction, v.v.
    return SimulationResponse(
        type=str(visual_type),
        payload=visual_data,
    )