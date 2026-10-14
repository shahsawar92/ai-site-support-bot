import { ApiError, GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";

let client: GoogleGenAI | null = null;

// Tried in order. If Google retires or renames a model (404), the next one is used.
const MODELS = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"].filter(
  (m, i, all): m is string => !!m && all.indexOf(m) === i,
);
export let MODEL = MODELS[0];

export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MissingKeyError();
  // GEMINI_BASE_URL is only for pointing tests at a local fake server.
  const baseUrl = process.env.GEMINI_BASE_URL;
  client ??= new GoogleGenAI({ apiKey, ...(baseUrl && { httpOptions: { baseUrl } }) });
  return client;
}

/** generateContent with automatic fallback to the next model when one isn't available. */
export async function generate(params: Omit<GenerateContentParameters, "model">): Promise<GenerateContentResponse> {
  let lastError: unknown;
  for (const model of MODELS.slice(MODELS.indexOf(MODEL))) {
    try {
      const res = await gemini().models.generateContent({ ...params, model });
      MODEL = model;
      return res;
    } catch (err) {
      lastError = err;
      if (!(err instanceof ApiError && err.status === 404)) throw err;
      console.warn(`Gemini model ${model} unavailable, trying the next one`);
    }
  }
  throw lastError;
}

export class MissingKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set on the server.");
  }
}

/** Turns provider errors into a message a visitor (and the site owner) can act on. Never includes the key. */
export function aiErrorResponse(err: unknown) {
  if (err instanceof MissingKeyError) {
    return Response.json({ error: "This demo isn't configured yet (missing AI key)." }, { status: 503 });
  }
  console.error(err);
  if (err instanceof ApiError) {
    const msg = err.message.toLowerCase();
    const reason =
      msg.includes("api key not valid") || msg.includes("api_key_invalid")
        ? "the Gemini API key is invalid"
        : err.status === 429
          ? "the free Gemini quota is used up for now"
          : err.status === 403
            ? "the Gemini API key isn't allowed to use this model"
            : err.status === 404
              ? `no Gemini model was available (tried ${MODELS.join(", ")})`
              : err.status >= 500
                ? "Gemini is having problems"
                : `Gemini returned an error ${err.status}`;
    return Response.json(
      { error: `The AI service didn't answer: ${reason}. Please try again later.`, detail: err.message.slice(0, 300) },
      { status: err.status === 429 ? 429 : 502 },
    );
  }
  const detail = err instanceof Error ? err.message.slice(0, 300) : String(err);
  return Response.json({ error: `The AI service didn't answer (${detail}).` }, { status: 502 });
}
