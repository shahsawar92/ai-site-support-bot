import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingKeyError();
  // GEMINI_BASE_URL is only for pointing tests at a local fake server.
  const baseUrl = process.env.GEMINI_BASE_URL;
  client ??= new GoogleGenAI({ apiKey, ...(baseUrl && { httpOptions: { baseUrl } }) });
  return client;
}

export class MissingKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set on the server.");
  }
}

export function aiErrorResponse(err: unknown) {
  if (err instanceof MissingKeyError) {
    return Response.json({ error: "This demo isn't configured yet (missing AI key)." }, { status: 503 });
  }
  console.error(err);
  return Response.json({ error: "The AI service didn't respond. Please try again." }, { status: 502 });
}
