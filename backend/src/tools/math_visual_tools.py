from typing import Any, Literal

from pydantic import Field

from .base import BaseTool, ToolInput, ToolResult


class CandyMultiplicationInput(ToolInput):
    groups: int = Field(..., ge=1, le=12, description="Số nhóm/đĩa/túi")
    items_per_group: int = Field(
        ...,
        ge=1,
        le=20,
        description="Số vật trong mỗi nhóm",
    )
    item_name: str = Field(default="kẹo", description="Tên vật minh họa")
    group_name: str = Field(default="đĩa", description="Tên nhóm minh họa")


class CandyMultiplicationTool(BaseTool):
    name = "candy_multiplication"
    description = (
        "Tạo mô phỏng phép nhân bằng các nhóm đồ vật như đĩa kẹo hoặc túi bánh."
    )
    input_schema = CandyMultiplicationInput

    async def run(self, **kwargs: Any) -> ToolResult:
        try:
            validated_input = self.validate_input(kwargs)
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Dữ liệu đầu vào chưa hợp lệ.",
            )

        groups = validated_input["groups"]
        items_per_group = validated_input["items_per_group"]
        item_name = validated_input["item_name"]
        group_name = validated_input["group_name"]

        total = groups * items_per_group
        repeated_addition = " + ".join(str(items_per_group) for _ in range(groups))
        expression = f"{groups} × {items_per_group} = {total}"
        visual_groups = [
            {"group_id": group_id, "count": items_per_group}
            for group_id in range(1, groups + 1)
        ]

        return ToolResult(
            success=True,
            data={
                "type": "candy_multiplication",
                "groups": groups,
                "items_per_group": items_per_group,
                "item_name": item_name,
                "group_name": group_name,
                "total": total,
                "repeated_addition": repeated_addition,
                "expression": expression,
                "visual_groups": visual_groups,
            },
            message=(
                f"Có {groups} {group_name}, mỗi {group_name} có "
                f"{items_per_group} {item_name}. Vậy tất cả có {total} "
                f"{item_name} nhé!"
            ),
        )


class EqualDivisionInput(ToolInput):
    total_items: int = Field(
        ...,
        ge=1,
        le=100,
        description="Tổng số vật cần chia",
    )
    groups: int = Field(..., ge=1, le=20, description="Số nhóm hoặc người nhận")
    item_name: str = Field(default="quả táo", description="Tên vật minh họa")
    group_name: str = Field(default="bạn", description="Tên nhóm hoặc người nhận")


class EqualDivisionTool(BaseTool):
    name = "equal_division"
    description = "Tạo mô phỏng phép chia đều đồ vật cho nhiều nhóm hoặc nhiều bạn."
    input_schema = EqualDivisionInput

    async def run(self, **kwargs: Any) -> ToolResult:
        try:
            validated_input = self.validate_input(kwargs)
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Dữ liệu đầu vào chưa hợp lệ.",
            )

        total_items = validated_input["total_items"]
        groups = validated_input["groups"]
        item_name = validated_input["item_name"]
        group_name = validated_input["group_name"]

        items_per_group = total_items // groups
        remainder = total_items % groups
        is_evenly_divisible = remainder == 0
        expression = f"{total_items} ÷ {groups} = {items_per_group}"
        visual_groups = [
            {"group_id": group_id, "count": items_per_group}
            for group_id in range(1, groups + 1)
        ]

        if is_evenly_divisible:
            message = (
                f"Chia đều {total_items} {item_name} cho {groups} {group_name}, "
                f"mỗi {group_name} nhận được {items_per_group} {item_name}."
            )
        else:
            message = (
                f"Chia đều {total_items} {item_name} cho {groups} {group_name}, "
                f"mỗi {group_name} nhận được {items_per_group} {item_name} "
                f"và còn dư {remainder} {item_name}."
            )

        return ToolResult(
            success=True,
            data={
                "type": "equal_division",
                "total_items": total_items,
                "groups": groups,
                "items_per_group": items_per_group,
                "remainder": remainder,
                "item_name": item_name,
                "group_name": group_name,
                "expression": expression,
                "is_evenly_divisible": is_evenly_divisible,
                "visual_groups": visual_groups,
            },
            message=message,
        )


class FractionPizzaInput(ToolInput):
    numerator: int = Field(..., ge=0, le=20, description="Tử số")
    denominator: int = Field(..., ge=1, le=20, description="Mẫu số")
    whole_name: str = Field(
        default="pizza",
        description="Vật minh họa cho một đơn vị nguyên",
    )


class FractionPizzaTool(BaseTool):
    name = "fraction_pizza"
    description = "Tạo mô phỏng phân số bằng một chiếc pizza hoặc một vật được chia đều."
    input_schema = FractionPizzaInput

    async def run(self, **kwargs: Any) -> ToolResult:
        try:
            validated_input = self.validate_input(kwargs)
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Dữ liệu đầu vào chưa hợp lệ.",
            )

        numerator = validated_input["numerator"]
        denominator = validated_input["denominator"]
        whole_name = validated_input["whole_name"]

        if numerator > denominator:
            return ToolResult(
                success=False,
                error="UNSUPPORTED_IMPROPER_FRACTION",
                message=(
                    "Hiện tại học cụ này chỉ hỗ trợ phân số nhỏ hơn hoặc bằng 1."
                ),
            )

        fraction_text = f"{numerator}/{denominator}"
        filled_slices = numerator
        total_slices = denominator
        empty_slices = denominator - numerator
        visual_slices = [
            {"slice_id": slice_id, "filled": slice_id <= filled_slices}
            for slice_id in range(1, total_slices + 1)
        ]

        return ToolResult(
            success=True,
            data={
                "type": "fraction_pizza",
                "numerator": numerator,
                "denominator": denominator,
                "whole_name": whole_name,
                "fraction_text": fraction_text,
                "filled_slices": filled_slices,
                "total_slices": total_slices,
                "empty_slices": empty_slices,
                "visual_slices": visual_slices,
            },
            message=(
                f"{whole_name.capitalize()} được chia thành {denominator} "
                f"phần bằng nhau, mình lấy {numerator} phần."
            ),
        )


class RectangleMeasurementInput(ToolInput):
    length: int = Field(..., ge=1, le=50, description="Chiều dài")
    width: int = Field(..., ge=1, le=50, description="Chiều rộng")
    unit: str = Field(default="ô", description="Đơn vị đo")
    mode: Literal["area", "perimeter", "both"] = Field(
        default="both",
        description="Tính diện tích, chu vi hoặc cả hai",
    )


class RectangleMeasurementTool(BaseTool):
    name = "rectangle_measurement"
    description = "Tạo mô phỏng hình chữ nhật để học diện tích và chu vi."
    input_schema = RectangleMeasurementInput

    async def run(self, **kwargs: Any) -> ToolResult:
        try:
            validated_input = self.validate_input(kwargs)
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Dữ liệu đầu vào chưa hợp lệ.",
            )

        length = validated_input["length"]
        width = validated_input["width"]
        unit = validated_input["unit"]
        mode = validated_input["mode"]

        area = length * width
        perimeter = 2 * (length + width)
        area_expression = f"{length} × {width} = {area}"
        perimeter_expression = f"2 × ({length} + {width}) = {perimeter}"
        grid = (
            [
                {"row": row, "col": col}
                for row in range(1, width + 1)
                for col in range(1, length + 1)
            ]
            if area <= 100
            else []
        )

        if mode == "area":
            message = (
                f"Hình chữ nhật dài {length} {unit} và rộng {width} {unit}. "
                f"Diện tích là {area_expression} {unit} vuông."
            )
        elif mode == "perimeter":
            message = (
                f"Hình chữ nhật dài {length} {unit} và rộng {width} {unit}. "
                f"Chu vi là {perimeter_expression} {unit}."
            )
        else:
            message = (
                f"Hình chữ nhật dài {length} {unit} và rộng {width} {unit}. "
                f"Diện tích là {area_expression} {unit} vuông, "
                f"còn chu vi là {perimeter_expression} {unit}."
            )

        return ToolResult(
            success=True,
            data={
                "type": "rectangle_measurement",
                "length": length,
                "width": width,
                "unit": unit,
                "mode": mode,
                "area": area,
                "perimeter": perimeter,
                "area_expression": area_expression,
                "perimeter_expression": perimeter_expression,
                "grid": grid,
            },
            message=message,
        )


def get_math_visual_tools() -> list[BaseTool]:
    return [
        CandyMultiplicationTool(),
        EqualDivisionTool(),
        FractionPizzaTool(),
        RectangleMeasurementTool(),
    ]
