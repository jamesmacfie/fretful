import type {
	AccidentalMode,
	DisplayNote,
	FretboardCell,
	FretboardPosition,
	FretboardZone,
	Pitch,
	StringNumber,
} from "./types";

export const FRET_COUNT = 24;

export const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];

const SHARP_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];

const FLAT_NAMES = [
	"C",
	"Db",
	"D",
	"Eb",
	"E",
	"F",
	"Gb",
	"G",
	"Ab",
	"A",
	"Bb",
	"B",
];

export const STANDARD_TUNING: Array<{
	stringNumber: StringNumber;
	label: string;
	name: string;
	baseMidi: number;
}> = [
	{ stringNumber: 6, label: "E", name: "Low E", baseMidi: 40 },
	{ stringNumber: 5, label: "A", name: "A", baseMidi: 45 },
	{ stringNumber: 4, label: "D", name: "D", baseMidi: 50 },
	{ stringNumber: 3, label: "G", name: "G", baseMidi: 55 },
	{ stringNumber: 2, label: "B", name: "B", baseMidi: 59 },
	{ stringNumber: 1, label: "E", name: "High E", baseMidi: 64 },
];

export const TAB_STRING_ORDER: StringNumber[] = [1, 2, 3, 4, 5, 6];

export function cellId(position: FretboardPosition) {
	return `${position.stringNumber}:${position.fret}`;
}

export function noteKey(pitchClass: number) {
	return `pc:${normalizePitchClass(pitchClass)}`;
}

export function normalizePitchClass(pitchClass: number) {
	return ((pitchClass % 12) + 12) % 12;
}

export function isNaturalPitchClass(pitchClass: number) {
	return NATURAL_PITCH_CLASSES.includes(normalizePitchClass(pitchClass));
}

export function getPitchClassName(
	pitchClass: number,
	accidentalMode: AccidentalMode,
) {
	const names = accidentalMode === "flats" ? FLAT_NAMES : SHARP_NAMES;
	return names[normalizePitchClass(pitchClass)];
}

export function getPitch(midi: number, accidentalMode: AccidentalMode): Pitch {
	const pitchClass = normalizePitchClass(midi);
	const octave = Math.floor(midi / 12) - 1;
	const name = getPitchClassName(pitchClass, accidentalMode);

	return {
		midi,
		pitchClass,
		octave,
		scientific: `${name}${octave}`,
		frequency: 440 * 2 ** ((midi - 69) / 12),
	};
}

export function getDisplayNote(
	midiOrPitchClass: number,
	accidentalMode: AccidentalMode,
	options: { scientific?: boolean } = {},
): DisplayNote {
	const pitchClass = normalizePitchClass(midiOrPitchClass);
	const octave = Math.floor(midiOrPitchClass / 12) - 1;
	const name = getPitchClassName(pitchClass, accidentalMode);
	const hasMidiRegister = midiOrPitchClass >= 12;

	return {
		name,
		scientific:
			options.scientific && hasMidiRegister ? `${name}${octave}` : name,
		pitchClass,
		isNatural: isNaturalPitchClass(pitchClass),
	};
}

export function getCell(position: FretboardPosition): FretboardCell {
	const tuning = STANDARD_TUNING.find(
		(string) => string.stringNumber === position.stringNumber,
	);

	if (!tuning) {
		throw new Error(`Unknown string number: ${position.stringNumber}`);
	}

	const midi = tuning.baseMidi + position.fret;
	const pitch = getPitch(midi, "sharps");

	return {
		id: cellId(position),
		position,
		stringLabel: tuning.label,
		stringName: tuning.name,
		midi,
		pitchClass: pitch.pitchClass,
		octave: pitch.octave,
	};
}

export function generateFretboardCells(): FretboardCell[] {
	return STANDARD_TUNING.flatMap((string) =>
		Array.from({ length: FRET_COUNT + 1 }, (_, fret) =>
			getCell({ stringNumber: string.stringNumber, fret }),
		),
	);
}

export function isCellInZone(cell: FretboardCell, zone: FretboardZone) {
	const inString = zone.strings.includes(cell.position.stringNumber);
	const inFret =
		cell.position.fret >= zone.fretStart && cell.position.fret <= zone.fretEnd;
	const inNoteSet =
		zone.noteSet === "chromatic" || isNaturalPitchClass(cell.pitchClass);
	const inAllowedPitchClass =
		!zone.allowedPitchClasses ||
		zone.allowedPitchClasses.includes(cell.pitchClass);

	return inString && inFret && inNoteSet && inAllowedPitchClass;
}

export function getActiveCells(zone: FretboardZone) {
	return generateFretboardCells().filter((cell) => isCellInZone(cell, zone));
}

export function getCellsForPitchClass(
	cells: FretboardCell[],
	pitchClass: number,
) {
	return cells.filter(
		(cell) => cell.pitchClass === normalizePitchClass(pitchClass),
	);
}

export function getDisplayChoices(
	noteSet: FretboardZone["noteSet"],
	accidentalMode: AccidentalMode,
) {
	const pitchClasses =
		noteSet === "natural"
			? NATURAL_PITCH_CLASSES
			: Array.from({ length: 12 }, (_, index) => index);

	return pitchClasses.map((pitchClass) =>
		getDisplayNote(pitchClass, accidentalMode),
	);
}

export function getStringDisplayName(stringNumber: StringNumber) {
	const tuning = STANDARD_TUNING.find(
		(string) => string.stringNumber === stringNumber,
	);
	return tuning ? `${stringNumber} ${tuning.name}` : String(stringNumber);
}
