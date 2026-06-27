import pytest

from src.tools.math_visual_tools import (
    CandyMultiplicationTool,
    EqualDivisionTool,
    FractionPizzaTool,
    RectangleMeasurementTool,
    get_math_visual_tools,
)


@pytest.mark.asyncio
async def test_candy_multiplication_tool_returns_visual_data() -> None:
    tool = CandyMultiplicationTool()

    result = await tool.run(groups=3, items_per_group=4)

    assert result.success is True
    assert result.data["type"] == "candy_multiplication"
    assert result.data["total"] == 12
    assert result.data["expression"] == "3 × 4 = 12"
    assert result.data["repeated_addition"] == "4 + 4 + 4"
    assert len(result.data["visual_groups"]) == 3


@pytest.mark.asyncio
async def test_candy_multiplication_tool_returns_error_for_invalid_input() -> None:
    tool = CandyMultiplicationTool()

    result = await tool.run(groups=0, items_per_group=4)

    assert result.success is False


@pytest.mark.asyncio
async def test_equal_division_tool_returns_even_division_data() -> None:
    tool = EqualDivisionTool()

    result = await tool.run(total_items=12, groups=4)

    assert result.success is True
    assert result.data["type"] == "equal_division"
    assert result.data["items_per_group"] == 3
    assert result.data["remainder"] == 0
    assert result.data["is_evenly_divisible"] is True
    assert result.data["expression"] == "12 ÷ 4 = 3"


@pytest.mark.asyncio
async def test_equal_division_tool_returns_remainder_data() -> None:
    tool = EqualDivisionTool()

    result = await tool.run(total_items=14, groups=4)

    assert result.success is True
    assert result.data["items_per_group"] == 3
    assert result.data["remainder"] == 2
    assert result.data["is_evenly_divisible"] is False


@pytest.mark.asyncio
async def test_fraction_pizza_tool_returns_valid_fraction_data() -> None:
    tool = FractionPizzaTool()

    result = await tool.run(numerator=3, denominator=5)

    assert result.success is True
    assert result.data["type"] == "fraction_pizza"
    assert result.data["fraction_text"] == "3/5"
    assert result.data["filled_slices"] == 3
    assert result.data["empty_slices"] == 2
    assert len(result.data["visual_slices"]) == 5
    assert sum(1 for visual_slice in result.data["visual_slices"] if visual_slice["filled"]) == 3


@pytest.mark.asyncio
async def test_fraction_pizza_tool_rejects_improper_fraction() -> None:
    tool = FractionPizzaTool()

    result = await tool.run(numerator=7, denominator=5)

    assert result.success is False
    assert result.error == "UNSUPPORTED_IMPROPER_FRACTION"


@pytest.mark.asyncio
async def test_rectangle_measurement_tool_returns_area_and_perimeter_data() -> None:
    tool = RectangleMeasurementTool()

    result = await tool.run(length=4, width=3, mode="both")

    assert result.success is True
    assert result.data["type"] == "rectangle_measurement"
    assert result.data["area"] == 12
    assert result.data["perimeter"] == 14
    assert result.data["area_expression"] == "4 × 3 = 12"
    assert result.data["perimeter_expression"] == "2 × (4 + 3) = 14"
    assert len(result.data["grid"]) == 12


@pytest.mark.asyncio
async def test_rectangle_measurement_tool_omits_large_grid() -> None:
    tool = RectangleMeasurementTool()

    result = await tool.run(length=20, width=10)

    assert result.success is True
    assert result.data["area"] == 200
    assert result.data["grid"] == []


@pytest.mark.asyncio
async def test_rectangle_measurement_tool_returns_error_for_invalid_mode() -> None:
    tool = RectangleMeasurementTool()

    result = await tool.run(length=4, width=3, mode="invalid")

    assert result.success is False


def test_get_math_visual_tools_returns_all_tools() -> None:
    tools = get_math_visual_tools()

    tool_names = {tool.name for tool in tools}

    assert len(tools) == 4
    assert tool_names == {
        "candy_multiplication",
        "equal_division",
        "fraction_pizza",
        "rectangle_measurement",
    }
