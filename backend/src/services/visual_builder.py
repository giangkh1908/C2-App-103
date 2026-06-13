from src.models.chat import SimulationConfig, Topic, VisualCard, VisualData
from src.models.lesson import LessonSimulation, LessonVisual
from src.services.types import LearningContext


def build_visual_bundle(
    topic: Topic,
    assistant_message: str,
    tool_data: dict,
    context: LearningContext,
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    if topic == "multiplication":
        return _build_multiplication_bundle(assistant_message, tool_data)
    if topic == "division":
        return _build_division_bundle(assistant_message, tool_data)
    if topic == "fraction_basic":
        return _build_fraction_bundle(assistant_message, tool_data)
    return _build_rectangle_bundle(assistant_message, tool_data, context)


def _build_multiplication_bundle(
    assistant_message: str,
    tool_data: dict,
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
            prompt="Con thu dem tung nhom roi tinh tong so vat nhe.",
        ),
        VisualCard(
            topic="multiplication",
            title=f"Phep nhan {tool_data['groups']} x {tool_data['items_per_group']} bang nhom deu",
            short_explanation=assistant_message,
            life_example=f"Co {tool_data['groups']} dia, moi dia co {tool_data['items_per_group']} keo.",
            visual_data=VisualData(
                type="candy",
                primary_count=tool_data["groups"],
                secondary_count=tool_data["items_per_group"],
                total_count=float(tool_data["total"]),
                groups_label="So nhom",
                items_label="So vat moi nhom",
            ),
            simulation_config=SimulationConfig(
                type="groups",
                min_x=1,
                max_x=12,
                min_y=1,
                max_y=20,
                default_x=tool_data["groups"],
                default_y=tool_data["items_per_group"],
                label_x="So nhom",
                label_y="So vat moi nhom",
            ),
        ),
    )


def _build_division_bundle(
    assistant_message: str,
    tool_data: dict,
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
            prompt="Con thu chia deu tung vat vao moi nhom nhe.",
        ),
        VisualCard(
            topic="division",
            title=f"Phep chia {tool_data['total_items']} cho {tool_data['groups']}",
            short_explanation=assistant_message,
            life_example=f"Co {tool_data['total_items']} qua tao chia deu cho {tool_data['groups']} ban.",
            visual_data=VisualData(
                type="apple",
                primary_count=tool_data["total_items"],
                secondary_count=tool_data["groups"],
                total_count=float(tool_data["items_per_group"]),
                groups_label="Tong so tao",
                items_label="So ban",
            ),
            simulation_config=SimulationConfig(
                type="division",
                min_x=1,
                max_x=30,
                min_y=1,
                max_y=10,
                default_x=tool_data["total_items"],
                default_y=tool_data["groups"],
                label_x="Tong so tao",
                label_y="So ban",
            ),
        ),
    )


def _build_fraction_bundle(
    assistant_message: str,
    tool_data: dict,
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
            prompt="Con thu to mau so phan da lay tren chiec pizza nhe.",
        ),
        VisualCard(
            topic="fraction_basic",
            title=f"Phan so {tool_data['fraction_text']} bang pizza",
            short_explanation=assistant_message,
            life_example=(
                f"Pizza duoc chia thanh {tool_data['denominator']} phan, "
                f"minh lay {tool_data['numerator']} phan."
            ),
            visual_data=VisualData(
                type="pizza",
                primary_count=tool_data["numerator"],
                secondary_count=tool_data["denominator"],
                total_count=tool_data["numerator"] / tool_data["denominator"],
                groups_label="So phan da lay",
                items_label="Tong so phan",
            ),
            simulation_config=SimulationConfig(
                type="pizza_slices",
                min_x=0,
                max_x=12,
                min_y=1,
                max_y=12,
                default_x=tool_data["numerator"],
                default_y=tool_data["denominator"],
                label_x="So mieng duoc to",
                label_y="Tong so mieng",
            ),
        ),
    )


def _build_rectangle_bundle(
    assistant_message: str,
    tool_data: dict,
    context: LearningContext,
) -> tuple[LessonVisual, LessonSimulation, VisualCard]:
    visual_type = "perimeter_path" if context.visual_type == "perimeter_path" else "area_grid"
    mode_label = "chu vi" if visual_type == "perimeter_path" else "dien tich"
    return (
        LessonVisual(
            visual_type=visual_type,
            object="grid",
            length=tool_data["length"],
            width=tool_data["width"],
            unit=str(tool_data["unit"]),
        ),
        LessonSimulation(
            simulation_type="perimeter_path_counter" if visual_type == "perimeter_path" else "area_grid_counter",
            prompt=(
                "Con thu cham theo duong bao quanh de dem chu vi nhe."
                if visual_type == "perimeter_path"
                else "Con thu dem cac o vuong ben trong hinh de tinh dien tich nhe."
            ),
        ),
        VisualCard(
            topic="perimeter_area_basic",
            title=f"Hinh chu nhat {tool_data['length']} x {tool_data['width']}",
            short_explanation=assistant_message,
            life_example=f"Minh nhin hinh chu nhat de hieu {mode_label} bang o vuong.",
            visual_data=VisualData(
                type="grid",
                primary_count=tool_data["length"],
                secondary_count=tool_data["width"],
                total_count=float(
                    tool_data["perimeter"] if visual_type == "perimeter_path" else tool_data["area"]
                ),
                groups_label="Chieu dai",
                items_label="Chieu rong",
            ),
            simulation_config=SimulationConfig(
                type="rectangle_grid",
                min_x=1,
                max_x=20,
                min_y=1,
                max_y=20,
                default_x=tool_data["length"],
                default_y=tool_data["width"],
                label_x="Chieu dai",
                label_y="Chieu rong",
            ),
        ),
    )
