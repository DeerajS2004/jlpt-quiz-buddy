import { createServerFn } from "@tanstack/react-start";
import type { QuestionSet, QuestionType } from "./quiz-types";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface GenerateQuizInput {
  level: JlptLevel;
  categories: QuestionType[];
  count: number;
  extraPrompt?: string;
  performance?: string;
}

export const generateQuizFn = createServerFn({ method: "POST" })
  .inputValidator((input: GenerateQuizInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    if (!Array.isArray(input.categories) || input.categories.length === 0)
      throw new Error("Pick at least one category");
    if (typeof input.count !== "number" || input.count < 1 || input.count > 60)
      throw new Error("Question count must be between 1 and 60");
    return input;
  })
  .handler(async ({ data }): Promise<QuestionSet> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Add it to your environment (.env) and restart the app.",
      );
    }
    const { generateQuizWithGemini } = await import("./gemini.server");
    return generateQuizWithGemini(apiKey, data);
  });
