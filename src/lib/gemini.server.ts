import type { QuestionSet, QuestionType } from "./quiz-types";

const MODEL = "gemini-3.6-flash";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface GenerateInput {
  level: JlptLevel;
  categories: QuestionType[];
  count: number;
  extraPrompt?: string;
  /** Pre-formatted summary of the learner's stats + recent mistakes. */
  performance?: string;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          question: { type: "STRING" },
          reading: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          answer: { type: "INTEGER" },
          explanation: { type: "STRING" },
        },
        required: ["type", "question", "options", "answer", "explanation"],
      },
    },
  },
  required: ["title", "questions"],
};

export async function generateQuizWithGemini(
  apiKey: string,
  params: GenerateInput,
): Promise<QuestionSet> {
  const { level, categories, count, extraPrompt, performance } = params;

  const prompt = `Generate exactly ${count} unique JLPT ${level} practice questions.
Categories to draw from: ${categories.join(", ")}.

Rules:
- Each question must be authentic JLPT ${level} level — do not use content harder or easier than that level.
- For "kanji": ask meaning or reading of a kanji/word written in kanji. Include the reading in the "reading" field.
- For "vocabulary": test word meaning or usage.
- For "grammar": test a grammar pattern in a sentence (use ___ for the blank).
- For "reading": short passage followed by a comprehension question.
- For "expression": common set phrases / keigo / idiomatic usage.
- Provide exactly 4 options.
- "answer" is the 0-based index of the correct option.
- "explanation" must be a concise English explanation of why the answer is correct.
- Distribute questions roughly evenly across the requested categories.
- Return valid JSON only, matching the schema.
${
  performance
    ? `
LEARNER PERFORMANCE DATA (analyse this before writing questions):
${performance}

Use this data to target the learner's weak points: weight questions toward the
categories with the lowest accuracy, re-test (in reworded form, never verbatim)
the concepts they answered incorrectly, and avoid over-drilling what they
already answer correctly. Keep everything within JLPT ${level}.
`
    : ""
}${
    extraPrompt?.trim()
      ? `
ADDITIONAL USER INSTRUCTIONS (follow these unless they conflict with the rules above):
${extraPrompt.trim()}
`
      : ""
  }
Set the title to "JLPT ${level} — AI Generated (${count}q)".`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  let parsed: {
    title?: string;
    description?: string;
    questions: Array<{
      type: string;
      question: string;
      reading?: string;
      options: string[];
      answer: number;
      explanation?: string;
    }>;
  };
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const validTypes: QuestionType[] = ["kanji", "vocabulary", "grammar", "reading", "expression"];
  const questions = (parsed.questions ?? []).map((q, i) => ({
    id: i + 1,
    type: (validTypes.includes(q.type as QuestionType) ? q.type : categories[0]) as QuestionType,
    question: q.question,
    reading: q.reading,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  }));

  if (questions.length === 0) throw new Error("Gemini returned zero questions");

  return {
    title: parsed.title ?? `JLPT ${level} — AI Generated`,
    description: parsed.description,
    questions,
  };
}
