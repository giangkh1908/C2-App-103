from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ConceptType = Literal[
    "addition_with_objects",
    "subtraction_with_objects",
    "mental_math_number_line",
    "mental_math_ten_frame",
    "multiplication_as_groups",
    "division_as_sharing",
    "grouped_counting",
    "place_value",
    "compare_numbers",
    "spatial_position",
    "geometry_shapes",
    "shape_composition",
    "measurement_length",
    "time_clock",
    "money",
    "mass_capacity",
    "picture_graph",
    "probability_basic",
    "word_problem_bar_model",
]

PolypadMode = Literal[
    "fractions",
    "geometry",
    "number-line",
    "base-ten-blocks",
    "measurement",
    "counters",
]


@dataclass(frozen=True)
class ConceptDefinition:
    default_template: str
    allowed_templates: tuple[str, ...]
    keyword_overrides: tuple[tuple[tuple[str, ...], str], ...] = ()
    polypad_enabled: bool = False
    polypad_mode: PolypadMode | None = None


TOPIC_TO_CONCEPT: dict[str, ConceptType] = {
    "G1-NUM-01": "place_value",
    "G1-NUM-02": "compare_numbers",
    "G1-OPS-01": "addition_with_objects",
    "G1-OPS-02": "mental_math_ten_frame",
    "G1-WORD-01": "word_problem_bar_model",
    "G1-GEO-01": "spatial_position",
    "G1-GEO-02": "geometry_shapes",
    "G1-GEO-03": "shape_composition",
    "G1-MEAS-01": "measurement_length",
    "G1-MEAS-02": "measurement_length",
    "G2-NUM-01": "place_value",
    "G2-NUM-02": "compare_numbers",
    "G2-NUM-03": "grouped_counting",
    "G2-OPS-01": "addition_with_objects",
    "G2-OPS-02": "multiplication_as_groups",
    "G2-OPS-03": "mental_math_ten_frame",
    "G2-WORD-01": "word_problem_bar_model",
    "G2-GEO-01": "geometry_shapes",
    "G2-GEO-02": "shape_composition",
    "G2-MEAS-01": "time_clock",
    "G2-MEAS-02": "measurement_length",
    "G2-STAT-01": "picture_graph",
    "G2-PROB-01": "probability_basic",
}


CONCEPT_DEFINITIONS: dict[ConceptType, ConceptDefinition] = {
    "addition_with_objects": ConceptDefinition(
        default_template="operation_story",
        allowed_templates=(
            "operation_story",
            "counting_objects",
            "place_value_blocks",
            "stick_bundles",
        ),
    ),
    "subtraction_with_objects": ConceptDefinition(
        default_template="operation_story",
        allowed_templates=(
            "operation_story",
            "counting_objects",
            "place_value_blocks",
            "stick_bundles",
        ),
    ),
    "mental_math_number_line": ConceptDefinition(
        default_template="number_line",
        allowed_templates=("number_line", "ten_frame", "place_value_blocks"),
        polypad_enabled=True,
        polypad_mode="number-line",
    ),
    "mental_math_ten_frame": ConceptDefinition(
        default_template="ten_frame",
        allowed_templates=("ten_frame", "number_line", "place_value_blocks"),
        keyword_overrides=(
            (("tia so",), "number_line"),
            (("tram", "chuc"), "place_value_blocks"),
        ),
    ),
    "multiplication_as_groups": ConceptDefinition(
        default_template="array_model",
        allowed_templates=("array_model", "grouping_model", "counting_objects"),
        keyword_overrides=(
            (("chia", "chia deu"), "grouping_model"),
            (("dem", "do vat"), "counting_objects"),
        ),
        polypad_enabled=True,
        polypad_mode="counters",
    ),
    "division_as_sharing": ConceptDefinition(
        default_template="grouping_model",
        allowed_templates=("grouping_model", "counting_objects"),
        polypad_enabled=True,
        polypad_mode="counters",
    ),
    "grouped_counting": ConceptDefinition(
        default_template="grouping_model",
        allowed_templates=("grouping_model", "counting_objects"),
        polypad_enabled=True,
        polypad_mode="counters",
    ),
    "place_value": ConceptDefinition(
        default_template="place_value_blocks",
        allowed_templates=("place_value_blocks", "number_line", "counting_objects"),
        keyword_overrides=((("tia so",), "number_line"),),
        polypad_enabled=True,
        polypad_mode="base-ten-blocks",
    ),
    "compare_numbers": ConceptDefinition(
        default_template="comparison_visual",
        allowed_templates=("comparison_visual", "number_line", "place_value_blocks"),
        keyword_overrides=(
            (("tia so", "sap xep", "tang dan", "giam dan"), "number_line"),
            (("tram", "chuc", "don vi"), "place_value_blocks"),
        ),
    ),
    "spatial_position": ConceptDefinition(
        default_template="spatial_position_scene",
        allowed_templates=("spatial_position_scene",),
    ),
    "geometry_shapes": ConceptDefinition(
        default_template="geometry_shape",
        allowed_templates=("geometry_shape", "shape_sorting", "real_object_match"),
        polypad_enabled=True,
        polypad_mode="geometry",
    ),
    "shape_composition": ConceptDefinition(
        default_template="shape_composition",
        allowed_templates=("shape_composition", "drag_drop_shapes", "ruler_measurement"),
        keyword_overrides=(
            (("cm", "thuoc", "doan thang"), "ruler_measurement"),
            (("keo tha",), "drag_drop_shapes"),
        ),
        polypad_enabled=True,
        polypad_mode="geometry",
    ),
    "measurement_length": ConceptDefinition(
        default_template="ruler_measurement",
        allowed_templates=(
            "comparison_visual",
            "ruler_measurement",
            "clock_calendar",
            "polyline_length_visual",
        ),
        keyword_overrides=(
            (("gio", "dong ho", "phut", "ngay", "thang", "lich", "thu"), "clock_calendar"),
            (("gap khuc",), "polyline_length_visual"),
            (("so sanh", "dai hon", "ngan hon"), "comparison_visual"),
        ),
        polypad_enabled=True,
        polypad_mode="measurement",
    ),
    "time_clock": ConceptDefinition(
        default_template="clock_calendar",
        allowed_templates=(
            "clock_calendar",
            "money_visual",
            "mass_capacity_visual",
            "ruler_measurement",
        ),
        keyword_overrides=(
            (("tien",), "money_visual"),
            (("kg", "lit", "khoi luong", "dung tich"), "mass_capacity_visual"),
            (("cm", "thuoc"), "ruler_measurement"),
        ),
        polypad_enabled=True,
        polypad_mode="measurement",
    ),
    "money": ConceptDefinition(
        default_template="money_visual",
        allowed_templates=("money_visual",),
        polypad_enabled=True,
        polypad_mode="measurement",
    ),
    "mass_capacity": ConceptDefinition(
        default_template="mass_capacity_visual",
        allowed_templates=("mass_capacity_visual",),
        polypad_enabled=True,
        polypad_mode="measurement",
    ),
    "picture_graph": ConceptDefinition(
        default_template="picture_graph",
        allowed_templates=("picture_graph", "data_table", "counting_objects"),
        keyword_overrides=((("bang", "so lieu"), "data_table"),),
    ),
    "probability_basic": ConceptDefinition(
        default_template="probability_experiment",
        allowed_templates=("probability_experiment", "scenario_cards"),
        keyword_overrides=((("co the", "chac chan", "khong the"), "scenario_cards"),),
    ),
    "word_problem_bar_model": ConceptDefinition(
        default_template="bar_model",
        allowed_templates=("bar_model", "operation_story", "counting_objects", "array_model"),
        keyword_overrides=((("them", "bot", "con lai"), "operation_story"),),
    ),
}


TEMPLATE_REQUIRED_CONFIG: dict[str, tuple[str, ...]] = {
    "place_value_blocks": ("number",),
    "comparison_visual": ("a_label", "b_label"),
    "number_line": ("result",),
    "ten_frame": ("result",),
    "operation_story": ("operation", "before", "change", "result"),
    "stick_bundles": ("operation", "before", "change", "result"),
    "array_model": ("rows", "cols"),
    "grouping_model": (),
    "ruler_measurement": ("object_name",),
    "clock_calendar": ("mode",),
    "money_visual": ("denominations", "total_value", "currency"),
    "mass_capacity_visual": ("left_label", "right_label", "unit"),
    "picture_graph": ("labels", "values"),
    "data_table": ("labels", "values"),
    "probability_experiment": ("outcomes", "favorable_count", "experiment_label"),
    "bar_model": ("top_label", "bottom_label", "unit_label"),
}
