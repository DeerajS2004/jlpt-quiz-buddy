import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, RotateCcw, BookOpen } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { loadLastResult, loadSessions } from "@/lib/quiz-store";
import type { Question, QuestionType, SessionResult } from "@/lib/quiz-types";
import { TYPE_LABELS } from "@/lib/quiz-types";

export const Route = createFileRoute("/results")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [{ title: "Results — JLPT Practice" }] }),
  component: ResultsScreen,
});

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function ResultsScreen() {
  const { id } = Route.useSearch();
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (id) {
      const found = loadSessions().find((s) => s.id === id);
      if (found) {
        setResult(found);
        return;
      }
    }
    setResult(loadLastResult());
  }, [id]);

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">No results yet</h1>
        <p className="mt-2 text-muted-foreground">Complete a session to see your results here.</p>
        <Button asChild className="mt-6">
          <Link to="/load"><BookOpen className="mr-2 h-4 w-4" /> Load a test</Link>
        </Button>
      </div>
    );
  }

  const p = pct(result.correct, result.total);
  const passed = p >= 70;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-hanko">結果</div>
      <h1 className="font-display text-4xl font-semibold">{result.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(result.date).toLocaleString()} · {fmtDur(result.durationSec)}
      </p>

      {/* Score banner */}
      <Card className={`mt-8 ${passed ? "border-hanko/40" : ""}`}>
        <CardContent className="grid gap-6 p-8 md:grid-cols-3 md:items-center">
          <div className="md:col-span-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`font-display text-6xl font-semibold tabular-nums ${passed ? "text-hanko" : ""}`}>{p}%</span>
              <span className="text-muted-foreground tabular-nums">{result.correct}/{result.total}</span>
            </div>
          </div>
          <div className="text-sm md:col-span-2">
            <p className="leading-relaxed text-muted-foreground">
              {passed
                ? "Above the 70% benchmark — a strong session. Keep the streak alive."
                : "Below 70%. Review the explanations below and try again — repetition is the way."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="bg-hanko text-paper hover:bg-hanko/90">
                <Link to="/load"><RotateCcw className="mr-2 h-4 w-4" /> Try another</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary (copyable) */}
      <SummarySection result={result} />

      {/* Review */}
      <ReviewSection result={result} />
    </div>
  );
}

function ReviewSection({ result }: { result: SessionResult }) {
  const items = result.questions.map((q, i) => ({ q, a: result.answers[i], i }));
  const wrong = items.filter(({ a }) => !a?.correct);
  const correctItems = items.filter(({ a }) => a?.correct);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="font-display">Review</CardTitle>
        <CardDescription>Every question, your answer, and the explanation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wrong">
          <TabsList>
            <TabsTrigger value="wrong">
              Wrong <span className="ml-1.5 tabular-nums opacity-70">{wrong.length}</span>
            </TabsTrigger>
            <TabsTrigger value="correct">
              Correct <span className="ml-1.5 tabular-nums opacity-70">{correctItems.length}</span>
            </TabsTrigger>
            <TabsTrigger value="all">
              All <span className="ml-1.5 tabular-nums opacity-70">{items.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wrong" className="mt-4 space-y-4">
            {wrong.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No wrong answers — well done.</p>
            ) : (
              wrong.map(({ q, a, i }) => <ReviewItem key={`${q.id}-${i}`} q={q} a={a} i={i} />)
            )}
          </TabsContent>
          <TabsContent value="correct" className="mt-4 space-y-4">
            {correctItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No correct answers yet.</p>
            ) : (
              correctItems.map(({ q, a, i }) => <ReviewItem key={`${q.id}-${i}`} q={q} a={a} i={i} />)
            )}
          </TabsContent>
          <TabsContent value="all" className="mt-4 space-y-4">
            {items.map(({ q, a, i }) => <ReviewItem key={`${q.id}-${i}`} q={q} a={a} i={i} />)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ q, a, i }: { q: Question; a: SessionResult["answers"][number] | undefined; i: number }) {
  const correct = a?.correct ?? false;
  return (
    <div className="rounded-md border bg-card p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-display text-[10px]">#{i + 1}</Badge>
          <span>{TYPE_LABELS[q.type] ?? q.type}</span>
        </div>
        {correct ? (
          <span className="inline-flex items-center gap-1 text-xs text-ink">
            <Check className="h-3.5 w-3.5" /> Correct
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-hanko">
            <X className="h-3.5 w-3.5" /> {a?.selected == null ? "Skipped" : "Wrong"}
          </span>
        )}
      </div>
      <div className="jp font-display text-lg">{q.question}</div>
      {q.reading && <div className="jp mt-1 text-xs text-muted-foreground">{q.reading}</div>}
      <ul className="mt-3 space-y-1.5 text-sm">
        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.answer;
          const isPicked = a?.selected === idx;
          return (
            <li
              key={idx}
              className={`flex items-center gap-2 rounded px-2 py-1 ${
                isCorrect
                  ? "bg-paper-soft text-foreground"
                  : isPicked
                    ? "bg-hanko/10 text-hanko"
                    : "text-muted-foreground"
              }`}
            >
              <span className="font-mono text-xs opacity-70">{idx + 1}.</span>
              <span className="jp flex-1">{opt}</span>
              {isCorrect && <Check className="h-3.5 w-3.5" />}
              {isPicked && !isCorrect && <X className="h-3.5 w-3.5" />}
            </li>
          );
        })}
      </ul>
      {q.explanation && (
        <div className="mt-3 border-l-2 border-hanko/60 pl-3 text-sm text-muted-foreground">
          {q.explanation}
        </div>
      )}
    </div>
  );
}
