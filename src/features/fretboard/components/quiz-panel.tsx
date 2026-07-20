import { Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	RefreshCw,
	RotateCcw,
	TimerReset,
	Volume2,
	XCircle,
} from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { getDisplayNote } from "../note-engine";
import {
	createCellAnswer,
	createFindAllAnswer,
	createNameAnswer,
	createPaceAnswer,
	createPracticePrompt,
	getPromptToneMidi,
} from "../quiz-engine";
import { passesGate, summarizeSession } from "../review";
import { useTrainer } from "../trainer-provider";
import type {
	AnswerResult,
	CourseModule,
	FretboardCell,
	PracticePrompt,
	QuizMode,
} from "../types";
import { FretboardView } from "./fretboard-view";

const SESSION_LENGTH = 12;
const AUTO_ADVANCE_DELAY_MS = 650;

export function QuizPanel({
	module,
	mode,
}: {
	module: CourseModule;
	mode: QuizMode;
}) {
	const trainer = useTrainer();
	const { progress } = trainer;
	const progressRef = React.useRef(progress);
	const [prompt, setPrompt] = React.useState<PracticePrompt | undefined>();
	const [results, setResults] = React.useState<AnswerResult[]>([]);
	const [feedback, setFeedback] = React.useState<AnswerResult | undefined>();
	const [selectedCellIds, setSelectedCellIds] = React.useState<string[]>([]);
	const [revealed, setRevealed] = React.useState(false);
	const [sessionComplete, setSessionComplete] = React.useState(false);

	React.useEffect(() => {
		progressRef.current = progress;
	}, [progress]);

	const makePrompt = React.useCallback(() => {
		return createPracticePrompt({
			module,
			mode,
			accidentalMode: progressRef.current.settings.accidentalMode,
			progress: progressRef.current,
		});
	}, [mode, module]);

	React.useEffect(() => {
		setResults([]);
		setFeedback(undefined);
		setSelectedCellIds([]);
		setRevealed(false);
		setSessionComplete(false);
		setPrompt(makePrompt());
	}, [makePrompt]);

	React.useEffect(() => {
		if (!prompt || prompt.mode !== "pace" || revealed) {
			return;
		}

		const timer = window.setTimeout(
			() => setRevealed(true),
			progress.settings.timerSeconds * 1000,
		);

		return () => window.clearTimeout(timer);
	}, [progress.settings.timerSeconds, prompt, revealed]);

	const answerPrompt = React.useCallback(
		(answer: AnswerResult) => {
			if (!prompt || sessionComplete) {
				return;
			}

			trainer.recordAnswer(answer);
			trainer.playMidi(getPromptToneMidi(prompt));
			const nextResults = [...results, answer];
			setResults(nextResults);
			setFeedback(answer);

			if (nextResults.length >= SESSION_LENGTH) {
				trainer.finishLessonSession(module, nextResults);
				setSessionComplete(true);
			}
		},
		[prompt, results, sessionComplete, trainer, module],
	);

	const goNext = React.useCallback(() => {
		setPrompt(makePrompt());
		setFeedback(undefined);
		setSelectedCellIds([]);
		setRevealed(false);
	}, [makePrompt]);

	React.useEffect(() => {
		if (
			!feedback?.correct ||
			!progress.settings.autoAdvanceOnCorrect ||
			sessionComplete
		) {
			return;
		}

		const timer = window.setTimeout(goNext, AUTO_ADVANCE_DELAY_MS);

		return () => window.clearTimeout(timer);
	}, [
		feedback,
		goNext,
		progress.settings.autoAdvanceOnCorrect,
		sessionComplete,
	]);

	const restartSession = React.useCallback(() => {
		setResults([]);
		setSessionComplete(false);
		goNext();
	}, [goNext]);

	const replayTarget = React.useCallback(() => {
		if (!prompt) {
			return;
		}

		trainer.playMidi(getPromptToneMidi(prompt));
		trainer.speak(prompt.targetNote.name);
		trainer.announce(`Replay target ${prompt.targetNote.name}.`);
	}, [prompt, trainer]);

	const handleCellSelect = React.useCallback(
		(cell: FretboardCell) => {
			if (mode === "study") {
				const note = getDisplayNote(
					cell.midi,
					progress.settings.accidentalMode,
					{
						scientific: cell.position.fret >= 12,
					},
				);
				trainer.playMidi(cell.midi);
				trainer.announce(
					`String ${cell.position.stringNumber}, fret ${cell.position.fret}. ${note.scientific}.`,
				);
				trainer.speak(note.name);
				return;
			}

			if (!prompt || (feedback && prompt.mode !== "find-all")) {
				return;
			}

			if (prompt.mode === "find-all") {
				setSelectedCellIds((current) =>
					current.includes(cell.id)
						? current.filter((cellId) => cellId !== cell.id)
						: [...current, cell.id],
				);
				return;
			}

			if (prompt.mode === "find-note" || prompt.mode === "audio-match") {
				answerPrompt(createCellAnswer(prompt, cell.id));
			}
		},
		[
			answerPrompt,
			feedback,
			mode,
			progress.settings.accidentalMode,
			prompt,
			trainer,
		],
	);

	if (mode === "study") {
		return (
			<section
				className="lesson-surface lesson-surface--study"
				aria-labelledby="study-title"
			>
				<div className="lesson-toolbar">
					<div>
						<p className="app-kicker">Study mode</p>
						<h2 id="study-title">Explore the active zone</h2>
					</div>
				</div>
				<p className="lesson-copy">
					Tap any highlighted position to hear it. Labels stay visible here so
					the shape and sound can connect before recall begins.
				</p>
				<FretboardView
					zone={module.zone}
					settings={progress.settings}
					showLabels={progress.settings.showNoteLabelsInStudy}
					showFretNumbers={progress.settings.showFretNumbers}
					onCellSelect={handleCellSelect}
				/>
			</section>
		);
	}

	if (!prompt) {
		return null;
	}

	if (sessionComplete) {
		const summary = summarizeSession(results);
		const passed = passesGate(module, summary);

		return (
			<section
				className="lesson-surface lesson-surface--summary"
				aria-labelledby="summary-title"
			>
				<div className="session-summary">
					{passed ? (
						<CheckCircle2
							className="summary-icon is-correct"
							aria-hidden="true"
						/>
					) : (
						<TimerReset className="summary-icon" aria-hidden="true" />
					)}
					<div>
						<p className="app-kicker">Session complete</p>
						<h2 id="summary-title">
							{passed ? "Checkpoint passed" : "Review this zone again"}
						</h2>
					</div>
				</div>
				<div className="metric-grid">
					<Metric
						label="Accuracy"
						value={`${Math.round(summary.accuracy * 100)}%`}
					/>
					<Metric label="Average" value={`${summary.avgResponseMs} ms`} />
					<Metric
						label="Correct"
						value={`${summary.correct}/${summary.total}`}
					/>
				</div>
				{summary.slowestNotes.length > 0 ? (
					<div className="inline-list">
						<span>Slowest notes</span>
						{summary.slowestNotes.map((note) => (
							<strong key={note.label}>{note.label}</strong>
						))}
					</div>
				) : null}
				<div className="button-row">
					<Button type="button" onClick={restartSession}>
						<RefreshCw />
						Practice again
					</Button>
					<Button asChild variant="secondary">
						<Link to="/course">Course</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/review">Review</Link>
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section
			className="lesson-surface lesson-surface--quiz"
			aria-labelledby="quiz-title"
		>
			<div className="lesson-toolbar">
				<div>
					<p className="app-kicker">{modeLabel(prompt.mode)}</p>
					<h2 id="quiz-title">{prompt.question}</h2>
					{prompt.moduleId !== module.id ? (
						<p className="lesson-context">
							Stretch target from {prompt.moduleTitle}
						</p>
					) : null}
				</div>
				<div className="toolbar-actions">
					<Button type="button" variant="secondary" onClick={replayTarget}>
						<Volume2 />
						Replay
					</Button>
					<span className="session-count">
						{results.length + 1}/{SESSION_LENGTH}
					</span>
				</div>
			</div>

			{prompt.mode === "name-note" ? (
				<fieldset className="answer-grid">
					<legend className="sr-only">Note choices</legend>
					{prompt.choices.map((choice) => {
						const isCorrectChoice =
							feedback && choice.pitchClass === prompt.targetNote.pitchClass;

						return (
							<Button
								key={choice.name}
								type="button"
								variant={isCorrectChoice ? "default" : "outline"}
								className="answer-choice"
								disabled={Boolean(feedback)}
								onClick={() => answerPrompt(createNameAnswer(prompt, choice))}
							>
								{choice.name}
							</Button>
						);
					})}
				</fieldset>
			) : null}

			{prompt.mode === "pace" ? (
				<div className="pace-card">
					<div>
						<p className="app-kicker">Timed reveal</p>
						<h3>
							{revealed
								? prompt.targetNote.scientific
								: `Reveals after ${progress.settings.timerSeconds}s`}
						</h3>
					</div>
					<div className="button-row">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setRevealed(true)}
						>
							<TimerReset />
							Reveal now
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => answerPrompt(createPaceAnswer(prompt, false))}
						>
							Missed
						</Button>
						<Button
							type="button"
							onClick={() => answerPrompt(createPaceAnswer(prompt, true))}
						>
							Got it
						</Button>
					</div>
				</div>
			) : null}

			<FretboardView
				zone={prompt.zone}
				settings={progress.settings}
				showLabels={false}
				showFretNumbers={
					progress.settings.showFretNumbers && module.fretNumbersDefault
				}
				selectedCellIds={
					prompt.mode === "find-all"
						? selectedCellIds
						: (feedback?.selectedCellIds ?? [])
				}
				correctCellIds={feedback?.correctCellIds ?? []}
				targetCellId={
					prompt.mode === "name-note" || prompt.mode === "pace"
						? prompt.targetCell?.id
						: undefined
				}
				highlightedPitchClass={
					feedback ? prompt.targetNote.pitchClass : undefined
				}
				disabled={prompt.mode === "name-note" || prompt.mode === "pace"}
				onCellSelect={handleCellSelect}
			/>

			{prompt.mode === "find-all" ? (
				<div className="button-row">
					<Button
						type="button"
						disabled={selectedCellIds.length === 0}
						onClick={() =>
							answerPrompt(createFindAllAnswer(prompt, selectedCellIds))
						}
					>
						Submit {selectedCellIds.length}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => setSelectedCellIds([])}
					>
						<RotateCcw />
						Clear
					</Button>
				</div>
			) : null}

			{feedback ? (
				<div className="feedback-bar" data-correct={feedback.correct}>
					{feedback.correct ? <CheckCircle2 /> : <XCircle />}
					<span>
						{feedback.correct
							? `Correct: ${prompt.targetNote.scientific}`
							: `Not yet. Correct answer: ${prompt.targetNote.scientific}`}
					</span>
					<Button type="button" variant="secondary" size="sm" onClick={goNext}>
						Next
					</Button>
				</div>
			) : null}
		</section>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="metric-card">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function modeLabel(mode: QuizMode) {
	const labels: Record<QuizMode, string> = {
		study: "Study",
		"name-note": "Name the Note",
		"find-note": "Find the Note",
		"find-all": "Find All",
		pace: "Pace",
		"audio-match": "Audio Match",
	};

	return labels[mode];
}
