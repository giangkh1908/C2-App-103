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
