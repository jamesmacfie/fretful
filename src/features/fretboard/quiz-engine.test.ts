import { describe, expect, it } from "vitest";

import { COURSE_MODULES, getModule } from "./curriculum";
import { isCellInZone } from "./note-engine";
import { createPracticePrompt } from "./quiz-engine";
import { defaultProgressState } from "./storage";

function sequenceRandom(values: number[]) {
	let index = 0;

	return () => {
		const value =
			index < values.length ? values[index] : values[values.length - 1];
		index += 1;

		return value ?? 0;
	};
}

describe("quiz engine", () => {
	it("keeps ordinary course prompts inside their selected module", () => {
		for (const module of COURSE_MODULES) {
			const prompt = createPracticePrompt({
				module,
				mode: module.defaultMode,
				accidentalMode: "sharps",
				progress: defaultProgressState,
				random: () => 0.95,
				now: 1_700_000_000_000,
			});

			expect(prompt.source).toBe("current");
			expect(prompt.moduleId).toBe(module.id);
			expect(prompt.zone).toEqual(module.zone);
			expect(prompt.targetCell).toBeDefined();
			if (prompt.targetCell) {
				expect(isCellInZone(prompt.targetCell, module.zone)).toBe(true);
			}
		}
	});

	it("carries the generated module zone when stretch prompts are explicitly enabled", () => {
		const prompt = createPracticePrompt({
			module: getModule("b-high-e-naturals"),
			mode: "name-note",
			accidentalMode: "sharps",
			progress: defaultProgressState,
			includeStretch: true,
			random: () => 0.95,
			now: 1_700_000_000_000,
		});

		expect(prompt.source).toBe("stretch");
		expect(prompt.moduleId).toBe("b-low-e-naturals");
		expect(prompt.zone.strings).toEqual([6]);
		expect(prompt.targetCell?.position.stringNumber).toBe(6);
	});

	it("mixes Find All prompts into Find the Note when the module supports it", () => {
		const prompt = createPracticePrompt({
			module: getModule("i-naturals-0-12"),
			mode: "find-note",
			accidentalMode: "sharps",
			progress: defaultProgressState,
			random: sequenceRandom([0.25, 0]),
			now: 1_700_000_000_000,
		});

		expect(prompt.mode).toBe("find-all");
		expect(prompt.question).toBe("Find every E in the active zone.");
	});

	it("keeps Find the Note as a single-note prompt before Find All is introduced", () => {
		const prompt = createPracticePrompt({
			module: getModule("b-first-position-mix"),
			mode: "find-note",
			accidentalMode: "sharps",
			progress: defaultProgressState,
			random: sequenceRandom([0.25]),
			now: 1_700_000_000_000,
		});

		expect(prompt.mode).toBe("find-note");
		expect(prompt.question).toBe(
			`Find ${prompt.targetNote.name} in the active zone.`,
		);
	});
});
