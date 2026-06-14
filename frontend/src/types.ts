export type MathDomain = 'multiplication' | 'division' | 'fraction_basic' | 'perimeter_area_basic';
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

export interface VisualData {
  type: 'candy' | 'apple' | 'pizza' | 'grid';
  primaryCount: number; // e.g., number of groups, numerator, or length
  secondaryCount: number; // e.g., size of each group, denominator, or width
  totalCount: number; // calculated total value
  groupsLabel?: string;
  itemsLabel?: string;
}

export interface SimulationConfig {
  type: 'groups' | 'division' | 'pizza_slices' | 'rectangle_grid';
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
    type: 'candy' | 'apple' | 'pizza' | 'grid';
    primary_count: number;
    secondary_count: number;
    total_count: number;
    groups_label?: string;
    items_label?: string;
  };
  simulation_config: {
    type: 'groups' | 'division' | 'pizza_slices' | 'rectangle_grid';
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
