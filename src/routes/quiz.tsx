import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  finalizeSession,
  loadActive,
  saveActive,
  type ActiveSession,
} from "@/lib/quiz-store";
import type { AnswerRecord } from "@/lib/quiz-types";
import { TYPE_LABELS } from "@/lib/quiz-types";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Quiz — JLPT Practice" }] }),
  component: QuizScreen,
});

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function QuizScreen() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const a = loadActive();
    if (!a) {
      navigate({ to: "/load" });
      return;
    }
    setActive(a);
    // existing answer for current index?
    setReveal(Boolean(a.answers[a.currentIndex]));
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const finish = useCallback(
    (a: ActiveSession) => {
      const result = finalizeSession(a);
      navigate({ to: "/results", search: { id: result.id } });
    },
    [navigate],
  );

  const timeLeft = useMemo(() => {
    if (!active) return 0;
    const elapsed = Math.floor((now - active.startedAt) / 1000);
    return Math.max(0, active.durationSec - elapsed);
  }, [active, now]);

  useEffect(() => {
    if (active && timeLeft === 0 && active.durationSec > 0) {
      finish(active);
    }
  }, [active, timeLeft, finish]);

  const select = useCallback(
    (choiceIdx: number) => {
      if (!active || reveal) return;
      const q = active.set.questions[active.currentIndex];
      const correct = choiceIdx === q.answer;
      const record: AnswerRecord = {
        questionId: q.id,
        selected: choiceIdx,
        correct,
        timeMs: Date.now() - active.startedAt,
      };
      const answers = [...active.answers];
      answers[active.currentIndex] = record;
      const next = { ...active, answers };
      setActive(next);
      saveActive(next);
      setReveal(true);
    },
    [active, reveal],
  );

  const goNext = useCallback(() => {
    if (!active) return;
    const last = active.currentIndex >= active.set.questions.length - 1;
    if (last) {
      finish(active);
      return;
    }
    const next = { ...active, currentIndex: active.currentIndex + 1 };
    setActive(next);
    saveActive(next);
    setReveal(Boolean(next.answers[next.currentIndex]));
  }, [active, finish]);

  const goPrev = useCallback(() => {
    if (!active || active.currentIndex === 0) return;
    const next = { ...active, currentIndex: active.currentIndex - 1 };
    setActive(next);
    saveActive(next);
    setReveal(Boolean(next.answers[next.currentIndex]));
  }, [active]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active) return;
      if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key, 10) - 1;
        const q = active.set.questions[active.currentIndex];
        if (idx < q.options.length) select(idx);
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        if (reveal) goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, reveal, select, goNext, goPrev]);

  if (!active) return null;

  const q = active.set.questions[active.currentIndex];
  const record = active.answers[active.currentIndex];
  const total = active.set.questions.length;
  const answered = active.answers.filter(Boolean).length;
  const correctCount = active.answers.filter((a) => a?.correct).length;
  const progress = ((active.currentIndex + 1) / total) * 100;
  const lowTime = timeLeft <= 30 && active.durationSec > 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className="border-ink/20 font-display">
            {active.currentIndex + 1} / {total}
          </Badge>
          <span className="text-muted-foreground">{TYPE_LABELS[q.type] ?? q.type}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-1.5 tabular-nums ${lowTime ? "text-hanko" : "text-muted-foreground"}`}>
            <Clock className="h-4 w-4" /> {fmtTime(timeLeft)}
          </div>
          <div className="text-muted-foreground">
            Score <span className="font-display tabular-nums text-foreground">{correctCount}</span>/<span className="tabular-nums">{answered}</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8">
                <Flag className="mr-1.5 h-3.5 w-3.5" /> Finish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finish session now?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unanswered questions ({total - answered}) will be marked incorrect.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-hanko text-paper hover:bg-hanko/90"
                  onClick={() => finish(active)}
                >
                  Finish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Progress value={progress} className="mb-8 h-1" />

      {/* Question card */}
      <Card className="border-paper-soft bg-card p-8 shadow-sm md:p-12">
        <div className="mb-1 font-display text-xs uppercase tracking-[0.2em] text-hanko">
          Question {active.currentIndex + 1}
        </div>
        <div className="jp font-display text-2xl leading-relaxed text-foreground md:text-3xl">
          {q.question}
        </div>
        {q.reading && (
          <div className="mt-2 jp text-sm text-muted-foreground">{q.reading}</div>
        )}

        <div className="mt-8 space-y-3">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.answer;
            const isSelected = record?.selected === idx;
            const showCorrect = reveal && isCorrect;
            const showWrong = reveal && isSelected && !isCorrect;
            const baseClasses =
              "group flex w-full items-center gap-4 rounded-md border bg-background p-4 text-left transition-all hover:border-hanko/40 disabled:cursor-not-allowed disabled:opacity-100";
            const stateClasses = showCorrect
              ? "border-ink bg-paper-soft"
              : showWrong
                ? "border-hanko bg-hanko/5"
                : isSelected
                  ? "border-hanko/50"
                  : "border-border";

            return (
              <button
                key={idx}
                onClick={() => select(idx)}
                disabled={reveal}
                className={`${baseClasses} ${stateClasses}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted font-display text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="jp flex-1 text-base">{opt}</span>
                {showCorrect && <Check className="h-5 w-5 text-ink" />}
                {showWrong && <X className="h-5 w-5 text-hanko" />}
              </button>
            );
          })}
        </div>

        {reveal && q.explanation && (
          <div className="mt-6 rounded-md border-l-2 border-hanko bg-paper-soft/60 p-4">
            <div className="mb-1 font-display text-xs uppercase tracking-wider text-hanko">Explanation</div>
            <div className="jp text-sm leading-relaxed">{q.explanation}</div>
          </div>
        )}
      </Card>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={goPrev} disabled={active.currentIndex === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <div className="text-xs text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">1–{q.options.length}</kbd> to answer, <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to continue
        </div>
        <Button onClick={goNext} disabled={!reveal} className="bg-hanko text-paper hover:bg-hanko/90 disabled:bg-muted disabled:text-muted-foreground">
          {active.currentIndex >= total - 1 ? "Finish" : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
