import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Gauge, Volume2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { COURSE_MODULES, getNextModule } from "#/features/fretboard/curriculum";
import {
	getCourseProgress,
	getRecommendedPracticeItems,
} from "#/features/fretboard/review";
import { useTrainer } from "#/features/fretboard/trainer-provider";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { progress, currentModule, audioReady, enableSound } = useTrainer();
	const courseProgress = getCourseProgress(progress);
	const nextModule = getNextModule(currentModule.id);
	const recommendations = getRecommendedPracticeItems(progress, 3);

	return (
		<div className="page-stack home-workbench">
			<section className="dashboard-hero workbench-hero">
				<div className="dashboard-hero__copy">
					<p className="app-kicker">Local-first note trainer</p>
					<h2>Continue building single-note recall.</h2>
					<p>
						Your current checkpoint is {currentModule.title}. The active zone is
						deliberately narrow so recall grows before the full 0-24 neck opens.
					</p>
					<div className="button-row">
						<Button asChild size="lg">
							<Link
								to="/lesson"
								search={{
									moduleId: currentModule.id,
									mode: currentModule.defaultMode,
								}}
							>
								Continue
								<ArrowRight />
							</Link>
						</Button>
						<Button asChild variant="secondary" size="lg">
							<Link to="/course">Course map</Link>
						</Button>
						{!audioReady ? (
							<Button
								type="button"
								variant="outline"
								size="lg"
								onClick={enableSound}
							>
								<Volume2 />
								Enable sound
							</Button>
						) : null}
					</div>
				</div>
				<div className="dashboard-hero__panel">
					<Metric
						label="Course"
						value={`${courseProgress.percent}%`}
						icon={BookOpen}
					/>
					<Metric
						label="Sessions"
						value={String(progress.stats.sessionsCompleted)}
						icon={Gauge}
					/>
					<Metric
						label="Average"
						value={
							progress.stats.avgResponseMs
								? `${progress.stats.avgResponseMs} ms`
								: "New"
						}
						icon={BarChart3}
					/>
				</div>
			</section>

			<section className="section-band">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Next checkpoint</p>
						<h2>{currentModule.title}</h2>
					</div>
					<span className="tier-pill">{currentModule.tier}</span>
				</div>
				<p>{currentModule.why}</p>
				<div className="module-meta">
					<span>
						Frets {currentModule.zone.fretStart}-{currentModule.zone.fretEnd}
					</span>
					<span>{currentModule.zone.noteSet} notes</span>
					<span>{currentModule.availableModes.length} modes</span>
				</div>
			</section>

			<section className="two-column">
				<div className="section-band">
					<div className="section-heading">
						<div>
							<p className="app-kicker">Review coach</p>
							<h2>Practice these next</h2>
						</div>
						<Button asChild variant="outline" size="sm">
							<Link to="/review">Open review</Link>
						</Button>
					</div>
					{recommendations.length > 0 ? (
						<ul className="practice-list">
							{recommendations.map((item) => (
								<li key={`${item.kind}-${item.key}`}>
									<strong>{item.kind === "cell" ? "Position" : "Note"}</strong>
									<span>{item.key.replace("pc:", "Pitch class ")}</span>
								</li>
							))}
						</ul>
					) : (
						<p>
							Complete a short session and weak spots will appear here for
							spaced review.
						</p>
					)}
				</div>
				<div className="section-band">
					<div className="section-heading">
						<div>
							<p className="app-kicker">Course spine</p>
							<h2>
								{courseProgress.completed}/{COURSE_MODULES.length} checkpoints
							</h2>
						</div>
					</div>
					<p>
						{nextModule
							? `Next unlock: ${nextModule.title}.`
							: "All checkpoints are unlocked."}
					</p>
					<div
						className="progress-rail"
						role="progressbar"
						aria-label="Course progress"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={courseProgress.percent}
					>
						<span style={{ width: `${courseProgress.percent}%` }} />
					</div>
				</div>
			</section>
		</div>
	);
}

function Metric({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="dashboard-metric">
			<Icon className="dashboard-metric__icon" aria-hidden="true" />
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}
