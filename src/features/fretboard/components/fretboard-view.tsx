import { Box, Grid3x3 } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

import { useTrainer } from "../trainer-provider";
import type {
	FretboardCell,
	FretboardZone,
	MarkerStyle,
	NeckBackColor,
	NeckWood,
	SettingsState,
} from "../types";
import { Fretboard } from "./fretboard";

// three.js + R3F load only in this lazy chunk, client-side.
const Fretboard3D = React.lazy(() => import("./fretboard-3d"));

interface FretboardViewProps {
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

const MARKER_OPTIONS: Array<{ value: MarkerStyle; label: string }> = [
	{ value: "dots", label: "Dots" },
	{ value: "blocks", label: "Blocks" },
	{ value: "sharkfin", label: "Sharkfin" },
];

const WOOD_OPTIONS: Array<{ value: NeckWood; label: string }> = [
	{ value: "rosewood", label: "Rosewood" },
	{ value: "maple", label: "Maple" },
	{ value: "ebony", label: "Ebony" },
];

const BACK_OPTIONS: Array<{ value: NeckBackColor; label: string }> = [
	{ value: "natural", label: "Natural" },
	{ value: "mahogany", label: "Mahogany" },
	{ value: "black", label: "Black" },
	{ value: "cream", label: "Cream" },
	{ value: "blue", label: "Blue" },
];

export function FretboardView(props: FretboardViewProps) {
	const { updateSettings } = useTrainer();
	const { settings } = props;
	const is3d = settings.fretboardView === "3d";

	// Only mount WebGL on the client to survive SSR and avoid hydration mismatch.
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => setMounted(true), []);

	return (
		<div className="fretboard-view">
			<div className="fretboard-view__controls">
				<div className="fretboard-view__toggle">
					<Button
						type="button"
						size="sm"
						variant={is3d ? "ghost" : "secondary"}
						aria-pressed={!is3d}
						onClick={() => updateSettings({ fretboardView: "2d" })}
					>
						<Grid3x3 />
						2D
					</Button>
					<Button
						type="button"
						size="sm"
						variant={is3d ? "secondary" : "ghost"}
						aria-pressed={is3d}
						onClick={() => updateSettings({ fretboardView: "3d" })}
					>
						<Box />
						3D
					</Button>
				</div>

				{is3d ? (
					<div className="fretboard-view__style">
						<StyleSelect
							label="Markers"
							value={settings.neckMarkerStyle}
							options={MARKER_OPTIONS}
							onChange={(value) => updateSettings({ neckMarkerStyle: value })}
						/>
						<StyleSelect
							label="Wood"
							value={settings.neckWood}
							options={WOOD_OPTIONS}
							onChange={(value) => updateSettings({ neckWood: value })}
						/>
						<StyleSelect
							label="Neck back"
							value={settings.neckBackColor}
							options={BACK_OPTIONS}
							onChange={(value) => updateSettings({ neckBackColor: value })}
						/>
					</div>
				) : null}
			</div>

			{is3d && mounted ? (
				<React.Suspense fallback={<Fretboard {...props} />}>
					<Fretboard3D
						zone={props.zone}
						settings={settings}
						showLabels={props.showLabels}
						selectedCellIds={props.selectedCellIds}
						correctCellIds={props.correctCellIds}
						targetCellId={props.targetCellId}
						highlightedPitchClass={props.highlightedPitchClass}
						heatmap={props.heatmap}
						disabled={props.disabled}
						onCellSelect={props.onCellSelect}
					/>
				</React.Suspense>
			) : (
				<Fretboard {...props} />
			)}
		</div>
	);
}

function StyleSelect<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: Array<{ value: T; label: string }>;
	onChange: (value: T) => void;
}) {
	return (
		<div className="fretboard-view__style-field">
			<Label>{label}</Label>
			<Select value={value} onValueChange={(next) => onChange(next as T)}>
				<SelectTrigger size="sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
