from src.models.chat import SimulationConfig, Topic, VisualCard, VisualData
from src.models.lesson import LessonSimulation, LessonVisual
from src.services.types import LearningContext


# Curriculum visual templates that map to existing backend types
_LEGACY_TEMPLATE_MAP = {
    "candy": "candy",
    "apple": "apple",
    "pizza": "pizza",
    "grid": "grid",
    # Legacy topic names → visual types
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

    # Determine the visual type to emit
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
    # If a curriculum template is explicitly provided, prefer it
    if curriculum_visual_template:
        # Direct match (e.g. "fraction_bar", "number_line", "bar_chart")
        return curriculum_visual_template

    # Fallback to the default visual type for each supported topic.
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
            prompt="Con thá»­ Äáº¿m tá»«ng nhÃ³m rá»i tÃ­nh tá»ng sá» váº­t nhÃ©.",
        ),
        VisualCard(
            topic="multiplication",
            title=f"PhÃ©p nhÃ¢n {tool_data['groups']} x {tool_data['items_per_group']} báº±ng nhÃ³m Äá»u",
            short_explanation=assistant_message,
            life_example=f"CÃ³ {tool_data['groups']} ÄÄ©a, má»i ÄÄ©a cÃ³ {tool_data['items_per_group']} káº¹o.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["groups"],
                secondary_count=tool_data["items_per_group"],
                total_count=float(tool_data["total"]),
                groups_label="Sá» nhÃ³m",
                items_label="Sá» váº­t má»i nhÃ³m",
            ),
            simulation_config=SimulationConfig(
                type="groups",
                min_x=1,
                max_x=12,
                min_y=1,
                max_y=20,
                default_x=tool_data["groups"],
                default_y=tool_data["items_per_group"],
                label_x="Sá» nhÃ³m",
                label_y="Sá» váº­t má»i nhÃ³m",
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
            prompt="Con thá»­ chia Äá»u tá»«ng váº­t vÃ o má»i nhÃ³m nhÃ©.",
        ),
        VisualCard(
            topic="division",
            title=f"PhÃ©p chia {tool_data['total_items']} cho {tool_data['groups']}",
            short_explanation=assistant_message,
            life_example=f"CÃ³ {tool_data['total_items']} quáº£ tÃ¡o chia Äá»u cho {tool_data['groups']} báº¡n.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["total_items"],
                secondary_count=tool_data["groups"],
                total_count=float(tool_data["items_per_group"]),
                groups_label="Tá»ng sá» tÃ¡o",
                items_label="Sá» báº¡n",
            ),
            simulation_config=SimulationConfig(
                type="division",
                min_x=1,
                max_x=30,
                min_y=1,
                max_y=10,
                default_x=tool_data["total_items"],
                default_y=tool_data["groups"],
                label_x="Tá»ng sá» tÃ¡o",
                label_y="Sá» báº¡n",
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
            prompt="Con thá»­ tÃ´ mÃ u sá» pháº§n ÄÃ£ láº¥y trÃªn chiáº¿c pizza nhÃ©.",
        ),
        VisualCard(
            topic="fraction_basic",
            title=f"Pháº§n sá» {tool_data['fraction_text']} báº±ng pizza",
            short_explanation=assistant_message,
            life_example=(
                f"Pizza ÄÆ°á»£c chia thÃ nh {tool_data['denominator']} pháº§n, "
                f"mÃ¬nh láº¥y {tool_data['numerator']} phan."
            ),
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["numerator"],
                secondary_count=tool_data["denominator"],
                total_count=tool_data["numerator"] / tool_data["denominator"],
                groups_label="Sá» pháº§n ÄÃ£ láº¥y",
                items_label="Tá»ng sá» pháº§n",
            ),
            simulation_config=SimulationConfig(
                type="pizza_slices",
                min_x=0,
                max_x=12,
                min_y=1,
                max_y=12,
                default_x=tool_data["numerator"],
                default_y=tool_data["denominator"],
                label_x="Sá» miáº¿ng ÄÆ°á»£c tÃ´",
                label_y="Tá»ng sá» miáº¿ng",
            ),
        ),
    )


def _build_rectangle_bundle(
    assistant_message: str,
    tool_data: dict,
    context: LearningContext,
    visual_type: str = "grid",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    mode_label = "chu vi" if context.visual_type == "perimeter_path" else "diá»n tÃ­ch"
    return (
        LessonVisual(
            visual_type="perimeter_path" if context.visual_type == "perimeter_path" else "area_grid",
            object="grid",
            length=tool_data["length"],
            width=tool_data["width"],
            unit=str(tool_data["unit"]),
        ),
        LessonSimulation(
            simulation_type="perimeter_path_counter" if context.visual_type == "perimeter_path" else "area_grid_counter",
            prompt=(
                "Con thá»­ cháº¡m theo ÄÆ°á»ng bao quanh Äá» Äáº¿m chu vi nhÃ©."
                if context.visual_type == "perimeter_path"
                else "Con thu dem cac o vuong ben trong hinh de tinh diá»n tÃ­ch nhe."
            ),
        ),
        VisualCard(
            topic="perimeter_area_basic",
            title=f"HÃ¬nh chá»¯ nháº­t {tool_data['length']} x {tool_data['width']}",
            short_explanation=assistant_message,
            life_example=f"MÃ¬nh nhÃ¬n hÃ¬nh chá»¯ nháº­t Äá» hiá»u {mode_label} báº±ng Ã´ vuÃ´ng.",
            visual_data=VisualData(
                type=visual_type,
                primary_count=tool_data["length"],
                secondary_count=tool_data["width"],
                total_count=float(
                    tool_data["perimeter"] if context.visual_type == "perimeter_path" else tool_data["area"]
                ),
                groups_label="Chiá»u dÃ i",
                items_label="Chiá»u rá»ng",
            ),
            simulation_config=SimulationConfig(
                type="rectangle_grid",
                min_x=1,
                max_x=20,
                min_y=1,
                max_y=20,
                default_x=tool_data["length"],
                default_y=tool_data["width"],
                label_x="Chiá»u dÃ i",
                label_y="Chiá»u rá»ng",
            ),
        ),
    )


def _build_bar_chart_bundle(
    assistant_message: str,
    tool_data: dict,
    visual_type: str = "bar_chart",
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    labels = tool_data.get("labels") or ["Tá» 1", "Tá» 2", "Tá» 3"]
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
            prompt="Con thá»­ nhÃ¬n cá»t cao nháº¥t vÃ  cá»t tháº¥p nháº¥t Äá» so sÃ¡nh sá» liá»u nhÃ©.",
        ),
        VisualCard(
            topic="data_representation",
            title="Biá»u Äá» cá»t so sÃ¡nh dá»¯ liá»u",
            short_explanation=assistant_message,
            life_example="Má»i cá»t biá»u diá»n sá» há»c sinh cá»§a má»t tá».",
            visual_data=VisualData(
                type=visual_type,
                primary_count=len(values),
                secondary_count=max_value,
                total_count=float(total_value),
                groups_label="Tá»",
                items_label="Sá» báº¡n",
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
                label_x="Sá» cá»t",
                label_y="GiÃ¡ trá» lá»n nháº¥t",
            ),
        ),
    )
