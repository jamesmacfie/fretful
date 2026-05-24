import * as React from "react";

import {
	createBrowserAudioContext,
	playMidiNote,
	resumeAudioContext,
	speakText,
} from "./audio";
import { getModule } from "./curriculum";
import { getDisplayNote } from "./note-engine";
import { applyAnswerToProgress, finishSession } from "./review";
import {
	defaultProgressState,
	parseProgressJson,
	readStoredProgress,
	resetLearningProgress,
	serializeProgress,
	writeStoredProgress,
} from "./storage";
import type {
	AnswerResult,
	CourseModule,
	ProgressState,
	SettingsState,
} from "./types";

interface TrainerContextValue {
	progress: ProgressState;
	isHydrated: boolean;
	audioReady: boolean;
	persistenceAvailable: boolean;
	liveMessage: string;
	currentModule: CourseModule;
	enableSound: () => Promise<void>;
	playMidi: (midi: number) => void;
	speak: (text: string) => void;
	announce: (message: string) => void;
	updateSettings: (settings: Partial<SettingsState>) => void;
	setCurrentModule: (moduleId: string) => void;
	recordAnswer: (answer: AnswerResult) => void;
	finishLessonSession: (module: CourseModule, results: AnswerResult[]) => void;
	exportProgress: () => string;
	importProgress: (
		json: string,
	) => { ok: true; message: string } | { ok: false; message: string };
	resetProgress: () => void;
}

const TrainerContext = React.createContext<TrainerContextValue | undefined>(
	undefined,
);

export function TrainerProvider({ children }: { children: React.ReactNode }) {
	const [progress, setProgress] =
		React.useState<ProgressState>(defaultProgressState);
	const [isHydrated, setIsHydrated] = React.useState(false);
	const [audioReady, setAudioReady] = React.useState(false);
	const [liveMessage, setLiveMessage] = React.useState("");
	const [persistenceAvailable, setPersistenceAvailable] = React.useState(true);
	const audioContextRef = React.useRef<AudioContext | undefined>(undefined);

	React.useEffect(() => {
		const stored = readStoredProgress();
		setProgress(stored);
		setIsHydrated(true);
	}, []);

	React.useEffect(() => {
		if (!isHydrated) {
			return;
		}

		const saved = writeStoredProgress(progress);
		setPersistenceAvailable(saved);
	}, [isHydrated, progress]);

	React.useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		document.documentElement.dataset.contrast = progress.settings.highContrast
			? "high"
			: "standard";
	}, [progress.settings.highContrast]);

	const updateSettings = React.useCallback(
		(settings: Partial<SettingsState>) => {
			setProgress((current) => ({
				...current,
				settings: { ...current.settings, ...settings },
			}));
		},
		[],
	);

	const enableSound = React.useCallback(async () => {
		const existing = audioContextRef.current;

		if (existing) {
			await resumeAudioContext(existing);
			setAudioReady(existing.state === "running");
			updateSettings({ soundEnabled: true });
			return;
		}

		const context = createBrowserAudioContext();
		if (!context) {
			setLiveMessage("Audio is not available in this browser.");
			return;
		}

		audioContextRef.current = context;
		await resumeAudioContext(context);
		setAudioReady(context.state === "running");
		updateSettings({ soundEnabled: true });
		setLiveMessage("Sound enabled.");
	}, [updateSettings]);

	const playMidi = React.useCallback(
		(midi: number) => {
			if (!progress.settings.soundEnabled) {
				return;
			}

			playMidiNote(audioContextRef.current, midi);
		},
		[progress.settings.soundEnabled],
	);

	const speak = React.useCallback(
		(text: string) => {
			if (!progress.settings.spokenPrompts) {
				return;
			}

			speakText(text);
		},
		[progress.settings.spokenPrompts],
	);

	const announce = React.useCallback((message: string) => {
		setLiveMessage(message);
	}, []);

	const setCurrentModule = React.useCallback((moduleId: string) => {
		setProgress((current) => {
			if (!current.course.unlockedModuleIds.includes(moduleId)) {
				return current;
			}

			const module = getModule(moduleId);
			return {
				...current,
				course: {
					...current.course,
					currentModuleId: module.id,
					currentTier: module.tier,
				},
			};
		});
	}, []);

	const recordAnswer = React.useCallback((answer: AnswerResult) => {
		setProgress((current) => applyAnswerToProgress(current, answer));
		const note = answer.targetNote.name;
		setLiveMessage(
			answer.correct
				? `Correct. ${note}.`
				: `Not yet. Correct answer: ${note}.`,
		);
	}, []);

	const finishLessonSession = React.useCallback(
		(module: CourseModule, results: AnswerResult[]) => {
			setProgress((current) => {
				return finishSession(current, results, module);
			});
		},
		[],
	);

	const exportProgress = React.useCallback(() => {
		return serializeProgress(progress);
	}, [progress]);

	const importProgress = React.useCallback((json: string) => {
		const parsed = parseProgressJson(json);
		if (!parsed.ok) {
			return { ok: false as const, message: parsed.error };
		}

		setProgress(parsed.value);
		setLiveMessage("Progress imported.");
		return { ok: true as const, message: "Progress imported." };
	}, []);

	const resetProgress = React.useCallback(() => {
		setProgress((current) => resetLearningProgress(current));
		setLiveMessage("Learning progress reset.");
	}, []);

	const currentModule = getModule(progress.course.currentModuleId);

	const value = React.useMemo<TrainerContextValue>(
		() => ({
			progress,
			isHydrated,
			audioReady,
			persistenceAvailable,
			liveMessage,
			currentModule,
			enableSound,
			playMidi,
			speak,
			announce,
			updateSettings,
			setCurrentModule,
			recordAnswer,
			finishLessonSession,
			exportProgress,
			importProgress,
			resetProgress,
		}),
		[
			progress,
			isHydrated,
			audioReady,
			persistenceAvailable,
			liveMessage,
			currentModule,
			enableSound,
			playMidi,
			speak,
			announce,
			updateSettings,
			setCurrentModule,
			recordAnswer,
			finishLessonSession,
			exportProgress,
			importProgress,
			resetProgress,
		],
	);

	return (
		<TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>
	);
}

export function useTrainer() {
	const context = React.useContext(TrainerContext);
	if (!context) {
		throw new Error("useTrainer must be used inside TrainerProvider");
	}

	return context;
}

export function useDisplayNote(midi: number) {
	const { progress } = useTrainer();
	return getDisplayNote(midi, progress.settings.accidentalMode);
}
