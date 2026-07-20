import { z } from "zod";

import { COURSE_MODULES, getNextModule } from "./curriculum";
import { getActiveCells } from "./note-engine";
import { passesGate } from "./review";
import type {
	CourseModule,
	CourseState,
	ProgressState,
	SettingsState,
	StatsState,
} from "./types";

export const STORAGE_KEY = "fretful:v1";

export const defaultSettings: SettingsState = {
	handedness: "right",
	accidentalMode: "sharps",
	showFretNumbers: true,
	showNoteLabelsInStudy: true,
	hideStringLabels: false,
	soundEnabled: true,
	spokenPrompts: false,
	timbre: "clean-electric",
	timerSeconds: 5,
	autoAdvanceOnCorrect: true,
	highContrast: false,
};

export const defaultCourse: CourseState = {
	currentTier: "beginner",
	currentModuleId: COURSE_MODULES[0].id,
	unlockedModuleIds: [COURSE_MODULES[0].id],
	completedCheckpointIds: [],
};

export const defaultStats: StatsState = {
	sessionsCompleted: 0,
	streakDays: 0,
	avgResponseMs: 0,
	cellStats: {},
	noteStats: {},
	reviewQueue: [],
};

export const defaultProgressState: ProgressState = {
	version: 1,
	settings: defaultSettings,
	course: defaultCourse,
	stats: defaultStats,
};

export function resetLearningProgress(progress: ProgressState): ProgressState {
	return {
		version: 1,
		settings: { ...defaultSettings, ...progress.settings },
		course: structuredClone(defaultCourse),
		stats: structuredClone(defaultStats),
	};
}

const settingsSchema = z.object({
	handedness: z.enum(["right", "left"]),
	accidentalMode: z.enum(["sharps", "flats"]),
	showFretNumbers: z.boolean(),
	showNoteLabelsInStudy: z.boolean(),
	hideStringLabels: z.boolean().default(false),
	soundEnabled: z.boolean(),
	spokenPrompts: z.boolean(),
	timbre: z.literal("clean-electric"),
	timerSeconds: z.number().min(2).max(20),
	autoAdvanceOnCorrect: z.boolean().default(true),
	highContrast: z.boolean(),
});

const courseSchema = z.object({
	currentTier: z.enum(["beginner", "intermediate", "advanced"]),
	currentModuleId: z.string(),
	unlockedModuleIds: z.array(z.string()),
	completedCheckpointIds: z.array(z.string()),
});

const statRecordSchema = z.object({
	attempts: z.number().int().min(0),
	correct: z.number().int().min(0),
	totalResponseMs: z.number().min(0),
	lastResponseMs: z.number().min(0),
	streak: z.number().int().min(0),
	lapses: z.number().int().min(0),
	lastSeenAt: z.number().min(0),
	dueAt: z.number().min(0),
});

const reviewQueueItemSchema = z.object({
	kind: z.enum(["cell", "note"]),
	key: z.string(),
	dueAt: z.number().min(0),
	priority: z.number().min(0),
});

const statsSchema = z.object({
	sessionsCompleted: z.number().int().min(0),
	streakDays: z.number().int().min(0),
	lastSessionDate: z.string().optional(),
	avgResponseMs: z.number().min(0),
	cellStats: z.record(z.string(), statRecordSchema),
	noteStats: z.record(z.string(), statRecordSchema),
	reviewQueue: z.array(reviewQueueItemSchema),
});

export const progressSchema = z.object({
	version: z.literal(1),
	settings: settingsSchema,
	course: courseSchema,
	stats: statsSchema,
});

export function isBrowser() {
	return typeof window !== "undefined";
}

export function mergeWithDefaults(value: ProgressState): ProgressState {
	const merged: ProgressState = {
		version: 1,
		settings: { ...defaultSettings, ...value.settings },
		course: {
			...defaultCourse,
			...value.course,
			unlockedModuleIds:
				value.course.unlockedModuleIds.length > 0
					? value.course.unlockedModuleIds
					: defaultCourse.unlockedModuleIds,
		},
		stats: {
			...defaultStats,
			...value.stats,
			cellStats: value.stats.cellStats ?? {},
			noteStats: value.stats.noteStats ?? {},
			reviewQueue: value.stats.reviewQueue ?? [],
		},
	};

	return repairCourseUnlocks(merged);
}

function repairCourseUnlocks(progress: ProgressState): ProgressState {
	const next: ProgressState = structuredClone(progress);
	const unlocked = new Set(next.course.unlockedModuleIds);
	const completed = new Set(next.course.completedCheckpointIds);

	unlocked.add(COURSE_MODULES[0].id);

	for (const module of COURSE_MODULES) {
		if (!unlocked.has(module.id)) {
			break;
		}

		if (completed.has(module.id) || modulePassesFromStats(module, next.stats)) {
			completed.add(module.id);
			const upcoming = getNextModule(module.id);
			if (upcoming) {
				unlocked.add(upcoming.id);
			}
		}
	}

	next.course.unlockedModuleIds = COURSE_MODULES.filter((module) =>
		unlocked.has(module.id),
	).map((module) => module.id);
	next.course.completedCheckpointIds = COURSE_MODULES.filter((module) =>
		completed.has(module.id),
	).map((module) => module.id);

	if (!unlocked.has(next.course.currentModuleId)) {
		next.course.currentModuleId =
			next.course.unlockedModuleIds.at(-1) ?? COURSE_MODULES[0].id;
	}

	const currentModule =
		COURSE_MODULES.find(
			(module) => module.id === next.course.currentModuleId,
		) ?? COURSE_MODULES[0];
	next.course.currentTier = currentModule.tier;

	return next;
}

function modulePassesFromStats(module: CourseModule, stats: StatsState) {
	const activeCellIds = new Set(
		getActiveCells(module.zone).map((cell) => cell.id),
	);
	const records = Object.entries(stats.cellStats)
		.filter(([cellId]) => activeCellIds.has(cellId))
		.map(([, record]) => record);

	const total = records.reduce((sum, record) => sum + record.attempts, 0);
	if (total === 0) {
		return false;
	}

	const correct = records.reduce((sum, record) => sum + record.correct, 0);
	const totalResponseMs = records.reduce(
		(sum, record) => sum + record.totalResponseMs,
		0,
	);

	return passesGate(module, {
		total,
		correct,
		accuracy: correct / total,
		avgResponseMs: Math.round(totalResponseMs / total),
		slowestNotes: [],
	});
}

export function parseProgressJson(
	json: string,
): { ok: true; value: ProgressState } | { ok: false; error: string } {
	try {
		const parsed = JSON.parse(json);
		const result = progressSchema.safeParse(parsed);

		if (!result.success) {
			return { ok: false, error: "Progress JSON does not match v1 schema." };
		}

		return { ok: true, value: mergeWithDefaults(result.data) };
	} catch {
		return { ok: false, error: "Progress JSON could not be parsed." };
	}
}

export function serializeProgress(progress: ProgressState) {
	return JSON.stringify(progress, null, 2);
}

export function readStoredProgress(): ProgressState {
	if (!isBrowser()) {
		return defaultProgressState;
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return defaultProgressState;
		}

		const parsed = parseProgressJson(raw);
		return parsed.ok ? parsed.value : defaultProgressState;
	} catch {
		return defaultProgressState;
	}
}

export function writeStoredProgress(progress: ProgressState) {
	if (!isBrowser()) {
		return false;
	}

	try {
		window.localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
		return true;
	} catch {
		return false;
	}
}
