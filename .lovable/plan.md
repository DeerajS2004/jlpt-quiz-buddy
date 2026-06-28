- What we're building

A focused, anonymous JLPT practice quiz covering levels N5 through N1. Three question modes: vocabulary meaning, kanji reading, and grammar fill-in-the-blank. No accounts — sessions are local only.

## Visual direction

- **Palette:** Paper & Hanko — warm off-white background (#f5f3ee), soft paper grey (#e8e4dd), ink black (#2d2d2d), single hanko red accent (#c8302a) for the active state, correct/scoring marks, and the brand stamp.
- **Type:** Space Grotesk for display (level badges, big Japanese prompts framing, numerals), DM Sans for body and answer choices.
- **Layout:** Sidebar shell. Left rail holds level selector (N5–N1), question-type filter, and session progress. Main area is the quiz card — generous whitespace, large Japanese characters as the visual hero.

## Screens & flow

1. **Home / setup** — sidebar shows N5–N1 chips and mode toggles (Vocabulary / Kanji Reading / Grammar). Main area: short intro card, "Start quiz" button, optional question-count selector (10 / 20 / 30).
2. **Quiz screen** — sidebar shows current level, mode, and progress bar (e.g. 7 / 20) + live score. Main area: one question card with the Japanese prompt set at large scale, 4 multiple-choice buttons stacked. Hanko-red ring on hover/focus.
3. **Feedback state (inline)** — after answering, the chosen choice turns red (wrong) or ink-outlined (correct), correct answer is revealed with the reading/meaning, plus a small "Next" button. Keyboard: 1–4 to answer, Enter to advance.
4. **Results** — score, accuracy %, per-question review list, "Try again" / "Change level".

## Content / data

Ships with a hand-curated local question bank (TypeScript files, no backend) so the app works immediately:

- ~30 questions per (level × mode) to start = enough for varied 10/20-question sessions.
- Each question: `{ id, level, mode, prompt, choices[4], answerIndex, explanation? }`.
- Questions are shuffled per session; choices shuffled per question.

The bank is structured so it's trivial to extend later — one file per level per mode under `src/data/questions/`.

## Routes

- `/` — setup/home (level + mode + start)
- `/quiz` — active quiz (session held in a Zustand-style store or React context; if user lands here without a session, redirect to `/`)
- `/results` — end-of-quiz summary

Shared sidebar lives in `__root.tsx` via shadcn `SidebarProvider`.

## Technical details

- TanStack Start routes under `src/routes/`: `index.tsx`, `quiz.tsx`, `results.tsx`.
- Sidebar component in `src/components/app-sidebar.tsx` using shadcn `Sidebar` with `collapsible="icon"`; `SidebarTrigger` in the header.
- Quiz session state: a small React context (`QuizProvider`) holding `{ level, mode, questions, currentIndex, answers, score }`. No persistence required (anonymous, ephemeral).
- Question bank: `src/data/questions/{n5,n4,n3,n2,n1}.{vocab,kanji,grammar}.ts`, aggregated by `src/data/questions/index.ts` with a `getQuestions(level, mode, count)` helper that shuffles.
- Design tokens added to `src/styles.css` under `:root` (paper, ink, hanko-red) and mapped in `@theme inline`; Space Grotesk + DM Sans loaded via `@fontsource` packages imported in `src/start.ts` (or root).
- shadcn components used: `Button`, `Card`, `Progress`, `Badge`, `Sidebar`, `RadioGroup` (or custom large buttons for choices).
- Keyboard handling via a `useEffect` listener on the quiz screen.

## Out of scope (for this build)

- Listening questions (you marked optional — easy to add later once we wire a TTS source).
- Accounts, saved history, spaced repetition, leaderboards.
- Hand-writing kanji input.  
  
i have uploaded a directory called jlpt into the repo , look at it and follow the structure for json uploaded quizzes and storing stats and also showing answers and results are each quiz and a page where the instructions are written on how to use the app and how the json file must be structured for each section : kanji, grammar, reading...