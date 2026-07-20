import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Target } from "lucide-react";

import { Button } from "#/components/ui/button";
import { FretboardView } from "#/features/fretboard/components/fretboard-view";
import { getDisplayNote } from "#/features/fretboard/note-engine";
import {
	getAverageResponseMs,
	getRecommendedPracticeItems,
	getRecordAccuracy,
	getRecordPriority,
} from "#/features/fretboard/review";
import { useTrainer } from "#/features/fretboard/trainer-provider";
import type { FretboardZone, StatRecord } from "#/features/fretboard/types";

export const Route = createFileRoute("/review")({ component: Review });

const FULL_BOARD_ZONE: FretboardZone = {
	strings: [6, 5, 4, 3, 2, 1],
	fretStart: 0,
	fretEnd: 24,
	noteSet: "chromatic",
};

function Review() {
	const { progress, currentModule } = useTrainer();
	const heatmap = buildCellHeatmap(progress.stats.cellStats);
	const recommended = getRecommendedPracticeItems(progress, 6);
	const weakNotes = getWeakNotes(progress.stats.noteStats);
	const weakStrings = getWeakStrings(progress.stats.cellStats);

	return (
		<div className="page-stack review-map">
			<section className="page-heading page-heading--map">
				<div>
					<p className="app-kicker">Review coach</p>
					<h2>Weak zones and due practice.</h2>
				</div>
				<Button asChild>
					<Link
						to="/lesson"
						search={{
							moduleId: currentModule.id,
							mode: currentModule.defaultMode,
						}}
					>
						Practice now
						<ArrowRight />
					</Link>
				</Button>
			</section>

			<section className="section-band section-band--fretboard-map">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Heatmap</p>
						<h2>Hesitation by fretboard position</h2>
					</div>
					<span className="tier-pill">0-24</span>
				</div>
				<FretboardView
					zone={FULL_BOARD_ZONE}
					settings={progress.settings}
					showLabels={false}
					showFretNumbers={true}
					heatmap={heatmap}
					disabled={true}
				/>
			</section>

			<section className="two-column review-panels">
				<div className="section-band">
					<div className="section-heading">
						<div>
							<p className="app-kicker">Due next</p>
							<h2>Practice these next</h2>
						</div>
						<Target aria-hidden="true" />
					</div>
					{recommended.length > 0 ? (
						<ul className="practice-list">
							{recommended.map((item) => (
								<li key={`${item.kind}-${item.key}`}>
									<strong>
										{formatReviewKey(
											item.key,
											item.kind,
											progress.settings.accidentalMode,
										)}
									</strong>
									<span>
										{item.kind} · priority {Math.round(item.priority)}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p>
							No review is due yet. Finish one lesson session to seed the local
							review queue.
						</p>
					)}
				</div>

				<div className="section-band">
					<div className="section-heading">
						<div>
							<p className="app-kicker">Weak notes</p>
							<h2>Slow or missed names</h2>
						</div>
						<Flame aria-hidden="true" />
					</div>
					{weakNotes.length > 0 ? (
						<ul className="practice-list">
							{weakNotes.map((note) => (
								<li key={note.key}>
									<strong>{note.label}</strong>
									<span>
										{Math.round(note.accuracy * 100)}% · {note.avgResponseMs} ms
									</span>
								</li>
							))}
						</ul>
					) : (
						<p>Missed and slow notes appear here after practice.</p>
					)}
				</div>
			</section>

			<section className="section-band">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Strings</p>
						<h2>Where mistakes cluster</h2>
					</div>
				</div>
				<div className="string-bars">
					{weakStrings.map((string) => (
						<div key={string.label} className="string-bar">
							<span>{string.label}</span>
							<div>
								<i style={{ width: `${string.percent}%` }} />
							</div>
							<strong>{string.percent}%</strong>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

function buildCellHeatmap(records: Record<string, StatRecord>) {
	const scored = Object.fromEntries(
		Object.entries(records).map(([key, record]) => [
			key,
			Math.min(1, getRecordPriority(record) / 20),
		]),
	);

	return scored;
}

function getWeakNotes(records: Record<string, StatRecord>) {
	return Object.entries(records)
		.map(([key, record]) => {
			const pitchClass = Number(key.replace("pc:", ""));
			return {
				key,
				label: getDisplayNote(pitchClass, "sharps").name,
				accuracy: getRecordAccuracy(record),
				avgResponseMs: Math.round(getAverageResponseMs(record)),
				priority: getRecordPriority(record),
			};
		})
		.sort((a, b) => b.priority - a.priority)
		.slice(0, 6);
}

function getWeakStrings(records: Record<string, StatRecord>) {
	const buckets = new Map<string, number>();

	for (const [key, record] of Object.entries(records)) {
		const [stringNumber] = key.split(":");
		buckets.set(
			stringNumber,
			(buckets.get(stringNumber) ?? 0) + getRecordPriority(record),
		);
	}

	const values = [1, 2, 3, 4, 5, 6].map((stringNumber) => ({
		label: `String ${stringNumber}`,
		score: buckets.get(String(stringNumber)) ?? 0,
	}));
	const max = Math.max(1, ...values.map((item) => item.score));

	return values.map((item) => ({
		label: item.label,
		percent: Math.round((item.score / max) * 100),
	}));
}

function formatReviewKey(
	key: string,
	kind: "cell" | "note",
	accidentalMode: "sharps" | "flats",
) {
	if (kind === "note") {
		const pitchClass = Number(key.replace("pc:", ""));
		return getDisplayNote(pitchClass, accidentalMode).name;
	}

	const [stringNumber, fret] = key.split(":");
	return `String ${stringNumber}, fret ${fret}`;
}
