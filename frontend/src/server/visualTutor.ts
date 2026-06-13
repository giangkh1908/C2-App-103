import { PRESET_LESSONS } from '../data/presets.js';
import type {
  ExplainApiSuccessResponse,
  MathDomain,
  MathExplanation,
  ResponseMode,
  TutorIntent,
  VisualPriority,
} from '../types.js';

export interface ExplainRequestPayload {
  domain?: MathDomain;
  grade?: number | string;
  customQuestion?: string;
  followUpContext?: string[];
}

export const VISUAL_TUTOR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    domain: {
      type: 'string',
      description: "Chu de hoc, phai la mot trong: multiplication, division, fraction_basic, perimeter_area_basic",
    },
    intent: {
      type: 'string',
      description:
        'Y dinh noi bo cua hoc sinh: explain_concept, give_example, compare_or_why, show_visual, change_difficulty, generate_quick_practice',
    },
    concept: {
      type: 'string',
      description: 'Bieu thuc toan hoc rut gon, vi du 3 x 5, 15 : 3, 2/5, hinh chu nhat 6x4',
    },
    title: {
      type: 'string',
      description: 'Tieu de ngan gon, de hieu cho hoc sinh tieu hoc',
    },
    grade: {
      type: 'integer',
      description: 'Muc lop hoc sinh dang hoc',
    },
    shortExplanation: {
      type: 'string',
      description: 'Loi giai thich chinh, ngan, than thien, dung vai gia su dong hanh',
    },
    lifeExample: {
      type: 'string',
      description: 'Vi du doi song gan gui voi tre em',
    },
    responseMode: {
      type: 'string',
      description: 'explain_only, explain_with_visual, explain_with_visual_and_practice',
    },
    visualPriority: {
      type: 'string',
      description: 'low, medium, high',
    },
    followUpSuggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 4,
      description: 'Cac goi y hoi tiep ngan gon cho hoc sinh',
    },
    visualData: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          description: 'Loai visual, phai la mot trong: candy, apple, pizza, grid',
        },
        primaryCount: {
          type: 'integer',
        },
        secondaryCount: {
          type: 'integer',
        },
        totalCount: {
          type: 'number',
        },
        groupsLabel: {
          type: 'string',
        },
        itemsLabel: {
          type: 'string',
        },
      },
      required: ['type', 'primaryCount', 'secondaryCount', 'totalCount', 'groupsLabel', 'itemsLabel'],
    },
    simulationConfig: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          description: 'Loai simulation: groups, division, pizza_slices, rectangle_grid',
        },
        minX: { type: 'integer' },
        maxX: { type: 'integer' },
        minY: { type: 'integer' },
        maxY: { type: 'integer' },
        defaultX: { type: 'integer' },
        defaultY: { type: 'integer' },
        labelX: { type: 'string' },
        labelY: { type: 'string' },
      },
      required: ['type', 'minX', 'maxX', 'minY', 'maxY', 'defaultX', 'defaultY', 'labelX', 'labelY'],
    },
    practiceQuestion: {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            questionText: { type: 'string' },
            options: {
              type: 'array',
              items: { type: 'string' },
              minItems: 4,
              maxItems: 4,
            },
            correctAnswerIndex: { type: 'integer' },
            successMessage: { type: 'string' },
            failMessage: { type: 'string' },
            hint: { type: 'string' },
          },
          required: ['id', 'questionText', 'options', 'correctAnswerIndex', 'successMessage', 'failMessage', 'hint'],
        },
        {
          type: 'null',
        },
      ],
    },
  },
  required: [
    'domain',
    'intent',
    'concept',
    'title',
    'grade',
    'shortExplanation',
    'lifeExample',
    'responseMode',
    'visualPriority',
    'followUpSuggestions',
    'visualData',
    'simulationConfig',
    'practiceQuestion',
  ],
} as const;

const DOMAINS: MathDomain[] = ['multiplication', 'division', 'fraction_basic', 'perimeter_area_basic'];
const INTENTS: TutorIntent[] = [
  'explain_concept',
  'give_example',
  'compare_or_why',
  'show_visual',
  'change_difficulty',
  'generate_quick_practice',
];
const RESPONSE_MODES: ResponseMode[] = [
  'explain_only',
  'explain_with_visual',
  'explain_with_visual_and_practice',
];
const VISUAL_PRIORITIES: VisualPriority[] = ['low', 'medium', 'high'];

export function normalizeExplainRequest(payload: ExplainRequestPayload): {
  requestedDomain: MathDomain;
  targetGrade: number;
  promptText: string;
  followUpContext: string[];
} {
  const promptText = (payload.customQuestion || '').trim();
  return {
    requestedDomain: isMathDomain(payload.domain)
      ? payload.domain
      : inferDomainFromPrompt(promptText),
    targetGrade: normalizeGrade(payload.grade),
    promptText,
    followUpContext: Array.isArray(payload.followUpContext)
      ? payload.followUpContext.filter((item) => typeof item === 'string' && item.trim()).slice(-4)
      : [],
  };
}

export function buildSystemPrompt(targetGrade: number): string {
  return `Ban la mot AI Visual Tutor dong vai gia su Toan hoc than thien cho hoc sinh tieu hoc Viet Nam lop ${targetGrade}.
Quy tac cot loi:
- KHONG lam bai ho hoc sinh.
- Chi hoat dong trong 4 domain: multiplication, division, fraction_basic, perimeter_area_basic.
- Loi giai thich phai ngan, ro, de hieu, giong mot nguoi dong hanh hoc tap.
- Chon dung mot intent noi bo trong cac intent da cho.
- Neu cau hoi thien ve hinh minh hoa hoac thao tac, dung responseMode co visual.
- Neu chi can giai thich ngan, co the dung explain_only nhung van tra ve visualData hop le.
- Khong gia vo tool calling, planner hay chatbot tong quat.
- Khong them markdown. Chi tra ve JSON hop le theo schema.`;
}

export function buildUserPrompt(
  promptText: string,
  requestedDomain: MathDomain,
  targetGrade: number,
  followUpContext: string[],
): string {
  const contextText =
    followUpContext.length > 0
      ? `Ngu canh 4 luot gan nhat cua hoc sinh: ${followUpContext.join(' | ')}.`
      : 'Hien chua co ngu canh luot truoc.';

  return `Hay giai thich truc quan cau hoi sau cho hoc sinh lop ${targetGrade}: "${promptText}".
${contextText}
Domain hoc sinh dang mong cho gan nhat: ${requestedDomain}.

Yeu cau bat buoc:
- Xac dinh domain dung trong 4 domain.
- Xac dinh intent noi bo phu hop nhat.
- Chon responseMode phu hop: explain_only, explain_with_visual, explain_with_visual_and_practice.
- Chon visualPriority: low, medium, high.
- Thiet lap visualData va simulationConfig dung domain.
- Neu can bai tap nhanh thi sinh practiceQuestion day du.
- Neu khong can bai tap nhanh, van phai tra ve practiceQuestion = null.
- followUpSuggestions gom 3 den 4 goi y hoi tiep ngan gon bang tieng Viet.

Mapping visual bat buoc:
- multiplication -> candy / groups
- division -> apple / division
- fraction_basic -> pizza / pizza_slices
- perimeter_area_basic -> grid / rectangle_grid`;
}

export function validateMathExplanation(payload: unknown): MathExplanation {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI khong tra ve object hop le.');
  }

  const data = payload as Record<string, unknown>;
  if (!isMathDomain(data.domain)) {
    throw new Error('domain khong hop le.');
  }
  if (!isIntent(data.intent)) {
    throw new Error('intent khong hop le.');
  }
  if (!isResponseMode(data.responseMode)) {
    throw new Error('responseMode khong hop le.');
  }
  if (!isVisualPriority(data.visualPriority)) {
    throw new Error('visualPriority khong hop le.');
  }
  if (typeof data.concept !== 'string' || !data.concept.trim()) {
    throw new Error('concept trong.');
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('title trong.');
  }
  if (typeof data.shortExplanation !== 'string' || !data.shortExplanation.trim()) {
    throw new Error('shortExplanation trong.');
  }
  if (typeof data.lifeExample !== 'string' || !data.lifeExample.trim()) {
    throw new Error('lifeExample trong.');
  }
  if (!Array.isArray(data.followUpSuggestions) || data.followUpSuggestions.length < 2) {
    throw new Error('followUpSuggestions khong hop le.');
  }
  if (!data.visualData || typeof data.visualData !== 'object') {
    throw new Error('visualData thieu.');
  }
  if (!data.simulationConfig || typeof data.simulationConfig !== 'object') {
    throw new Error('simulationConfig thieu.');
  }
  if (!('practiceQuestion' in data)) {
    throw new Error('practiceQuestion thieu.');
  }

  const visualData = data.visualData as Record<string, unknown>;
  const simulationConfig = data.simulationConfig as Record<string, unknown>;
  const practiceQuestion = data.practiceQuestion;

  const expectedVisualMap: Record<MathDomain, string> = {
    multiplication: 'candy',
    division: 'apple',
    fraction_basic: 'pizza',
    perimeter_area_basic: 'grid',
  };
  const expectedSimulationMap: Record<MathDomain, string> = {
    multiplication: 'groups',
    division: 'division',
    fraction_basic: 'pizza_slices',
    perimeter_area_basic: 'rectangle_grid',
  };

  if (visualData.type !== expectedVisualMap[data.domain]) {
    throw new Error('visualData.type khong khop domain.');
  }
  if (simulationConfig.type !== expectedSimulationMap[data.domain]) {
    throw new Error('simulationConfig.type khong khop domain.');
  }
  if (data.responseMode === 'explain_with_visual_and_practice') {
    if (!practiceQuestion || typeof practiceQuestion !== 'object') {
      throw new Error('practiceQuestion phai co khi responseMode yeu cau practice.');
    }
  }

  return payload as MathExplanation;
}

export function selectFallbackPreset(domain: MathDomain, targetGrade: number): ExplainApiSuccessResponse {
  const preset = PRESET_LESSONS[domain] || PRESET_LESSONS.multiplication;
  return {
    success: true,
    source: 'presets',
    data: {
      ...preset,
      grade: targetGrade,
    },
  };
}

function normalizeGrade(grade: number | string | undefined): number {
  const parsed = Number.parseInt(String(grade ?? 3), 10);
  if (Number.isNaN(parsed)) {
    return 3;
  }
  return Math.max(1, Math.min(parsed, 5));
}

function isMathDomain(value: unknown): value is MathDomain {
  return typeof value === 'string' && DOMAINS.includes(value as MathDomain);
}

function isIntent(value: unknown): value is TutorIntent {
  return typeof value === 'string' && INTENTS.includes(value as TutorIntent);
}

function isResponseMode(value: unknown): value is ResponseMode {
  return typeof value === 'string' && RESPONSE_MODES.includes(value as ResponseMode);
}

function isVisualPriority(value: unknown): value is VisualPriority {
  return typeof value === 'string' && VISUAL_PRIORITIES.includes(value as VisualPriority);
}

function inferDomainFromPrompt(promptText: string): MathDomain {
  const normalized = promptText.toLowerCase();

  if (
    normalized.includes('phan so') ||
    normalized.includes('pizza') ||
    normalized.includes('1/') ||
    normalized.includes('2/') ||
    normalized.includes('3/') ||
    normalized.includes('4/') ||
    normalized.includes('5/')
  ) {
    return 'fraction_basic';
  }

  if (
    normalized.includes('chu vi') ||
    normalized.includes('dien tich') ||
    normalized.includes('hinh chu nhat') ||
    normalized.includes('o vuong') ||
    normalized.includes('grid') ||
    normalized.includes('met vuong')
  ) {
    return 'perimeter_area_basic';
  }

  if (
    normalized.includes('chia') ||
    normalized.includes('chia deu') ||
    normalized.includes('12 chia 4') ||
    normalized.includes('15 : 3') ||
    normalized.includes(':')
  ) {
    return 'division';
  }

  if (
    normalized.includes('nhan') ||
    normalized.includes('phep nhan') ||
    normalized.includes('x') ||
    normalized.includes('nhom') ||
    normalized.includes('dia keo')
  ) {
    return 'multiplication';
  }

  return 'multiplication';
}
