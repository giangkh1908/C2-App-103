'use client';

import type { VisualComponent } from '@/components/visuals/shared';
import {
  VISUAL_REGISTRY,
} from '@/components/visuals';

import type { VisualizationTemplate } from './schema';

export const VISUALIZATION_TEMPLATE_REGISTRY: Partial<Record<VisualizationTemplate, VisualComponent>> = {
  counting_objects: VISUAL_REGISTRY.counting_objects,
  number_line: VISUAL_REGISTRY.number_line,
  ten_frame: VISUAL_REGISTRY.ten_frame,
  place_value_blocks: VISUAL_REGISTRY.place_value_blocks,
  comparison_visual: VISUAL_REGISTRY.comparison_visual,
  array_model: VISUAL_REGISTRY.array_model,
  grouping_model: VISUAL_REGISTRY.grouping_model,
  operation_story: VISUAL_REGISTRY.operation_story,
  stick_bundles: VISUAL_REGISTRY.stick_bundles,
  bar_model: VISUAL_REGISTRY.bar_model,
  geometry_shape: VISUAL_REGISTRY.geometry_shape,
  shape_composition: VISUAL_REGISTRY.shape_composition,
  ruler_measurement: VISUAL_REGISTRY.ruler_measurement,
  clock_calendar: VISUAL_REGISTRY.clock_calendar,
  money_visual: VISUAL_REGISTRY.money_visual,
  mass_capacity_visual: VISUAL_REGISTRY.mass_capacity_visual,
  picture_graph: VISUAL_REGISTRY.picture_graph,
  data_table: VISUAL_REGISTRY.data_table,
  probability_experiment: VISUAL_REGISTRY.probability_experiment,
  scenario_cards: VISUAL_REGISTRY.scenario_cards,
  drag_drop_shapes: VISUAL_REGISTRY.drag_drop_shapes,
  real_object_match: VISUAL_REGISTRY.real_object_match,
  spatial_position_scene: VISUAL_REGISTRY.spatial_position_scene,
  polyline_length_visual: VISUAL_REGISTRY.polyline_length_visual,
};
