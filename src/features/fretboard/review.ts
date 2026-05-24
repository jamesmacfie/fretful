import { COURSE_MODULES, getNextModule } from "./curriculum";
import { noteKey } from "./note-engine";
import type {
	AnswerResult,
	CourseModule,
	ProgressState,
	ReviewQueueItem,
	ReviewSource,
	SessionSummary,
	StatRecord,
} from "./types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function createEmptyRecord(now: number): StatRecord {
	return {
		attempts: 0,
		correct: 0,
		totalResponseMs: 0,
		lastResponseMs: 0,
		streak: 0,
		lapses: 0,
		lastSeenAt: now,
		dueAt: now,
	};
}

function nextDueAt(record: StatRecord, correct: boolean, now: number) {
	if (!correct) {
		return now + 5 * MINUTE;
	}

	const nextStreak = record.streak + 1;
	const intervalDays =
		nextStreak === 1
			? 0.25
			: nextStreak === 2
				? 1
				: Math.min(21, 2 ** (nextStreak - 1));

	return now + intervalDays * DAY;
}

function updateRecord(
	record: StatRecord | undefined,
	correct: boolean,
	responseMs: number,
	now: number,
) {
	const current = record ?? createEmptyRecord(now);
	const streak = correct ? current.streak + 1 : 0;

	return {
		attempts: current.attempts + 1,
		correct: current.correct + (correct ? 1 : 0),
		totalResponseMs: current.totalResponseMs + responseMs,
		lastResponseMs: responseMs,
		streak,
		lapses: current.lapses + (correct ? 0 : 1),
		lastSeenAt: now,
		dueAt: nextDueAt(current, correct, now),
	};
}

function buildReviewQueue(progress: ProgressState, now: number) {
	const items: ReviewQueueItem[] = [];

	for (const [key, record] of Object.entries(progress.stats.cellStats)) {
		items.push({
			kind: "cell",
			key,
			dueAt: record.dueAt,
			priority: getRecordPriority(record, now),
		});
	}

	for (const [key, record] of Object.entries(progress.stats.noteStats)) {
		items.push({
			kind: "note",
			key,
			dueAt: record.dueAt,
			priority: getRecordPriority(record, now),
		});
	}

	return items
		.sort((a, b) => b.priority - a.priority || a.dueAt - b.dueAt)
		.slice(0, 100);
}

export function getRecordAccuracy(record?: StatRecord) {
	if (!record || record.attempts === 0) {
		return 0;
	}

	return record.correct / record.attempts;
}

export function getAverageResponseMs(record?: StatRecord) {
	if (!record || record.attempts === 0) {
		return 0;
	}

	return record.totalResponseMs / record.attempts;
}

export function getRecordPriority(record: StatRecord, now = Date.now()) {
	const dueWeight = record.dueAt <= now ? 10 : 0;
	const errorRate = 1 - getRecordAccuracy(record);
	const responseWeight = Math.min(4, getAverageResponseMs(record) / 1500);
	return dueWeight + errorRate * 5 + responseWeight + record.lapses;
}

export function applyAnswerToProgress(
	progress: ProgressState,
	answer: AnswerResult,
): ProgressState {
	const now = answer.answeredAt;
	const next: ProgressState = structuredClone(progress);
	const affectedCells = new Set(answer.correctCellIds);

	if (answer.targetCellId) {
		affectedCells.add(answer.targetCellId);
	}

	for (const cellId of affectedCells) {
		next.stats.cellStats[cellId] = updateRecord(
			next.stats.cellStats[cellId],
			answer.correct,
			answer.responseMs,
			now,
		);
	}

	const targetNoteKey = noteKey(answer.targetNote.pitchClass);
	next.stats.noteStats[targetNoteKey] = updateRecord(
		next.stats.noteStats[targetNoteKey],
		answer.correct,
		answer.responseMs,
		now,
	);

	const previousAttempts = Object.values(progress.stats.noteStats).reduce(
		(total, record) => total + record.attempts,
		0,
	);
	const previousTotalMs = progress.stats.avgResponseMs * previousAttempts;
	const nextAttempts = previousAttempts + 1;
	next.stats.avgResponseMs =
		nextAttempts > 0
			? Math.round((previousTotalMs + answer.responseMs) / nextAttempts)
			: answer.responseMs;
	next.stats.reviewQueue = buildReviewQueue(next, now);

	return next;
}

export function finishSession(
	progress: ProgressState,
	results: AnswerResult[],
	module: CourseModule,
) {
	const now = Date.now();
	const next: ProgressState = structuredClone(progress);
	const today = new Date(now).toISOString().slice(0, 10);

	next.stats.sessionsCompleted += 1;
	next.stats.streakDays =
		next.stats.lastSessionDate === today
			? next.stats.streakDays
			: next.stats.streakDays + 1;
	next.stats.lastSessionDate = today;

	const summary = summarizeSession(results);
	if (passesGate(module, summary)) {
		next.course.completedCheckpointIds = Array.from(
			new Set([...next.course.completedCheckpointIds, module.id]),
		);

		const upcoming = getNextModule(module.id);
		if (upcoming) {
			next.course.unlockedModuleIds = Array.from(
				new Set([...next.course.unlockedModuleIds, upcoming.id]),
			);
			next.course.currentModuleId = upcoming.id;
			next.course.currentTier = upcoming.tier;
		}
	}

	return next;
}

export function summarizeSession(results: AnswerResult[]): SessionSummary {
	if (results.length === 0) {
		return {
			total: 0,
			correct: 0,
			accuracy: 0,
			avgResponseMs: 0,
			slowestNotes: [],
		};
	}

	const correct = results.filter((result) => result.correct).length;
	const totalMs = results.reduce((sum, result) => sum + result.responseMs, 0);
	const noteBuckets = new Map<string, { total: number; count: number }>();

	for (const result of results) {
		const bucket = noteBuckets.get(result.targetNote.name) ?? {
			total: 0,
			count: 0,
		};
		bucket.total += result.responseMs;
		bucket.count += 1;
		noteBuckets.set(result.targetNote.name, bucket);
	}

	return {
		total: results.length,
		correct,
		accuracy: correct / results.length,
		avgResponseMs: Math.round(totalMs / results.length),
		slowestNotes: [...noteBuckets.entries()]
			.map(([label, bucket]) => ({
				label,
				avgResponseMs: Math.round(bucket.total / bucket.count),
			}))
			.sort((a, b) => b.avgResponseMs - a.avgResponseMs)
			.slice(0, 3),
	};
}

export function passesGate(module: CourseModule, summary: SessionSummary) {
	const meetsAccuracyGate =
		summary.total >= module.gate.minAnswers &&
		summary.accuracy >= module.gate.accuracy;

	if (module.tier === "beginner") {
		return meetsAccuracyGate;
	}

	return (
		meetsAccuracyGate && summary.avgResponseMs <= module.gate.avgResponseMs
	);
}

export function getDueReviewItems(progress: ProgressState, now = Date.now()) {
	return progress.stats.reviewQueue
		.filter((item) => item.dueAt <= now)
		.sort((a, b) => b.priority - a.priority || a.dueAt - b.dueAt);
}

export function choosePromptSource(
	progress: ProgressState,
	hasNextModule: boolean,
	random = Math.random,
): ReviewSource {
	const dueItems = getDueReviewItems(progress);
	const roll = random();

	if (dueItems.length > 0 && roll < 0.6) {
		return "review";
	}

	if (hasNextModule && roll > 0.9) {
		return "stretch";
	}

	return "current";
}

export function getRecommendedPracticeItems(
	progress: ProgressState,
	limit = 6,
) {
	return progress.stats.reviewQueue
		.slice()
		.sort((a, b) => b.priority - a.priority || a.dueAt - b.dueAt)
		.slice(0, limit);
}

export function getCourseProgress(progress: ProgressState) {
	const completed = progress.course.completedCheckpointIds.length;
	return {
		completed,
		total: COURSE_MODULES.length,
		percent: Math.round((completed / COURSE_MODULES.length) * 100),
	};
}
