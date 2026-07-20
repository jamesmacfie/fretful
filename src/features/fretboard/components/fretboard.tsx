import * as React from "react";

import { cn } from "#/lib/utils";

import {
	generateFretboardCells,
	getDisplayNote,
	isCellInZone,
	TAB_STRING_ORDER,
} from "../note-engine";
import type {
	FretboardCell,
	FretboardZone,
	SettingsState,
	StringNumber,
} from "../types";

const FRET_MARKERS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
const ALL_CELLS = generateFretboardCells();

interface FretboardProps {
	zone: FretboardZone;
	settings: SettingsState;
	showLabels: boolean;
	showFretNumbers: boolean;
	selectedCellIds?: string[];
	correctCellIds?: string[];
	targetCellId?: string;
	highlightedPitchClass?: number;
	heatmap?: Record<string, number>;
	disabled?: boolean;
	onCellSelect?: (cell: FretboardCell) => void;
}

export function Fretboard({
	zone,
	settings,
	showLabels,
	showFretNumbers,
	selectedCellIds = [],
	correctCellIds = [],
	targetCellId,
	highlightedPitchClass,
	heatmap = {},
	disabled = false,
	onCellSelect,
}: FretboardProps) {
	const scrollRef = React.useRef<HTMLElement>(null);
	const fretNumbers = React.useMemo(() => {
		const frets = Array.from({ length: 25 }, (_, fret) => fret);
		return settings.handedness === "left" ? frets.reverse() : frets;
	}, [settings.handedness]);

	const scrollTargetCellIntoView = React.useCallback(() => {
		if (!targetCellId) {
			return;
		}

		const scrollElement = scrollRef.current;
		if (!scrollElement) {
			return;
		}

		const targetElement = Array.from(
			scrollElement.querySelectorAll<HTMLElement>("[data-cell-id]"),
		).find((element) => element.dataset.cellId === targetCellId);

		if (!targetElement) {
			return;
		}

		const stickyLabelWidth =
			scrollElement.querySelector<HTMLElement>(".fretboard-corner")
				?.offsetWidth ?? 0;
		const visibleStart = scrollElement.scrollLeft + stickyLabelWidth;
		const visibleEnd = scrollElement.scrollLeft + scrollElement.clientWidth;
		const targetStart = targetElement.offsetLeft;
		const targetEnd = targetStart + targetElement.offsetWidth;
		const margin = 12;

		if (
			targetStart >= visibleStart + margin &&
			targetEnd <= visibleEnd - margin
		) {
			return;
		}

		const availableWidth = scrollElement.clientWidth - stickyLabelWidth;
		const nextScrollLeft =
			targetStart -
			stickyLabelWidth -
			(availableWidth - targetElement.offsetWidth) / 2;
		const left = Math.max(0, nextScrollLeft);

		if (typeof scrollElement.scrollTo === "function") {
			scrollElement.scrollTo({ left, behavior: "smooth" });
			return;
		}

		scrollElement.scrollLeft = left;
	}, [targetCellId]);

	React.useEffect(() => {
		const frame = window.requestAnimationFrame(scrollTargetCellIntoView);
		return () => window.cancelAnimationFrame(frame);
	}, [scrollTargetCellIntoView]);

	React.useEffect(() => {
		if (!targetCellId) {
			return;
		}

		window.addEventListener("resize", scrollTargetCellIntoView);
		window.addEventListener("orientationchange", scrollTargetCellIntoView);

		return () => {
			window.removeEventListener("resize", scrollTargetCellIntoView);
			window.removeEventListener("orientationchange", scrollTargetCellIntoView);
		};
	}, [scrollTargetCellIntoView, targetCellId]);

	const rows = TAB_STRING_ORDER.map((stringNumber) => ({
		stringNumber,
		cells: fretNumbers.map((fret) =>
			ALL_CELLS.find(
				(cell) =>
					cell.position.stringNumber === stringNumber &&
					cell.position.fret === fret,
			),
		),
	}));

	return (
		<div
			className="fretboard-wrap"
			data-handedness={settings.handedness}
			data-disabled={disabled ? "true" : "false"}
		>
			<p className="fretboard-orientation-tip">
				Rotate to landscape for a wider fretboard view.
			</p>
			<section
				ref={scrollRef}
				className="fretboard-scroll"
				aria-label="Guitar fretboard"
			>
				<div className="fretboard-grid">
					<div className="fretboard-corner" aria-hidden="true">
						String
					</div>
					{fretNumbers.map((fret) => (
						<div key={fret} className="fretboard-fret-label">
							{showFretNumbers ? fret : FRET_MARKERS.has(fret) ? "•" : ""}
						</div>
					))}

					{rows.map((row) => (
						<FretboardRow
							key={row.stringNumber}
							row={row}
							zone={zone}
							settings={settings}
							showLabels={showLabels}
							selectedCellIds={selectedCellIds}
							correctCellIds={correctCellIds}
							targetCellId={targetCellId}
							highlightedPitchClass={highlightedPitchClass}
							heatmap={heatmap}
							disabled={disabled}
							onCellSelect={onCellSelect}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

function FretboardRow({
	row,
	zone,
	settings,
	showLabels,
	selectedCellIds,
	correctCellIds,
	targetCellId,
	highlightedPitchClass,
	heatmap,
	disabled,
	onCellSelect,
}: {
	row: { stringNumber: StringNumber; cells: Array<FretboardCell | undefined> };
	zone: FretboardZone;
	settings: SettingsState;
	showLabels: boolean;
	selectedCellIds: string[];
	correctCellIds: string[];
	targetCellId?: string;
	highlightedPitchClass?: number;
	heatmap: Record<string, number>;
	disabled: boolean;
	onCellSelect?: (cell: FretboardCell) => void;
}) {
	const stringCell = row.cells.find(Boolean);

	return (
		<>
			<div className="string-label">
				<span>{settings.hideStringLabels ? "" : stringCell?.stringLabel}</span>
				<small>{row.stringNumber}</small>
			</div>
			{row.cells.map((cell) => {
				if (!cell) {
					return null;
				}

				const active = isCellInZone(cell, zone);
				const selected = selectedCellIds.includes(cell.id);
				const correct = correctCellIds.includes(cell.id);
				const target = targetCellId === cell.id;
				const pitchHighlighted = highlightedPitchClass === cell.pitchClass;
				const note = getDisplayNote(cell.midi, settings.accidentalMode, {
					scientific: cell.position.fret >= 12,
				});
				const heat = heatmap[cell.id] ?? 0;

				return (
					<button
						type="button"
						key={cell.id}
						data-testid={`cell-${cell.id}`}
						data-cell-id={cell.id}
						className={cn("fret-cell", !active && "is-inactive")}
						data-active={active}
						data-selected={selected}
						data-correct={correct}
						data-target={target}
						data-pitch={pitchHighlighted}
						style={{ "--heat": heat } as React.CSSProperties}
						disabled={!active || disabled}
						aria-label={`${cell.stringName} string, fret ${cell.position.fret}, ${note.scientific}`}
						onClick={() => onCellSelect?.(cell)}
					>
						<span className="fret-cell__note">
							{showLabels && active ? note.name : ""}
						</span>
						<span className="fret-cell__marker" aria-hidden="true">
							{FRET_MARKERS.has(cell.position.fret) ? "•" : ""}
						</span>
					</button>
				);
			})}
		</>
	);
}
