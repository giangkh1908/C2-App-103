import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  VISUAL_TUTOR_SCHEMA,
  buildSystemPrompt,
  buildUserPrompt,
  normalizeExplainRequest,
  selectFallbackPreset,
  validateMathExplanation,
} from './src/server/visualTutor.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = 3000;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

app.use(express.json());

function normalizeEnvValue(value: string | undefined): string {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '');
}

function getOpenAiApiKey(): string {
  return normalizeEnvValue(process.env.OPENAI_API_KEY);
}

function getOpenAiModel(): string {
  const model = normalizeEnvValue(process.env.OPENAI_MODEL);
  if (model) {
    return model;
  }

  const defaultModel = normalizeEnvValue(process.env.DEFAULT_MODEL);
  if (defaultModel.startsWith('gpt-') || defaultModel.startsWith('o')) {
    return defaultModel;
  }

  return 'gpt-4o-mini';
}

async function generateVisualExplanationWithOpenAi(args: {
  promptText: string;
  requestedDomain: string;
  targetGrade: number;
  followUpContext: string[];
}): Promise<unknown> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(args.targetGrade),
        },
        {
          role: 'user',
          content: buildUserPrompt(
            args.promptText,
            args.requestedDomain as any,
            args.targetGrade,
            args.followUpContext,
          ),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'visual_tutor_response',
          strict: true,
          schema: VISUAL_TUTOR_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no message content.');
  }

  return JSON.parse(content);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/explain', async (req, res) => {
  const payload = normalizeExplainRequest(req.body);
  const fallback = selectFallbackPreset(payload.requestedDomain, payload.targetGrade);
  const openAiApiKey = getOpenAiApiKey();

  try {
    if (!payload.promptText || !openAiApiKey) {
      return res.json(fallback);
    }

    console.log(
      `Generating visual explanation with OpenAI for "${payload.promptText}" (grade ${payload.targetGrade}, domain hint ${payload.requestedDomain})`,
    );

    const parsedData = await generateVisualExplanationWithOpenAi({
      promptText: payload.promptText,
      requestedDomain: payload.requestedDomain,
      targetGrade: payload.targetGrade,
      followUpContext: payload.followUpContext,
    });

    const validatedData = validateMathExplanation(parsedData);

    return res.json({
      success: true,
      source: 'openai-ai',
      data: validatedData,
    });
  } catch (error: any) {
    console.error('OpenAI failed, returning preset fallback:', error);
    const unauthorized =
      String(error?.message || '').includes('401') ||
      String(error?.message || '').includes('Incorrect API key provided') ||
      String(error?.message || '').includes('invalid_api_key');

    return res.json({
      ...fallback,
      warning: unauthorized
        ? 'OpenAI API key is invalid. Update OPENAI_API_KEY in frontend/.env or the project root .env and restart the dev server.'
        : !openAiApiKey
          ? 'OpenAI API key is missing. Add OPENAI_API_KEY in frontend/.env or the project root .env and restart the dev server.'
          : undefined,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Khoi chay may chu Express o che do Development (cung voi Vite middleware)...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Khoi chay may chu Express o che do Production (phuc vu tep tinh)...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`May chu dang chay tai dia chi http://localhost:${PORT}`);
  });
}

startServer();
