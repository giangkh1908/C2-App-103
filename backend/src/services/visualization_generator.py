from __future__ import annotations

from dataclasses import dataclass

from src.services.concept_classifier import classify_curriculum_concept
from src.services.visualization_schema import CONCEPT_DEFINITIONS, ConceptType, PolypadMode


@dataclass(frozen=True)
class VisualizationPlan:
    concept_type: ConceptType
    template: str
    requested_template_accepted: bool
    polypad_enabled: bool = False
    polypad_mode: PolypadMode | None = None


def resolve_visualization_plan(
    curriculum_topic_id: str,
    normalized_message: str,
    requested_template: str | None,
    allowed_templates: tuple[str, ...],
) -> VisualizationPlan | None:
    concept_type = classify_curriculum_concept(
        curriculum_topic_id=curriculum_topic_id,
        normalized_message=normalized_message,
        requested_template=requested_template,
    )
    if concept_type is None:
        return None

    definition = CONCEPT_DEFINITIONS[concept_type]
    allowed_for_concept = tuple(template for template in definition.allowed_templates if template in allowed_templates)
    if not allowed_for_concept:
        allowed_for_concept = allowed_templates

    if requested_template and requested_template in allowed_for_concept:
        polypad_enabled, polypad_mode = _resolve_polypad_metadata(concept_type, requested_template)
        return VisualizationPlan(
            concept_type=concept_type,
            template=requested_template,
            requested_template_accepted=True,
            polypad_enabled=polypad_enabled,
            polypad_mode=polypad_mode,
        )

    for keywords, template in definition.keyword_overrides:
        if template not in allowed_for_concept:
            continue
        if any(keyword in normalized_message for keyword in keywords):
            polypad_enabled, polypad_mode = _resolve_polypad_metadata(concept_type, template)
            return VisualizationPlan(
                concept_type=concept_type,
                template=template,
                requested_template_accepted=False,
                polypad_enabled=polypad_enabled,
                polypad_mode=polypad_mode,
            )

    if definition.default_template in allowed_for_concept:
        template = definition.default_template
    else:
        template = allowed_for_concept[0]

    polypad_enabled, polypad_mode = _resolve_polypad_metadata(concept_type, template)
    return VisualizationPlan(
        concept_type=concept_type,
        template=template,
        requested_template_accepted=False,
        polypad_enabled=polypad_enabled,
        polypad_mode=polypad_mode,
    )


def _resolve_polypad_metadata(
    concept_type: ConceptType,
    template: str,
) -> tuple[bool, PolypadMode | None]:
    definition = CONCEPT_DEFINITIONS[concept_type]
    if concept_type == "compare_numbers":
        if template == "number_line":
            return True, "number-line"
        return False, None
    if concept_type == "mental_math_ten_frame":
        if template == "number_line":
            return True, "number-line"
        if template == "place_value_blocks":
            return True, "base-ten-blocks"
        return False, None
    return definition.polypad_enabled, definition.polypad_mode
