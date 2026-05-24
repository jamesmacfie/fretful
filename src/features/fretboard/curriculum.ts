import type { CourseModule, QuizMode, Tier } from "./types";

export const COURSE_MODULES: CourseModule[] = [
	{
		id: "b-open-strings",
		tier: "beginner",
		order: 10,
		title: "Open strings",
		summary: "Name and hear the six standard tuning notes.",
		why: "Open strings are the map legend. Every fretted note is counted from one of these six starting pitches.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 0,
			noteSet: "natural",
		},
		defaultMode: "study",
		availableModes: ["study", "name-note", "pace"],
		gate: { minAnswers: 8, accuracy: 0.85, avgResponseMs: 5000 },
		labelsDefault: true,
		fretNumbersDefault: true,
		timerSeconds: 8,
	},
	{
		id: "b-high-e-naturals",
		tier: "beginner",
		order: 20,
		title: "High E natural notes",
		summary: "Learn the first octave on the high E string.",
		why: "A single string removes visual overload and shows the alphabet pattern across frets before strings start mixing.",
		zone: { strings: [1], fretStart: 0, fretEnd: 12, noteSet: "natural" },
		defaultMode: "name-note",
		availableModes: ["study", "name-note", "find-note", "pace"],
		gate: { minAnswers: 10, accuracy: 0.8, avgResponseMs: 5500 },
		labelsDefault: true,
		fretNumbersDefault: true,
		timerSeconds: 7,
	},
	{
		id: "b-low-e-naturals",
		tier: "beginner",
		order: 30,
		title: "Low E natural notes",
		summary: "Transfer the high E pattern to the low E string.",
		why: "The two E strings share note names at the same frets, so this module proves the octave relationship is useful immediately.",
		zone: { strings: [6], fretStart: 0, fretEnd: 12, noteSet: "natural" },
		defaultMode: "name-note",
		availableModes: ["study", "name-note", "find-note", "pace"],
		gate: { minAnswers: 10, accuracy: 0.8, avgResponseMs: 5200 },
		labelsDefault: true,
		fretNumbersDefault: true,
		timerSeconds: 7,
	},
	{
		id: "b-a-d-window",
		tier: "beginner",
		order: 40,
		title: "A and D first window",
		summary: "Work natural notes on frets 0-5 of the A and D strings.",
		why: "A small fret window introduces vertical movement without forcing the full neck into memory.",
		zone: { strings: [5, 4], fretStart: 0, fretEnd: 5, noteSet: "natural" },
		defaultMode: "find-note",
		availableModes: ["study", "name-note", "find-note", "pace"],
		gate: { minAnswers: 12, accuracy: 0.8, avgResponseMs: 5200 },
		labelsDefault: true,
		fretNumbersDefault: true,
		timerSeconds: 6,
	},
	{
		id: "b-first-position-mix",
		tier: "beginner",
		order: 50,
		title: "First-position natural mix",
		summary: "Mix all six strings across frets 0-5.",
		why: "This is the first real transfer check: the same notes now appear across multiple strings and shapes.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 5,
			noteSet: "natural",
		},
		defaultMode: "find-note",
		availableModes: ["study", "name-note", "find-note", "pace"],
		gate: { minAnswers: 14, accuracy: 0.82, avgResponseMs: 5000 },
		labelsDefault: false,
		fretNumbersDefault: true,
		timerSeconds: 6,
	},
	{
		id: "i-naturals-0-12",
		tier: "intermediate",
		order: 60,
		title: "Natural notes 0-12",
		summary:
			"Expand natural-note recall across the first octave of the full neck.",
		why: "Frets 0-12 are the core map. Everything above fret 12 repeats this octave one register higher.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "natural",
		},
		defaultMode: "name-note",
		availableModes: ["study", "name-note", "find-note", "find-all", "pace"],
		gate: { minAnswers: 16, accuracy: 0.85, avgResponseMs: 4500 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 5,
	},
	{
		id: "i-string-pairs",
		tier: "intermediate",
		order: 70,
		title: "String-pair recall",
		summary: "Work natural notes on adjacent string groups from frets 0-12.",
		why: "String pairs bridge isolated-string practice and full-board recall while keeping the search space learnable.",
		zone: {
			strings: [1, 2, 3, 4],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "natural",
		},
		defaultMode: "find-note",
		availableModes: ["study", "name-note", "find-note", "find-all", "pace"],
		gate: { minAnswers: 16, accuracy: 0.85, avgResponseMs: 4300 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 5,
	},
	{
		id: "i-locate-all-naturals",
		tier: "intermediate",
		order: 80,
		title: "Locate all naturals",
		summary: "Find every instance of a natural note inside frets 0-12.",
		why: "Knowing one location is useful; knowing all local options is what makes the fretboard feel connected.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "natural",
		},
		defaultMode: "find-all",
		availableModes: ["study", "find-note", "find-all", "pace"],
		gate: { minAnswers: 12, accuracy: 0.82, avgResponseMs: 6000 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 6,
	},
	{
		id: "i-accidentals-window",
		tier: "intermediate",
		order: 90,
		title: "Accidentals first window",
		summary: "Add sharps or flats across frets 0-7.",
		why: "Accidentals are not extra geography. They are the frets between the natural-note anchors you already know.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 7,
			noteSet: "chromatic",
		},
		defaultMode: "name-note",
		availableModes: ["study", "name-note", "find-note", "find-all", "pace"],
		gate: { minAnswers: 18, accuracy: 0.84, avgResponseMs: 4200 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 5,
	},
	{
		id: "i-chromatic-0-12",
		tier: "intermediate",
		order: 100,
		title: "Chromatic 0-12",
		summary: "Recall every note name across the first twelve frets.",
		why: "This checkpoint confirms the whole first octave is usable before upper-fret extension begins.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 12,
			noteSet: "chromatic",
		},
		defaultMode: "find-note",
		availableModes: ["study", "name-note", "find-note", "find-all", "pace"],
		gate: { minAnswers: 18, accuracy: 0.86, avgResponseMs: 4000 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 5,
	},
	{
		id: "a-octave-extension",
		tier: "advanced",
		order: 110,
		title: "Octave extension 12-24",
		summary: "Transfer the 0-12 map to the upper octave.",
		why: "The twelfth fret repeats the open string one octave higher; upper-fret work should feel like transfer, not a second neck.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 12,
			fretEnd: 24,
			noteSet: "natural",
		},
		defaultMode: "name-note",
		availableModes: [
			"study",
			"name-note",
			"find-note",
			"find-all",
			"audio-match",
			"pace",
		],
		gate: { minAnswers: 18, accuracy: 0.87, avgResponseMs: 3600 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 4,
	},
	{
		id: "a-full-board-chromatic",
		tier: "advanced",
		order: 120,
		title: "Full-board chromatic",
		summary: "Recall every chromatic note from fret 0 through fret 24.",
		why: "This is the fluent single-note map: every string, every fret, every spelling option.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 24,
			noteSet: "chromatic",
		},
		defaultMode: "find-note",
		availableModes: [
			"study",
			"name-note",
			"find-note",
			"find-all",
			"audio-match",
			"pace",
		],
		gate: { minAnswers: 20, accuracy: 0.88, avgResponseMs: 3200 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 4,
	},
	{
		id: "a-audio-match",
		tier: "advanced",
		order: 130,
		title: "Audio-first recall",
		summary: "Hear a note before finding it on the board.",
		why: "Audio-first practice connects the visual fretboard to pitch memory instead of training only letter-name reflexes.",
		zone: {
			strings: [6, 5, 4, 3, 2, 1],
			fretStart: 0,
			fretEnd: 24,
			noteSet: "chromatic",
		},
		defaultMode: "audio-match",
		availableModes: ["study", "find-note", "find-all", "audio-match", "pace"],
		gate: { minAnswers: 18, accuracy: 0.86, avgResponseMs: 3600 },
		labelsDefault: false,
		fretNumbersDefault: false,
		timerSeconds: 4,
	},
];

export const MODULE_BY_ID = Object.fromEntries(
	COURSE_MODULES.map((module) => [module.id, module]),
);

export const TIERS: Array<{ id: Tier; label: string; summary: string }> = [
	{
		id: "beginner",
		label: "Beginner",
		summary: "Open strings, single strings, and small natural-note zones.",
	},
	{
		id: "intermediate",
		label: "Intermediate",
		summary: "First-octave naturals, duplicates, and accidentals.",
	},
	{
		id: "advanced",
		label: "Advanced",
		summary:
			"Full-board chromatic recall, octave extension, and audio-first work.",
	},
];

export function getModule(moduleId?: string) {
	return (moduleId && MODULE_BY_ID[moduleId]) || COURSE_MODULES[0];
}

export function getNextModule(moduleId: string) {
	const current = getModule(moduleId);
	return COURSE_MODULES.find((module) => module.order > current.order);
}

export function getPreviousModule(moduleId: string) {
	const current = getModule(moduleId);
	return [...COURSE_MODULES]
		.reverse()
		.find((module) => module.order < current.order);
}

export function getTierModules(tier: Tier) {
	return COURSE_MODULES.filter((module) => module.tier === tier);
}

export function isModeAvailable(module: CourseModule, mode: QuizMode) {
	return module.availableModes.includes(mode);
}
