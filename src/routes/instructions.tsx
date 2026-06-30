import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { TYPE_LABELS, QUESTION_TYPES } from "@/lib/quiz-types";

export const Route = createFileRoute("/instructions")({
  head: () => ({
    meta: [
      { title: "Instructions — JLPT Practice" },
      { name: "description", content: "How to use the JLPT Practice app and how to structure your JSON question files." },
    ],
  }),
  component: Instructions,
});

const SAMPLE = `{
  "day": "N5-Foundation",
  "date": "2026-03-19",
  "title": "JLPT N5 Kanji — Complete Set",
  "description": "Optional description shown on the load screen.",
  "questions": [
    {
      "id": 1,
      "type": "kanji",
      "question": "「一」の意味は何ですか？",
      "reading": "いち / ひと",
      "options": ["One", "Two", "Three", "Ten"],
      "answer": 0,
      "explanation": "一 (ichi/hito) = One. e.g. 一つ (hitotsu) = one thing."
    }
  ]
}`;

const SECTION_SAMPLES: Record<string, string> = {
  kanji: `{
  "id": 12,
  "type": "kanji",
  "question": "「山」の読み方はどれですか？",
  "reading": "やま / さん",
  "options": ["かわ", "やま", "うみ", "そら"],
  "answer": 1,
  "explanation": "山 = やま (yama) / さん (san). Mountain."
}`,
  vocabulary: `{
  "id": 34,
  "type": "vocabulary",
  "question": "「学校」の意味は？",
  "reading": "がっこう",
  "options": ["Hospital", "School", "Station", "Library"],
  "answer": 1,
  "explanation": "学校 (gakkou) = School."
}`,
  grammar: `{
  "id": 56,
  "type": "grammar",
  "question": "わたし___がくせいです。",
  "options": ["は", "を", "に", "で"],
  "answer": 0,
  "explanation": "は marks the topic. \\"I am a student\\"."
}`,
  reading: `{
  "id": 78,
  "type": "reading",
  "question": "本文：「きのう、ともだちと えいがを みました。とても おもしろかったです。」 What did the writer do yesterday?",
  "options": [
    "Watched a movie with a friend",
    "Read a book alone",
    "Went shopping",
    "Studied Japanese"
  ],
  "answer": 0,
  "explanation": "えいがを みました = watched a movie; ともだちと = with a friend."
}`,
  expression: `{
  "id": 90,
  "type": "expression",
  "question": "Which phrase fits a polite morning greeting?",
  "options": ["こんばんは", "おはようございます", "おやすみなさい", "さようなら"],
  "answer": 1,
  "explanation": "おはようございます = Good morning (polite)."
}`,
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border bg-paper-soft p-4 font-mono text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function Instructions() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="font-display text-xs uppercase tracking-[0.2em] text-hanko">使い方</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">Instructions</h1>
        <p className="mt-1 text-muted-foreground">
          How to use the app and how to structure your own JSON question files.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-display">How to use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open <Link to="/load" className="text-hanko underline-offset-4 hover:underline">Load Test</Link> and either drag in a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.json</code> file or pick a built-in set.</li>
            <li>Set the time limit and press <strong>Start session</strong>.</li>
            <li>Answer each question — use number keys <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">1</kbd>–<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">4</kbd> to pick, <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to advance.</li>
            <li>The correct answer and explanation are revealed immediately after each response.</li>
            <li>At the end you'll see a per-question review on the <Link to="/results" className="text-hanko underline-offset-4 hover:underline">Results</Link> screen. Stats are saved to your browser only.</li>
          </ol>
          <div className="pt-2">
            <Button asChild>
              <Link to="/load"><BookOpen className="mr-2 h-4 w-4" /> Load a test</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-display">JSON file format</CardTitle>
          <CardDescription>The whole file is one JSON object.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Code>{SAMPLE}</Code>
          <div>
            <h3 className="mb-2 font-display text-base font-semibold">Top-level fields</h3>
            <table className="w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="pr-4">Field</th><th className="pr-4">Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                <Row name="title" type="string" req>Shown on the loader and results screen.</Row>
                <Row name="questions" type="array" req>Non-empty array of question objects (see below).</Row>
                <Row name="description" type="string">Optional sub-title.</Row>
                <Row name="day" type="string">Optional label like <code>N5-Foundation</code>.</Row>
                <Row name="date" type="string">Optional date label, e.g. <code>2026-03-19</code>.</Row>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-2 font-display text-base font-semibold">Question fields</h3>
            <table className="w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="pr-4">Field</th><th className="pr-4">Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                <Row name="type" type="string" req>One of: {QUESTION_TYPES.map((t, i) => (<span key={t}>{i > 0 && ", "}<code>{t}</code></span>))}.</Row>
                <Row name="question" type="string" req>The question text. Japanese is fine — it will render at large display size.</Row>
                <Row name="options" type="string[]" req>Two or more answer choices (4 is conventional).</Row>
                <Row name="answer" type="number" req>0-based index into <code>options</code>.</Row>
                <Row name="id" type="number | string">Optional stable identifier.</Row>
                <Row name="reading" type="string">Optional furigana / reading hint shown under the question.</Row>
                <Row name="explanation" type="string">Shown after answering and on the Results page.</Row>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Examples by section</CardTitle>
          <CardDescription>One question per category — copy, adapt, and append into your <code>questions</code> array.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {QUESTION_TYPES.map((t) => (
            <div key={t}>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-display">{TYPE_LABELS[t]}</Badge>
                <span className="font-mono text-xs text-muted-foreground">type: "{t}"</span>
              </div>
              <Code>{SECTION_SAMPLES[t]}</Code>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ name, type, req, children }: { name: string; type: string; req?: boolean; children: React.ReactNode }) {
  return (
    <tr className="align-top">
      <td className="pr-4 font-mono text-xs">
        {name}{req && <span className="ml-1 text-hanko">*</span>}
      </td>
      <td className="pr-4 font-mono text-xs text-muted-foreground">{type}</td>
      <td className="text-sm">{children}</td>
    </tr>
  );
}
