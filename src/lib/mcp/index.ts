import { defineMcp } from "@lovable.dev/mcp-js";
import getQuizTool from "./tools/get-quiz";
import listQuizzesTool from "./tools/list-quizzes";

export default defineMcp({
  name: "jlpt-practice-mcp",
  title: "JLPT Practice MCP",
  version: "0.1.0",
  instructions:
    "Tools for the JLPT Practice app. Use `list_quizzes` to see every bundled JLPT quiz, then `get_quiz` to fetch the full question set (prompts, readings, options, answers, explanations) for study, drilling, or generating new practice material.",
  tools: [listQuizzesTool, getQuizTool],
});
