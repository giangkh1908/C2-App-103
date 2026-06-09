export type MathDomain = 'multiplication' | 'division' | 'fraction_basic' | 'perimeter_area_basic';

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
  concept: string;
  title: string;
  grade: number;
  shortExplanation: string;
  lifeExample: string;
  visualData: VisualData;
  simulationConfig: SimulationConfig;
  practiceQuestion: PracticeQuestion;
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
