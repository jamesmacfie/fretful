import { getNextModule, isModeAvailable } from "./curriculum";
import {
	getActiveCells,
	getCell,
	getCellsForPitchClass,
	getDisplayChoices,
	getDisplayNote,
} from "./note-engine";
import { choosePromptSource, getDueReviewItems } from "./review";
import type {
	AccidentalMode,
	AnswerResult,
	CourseModule,
	DisplayNote,
	FretboardCell,
	PracticePrompt,
	ProgressState,
	QuizMode,
	ReviewQueueItem,
} from "./types";

interface PromptOptions {
	module: CourseModule;
	mode: QuizMode;
	accidentalMode: AccidentalMode;
	progress: ProgressState;
	includeReview?: boolean;
	includeStretch?: boolean;
	random?: () => number;
	now?: number;
}

function randomItem<T>(items: T[], random: () => number) {
	if (items.length === 0) {
		throw new Error("Cannot choose from an empty list");
	}

	return items[Math.floor(random() * items.length)];
}

function shuffled<T>(items: T[], random: () => number) {
	return [...items]
		.map((item) => ({ item, rank: random() }))
		.sort((a, b) => a.rank - b.rank)
		.map(({ item }) => item);
}

function parseReviewCell(item: ReviewQueueItem) {
	if (item.kind !== "cell") {
		return undefined;
	}

	const [stringPart, fretPart] = item.key.split(":");
	const stringNumber = Number(stringPart);
	const fret = Number(fretPart);

	if (![1, 2, 3, 4, 5, 6].includes(stringNumber) || !Number.isInteger(fret)) {
		return undefined;
	}

	return getCell({ stringNumber: stringNumber as 1 | 2 | 3 | 4 | 5 | 6, fret });
}

function parseReviewPitchClass(item: ReviewQueueItem) {
	if (item.kind !== "note") {
		return undefined;
	}

	const value = Number(item.key.replace("pc:", ""));
	return Number.isInteger(value) ? value : undefined;
}

function chooseTargetCell(
	activeCells: FretboardCell[],
	reviewItem: ReviewQueueItem | undefined,
	random: () => number,
) {
	const reviewCell = reviewItem ? parseReviewCell(reviewItem) : undefined;
	if (reviewCell) {
		const inActiveZone = activeCells.find((cell) => cell.id === reviewCell.id);
		if (inActiveZone) {
			return inActiveZone;
		}
	}

	const reviewPitchClass = reviewItem
		? parseReviewPitchClass(reviewItem)
		: undefined;
	if (typeof reviewPitchClass === "number") {
		const candidates = getCellsForPitchClass(activeCells, reviewPitchClass);
		if (candidates.length > 0) {
			return randomItem(candidates, random);
		}
	}

	return randomItem(activeCells, random);
}

function buildQuestion(
	mode: QuizMode,
	targetCell: FretboardCell,
	note: DisplayNote,
) {
	if (mode === "name-note") {
		return `What note is string ${targetCell.position.stringNumber}, fret ${targetCell.position.fret}?`;
	}

	if (mode === "find-note") {
		return `Find ${note.name} in the active zone.`;
	}

	if (mode === "find-all") {
		return `Find every ${note.name} in the active zone.`;
	}

	if (mode === "audio-match") {
		return "Hear the target note, then tap a matching position.";
	}

	if (mode === "pace") {
		return `Reveal string ${targetCell.position.stringNumber}, fret ${targetCell.position.fret}.`;
	}

	return "Tap active notes to hear and inspect them.";
}

export function normalizeModeForModule(module: CourseModule, mode?: QuizMode) {
	if (mode && isModeAvailable(module, mode)) {
		return mode;
	}

	return module.defaultMode;
}

export function createPracticePrompt({
	module,
	mode,
	accidentalMode,
	progress,
	includeReview = false,
	includeStretch = false,
	random = Math.random,
	now = Date.now(),
}: PromptOptions): PracticePrompt {
	const nextModule = getNextModule(module.id);
	const mixedSource =
		includeReview || includeStretch
			? choosePromptSource(
					progress,
					Boolean(nextModule) && includeStretch,
					random,
				)
			: "current";
	const source =
		(mixedSource === "review" && includeReview) ||
		(mixedSource === "stretch" && includeStretch)
			? mixedSource
			: "current";
	const promptModule = source === "stretch" && nextModule ? nextModule : module;
	const promptMode = normalizeModeForModule(promptModule, mode);
	const activeCells = getActiveCells(promptModule.zone);
	const reviewItem =
		source === "review" ? getDueReviewItems(progress)[0] : undefined;
	const targetCell = chooseTargetCell(activeCells, reviewItem, random);
	const targetNote = getDisplayNote(targetCell.midi, accidentalMode, {
		scientific: promptModule.tier === "advanced",
	});
	const validCells = getCellsForPitchClass(activeCells, targetCell.pitchClass);
	const choices = getDisplayChoices(promptModule.zone.noteSet, accidentalMode);

	return {
		id: `${now}:${Math.round(random() * 1_000_000)}`,
		mode: promptMode,
		source,
		moduleId: promptModule.id,
		moduleTitle: promptModule.title,
		zone: promptModule.zone,
		question: buildQuestion(promptMode, targetCell, targetNote),
		targetCell,
		targetNote,
		validCells,
		choices: shuffled(choices, random),
		createdAt: now,
	};
}

export function getPromptToneMidi(prompt: PracticePrompt) {
	return prompt.targetCell?.midi ?? prompt.validCells[0]?.midi ?? 60;
}

export function createNameAnswer(
	prompt: PracticePrompt,
	choice: DisplayNote,
	now = Date.now(),
): AnswerResult {
	const correct = choice.pitchClass === prompt.targetNote.pitchClass;

	return {
		promptId: prompt.id,
		mode: prompt.mode,
		source: prompt.source,
		targetNote: prompt.targetNote,
		targetCellId: prompt.targetCell?.id,
		correctCellIds: prompt.targetCell ? [prompt.targetCell.id] : [],
		selectedCellIds: [],
		correct,
		responseMs: Math.max(0, now - prompt.createdAt),
		answeredAt: now,
	};
}

export function createCellAnswer(
	prompt: PracticePrompt,
	cellId: string,
	now = Date.now(),
): AnswerResult {
	const correctCellIds = prompt.validCells.map((cell) => cell.id);
	const correct = correctCellIds.includes(cellId);

	return {
		promptId: prompt.id,
		mode: prompt.mode,
		source: prompt.source,
		targetNote: prompt.targetNote,
		targetCellId: prompt.targetCell?.id,
		correctCellIds,
		selectedCellIds: [cellId],
		correct,
		responseMs: Math.max(0, now - prompt.createdAt),
		answeredAt: now,
	};
}

export function createFindAllAnswer(
	prompt: PracticePrompt,
	selectedCellIds: string[],
	now = Date.now(),
): AnswerResult {
	const correctCellIds = prompt.validCells.map((cell) => cell.id).sort();
	const selected = [...selectedCellIds].sort();
	const correct =
		selected.length === correctCellIds.length &&
		selected.every((cellId, index) => cellId === correctCellIds[index]);

	return {
		promptId: prompt.id,
		mode: prompt.mode,
		source: prompt.source,
		targetNote: prompt.targetNote,
		targetCellId: prompt.targetCell?.id,
		correctCellIds,
		selectedCellIds: selected,
		correct,
		responseMs: Math.max(0, now - prompt.createdAt),
		answeredAt: now,
	};
}

export function createPaceAnswer(
	prompt: PracticePrompt,
	correct: boolean,
	now = Date.now(),
): AnswerResult {
	return {
		promptId: prompt.id,
		mode: prompt.mode,
		source: prompt.source,
		targetNote: prompt.targetNote,
		targetCellId: prompt.targetCell?.id,
		correctCellIds: prompt.targetCell ? [prompt.targetCell.id] : [],
		selectedCellIds: [],
		correct,
		responseMs: Math.max(0, now - prompt.createdAt),
		answeredAt: now,
	};
}
