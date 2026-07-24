// Bundled JLPT quiz data used by MCP tools. Imports keep quiz JSON in the
// server bundle so tools don't need to fetch over HTTP at request time.
import n5KanjiAll from "../../../public/quizzes/jlpt_n5_kanji_all.json";

export type BundledQuiz = {
  id: string;
  title: string;
  description: string;
  data: unknown;
};

export const BUNDLED_QUIZZES: BundledQuiz[] = [
  {
    id: "n5-kanji",
    title: "JLPT N5 Kanji — Complete Set",
    description: "110 N5 kanji questions covering meanings and readings.",
    data: n5KanjiAll,
  },
];

export function findQuiz(id: string): BundledQuiz | undefined {
  return BUNDLED_QUIZZES.find((q) => q.id === id);
}
