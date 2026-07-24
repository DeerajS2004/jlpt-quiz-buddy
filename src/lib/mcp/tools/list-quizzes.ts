import { defineTool } from "@lovable.dev/mcp-js";
import { BUNDLED_QUIZZES } from "../quizzes";

export default defineTool({
  name: "list_quizzes",
  title: "List bundled JLPT quizzes",
  description:
    "List every JLPT quiz that ships with the app, with its id, title, description, and question count. Use the returned id with get_quiz to fetch the full question set.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const items = BUNDLED_QUIZZES.map((q) => {
      const questions = (q.data as { questions?: unknown[] })?.questions ?? [];
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        questionCount: Array.isArray(questions) ? questions.length : 0,
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { quizzes: items },
    };
  },
});
