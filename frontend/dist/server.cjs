var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/data/presets.ts
var PRESET_LESSONS = {
  multiplication: {
    domain: "multiplication",
    intent: "explain_concept",
    concept: "3 x 4",
    title: "Phep nhan: 3 dia banh, moi dia co 4 chiec banh kep",
    grade: 2,
    shortExplanation: "Phep nhan la cach cong nhieu nhom bang nhau that gon. Thay vi tinh 4 + 4 + 4, con co the viet 3 x 4, nghia la 3 nhom va moi nhom co 4 chiec.",
    lifeExample: "Hay tuong tuong me bay 3 dia banh ra ban. Moi dia co 4 chiec banh. Minh dem tong so banh de hieu vi sao 3 x 4 bang 12 nhe.",
    visualData: {
      type: "candy",
      primaryCount: 3,
      secondaryCount: 4,
      totalCount: 12,
      groupsLabel: "So nhom",
      itemsLabel: "So banh moi nhom"
    },
    simulationConfig: {
      type: "groups",
      minX: 1,
      maxX: 5,
      minY: 1,
      maxY: 6,
      defaultX: 3,
      defaultY: 4,
      labelX: "So nhom",
      labelY: "So vat moi nhom"
    },
    practiceQuestion: {
      id: "mult_practice_1",
      questionText: "Co 4 hop but, moi hop co 5 cay. Tong cong co bao nhieu cay but?",
      options: ["A. 4 + 5 = 9", "B. 4 x 5 = 20", "C. 5 x 4 = 15", "D. 4 x 5 = 24"],
      correctAnswerIndex: 1,
      successMessage: "Dung roi. Co 4 nhom, moi nhom 5 cay, nen 4 x 5 = 20.",
      failMessage: "Chua dung roi. Hay nho minh dang co 4 nhom bang nhau, moi nhom co 5 cay but.",
      hint: "So nhom nhan voi so vat trong moi nhom."
    },
    responseMode: "explain_with_visual_and_practice",
    visualPriority: "high",
    followUpSuggestions: [
      "Giai thich de hon duoc khong?",
      "Vi sao 3 x 4 lai bang 12?",
      "Cho con xem hinh minh hoa khac nhe."
    ]
  },
  division: {
    domain: "division",
    intent: "explain_concept",
    concept: "12 : 3",
    title: "Phep chia: Chia deu 12 qua tao cho 3 ban",
    grade: 2,
    shortExplanation: "Phep chia la cach tach deu mot so do vat thanh nhieu phan bang nhau. Neu co 12 qua tao chia cho 3 ban thi moi ban nhan 4 qua.",
    lifeExample: "Con co 12 qua tao va muon chia deu cho 3 nguoi ban. Minh chia tung qua mot de xem moi ban se nhan duoc bao nhieu qua nhe.",
    visualData: {
      type: "apple",
      primaryCount: 12,
      secondaryCount: 3,
      totalCount: 4,
      groupsLabel: "Tong so tao",
      itemsLabel: "So ban duoc chia"
    },
    simulationConfig: {
      type: "division",
      minX: 4,
      maxX: 16,
      minY: 2,
      maxY: 5,
      defaultX: 12,
      defaultY: 3,
      labelX: "Tong so tao",
      labelY: "So ban"
    },
    practiceQuestion: {
      id: "div_practice_1",
      questionText: "Co 15 vien keo chia deu cho 5 ban. Moi ban duoc may vien?",
      options: ["A. 3 vien", "B. 5 vien", "C. 4 vien", "D. 10 vien"],
      correctAnswerIndex: 0,
      successMessage: "Chinh xac. 15 chia 5 bang 3.",
      failMessage: "Chua dung roi. Hay thu chia deu 15 vien keo thanh 5 nhom.",
      hint: "Lay tong so vat chia cho so nhom."
    },
    responseMode: "explain_with_visual_and_practice",
    visualPriority: "high",
    followUpSuggestions: [
      "Giai thich de hon duoc khong?",
      "Vi sao chia deu lai ra 4 qua?",
      "Cho con them mot vi du khac nhe."
    ]
  },
  fraction_basic: {
    domain: "fraction_basic",
    intent: "explain_concept",
    concept: "3 / 4",
    title: "Phan so co ban: An 3 phan trong chiec banh 4 phan",
    grade: 3,
    shortExplanation: "Phan so cho biet minh dang lay may phan bang nhau trong mot tong the. Mau so cho biet co bao nhieu phan bang nhau, tu so cho biet minh lay may phan.",
    lifeExample: "Mot chiec pizza duoc cat thanh 4 mieng bang nhau. Neu con an 3 mieng, con da an 3/4 chiec banh.",
    visualData: {
      type: "pizza",
      primaryCount: 3,
      secondaryCount: 4,
      totalCount: 0.75,
      groupsLabel: "So phan da lay",
      itemsLabel: "Tong so phan bang nhau"
    },
    simulationConfig: {
      type: "pizza_slices",
      minX: 1,
      maxX: 8,
      minY: 2,
      maxY: 8,
      defaultX: 3,
      defaultY: 4,
      labelX: "So mieng duoc to",
      labelY: "Tong so mieng"
    },
    practiceQuestion: {
      id: "frac_practice_1",
      questionText: "Mot thanh socola chia 6 phan bang nhau. To mau 5 phan thi duoc phan so nao?",
      options: ["A. 1/6", "B. 5/6", "C. 6/5", "D. 5/5"],
      correctAnswerIndex: 1,
      successMessage: "Dung roi. To 5 phan trong tong 6 phan nen la 5/6.",
      failMessage: "Chua chinh xac. Hay nho tu so la so phan da to, mau so la tong so phan.",
      hint: "Da to 5 phan tren tong 6 phan bang nhau."
    },
    responseMode: "explain_with_visual_and_practice",
    visualPriority: "high",
    followUpSuggestions: [
      "Giai thich ngan hon duoc khong?",
      "Cho con vi du khac ve phan so nhe.",
      "Vi sao 3/4 lon hon 1/2?"
    ]
  },
  perimeter_area_basic: {
    domain: "perimeter_area_basic",
    intent: "explain_concept",
    concept: "4 x 3",
    title: "Chu vi va dien tich: Phong hinh chu nhat dai 4m rong 3m",
    grade: 4,
    shortExplanation: "Chu vi la do dai duong bao quanh hinh. Dien tich la phan ben trong hinh, co the hieu la so o vuong 1 x 1 phu kin ben trong.",
    lifeExample: "Phong ngu hinh chu nhat dai 4 met, rong 3 met. So o lat san ben trong giup con hieu dien tich, con duong ne quanh phong giup con hieu chu vi.",
    visualData: {
      type: "grid",
      primaryCount: 4,
      secondaryCount: 3,
      totalCount: 12,
      groupsLabel: "Chieu dai",
      itemsLabel: "Chieu rong"
    },
    simulationConfig: {
      type: "rectangle_grid",
      minX: 2,
      maxX: 6,
      minY: 1,
      maxY: 5,
      defaultX: 4,
      defaultY: 3,
      labelX: "Chieu dai",
      labelY: "Chieu rong"
    },
    practiceQuestion: {
      id: "peri_area_practice_1",
      questionText: "Hinh chu nhat dai 5m, rong 4m co dien tich bao nhieu?",
      options: ["A. 20 m2", "B. 18 m2", "C. 9 m2", "D. 10 m2"],
      correctAnswerIndex: 0,
      successMessage: "Dung roi. Dien tich = 5 x 4 = 20 m2.",
      failMessage: "Chua dung roi. Dien tich duoc tinh bang chieu dai nhan chieu rong.",
      hint: "Lay chieu dai nhan voi chieu rong."
    },
    responseMode: "explain_with_visual_and_practice",
    visualPriority: "high",
    followUpSuggestions: [
      "Giai thich de hon ve chu vi duoc khong?",
      "Phan biet chu vi voi dien tich giup con.",
      "Cho con xem hinh minh hoa khac nhe."
    ]
  }
};

// src/server/visualTutor.ts
var VISUAL_TUTOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      description: "Chu de hoc, phai la mot trong: multiplication, division, fraction_basic, perimeter_area_basic"
    },
    intent: {
      type: "string",
      description: "Y dinh noi bo cua hoc sinh: explain_concept, give_example, compare_or_why, show_visual, change_difficulty, generate_quick_practice"
    },
    concept: {
      type: "string",
      description: "Bieu thuc toan hoc rut gon, vi du 3 x 5, 15 : 3, 2/5, hinh chu nhat 6x4"
    },
    title: {
      type: "string",
      description: "Tieu de ngan gon, de hieu cho hoc sinh tieu hoc"
    },
    grade: {
      type: "integer",
      description: "Muc lop hoc sinh dang hoc"
    },
    shortExplanation: {
      type: "string",
      description: "Loi giai thich chinh, ngan, than thien, dung vai gia su dong hanh"
    },
    lifeExample: {
      type: "string",
      description: "Vi du doi song gan gui voi tre em"
    },
    responseMode: {
      type: "string",
      description: "explain_only, explain_with_visual, explain_with_visual_and_practice"
    },
    visualPriority: {
      type: "string",
      description: "low, medium, high"
    },
    followUpSuggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 4,
      description: "Cac goi y hoi tiep ngan gon cho hoc sinh"
    },
    visualData: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          description: "Loai visual, phai la mot trong: candy, apple, pizza, grid"
        },
        primaryCount: {
          type: "integer"
        },
        secondaryCount: {
          type: "integer"
        },
        totalCount: {
          type: "number"
        },
        groupsLabel: {
          type: "string"
        },
        itemsLabel: {
          type: "string"
        }
      },
      required: ["type", "primaryCount", "secondaryCount", "totalCount", "groupsLabel", "itemsLabel"]
    },
    simulationConfig: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          description: "Loai simulation: groups, division, pizza_slices, rectangle_grid"
        },
        minX: { type: "integer" },
        maxX: { type: "integer" },
        minY: { type: "integer" },
        maxY: { type: "integer" },
        defaultX: { type: "integer" },
        defaultY: { type: "integer" },
        labelX: { type: "string" },
        labelY: { type: "string" }
      },
      required: ["type", "minX", "maxX", "minY", "maxY", "defaultX", "defaultY", "labelX", "labelY"]
    },
    practiceQuestion: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        questionText: { type: "string" },
        options: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 4
        },
        correctAnswerIndex: { type: "integer" },
        successMessage: { type: "string" },
        failMessage: { type: "string" },
        hint: { type: "string" }
      },
      required: ["id", "questionText", "options", "correctAnswerIndex", "successMessage", "failMessage", "hint"]
    }
  },
  required: [
    "domain",
    "intent",
    "concept",
    "title",
    "grade",
    "shortExplanation",
    "lifeExample",
    "responseMode",
    "visualPriority",
    "followUpSuggestions",
    "visualData",
    "simulationConfig"
  ]
};
var DOMAINS = ["multiplication", "division", "fraction_basic", "perimeter_area_basic"];
var INTENTS = [
  "explain_concept",
  "give_example",
  "compare_or_why",
  "show_visual",
  "change_difficulty",
  "generate_quick_practice"
];
var RESPONSE_MODES = [
  "explain_only",
  "explain_with_visual",
  "explain_with_visual_and_practice"
];
var VISUAL_PRIORITIES = ["low", "medium", "high"];
function normalizeExplainRequest(payload) {
  return {
    requestedDomain: isMathDomain(payload.domain) ? payload.domain : "multiplication",
    targetGrade: normalizeGrade(payload.grade),
    promptText: (payload.customQuestion || "").trim(),
    followUpContext: Array.isArray(payload.followUpContext) ? payload.followUpContext.filter((item) => typeof item === "string" && item.trim()).slice(-4) : []
  };
}
function buildSystemPrompt(targetGrade) {
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
function buildUserPrompt(promptText, requestedDomain, targetGrade, followUpContext) {
  const contextText = followUpContext.length > 0 ? `Ngu canh 4 luot gan nhat cua hoc sinh: ${followUpContext.join(" | ")}.` : "Hien chua co ngu canh luot truoc.";
  return `Hay giai thich truc quan cau hoi sau cho hoc sinh lop ${targetGrade}: "${promptText}".
${contextText}
Domain hoc sinh dang mong cho gan nhat: ${requestedDomain}.

Yeu cau bat buoc:
- Xac dinh domain dung trong 4 domain.
- Xac dinh intent noi bo phu hop nhat.
- Chon responseMode phu hop: explain_only, explain_with_visual, explain_with_visual_and_practice.
- Chon visualPriority: low, medium, high.
- Thiet lap visualData va simulationConfig dung domain.
- Chi sinh practiceQuestion khi that su phu hop.
- followUpSuggestions gom 3 den 4 goi y hoi tiep ngan gon bang tieng Viet.

Mapping visual bat buoc:
- multiplication -> candy / groups
- division -> apple / division
- fraction_basic -> pizza / pizza_slices
- perimeter_area_basic -> grid / rectangle_grid`;
}
function validateMathExplanation(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI khong tra ve object hop le.");
  }
  const data = payload;
  if (!isMathDomain(data.domain)) {
    throw new Error("domain khong hop le.");
  }
  if (!isIntent(data.intent)) {
    throw new Error("intent khong hop le.");
  }
  if (!isResponseMode(data.responseMode)) {
    throw new Error("responseMode khong hop le.");
  }
  if (!isVisualPriority(data.visualPriority)) {
    throw new Error("visualPriority khong hop le.");
  }
  if (typeof data.concept !== "string" || !data.concept.trim()) {
    throw new Error("concept trong.");
  }
  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("title trong.");
  }
  if (typeof data.shortExplanation !== "string" || !data.shortExplanation.trim()) {
    throw new Error("shortExplanation trong.");
  }
  if (typeof data.lifeExample !== "string" || !data.lifeExample.trim()) {
    throw new Error("lifeExample trong.");
  }
  if (!Array.isArray(data.followUpSuggestions) || data.followUpSuggestions.length < 2) {
    throw new Error("followUpSuggestions khong hop le.");
  }
  if (!data.visualData || typeof data.visualData !== "object") {
    throw new Error("visualData thieu.");
  }
  if (!data.simulationConfig || typeof data.simulationConfig !== "object") {
    throw new Error("simulationConfig thieu.");
  }
  const visualData = data.visualData;
  const simulationConfig = data.simulationConfig;
  const expectedVisualMap = {
    multiplication: "candy",
    division: "apple",
    fraction_basic: "pizza",
    perimeter_area_basic: "grid"
  };
  const expectedSimulationMap = {
    multiplication: "groups",
    division: "division",
    fraction_basic: "pizza_slices",
    perimeter_area_basic: "rectangle_grid"
  };
  if (visualData.type !== expectedVisualMap[data.domain]) {
    throw new Error("visualData.type khong khop domain.");
  }
  if (simulationConfig.type !== expectedSimulationMap[data.domain]) {
    throw new Error("simulationConfig.type khong khop domain.");
  }
  return payload;
}
function selectFallbackPreset(domain, targetGrade) {
  const preset = PRESET_LESSONS[domain] || PRESET_LESSONS.multiplication;
  return {
    success: true,
    source: "presets",
    data: {
      ...preset,
      grade: targetGrade
    }
  };
}
function normalizeGrade(grade) {
  const parsed = Number.parseInt(String(grade ?? 3), 10);
  if (Number.isNaN(parsed)) {
    return 3;
  }
  return Math.max(1, Math.min(parsed, 5));
}
function isMathDomain(value) {
  return typeof value === "string" && DOMAINS.includes(value);
}
function isIntent(value) {
  return typeof value === "string" && INTENTS.includes(value);
}
function isResponseMode(value) {
  return typeof value === "string" && RESPONSE_MODES.includes(value);
}
function isVisualPriority(value) {
  return typeof value === "string" && VISUAL_PRIORITIES.includes(value);
}

// server.ts
import_dotenv.default.config();
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), "../.env") });
var app = (0, import_express.default)();
var PORT = 3e3;
var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
app.use(import_express.default.json());
function normalizeEnvValue(value) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}
function getOpenAiApiKey() {
  return normalizeEnvValue(process.env.OPENAI_API_KEY);
}
function getOpenAiModel() {
  const model = normalizeEnvValue(process.env.OPENAI_MODEL);
  if (model) {
    return model;
  }
  const defaultModel = normalizeEnvValue(process.env.DEFAULT_MODEL);
  if (defaultModel.startsWith("gpt-") || defaultModel.startsWith("o")) {
    return defaultModel;
  }
  return "gpt-4o-mini";
}
async function generateVisualExplanationWithOpenAi(args) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(args.targetGrade)
        },
        {
          role: "user",
          content: buildUserPrompt(
            args.promptText,
            args.requestedDomain,
            args.targetGrade,
            args.followUpContext
          )
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "visual_tutor_response",
          strict: true,
          schema: VISUAL_TUTOR_SCHEMA
        }
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no message content.");
  }
  return JSON.parse(content);
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/explain", async (req, res) => {
  const payload = normalizeExplainRequest(req.body);
  const fallback = selectFallbackPreset(payload.requestedDomain, payload.targetGrade);
  const openAiApiKey = getOpenAiApiKey();
  try {
    if (!payload.promptText || !openAiApiKey) {
      return res.json(fallback);
    }
    console.log(
      `Generating visual explanation with OpenAI for "${payload.promptText}" (grade ${payload.targetGrade}, domain hint ${payload.requestedDomain})`
    );
    const parsedData = await generateVisualExplanationWithOpenAi({
      promptText: payload.promptText,
      requestedDomain: payload.requestedDomain,
      targetGrade: payload.targetGrade,
      followUpContext: payload.followUpContext
    });
    const validatedData = validateMathExplanation(parsedData);
    return res.json({
      success: true,
      source: "openai-ai",
      data: validatedData
    });
  } catch (error) {
    console.error("OpenAI failed, returning preset fallback:", error);
    const unauthorized = String(error?.message || "").includes("401") || String(error?.message || "").includes("Incorrect API key provided") || String(error?.message || "").includes("invalid_api_key");
    return res.json({
      ...fallback,
      warning: unauthorized ? "OpenAI API key is invalid. Update OPENAI_API_KEY in frontend/.env or the project root .env and restart the dev server." : !openAiApiKey ? "OpenAI API key is missing. Add OPENAI_API_KEY in frontend/.env or the project root .env and restart the dev server." : void 0
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Khoi chay may chu Express o che do Development (cung voi Vite middleware)...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Khoi chay may chu Express o che do Production (phuc vu tep tinh)...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`May chu dang chay tai dia chi http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
