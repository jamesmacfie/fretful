import { describe, expect, it } from "vitest";

import { COURSE_MODULES, getModule } from "./curriculum";
import { isCellInZone } from "./note-engine";
import { createPracticePrompt } from "./quiz-engine";
import { defaultProgressState } from "./storage";

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
});
