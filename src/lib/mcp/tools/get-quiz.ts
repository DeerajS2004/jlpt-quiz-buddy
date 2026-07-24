import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { BUNDLED_QUIZZES, findQuiz } from "../quizzes";

export default defineTool({
  name: "get_quiz",
  title: "Get a bundled JLPT quiz",
  description:
    "Return the full question set for a bundled JLPT quiz, including every question's prompt, reading, options, correct answer index, and explanation. Call list_quizzes first to discover valid ids.",
  inputSchema: {
    id: z
      .string()
      .min(1)
      .describe("Quiz id from list_quizzes, e.g. 'n5-kanji'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const quiz = findQuiz(id);
    if (!quiz) {
      const known = BUNDLED_QUIZZES.map((q) => q.id).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Unknown quiz id "${id}". Known ids: ${known || "(none)"}.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(quiz.data, null, 2) }],
      structuredContent: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quiz: quiz.data,
      },
    };
  },
});
