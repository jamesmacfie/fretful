export const QUIZ_MODES = [
	"study",
	"name-note",
	"find-note",
	"find-all",
	"pace",
	"audio-match",
] as const;

export type QuizMode = (typeof QUIZ_MODES)[number];

export type Tier = "beginner" | "intermediate" | "advanced";

export type Handedness = "right" | "left";

export type AccidentalMode = "sharps" | "flats";

export type NoteSet = "natural" | "chromatic";

export type ReviewSource = "review" | "current" | "stretch";

export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface FretboardPosition {
	stringNumber: StringNumber;
	fret: number;
}

export interface Pitch {
	midi: number;
	pitchClass: number;
	octave: number;
	scientific: string;
	frequency: number;
}

export interface DisplayNote {
	name: string;
	scientific: string;
	pitchClass: number;
	isNatural: boolean;
}

export interface FretboardCell {
	id: string;
	position: FretboardPosition;
	stringLabel: string;
	stringName: string;
	midi: number;
	pitchClass: number;
	octave: number;
}

export interface FretboardZone {
	strings: StringNumber[];
	fretStart: number;
	fretEnd: number;
	noteSet: NoteSet;
	allowedPitchClasses?: number[];
}

export interface CourseGate {
	minAnswers: number;
	accuracy: number;
	avgResponseMs: number;
}

export interface CourseModule {
	id: string;
	tier: Tier;
	order: number;
	title: string;
	summary: string;
	why: string;
	zone: FretboardZone;
	defaultMode: QuizMode;
	availableModes: QuizMode[];
	gate: CourseGate;
	labelsDefault: boolean;
	fretNumbersDefault: boolean;
	timerSeconds: number;
}

export interface PracticePrompt {
	id: string;
	mode: QuizMode;
	source: ReviewSource;
	moduleId: string;
	moduleTitle: string;
	zone: FretboardZone;
	question: string;
	targetCell?: FretboardCell;
	targetNote: DisplayNote;
	validCells: FretboardCell[];
	choices: DisplayNote[];
	createdAt: number;
	revealed?: boolean;
}

export interface AnswerResult {
	promptId: string;
	mode: QuizMode;
	source: ReviewSource;
	targetNote: DisplayNote;
	targetCellId?: string;
	correctCellIds: string[];
	selectedCellIds: string[];
	correct: boolean;
	responseMs: number;
	answeredAt: number;
}

export interface SettingsState {
	handedness: Handedness;
	accidentalMode: AccidentalMode;
	showFretNumbers: boolean;
	showNoteLabelsInStudy: boolean;
	hideStringLabels: boolean;
	soundEnabled: boolean;
	spokenPrompts: boolean;
	timbre: "clean-electric";
	timerSeconds: number;
	autoAdvanceOnCorrect: boolean;
	highContrast: boolean;
}

export interface CourseState {
	currentTier: Tier;
	currentModuleId: string;
	unlockedModuleIds: string[];
	completedCheckpointIds: string[];
}

export interface StatRecord {
	attempts: number;
	correct: number;
	totalResponseMs: number;
	lastResponseMs: number;
	streak: number;
	lapses: number;
	lastSeenAt: number;
	dueAt: number;
}

export interface ReviewQueueItem {
	kind: "cell" | "note";
	key: string;
	dueAt: number;
	priority: number;
}

export interface StatsState {
	sessionsCompleted: number;
	streakDays: number;
	lastSessionDate?: string;
	avgResponseMs: number;
	cellStats: Record<string, StatRecord>;
	noteStats: Record<string, StatRecord>;
	reviewQueue: ReviewQueueItem[];
}

export interface ProgressState {
	version: 1;
	settings: SettingsState;
	course: CourseState;
	stats: StatsState;
}

export interface SessionSummary {
	total: number;
	correct: number;
	accuracy: number;
	avgResponseMs: number;
	slowestNotes: Array<{ label: string; avgResponseMs: number }>;
}
