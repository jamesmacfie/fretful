import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { QuizPanel } from "#/features/fretboard/components/quiz-panel";
import { getModule, isModeAvailable } from "#/features/fretboard/curriculum";
import { normalizeModeForModule } from "#/features/fretboard/quiz-engine";
import { useTrainer } from "#/features/fretboard/trainer-provider";
import type { QuizMode } from "#/features/fretboard/types";
import { QUIZ_MODES } from "#/features/fretboard/types";

export const Route = createFileRoute("/lesson")({
	validateSearch: (search) => ({
		moduleId: typeof search.moduleId === "string" ? search.moduleId : undefined,
		mode: QUIZ_MODES.includes(search.mode as QuizMode)
			? (search.mode as QuizMode)
			: undefined,
	}),
	component: Lesson,
});

function Lesson() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: "/lesson" });
	const { progress, currentModule, setCurrentModule } = useTrainer();
	const requestedModule = getModule(search.moduleId);
	const unlocked = progress.course.unlockedModuleIds.includes(
		requestedModule.id,
	);
	const module = unlocked ? requestedModule : currentModule;
	const mode = normalizeModeForModule(module, search.mode);

	React.useEffect(() => {
		if (unlocked && progress.course.currentModuleId !== module.id) {
			setCurrentModule(module.id);
		}
	}, [module.id, progress.course.currentModuleId, setCurrentModule, unlocked]);

	const setMode = (nextMode: string) => {
		const quizMode = nextMode as QuizMode;
		navigate({
			search: {
				moduleId: module.id,
				mode: isModeAvailable(module, quizMode) ? quizMode : module.defaultMode,
			},
		});
	};

	return (
		<div className="page-stack">
			<section className="page-heading lesson-heading">
				<div>
					<p className="app-kicker">{module.tier} checkpoint</p>
					<h2>{module.title}</h2>
				</div>
				<div className="lesson-mode-control">
					<label htmlFor="mode-select">Mode</label>
					<Select value={mode} onValueChange={setMode}>
						<SelectTrigger id="mode-select" className="min-w-44">
							<SelectValue placeholder={modeLabel(mode)} />
						</SelectTrigger>
						<SelectContent>
							{module.availableModes.map((availableMode) => (
								<SelectItem key={availableMode} value={availableMode}>
									{modeLabel(availableMode)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</section>

			{!unlocked ? (
				<section className="notice-band">
					Requested checkpoint is locked, so this lesson opened your current
					module instead.
				</section>
			) : null}

			<section className="section-band">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Why this matters</p>
						<h2>{module.summary}</h2>
					</div>
					<span className="tier-pill">{module.zone.noteSet}</span>
				</div>
				<p>{module.why}</p>
			</section>

			<QuizPanel key={`${module.id}-${mode}`} module={module} mode={mode} />
		</div>
	);
}

function modeLabel(mode: QuizMode) {
	const labels: Record<QuizMode, string> = {
		study: "Study",
		"name-note": "Name the Note",
		"find-note": "Find the Note",
		"find-all": "Find All",
		pace: "Pace",
		"audio-match": "Audio Match",
	};

	return labels[mode];
}
