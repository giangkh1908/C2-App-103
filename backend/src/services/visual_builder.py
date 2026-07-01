from src.models.chat import SimulationConfig, Topic, VisualCard, VisualData
from src.models.lesson import LessonSimulation, LessonVisual
from src.services.types import LearningContext

# Curriculum visual templates that map to existing backend types
_LEGACY_TEMPLATE_MAP = {
    "candy": "candy",
    "apple": "apple",
    "pizza": "pizza",
    "grid": "grid",
    # Legacy topic names -> visual types
    "counting_objects": "candy",
    "grouping_model": "apple",
    "fraction_circle": "pizza",
    "area_grid": "grid",
    "array_model": "candy",
    "ten_frame": "candy",
    "place_value_blocks": "candy",
}

_DEFAULT_TOPIC_VISUAL_TYPES = {
    "multiplication": "candy",
    "division": "apple",
    "fraction_basic": "pizza",
    "perimeter_area_basic": "grid",
    "data_representation": "bar_chart",
    "addition_subtraction": "operation_story",
    "comparison_numbers": "comparison_visual",
    "time_clock": "clock_calendar",
    "measurement_length": "ruler_measurement",
}


def build_visual_bundle(
    topic: Topic,
    assistant_message: str,
    tool_data: dict,
    context: LearningContext,
    curriculum_visual_template: str | None = None,
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    """Build visual bundle for a chat turn.

    If *curriculum_visual_template* is provided and matches a key in
    ``VISUAL_REGISTRY`` on the frontend, it is emitted as
    ``VisualData.type`` so the new visual components are actually used.
    """

    visual_type = _resolve_visual_type(topic, curriculum_visual_template, context)

    if topic == "multiplication":
        return _build_multiplication_bundle(assistant_message, tool_data, visual_type)
    if topic == "division":
        return _build_division_bundle(assistant_message, tool_data, visual_type)
    if topic == "fraction_basic":
        return _build_fraction_bundle(assistant_message, tool_data, visual_type)
    if topic == "data_representation":
        return _build_bar_chart_bundle(assistant_message, tool_data, visual_type)
    if topic == "addition_subtraction":
        return _build_addition_subtraction_bundle(assistant_message, tool_data, visual_type)
    if topic == "comparison_numbers":
        return _build_comparison_numbers_bundle(assistant_message, tool_data, visual_type)
    if topic == "time_clock":
        return _build_time_clock_bundle(assistant_message, tool_data, visual_type)
    if topic == "measurement_length":
        return _build_measurement_length_bundle(assistant_message, tool_data, visual_type)
    return _build_rectangle_bundle(assistant_message, tool_data, context, visual_type)


def _resolve_visual_type(
    topic: Topic,
    curriculum_visual_template: str | None,
    context: LearningContext,
) -> str:
    """Pick the best visual type string to send to the frontend."""
    if curriculum_visual_template:
        return curriculum_visual_template

    return _DEFAULT_TOPIC_VISUAL_TYPES.get(topic, "grid")


def _build_multiplication_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "candy",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    return (
        LessonVisual(
            visual_type="equal_groups",
            object="candy",
            groups=tool_data["groups"],
            items_per_group=tool_data["items_per_group"],
        ),
        LessonSimulation(
            simulation_type="equal_groups_builder",
            prompt="Con th\u1eed \u0111\u1ebfm t\u1eebng nh\u00f3m r\u1ed3i t\u00ednh t\u1ed5ng s\u1ed1 v\u1eadt nh\u00e9.",
        ),
        VisualCard(
            topic="multiplication",
            title=f"Ph\u00e9p nh\u00e2n {tool_data['groups']} x {tool_data['items_per_group']} b\u1eb1ng nh\u00f3m \u0111\u1ec1u",
            short_explanation=assistant_message,
            life_example=f"C\u00f3 {tool_data['groups']} \u0111\u0129a, m\u1ed7i \u0111\u0129a c\u00f3 {tool_data['items_per_group']} k\u1eb9o.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["groups"],
                secondary_count=tool_data["items_per_group"],
                total_count=float(tool_data["total"]),
                groups_label="S\u1ed1 nh\u00f3m",
                items_label="S\u1ed1 v\u1eadt m\u1ed7i nh\u00f3m",
            ),
            simulation_config=SimulationConfig(
                type="groups",
                min_x=1,
                max_x=12,
                min_y=1,
                max_y=20,
                default_x=tool_data["groups"],
                default_y=tool_data["items_per_group"],
                label_x="S\u1ed1 nh\u00f3m",
                label_y="S\u1ed1 v\u1eadt m\u1ed7i nh\u00f3m",
            ),
        ),
    )


def _build_division_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "apple",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    return (
        LessonVisual(
            visual_type="sharing",
            object="apple",
            total_items=tool_data["total_items"],
            groups=tool_data["groups"],
        ),
        LessonSimulation(
            simulation_type="sharing_builder",
            prompt="Con th\u1eed chia \u0111\u1ec1u t\u1eebng v\u1eadt v\u00e0o m\u1ed7i nh\u00f3m nh\u00e9.",
        ),
        VisualCard(
            topic="division",
            title=f"Ph\u00e9p chia {tool_data['total_items']} cho {tool_data['groups']}",
            short_explanation=assistant_message,
            life_example=f"C\u00f3 {tool_data['total_items']} qu\u1ea3 t\u00e1o chia \u0111\u1ec1u cho {tool_data['groups']} b\u1ea1n.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["total_items"],
                secondary_count=tool_data["groups"],
                total_count=float(tool_data["items_per_group"]),
                groups_label="T\u1ed5ng s\u1ed1 t\u00e1o",
                items_label="S\u1ed1 b\u1ea1n",
            ),
            simulation_config=SimulationConfig(
                type="division",
                min_x=1,
                max_x=30,
                min_y=1,
                max_y=10,
                default_x=tool_data["total_items"],
                default_y=tool_data["groups"],
                label_x="T\u1ed5ng s\u1ed1 t\u00e1o",
                label_y="S\u1ed1 b\u1ea1n",
            ),
        ),
    )


def _build_fraction_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "pizza",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    return (
        LessonVisual(
            visual_type="fraction_pizza",
            object="pizza",
            numerator=tool_data["numerator"],
            denominator=tool_data["denominator"],
        ),
        LessonSimulation(
            simulation_type="fraction_pizza_fill",
            prompt="Con th\u1eed t\u00f4 m\u00e0u s\u1ed1 ph\u1ea7n \u0111\u00e3 l\u1ea5y tr\u00ean chi\u1ebfc pizza nh\u00e9.",
        ),
        VisualCard(
            topic="fraction_basic",
            title=f"Ph\u1ea7n s\u1ed1 {tool_data['fraction_text']} b\u1eb1ng pizza",
            short_explanation=assistant_message,
            life_example=(
                f"Pizza \u0111\u01b0\u1ee3c chia th\u00e0nh {tool_data['denominator']} ph\u1ea7n, "
                f"m\u00ecnh l\u1ea5y {tool_data['numerator']} ph\u1ea7n."
            ),
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["numerator"],
                secondary_count=tool_data["denominator"],
                total_count=tool_data["numerator"] / tool_data["denominator"],
                groups_label="S\u1ed1 ph\u1ea7n \u0111\u00e3 l\u1ea5y",
                items_label="T\u1ed5ng s\u1ed1 ph\u1ea7n",
            ),
            simulation_config=SimulationConfig(
                type="pizza_slices",
                min_x=0,
                max_x=12,
                min_y=1,
                max_y=12,
                default_x=tool_data["numerator"],
                default_y=tool_data["denominator"],
                label_x="S\u1ed1 mi\u1ebfng \u0111\u01b0\u1ee3c t\u00f4",
                label_y="T\u1ed5ng s\u1ed1 mi\u1ebfng",
            ),
        ),
    )


def _build_rectangle_bundle(
    assistant_message: str,
    tool_data: dict,
    context: LearningContext,
    visual_type: str = "grid",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    mode_label = "chu vi" if context.visual_type == "perimeter_path" else "di\u1ec7n t\u00edch"
    return (
        LessonVisual(
            visual_type="perimeter_path"
            if context.visual_type == "perimeter_path"
            else "area_grid",
            object="grid",
            length=tool_data["length"],
            width=tool_data["width"],
            unit=str(tool_data["unit"]),
        ),
        LessonSimulation(
            simulation_type="perimeter_path_counter"
            if context.visual_type == "perimeter_path"
            else "area_grid_counter",
            prompt=(
                "Con th\u1eed ch\u1ea1m theo \u0111\u01b0\u1eddng bao quanh \u0111\u1ec3 \u0111\u1ebfm chu vi nh\u00e9."
                if context.visual_type == "perimeter_path"
                else "Con th\u1eed \u0111\u1ebfm c\u00e1c \u00f4 vu\u00f4ng b\u00ean trong h\u00ecnh \u0111\u1ec3 t\u00ednh di\u1ec7n t\u00edch nh\u00e9."
            ),
        ),
        VisualCard(
            topic="perimeter_area_basic",
            title=f"H\u00ecnh ch\u1eef nh\u1eadt {tool_data['length']} x {tool_data['width']}",
            short_explanation=assistant_message,
            life_example=f"M\u00ecnh nh\u00ecn h\u00ecnh ch\u1eef nh\u1eadt \u0111\u1ec3 hi\u1ec3u {mode_label} b\u1eb1ng \u00f4 vu\u00f4ng.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["length"],
                secondary_count=tool_data["width"],
                total_count=float(
                    tool_data["perimeter"]
                    if context.visual_type == "perimeter_path"
                    else tool_data["area"]
                ),
                groups_label="Chi\u1ec1u d\u00e0i",
                items_label="Chi\u1ec1u r\u1ed9ng",
            ),
            simulation_config=SimulationConfig(
                type="rectangle_grid",
                min_x=1,
                max_x=20,
                min_y=1,
                max_y=20,
                default_x=tool_data["length"],
                default_y=tool_data["width"],
                label_x="Chi\u1ec1u d\u00e0i",
                label_y="Chi\u1ec1u r\u1ed9ng",
            ),
        ),
    )


def _build_bar_chart_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "bar_chart",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    labels = tool_data.get("labels") or ["T\u1ed5 1", "T\u1ed5 2", "T\u1ed5 3"]
    values = tool_data.get("values") or [6, 9, 7]
    max_value = max(values) if values else 0
    total_value = sum(values)

    return (
        LessonVisual(
            visual_type="bar_chart",
            object="chart",
            groups=len(values),
            total_items=total_value,
            chart_labels=labels,
            chart_values=values,
        ),
        LessonSimulation(
            simulation_type="bar_chart_reader",
            prompt="Con th\u1eed nh\u00ecn c\u1ed9t cao nh\u1ea5t v\u00e0 c\u1ed9t th\u1ea5p nh\u1ea5t \u0111\u1ec3 so s\u00e1nh s\u1ed1 li\u1ec7u nh\u00e9.",
        ),
        VisualCard(
            topic="data_representation",
            title="Bi\u1ec3u \u0111\u1ed3 c\u1ed9t so s\u00e1nh d\u1eef li\u1ec7u",
            short_explanation=assistant_message,
            life_example="M\u1ed7i c\u1ed9t bi\u1ec3u di\u1ec5n s\u1ed1 h\u1ecdc sinh c\u1ee7a m\u1ed9t t\u1ed5.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=len(values),
                secondary_count=max_value,
                total_count=float(total_value),
                groups_label="T\u1ed5",
                items_label="S\u1ed1 b\u1ea1n",
                config={
                    "labels": labels,
                    "values": values,
                },
            ),
            simulation_config=SimulationConfig(
                type="bar_chart_reader",
                min_x=1,
                max_x=max(1, len(values)),
                min_y=0,
                max_y=max(1, max_value),
                default_x=len(values),
                default_y=max_value,
                label_x="S\u1ed1 c\u1ed9t",
                label_y="Gi\u00e1 tr\u1ecb l\u1edbn nh\u1ea5t",
            ),
        ),
    )


def _build_addition_subtraction_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "operation_story",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    operation = tool_data["operation"]
    operand_a = tool_data["operand_a"]
    operand_b = tool_data["operand_b"]
    result = tool_data["result"]
    item_name = tool_data.get("item_name") or "qu\u1ea3 cam"
    op_label = "c\u1ed9ng" if operation == "+" else "tr\u1eeb"
    change_verb = "b\u1edbt \u0111i" if operation == "-" else "th\u00eam"

    return (
        LessonVisual(
            visual_type="operation_story",
            object=item_name,
            groups=operand_a,
            items_per_group=operand_b,
            total_items=result,
        ),
        LessonSimulation(
            simulation_type="operation_story_stepper",
            prompt="Con th\u1eed t\u00ednh t\u1eebng b\u01b0\u1edbc \u0111\u1ec3 ra k\u1ebft qu\u1ea3 cu\u1ed1i c\u00f9ng nh\u00e9.",
        ),
        VisualCard(
            topic="addition_subtraction",
            title=f"Ph\u00e9p {op_label} {operand_a} {operation} {operand_b}",
            short_explanation=assistant_message,
            life_example=f"C\u00f3 {operand_a} {item_name}, {change_verb} {operand_b} {item_name}, c\u00f2n l\u1ea1i {result} {item_name}.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=operand_a,
                secondary_count=operand_b,
                total_count=float(result),
                groups_label="S\u1ed1 th\u1ee9 nh\u1ea5t",
                items_label="S\u1ed1 th\u1ee9 hai",
                config={"operation": operation, "before": operand_a, "change": operand_b, "result": result},
            ),
            simulation_config=SimulationConfig(
                type="operation_story",
                min_x=0,
                max_x=max(20, operand_a + 5),
                min_y=0,
                max_y=max(20, operand_b + 5),
                default_x=operand_a,
                default_y=operand_b,
                label_x="S\u1ed1 th\u1ee9 nh\u1ea5t",
                label_y="S\u1ed1 th\u1ee9 hai",
            ),
        ),
    )


def _build_comparison_numbers_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "comparison_visual",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    number_a = tool_data["number_a"]
    number_b = tool_data["number_b"]
    symbol = tool_data.get("comparison_symbol") or "="
    larger = tool_data.get("larger", max(number_a, number_b))

    return (
        LessonVisual(
            visual_type="comparison_visual",
            object="s\u1ed1",
            groups=number_a,
            items_per_group=number_b,
            total_items=larger,
        ),
        LessonSimulation(
            simulation_type="comparison_visual_scale",
            prompt="Con th\u1eed xem s\u1ed1 n\u00e0o l\u1edbn h\u01a1n tr\u00ean tia s\u1ed1 nh\u00e9.",
        ),
        VisualCard(
            topic="comparison_numbers",
            title=f"So s\u00e1nh {number_a} v\u00e0 {number_b}",
            short_explanation=assistant_message,
            life_example=f"{number_a} {symbol} {number_b}.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=number_a,
                secondary_count=number_b,
                total_count=float(larger),
                groups_label="S\u1ed1 th\u1ee9 nh\u1ea5t",
                items_label="S\u1ed1 th\u1ee9 hai",
                config={"a_label": str(number_a), "b_label": str(number_b)},
            ),
            simulation_config=SimulationConfig(
                type="comparison_scale",
                min_x=0,
                max_x=max(number_a, number_b, 20),
                min_y=0,
                max_y=max(number_a, number_b, 20),
                default_x=number_a,
                default_y=number_b,
                label_x="S\u1ed1 th\u1ee9 nh\u1ea5t",
                label_y="S\u1ed1 th\u1ee9 hai",
            ),
        ),
    )


def _build_time_clock_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "clock_calendar",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    hour = tool_data["hour"]
    minute = tool_data.get("minute", 0)
    time_label = tool_data.get("time_label") or f"{hour} gi\u1edd"

    return (
        LessonVisual(
            visual_type="clock_calendar",
            object="\u0111\u1ed3ng h\u1ed3",
            groups=hour,
            items_per_group=minute,
            total_items=hour,
        ),
        LessonSimulation(
            simulation_type="clock_calendar_reader",
            prompt="Con th\u1eed di chuy\u1ec3n kim \u0111\u1ed3ng h\u1ed3 \u0111\u1ec3 \u0111\u1ecdc \u0111\u00fang gi\u1edd nh\u00e9.",
        ),
        VisualCard(
            topic="time_clock",
            title=f"\u0110\u1ecdc gi\u1edd {time_label}",
            short_explanation=assistant_message,
            life_example=f"\u0110\u1ed3ng h\u1ed3 \u0111ang ch\u1ec9 {time_label}.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=hour,
                secondary_count=minute,
                total_count=float(hour),
                groups_label="Gi\u1edd",
                items_label="Ph\u00fat",
                config={"mode": "clock", "hour": hour, "minute": minute},
            ),
            simulation_config=SimulationConfig(
                type="clock_reader",
                min_x=1,
                max_x=12,
                min_y=0,
                max_y=59,
                default_x=hour,
                default_y=minute,
                label_x="Gi\u1edd",
                label_y="Ph\u00fat",
            ),
        ),
    )


def _build_measurement_length_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "ruler_measurement",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    length_a = tool_data["length_a"]
    length_b = tool_data["length_b"]
    unit = tool_data.get("unit") or "cm"
    object_a = tool_data.get("object_a") or "c\u00e2y b\u00fat"
    object_b = tool_data.get("object_b") or "c\u00e2y th\u01b0\u1edbc"
    longer_object = tool_data.get("longer_object") or (
        object_a if length_a >= length_b else object_b
    )

    return (
        LessonVisual(
            visual_type="ruler_measurement",
            object=object_a,
            length=length_a,
            width=length_b,
            unit=unit,
        ),
        LessonSimulation(
            simulation_type="ruler_measurement_counter",
            prompt="Con th\u1eed \u0111o t\u1eebng v\u1eadt b\u1eb1ng th\u01b0\u1edbc \u0111\u1ec3 so s\u00e1nh \u0111\u1ed9 d\u00e0i nh\u00e9.",
        ),
        VisualCard(
            topic="measurement_length",
            title=f"So s\u00e1nh \u0111\u1ed9 d\u00e0i {object_a} v\u00e0 {object_b}",
            short_explanation=assistant_message,
            life_example=f"{object_a} d\u00e0i {length_a}{unit}, {object_b} d\u00e0i {length_b}{unit}. {longer_object} d\u00e0i h\u01a1n.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=length_a,
                secondary_count=length_b,
                total_count=float(max(length_a, length_b)),
                groups_label=object_a,
                items_label=object_b,
                config={"object_name": object_a, "length_cm": length_a},
            ),
            simulation_config=SimulationConfig(
                type="ruler_measurement",
                min_x=0,
                max_x=max(length_a, length_b, 20) + 5,
                min_y=0,
                max_y=max(length_a, length_b, 20) + 5,
                default_x=length_a,
                default_y=length_b,
                label_x=object_a,
                label_y=object_b,
            ),
        ),
    )
