import { FRET_COUNT } from "./note-engine";
import type { Handedness, StringNumber } from "./types";

// All values are in arbitrary "neck units" (roughly inches, scale-length based).
// The nut sits at x = 0 and the neck extends toward +x (the body).

export const SCALE_LENGTH = 25.5;

export const NECK_WIDTH = 2.1;
export const FRETBOARD_THICKNESS = 0.22;
export const NECK_BACK_DEPTH = 0.85;

// Top surface of the fretboard (where strings/inlays/notes sit).
export const SURFACE_Y = 0;

// Distance from the nut to the fret wire for fret `n` (equal temperament).
// fretX(0) === 0 (the nut); fretX(12) === SCALE_LENGTH / 2 (the octave).
export function fretX(fret: number): number {
	return SCALE_LENGTH - SCALE_LENGTH / 2 ** (fret / 12);
}

// Where a played note sits: open strings just behind the nut, fretted notes
// midway between their fret wire and the previous one.
export function noteX(fret: number): number {
	if (fret <= 0) {
		return -0.6;
	}
	return (fretX(fret - 1) + fretX(fret)) / 2;
}

// Neck spans from just behind the nut to a little past the last fret.
export const NECK_START_X = -1.4;
export const NECK_END_X = fretX(FRET_COUNT) + 1;
export const NECK_LENGTH = NECK_END_X - NECK_START_X;

// Even string spacing across the neck. String 6 (low E) and string 1 (high E)
// sit on opposite edges; left-handed mirrors the layout.
export function stringZ(
	stringNumber: StringNumber,
	handedness: Handedness = "right",
): number {
	const usable = NECK_WIDTH - 0.5;
	const step = usable / 5;
	const base = -usable / 2 + (stringNumber - 1) * step;
	return handedness === "left" ? -base : base;
}
