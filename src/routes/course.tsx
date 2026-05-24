import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Play, Route as RouteIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
	getPreviousModule,
	getTierModules,
	TIERS,
} from "#/features/fretboard/curriculum";
import { useTrainer } from "#/features/fretboard/trainer-provider";
import type { CourseModule } from "#/features/fretboard/types";

export const Route = createFileRoute("/course")({ component: Course });

function Course() {
	const { progress, setCurrentModule } = useTrainer();

	return (
		<div className="page-stack">
			<section className="page-heading">
				<div>
					<p className="app-kicker">Course</p>
					<h2>Learn, drill, prove, review.</h2>
				</div>
				<p>
					The full 0-24 neck is always visible in lessons, but each checkpoint
					limits the active zone until recall is ready for more pressure.
				</p>
			</section>

			{TIERS.map((tier) => (
				<section
					key={tier.id}
					className="course-tier"
					aria-labelledby={tier.id}
				>
					<div className="section-heading">
						<div>
							<p className="app-kicker">{tier.id}</p>
							<h2 id={tier.id}>{tier.label}</h2>
						</div>
						<p>{tier.summary}</p>
					</div>
					<div className="module-grid">
						{getTierModules(tier.id).map((module) => (
							<ModuleCard
								key={module.id}
								module={module}
								unlocked={progress.course.unlockedModuleIds.includes(module.id)}
								completed={progress.course.completedCheckpointIds.includes(
									module.id,
								)}
								current={progress.course.currentModuleId === module.id}
								onStart={() => setCurrentModule(module.id)}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

function ModuleCard({
	module,
	unlocked,
	completed,
	current,
	onStart,
}: {
	module: CourseModule;
	unlocked: boolean;
	completed: boolean;
	current: boolean;
	onStart: () => void;
}) {
	return (
		<article className="module-card" data-current={current}>
			<div className="module-card__top">
				<span className="module-number">{module.order / 10}</span>
				{completed ? (
					<CheckCircle2
						className="module-status is-complete"
						aria-label="Complete"
					/>
				) : unlocked ? (
					<RouteIcon className="module-status" aria-label="Unlocked" />
				) : (
					<Lock className="module-status" aria-label="Locked" />
				)}
			</div>
			<h3>{module.title}</h3>
			<p>{module.summary}</p>
			<div className="module-meta">
				<span>
					Frets {module.zone.fretStart}-{module.zone.fretEnd}
				</span>
				<span>{module.zone.noteSet}</span>
				<span>{module.defaultMode.replace("-", " ")}</span>
			</div>
			{unlocked ? (
				<>
					{!completed ? (
						<p className="locked-copy">{checkpointGateCopy(module)}</p>
					) : null}
					<div className="button-row">
						<Button asChild size="sm" onClick={onStart}>
							<Link
								to="/lesson"
								search={{ moduleId: module.id, mode: module.defaultMode }}
							>
								<Play />
								Start
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm" onClick={onStart}>
							<Link
								to="/lesson"
								search={{ moduleId: module.id, mode: "study" }}
							>
								Study
							</Link>
						</Button>
					</div>
				</>
			) : (
				<p className="locked-copy">{lockedGateCopy(module)}</p>
			)}
		</article>
	);
}

function checkpointGateCopy(module: CourseModule) {
	const accuracy = Math.round(module.gate.accuracy * 100);

	if (module.tier === "beginner") {
		return `Unlocks next after ${module.gate.minAnswers}+ answers at ${accuracy}% accuracy.`;
	}

	return `Unlocks next after ${module.gate.minAnswers}+ answers at ${accuracy}% accuracy and ${module.gate.avgResponseMs / 1000}s average.`;
}

function lockedGateCopy(module: CourseModule) {
	const previous = getPreviousModule(module.id);

	if (!previous) {
		return "Start this checkpoint to unlock the course.";
	}

	return `Pass ${previous.title}: ${checkpointGateCopy(previous)}`;
}
