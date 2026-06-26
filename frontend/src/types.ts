export type MathDomain =
  | 'multiplication'
  | 'division'
  | 'fraction_basic'
  | 'perimeter_area_basic'
  | 'data_representation';
export type TutorIntent =
  | 'explain_concept'
  | 'give_example'
  | 'compare_or_why'
  | 'show_visual'
  | 'change_difficulty'
  | 'generate_quick_practice';
export type ResponseMode =
  | 'explain_only'
  | 'explain_with_visual'
  | 'explain_with_visual_and_practice'
  | 'clarification_needed';

export type VisualPriority = 'low' | 'medium' | 'high';

// Curriculum topic types (additive, backward compatible)
export interface CurriculumTopicItem {
  topic_id: string;
  topic_name: string;
  strand: string;
  visual_templates: string[];
  difficulty: number;
}

export interface CurriculumTopicDetail extends CurriculumTopicItem {
  grade: number;
  content: string;
  learning_outcomes: string[];
  prompt_examples?: string[];
}

export interface CurriculumGradeSummary {
  grade: number;
  topic_count: number;
  strands: string[];
}

export type VisualType =
  | 'candy' | 'apple' | 'pizza' | 'grid'
  | 'number_line' | 'ten_frame' | 'place_value' | 'grouping'
  | 'counting_objects' | 'bar_model' | 'array_model' | 'comparison_visual'
  | 'rounding_visual' | 'balance_model' | 'expression_tree' | 'parity_visual'
  | 'mean_balance_visual' | 'area_model_distributive' | 'unit_rate_visual' | 'operation_story'
  | 'fraction_bar' | 'fraction_circle' | 'equivalent_fraction_visual' | 'decimal_place_value'
  | 'area_model_decimal' | 'percent_bar' | 'ratio_model'
  | 'data_table' | 'bar_chart' | 'pie_chart' | 'picture_graph'
  | 'probability_experiment' | 'scenario_cards'
  | 'ruler_measurement' | 'clock_calendar' | 'money_visual' | 'thermometer_visual'
  | 'mass_capacity_visual' | 'volume_cubes' | 'speed_distance_time_visual' | 'polyline_length_visual'
  | 'geometry_shape' | 'spatial_position_scene' | 'shape_sorting' | 'real_object_match'
  | 'shape_composition' | 'drag_drop_shapes' | 'angle_protractor' | 'shape_attribute_highlight'
  | 'solid_shape' | 'parallel_perpendicular_visual' | 'net_3d_visual' | 'area_grid'
  | 'roman_numeral_visual' | 'calculator_demo' | 'step_by_step_input';

export type SimulationType = string;

export interface VisualData {
  type: VisualType;
  primaryCount: number; // e.g., number of groups, numerator, or length
  secondaryCount: number; // e.g., size of each group, denominator, or width
  totalCount: number; // calculated total value
  groupsLabel?: string;
  itemsLabel?: string;
  config?: Record<string, unknown>;
}

export interface SimulationConfig {
  type: SimulationType;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  defaultX: number;
  defaultY: number;
  labelX: string;
  labelY: string;
}

export interface PracticeQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  successMessage: string;
  failMessage: string;
  hint: string;
}

export interface MathExplanation {
  domain: MathDomain;
  intent: TutorIntent;
  concept: string;
  title: string;
  grade: number;
  shortExplanation: string;
  lifeExample: string;
  visualData: VisualData;
  simulationConfig: SimulationConfig;
  practiceQuestion?: PracticeQuestion | null;
  responseMode: ResponseMode;
  visualPriority: VisualPriority;
  followUpSuggestions: string[];
}

export interface ExplainApiSuccessResponse {
  success: true;
  source: 'openai-ai' | 'presets';
  data: MathExplanation;
}

export interface ExplainApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ExplainApiResponse = ExplainApiSuccessResponse | ExplainApiErrorResponse;

export interface ChatTurnVisualCard {
  topic: MathDomain;
  title: string;
  short_explanation: string;
  life_example: string;
  visual_data: {
    type: VisualType;
    primary_count: number;
    secondary_count: number;
    total_count: number;
    groups_label?: string;
    items_label?: string;
    config?: Record<string, unknown>;
  };
  simulation_config: {
    type: SimulationType;
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
    default_x: number;
    default_y: number;
    label_x: string;
    label_y: string;
  };
}

export interface ChatTurnPracticeQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  success_message: string;
  fail_message: string;
  hint: string;
}

export interface ChatTurnResponse {
  session_id: string;
  assistant_message: string;
  detected_topic: MathDomain | null;
  intent: TutorIntent;
  response_mode: ResponseMode;
  visual_card: ChatTurnVisualCard | null;
  practice_question: ChatTurnPracticeQuestion | null;
  follow_up_suggestions: string[];
}

export interface SEOInfo {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  schemaMarkup: string; // JSON string of JSON-LD
}

export interface TestCase {
  name: string;
  input: string;
  preset: MathExplanation;
}

export interface PracticeGradeSummary {
  grade: number;
  exam_count: number;
}

export interface PracticeExamSummary {
  exam_id: string;
  title: string;
  grade: number;
  question_count: number;
  preview_text: string;
  attempt_status: 'not_started' | 'in_progress' | 'submitted_recently';
}

export interface PracticeExamQuestion {
  question_id: string;
  question_text: string;
  choices: string[];
  correct_choice_index: number;
  explanation: string;
}

export interface PracticeExamDetail extends PracticeExamSummary {
  source: string;
  source_row_id: string;
  source_split: string;
  tags: string[];
  is_active: boolean;
  sort_order?: number | null;
  curation_status: string;
  questions: PracticeExamQuestion[];
}

export interface PracticeAttemptCreateResponse {
  attempt_id: string;
  started_at: string;
  exam: PracticeExamDetail;
}

export interface PracticeAttemptSubmitAnswer {
  question_id: string;
  selected_choice_index: number | null;
}

export interface PracticeAttemptSubmitRequest {
  answers: PracticeAttemptSubmitAnswer[];
}

export interface PracticeAttemptQuestionResult {
  question_id: string;
  question_text: string;
  choices: string[];
  selected_choice_index: number | null;
  correct_choice_index: number;
  is_correct: boolean;
  explanation: string;
}

export interface PracticeAttemptResultSummary {
  score: number;
  correct_count: number;
  total_count: number;
  badge_label: string;
}

export interface PracticeAttemptResult {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  grade: number;
  status: string;
  started_at: string;
  updated_at: string;
  submitted_at: string | null;
  result_summary: PracticeAttemptResultSummary | null;
  answers: PracticeAttemptSubmitAnswer[];
  questions: PracticeAttemptQuestionResult[];
}

export interface PracticeAttemptHistoryItem {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  grade: number;
  status: string;
  score: number | null;
  correct_count: number | null;
  total_count: number | null;
  submitted_at: string | null;
  started_at: string;
  updated_at: string;
}

export interface PracticeAttemptLookupResponse {
  attempt: PracticeAttemptResult | null;
}
