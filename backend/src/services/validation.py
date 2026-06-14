from src.models.chat import Topic
from src.models.lesson import LessonResponse
from src.services.types import LearningCoreResult


EXPECTED_VISUAL_TYPES: dict[Topic, set[str]] = {
    "multiplication": {"equal_groups"},
    "division": {"sharing"},
    "fraction_basic": {"fraction_pizza"},
    "perimeter_area_basic": {"perimeter_path", "area_grid"},
}

EXPECTED_CHAT_VISUAL_TYPES: dict[Topic, str] = {
    "multiplication": "candy",
    "division": "apple",
    "fraction_basic": "pizza",
    "perimeter_area_basic": "grid",
}

EXPECTED_SIMULATION_TYPES: dict[str, str] = {
    "equal_groups": "equal_groups_builder",
    "sharing": "sharing_builder",
    "fraction_pizza": "fraction_pizza_fill",
    "perimeter_path": "perimeter_path_counter",
    "area_grid": "area_grid_counter",
}


def validate_learning_core_result(result: LearningCoreResult) -> None:
    # Clarification responses không cần visual/practice — skip validation
    if result.response_mode == "clarification_needed":
        if not result.tts_text.strip():
            raise ValueError("tts_text must not be empty")
        return

    if result.visual_spec is None:
        raise ValueError("visual_spec must not be None for non-clarification responses")

    visual_type = result.visual_spec.visual_type
    if visual_type not in EXPECTED_VISUAL_TYPES[result.topic]:
        raise ValueError(f"Visual type '{visual_type}' does not match topic '{result.topic}'")

    if result.visual_card is None or result.visual_card.visual_data.type != EXPECTED_CHAT_VISUAL_TYPES[result.topic]:
        raise ValueError("Runtime visual payload does not match topic")

    if result.simulation_spec is None:
        raise ValueError("simulation_spec must not be None for non-clarification responses")

    if result.simulation_spec.simulation_type != EXPECTED_SIMULATION_TYPES[visual_type]:
        raise ValueError("Simulation type does not match visual type")

    if not result.tts_text.strip():
        raise ValueError("tts_text must not be empty")

    if not result.simple_explanation.strip():
        raise ValueError("simple_explanation must not be empty")

    if result.practice_question_spec is None:
        raise ValueError("practice_question_spec must not be None for non-clarification responses")

    if result.practice_question_spec.correct_answer not in result.practice_question_spec.options:
        raise ValueError("Practice question correct_answer must exist in options")




def validate_lesson_response(response: LessonResponse) -> None:
    if response.visual.visual_type not in EXPECTED_VISUAL_TYPES[response.topic]:
        raise ValueError("Lesson visual_type does not match topic")

    if response.simulation.simulation_type != EXPECTED_SIMULATION_TYPES[response.visual.visual_type]:
        raise ValueError("Lesson simulation_type does not match visual_type")

    if response.practice_question.correct_answer not in response.practice_question.options:
        raise ValueError("Lesson correct_answer must exist in options")

    if not response.tts_text.strip():
        raise ValueError("Lesson tts_text must not be empty")
