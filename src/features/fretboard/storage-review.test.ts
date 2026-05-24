import { describe, expect, it } from "vitest";

import { COURSE_MODULES } from "./curriculum";
import { getDisplayNote, noteKey } from "./note-engine";
import {
	applyAnswerToProgress,
	choosePromptSource,
	finishSession,
	passesGate,
	summarizeSession,
} from "./review";
import {
	defaultProgressState,
	parseProgressJson,
	serializeProgress,
} from "./storage";
import type { AnswerResult, ProgressState } from "./types";

function answer(overrides: Partial<AnswerResult> = {}): AnswerResult {
	return {
		promptId: "prompt-1",
		mode: "name-note",
		source: "current",
		targetNote: getDisplayNote(40, "sharps"),
		targetCellId: "6:0",
		correctCellIds: ["6:0"],
		selectedCellIds: [],
		correct: true,
		responseMs: 1200,
		answeredAt: 1_700_000_000_000,
		...overrides,
	};
}

describe("storage and review", () => {
	it("round-trips valid v1 progress and rejects corrupt JSON", () => {
		const json = serializeProgress(defaultProgressState);
		const parsed = parseProgressJson(json);

		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.value.version).toBe(1);
			expect(parsed.value.course.currentModuleId).toBe("b-open-strings");
		}

		expect(parseProgressJson("{broken").ok).toBe(false);
		expect(parseProgressJson(JSON.stringify({ version: 2 })).ok).toBe(false);
	});

	it("defaults auto-advance for older v1 progress exports", () => {
		const legacy = structuredClone(defaultProgressState);
		const legacySettings = legacy.settings as Partial<typeof legacy.settings>;
		delete legacySettings.autoAdvanceOnCorrect;

		const parsed = parseProgressJson(JSON.stringify(legacy));

		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.value.settings.autoAdvanceOnCorrect).toBe(true);
		}
	});

	it("repairs beginner unlocks from saved stats without using speed as a gate", () => {
		const progress = structuredClone(defaultProgressState);
		progress.course.unlockedModuleIds = [
			COURSE_MODULES[0].id,
			COURSE_MODULES[1].id,
		];
		progress.course.completedCheckpointIds = [COURSE_MODULES[0].id];
		progress.course.currentModuleId = COURSE_MODULES[1].id;
		progress.stats.cellStats["1:0"] = {
			attempts: 12,
			correct: 12,
			totalResponseMs: 120_000,
			lastResponseMs: 10_000,
			streak: 12,
			lapses: 0,
			lastSeenAt: 1_700_000_000_000,
			dueAt: 1_700_000_000_000,
		};

		const parsed = parseProgressJson(JSON.stringify(progress));

		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.value.course.completedCheckpointIds).toContain(
				COURSE_MODULES[1].id,
			);
			expect(parsed.value.course.unlockedModuleIds).toContain(
				COURSE_MODULES[2].id,
			);
		}
	});

	it("updates cell and note stats with spaced due dates", () => {
		const now = 1_700_000_000_000;
		const correct = applyAnswerToProgress(defaultProgressState, answer());
		const noteRecord = correct.stats.noteStats[noteKey(4)];
		const cellRecord = correct.stats.cellStats["6:0"];

		expect(noteRecord.attempts).toBe(1);
		expect(noteRecord.correct).toBe(1);
		expect(cellRecord.dueAt).toBeGreaterThan(now);

		const incorrect = applyAnswerToProgress(
			defaultProgressState,
			answer({ correct: false }),
		);
		expect(incorrect.stats.noteStats[noteKey(4)].dueAt).toBe(
			now + 5 * 60 * 1000,
		);
	});

	it("passes gates and unlocks the next module when a session proves mastery", () => {
		const module = COURSE_MODULES[0];
		const results = Array.from({ length: module.gate.minAnswers }, (_, index) =>
			answer({ promptId: `prompt-${index}`, responseMs: 900 + index }),
		);
		const summary = summarizeSession(results);

		expect(passesGate(module, summary)).toBe(true);

		const progress: ProgressState = {
			...defaultProgressState,
			stats: {
				...defaultProgressState.stats,
				noteStats: { ...defaultProgressState.stats.noteStats },
				cellStats: { ...defaultProgressState.stats.cellStats },
				reviewQueue: [],
			},
		};
		const next = finishSession(progress, results, module);

		expect(next.course.completedCheckpointIds).toContain(module.id);
		expect(next.course.unlockedModuleIds).toContain(COURSE_MODULES[1].id);
		expect(next.course.currentModuleId).toBe(COURSE_MODULES[1].id);
	});

	it("prefers due review, current work, and stretch targets by configured mix", () => {
		const dueProgress = applyAnswerToProgress(
			defaultProgressState,
			answer({ correct: false }),
		);
		dueProgress.stats.reviewQueue = dueProgress.stats.reviewQueue.map(
			(item) => ({
				...item,
				dueAt: 0,
			}),
		);

		expect(choosePromptSource(dueProgress, true, () => 0.2)).toBe("review");
		expect(choosePromptSource(defaultProgressState, true, () => 0.95)).toBe(
			"stretch",
		);
		expect(choosePromptSource(defaultProgressState, true, () => 0.5)).toBe(
			"current",
		);
	});
});
