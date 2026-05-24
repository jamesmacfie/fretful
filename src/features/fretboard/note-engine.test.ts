import { describe, expect, it } from "vitest";

import {
	getActiveCells,
	getCell,
	getCellsForPitchClass,
	getDisplayNote,
	getPitch,
	isNaturalPitchClass,
} from "./note-engine";

describe("note engine", () => {
	it("derives standard tuning positions from MIDI bases", () => {
		expect(getCell({ stringNumber: 6, fret: 0 }).midi).toBe(40);
		expect(getCell({ stringNumber: 6, fret: 12 }).midi).toBe(52);
		expect(getCell({ stringNumber: 1, fret: 24 }).midi).toBe(88);
		expect(getPitch(40, "sharps").scientific).toBe("E2");
		expect(getPitch(88, "sharps").scientific).toBe("E6");
	});

	it("formats sharps, flats, and scientific pitch names", () => {
		expect(getDisplayNote(66, "sharps", { scientific: true })).toEqual({
			name: "F#",
			scientific: "F#4",
			pitchClass: 6,
			isNatural: false,
		});
		expect(getDisplayNote(66, "flats", { scientific: true }).scientific).toBe(
			"Gb4",
		);
		expect(getDisplayNote(64, "sharps").name).toBe("E");
	});

	it("filters active cells by zone and natural-note scope", () => {
		const cells = getActiveCells({
			strings: [1],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "natural",
		});

		expect(cells.every((cell) => cell.position.stringNumber === 1)).toBe(true);
		expect(cells.every((cell) => isNaturalPitchClass(cell.pitchClass))).toBe(
			true,
		);
		expect(cells.map((cell) => cell.position.fret)).toContain(12);
		expect(cells.map((cell) => cell.position.fret)).not.toContain(2);
	});

	it("finds every duplicate note location inside an active zone", () => {
		const cells = getActiveCells({
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "natural",
		});
		const eCells = getCellsForPitchClass(cells, 4);

		expect(eCells.map((cell) => cell.id)).toEqual(
			expect.arrayContaining(["6:0", "1:0", "6:12", "1:12"]),
		);
	});
});
