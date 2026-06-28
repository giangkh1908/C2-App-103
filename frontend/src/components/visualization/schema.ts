'use client';

export type VisualizationTemplate =
  | 'counting_objects'
  | 'number_line'
  | 'ten_frame'
  | 'place_value_blocks'
  | 'comparison_visual'
  | 'array_model'
  | 'grouping_model'
  | 'operation_story'
  | 'stick_bundles'
  | 'bar_model'
  | 'geometry_shape'
  | 'shape_composition'
  | 'ruler_measurement'
  | 'clock_calendar'
  | 'money_visual'
  | 'mass_capacity_visual'
  | 'picture_graph'
  | 'data_table'
  | 'probability_experiment'
  | 'scenario_cards'
  | 'drag_drop_shapes'
  | 'real_object_match'
  | 'spatial_position_scene'
  | 'polyline_length_visual';

export type ConceptType =
  | 'addition_with_objects'
  | 'subtraction_with_objects'
  | 'mental_math_number_line'
  | 'mental_math_ten_frame'
  | 'multiplication_as_groups'
  | 'division_as_sharing'
  | 'place_value'
  | 'compare_numbers'
  | 'geometry_shapes'
  | 'shape_composition'
  | 'measurement_length'
  | 'time_clock'
  | 'money'
  | 'mass_capacity'
  | 'picture_graph'
  | 'probability_basic'
  | 'word_problem_bar_model';

export interface ValidatedVisualizationPayload {
  type: VisualizationTemplate | string;
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
  config?: Record<string, unknown>;
}

export const TEMPLATE_REQUIRED_CONFIG: Partial<Record<VisualizationTemplate, readonly string[]>> = {
  comparison_visual: ['a_label', 'b_label'],
  place_value_blocks: ['number'],
  operation_story: ['operation', 'before', 'change', 'result'],
  stick_bundles: ['operation', 'before', 'change', 'result'],
  array_model: ['rows', 'cols'],
  bar_model: ['top_label', 'bottom_label', 'unit_label'],
  ruler_measurement: ['object_name'],
  clock_calendar: ['mode'],
  money_visual: ['denominations', 'total_value', 'currency'],
  mass_capacity_visual: ['left_label', 'right_label', 'unit'],
  picture_graph: ['labels', 'values'],
  data_table: ['labels', 'values'],
  probability_experiment: ['outcomes', 'favorable_count', 'experiment_label'],
};
