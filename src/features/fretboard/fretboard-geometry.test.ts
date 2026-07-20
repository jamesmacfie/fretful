import { describe, expect, it } from "vitest";

import { fretX, noteX, SCALE_LENGTH, stringZ } from "./fretboard-geometry";

describe("fretboard-geometry", () => {
	it("places the nut at 0 and the octave at half the scale length", () => {
		expect(fretX(0)).toBe(0);
		expect(fretX(12)).toBeCloseTo(SCALE_LENGTH / 2, 5);
	});

	it("fret positions increase monotonically", () => {
		for (let n = 1; n <= 24; n++) {
			expect(fretX(n)).toBeGreaterThan(fretX(n - 1));
		}
	});

	it("open notes sit behind the nut, fretted notes between wires", () => {
		expect(noteX(0)).toBeLessThan(0);
		expect(noteX(5)).toBeGreaterThan(fretX(4));
		expect(noteX(5)).toBeLessThan(fretX(5));
	});

	it("left-handed mirrors string positions", () => {
		expect(stringZ(6, "left")).toBeCloseTo(-stringZ(6, "right"), 5);
		expect(stringZ(1, "right")).toBeCloseTo(-stringZ(6, "right"), 5);
	});
});
