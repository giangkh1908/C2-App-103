"""
test_mappers.py – Unit tests cho src.api.mappers.map_visual_data_to_simulation.
"""

import pytest

from src.api.mappers import map_visual_data_to_simulation
from src.api.schemas import SimulationResponse


def test_returns_none_when_visual_data_is_none() -> None:
    result = map_visual_data_to_simulation(None)
    assert result is None


def test_returns_none_when_visual_data_is_empty_dict() -> None:
    result = map_visual_data_to_simulation({})
    assert result is None


def test_maps_candy_multiplication_to_candy_simulation() -> None:
    result = map_visual_data_to_simulation(
        {
            "type": "candy_multiplication",
            "groups": 3,
            "items_per_group": 4,
            "total": 12,
        }
    )

    assert result is not None
    assert isinstance(result, SimulationResponse)
    assert result.type == "candy"
    assert result.payload["primaryCount"] == 3
    assert result.payload["secondaryCount"] == 4
    assert result.payload["totalCount"] == 12


def test_maps_fraction_visual_to_fraction_simulation() -> None:
    result = map_visual_data_to_simulation(
        {
            "type": "fraction_visual",
            "numerator": 3,
            "denominator": 4,
        }
    )

    assert result is not None
    assert result.type == "fraction"
    assert result.payload["numerator"] == 3
    assert result.payload["denominator"] == 4


def test_fallback_for_unknown_visual_type() -> None:
    visual_data = {
        "type": "rectangle_area",
        "width": 5,
        "height": 4,
    }

    result = map_visual_data_to_simulation(visual_data)

    assert result is not None
    assert result.type == "rectangle_area"
    assert result.payload == visual_data


def test_fallback_when_type_field_is_missing() -> None:
    visual_data = {"foo": "bar"}

    result = map_visual_data_to_simulation(visual_data)

    assert result is not None
    assert result.type == "None"
    assert result.payload["foo"] == "bar"