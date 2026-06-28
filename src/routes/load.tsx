import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Play, FileJson } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BUILT_IN_QUIZZES, fetchBuiltIn } from "@/lib/built-in-quizzes";
import { saveActive, validateQuestionSet } from "@/lib/quiz-store";
import type { QuestionSet } from "@/lib/quiz-types";

export const Route = createFileRoute("/load")({
  head: () => ({
    meta: [
      { title: "Load Test — JLPT Practice" },
      { name: "description", content: "Load a JSON question set or pick a built-in JLPT mock test." },
    ],
  }),
  component: LoadTest,
});

function LoadTest() {
  const navigate = useNavigate();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [duration, setDuration] = useState(15); // minutes
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // preload first built-in to make Start instant
  }, []);

  async function onFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const v = validateQuestionSet(parsed);
      if (!v.ok) {
        toast.error("Invalid question file", { description: v.error });
        return;
      }
      setSet(v.set);
      toast.success("Loaded", { description: `${v.set.title} · ${v.set.questions.length} questions` });
    } catch (e) {
      toast.error("Could not parse JSON", { description: e instanceof Error ? e.message : String(e) });
    }
  }

  async function loadBuiltIn(url: string) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      const v = validateQuestionSet(json);
      if (!v.ok) {
        toast.error("Invalid built-in", { description: v.error });
        return;
      }
      setSet(v.set);
    } catch (e) {
      toast.error("Failed to load", { description: e instanceof Error ? e.message : String(e) });
    }
  }

  function start() {
    if (!set) return;
    saveActive({
      set,
      startedAt: Date.now(),
      durationSec: duration * 60,
      answers: [],
      currentIndex: 0,
    });
    navigate({ to: "/quiz" });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="font-display text-xs uppercase tracking-[0.2em] text-hanko">テスト</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">Load Test</h1>
        <p className="mt-1 text-muted-foreground">Upload your own JSON or pick a built-in set.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="border-dashed transition-colors hover:border-hanko/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
        >
          <CardHeader>
            <CardTitle className="font-display">Upload JSON</CardTitle>
            <CardDescription>Drag & drop or browse</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/40 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Upload className="h-6 w-6" />
              <span>Click or drop a <code className="font-mono text-xs">.json</code> file</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Built-in sets</CardTitle>
            <CardDescription>Shipped with the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {BUILT_IN_QUIZZES.map((q) => (
              <button
                key={q.id}
                onClick={() => loadBuiltIn(q.url)}
                className="flex w-full items-start gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-hanko/40 hover:bg-muted/40"
              >
                <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-hanko" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{q.title}</div>
                  <div className="text-xs text-muted-foreground">{q.description}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {set && (
        <Card className="mt-8 border-hanko/30">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-2xl">{set.title}</CardTitle>
                <CardDescription>
                  {set.description ?? `${set.questions.length} questions ready`}
                </CardDescription>
              </div>
              <Badge className="bg-hanko text-paper hover:bg-hanko">
                {set.questions.length} questions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="duration" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Time limit
                </Label>
                <div className="mt-3 flex items-center gap-4">
                  <Slider
                    id="duration"
                    min={1}
                    max={60}
                    step={1}
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0] ?? 15)}
                  />
                  <div className="w-16 text-right font-display text-lg tabular-nums">{duration}m</div>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Set</Label>
                <div className="mt-3 text-sm">
                  {set.day && <span className="mr-2 text-muted-foreground">{set.day}</span>}
                  {set.date && <span className="text-muted-foreground">{set.date}</span>}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={start} className="bg-hanko text-paper hover:bg-hanko/90">
                <Play className="mr-2 h-4 w-4" /> Start session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

