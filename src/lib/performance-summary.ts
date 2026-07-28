import { loadSessions, loadStats } from "./quiz-store";
import { TYPE_LABELS } from "./quiz-types";

/**
 * Builds a compact text summary of lifetime stats plus recent mistakes so the
 * model can target the learner's weak points.
 */
export function buildPerformanceSummary(): string {
  const stats = loadStats();
  const sessions = loadSessions();

  if (stats.totalQuestions === 0 && sessions.length === 0) return "";

  const lines: string[] = [];
  const acc = stats.totalQuestions
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;
  lines.push(
    `Lifetime: ${stats.totalCorrect}/${stats.totalQuestions} correct (${acc}%), ` +
      `${stats.sessionsCompleted} sessions, ${stats.streak}-day streak.`,
  );

  lines.push("Accuracy by category:");
  for (const [type, stat] of Object.entries(stats.byCategory)) {
    if (!stat.total) continue;
    const pct = Math.round((stat.correct / stat.total) * 100);
    lines.push(`- ${TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type}: ${stat.correct}/${stat.total} (${pct}%)`);
  }

  const recent = sessions.slice(0, 5);
  if (recent.length) {
    lines.push("Recent sessions:");
    for (const s of recent) {
      lines.push(`- ${s.date.slice(0, 10)} · ${s.title} · ${s.correct}/${s.total}`);
    }
  }

  const missed: string[] = [];
  for (const s of recent) {
    for (let i = 0; i < s.questions.length && missed.length < 30; i++) {
      const q = s.questions[i];
      const a = s.answers[i];
      if (a && !a.correct) {
        const chosen =
          a.selected == null ? "(skipped)" : (q.options[a.selected] ?? "(unknown)");
        missed.push(
          `- [${q.type}] ${q.question} → correct: ${q.options[q.answer]}; answered: ${chosen}`,
        );
      }
    }
  }
  if (missed.length) {
    lines.push("Recently missed questions:");
    lines.push(...missed);
  }

  return lines.join("\n");
}
