import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import * as THREE from "three";

import { Button } from "#/components/ui/button";

import {
	fretX,
	NECK_BACK_DEPTH,
	NECK_END_X,
	NECK_LENGTH,
	NECK_START_X,
	NECK_WIDTH,
	noteX,
	SURFACE_Y,
	stringZ,
} from "../fretboard-geometry";
import {
	DOUBLE_MARKER_FRETS,
	INLAY_COLOR,
	MARKER_FRETS,
	MARKER_STYLES,
	NECK_BACK_COLORS,
	WOODS,
} from "../guitar-style";
import {
	FRET_COUNT,
	generateFretboardCells,
	getDisplayNote,
	isCellInZone,
} from "../note-engine";
import type { FretboardCell, FretboardZone, SettingsState } from "../types";

const ALL_CELLS = generateFretboardCells();

const SHARKFIN_GEOMETRY = (() => {
	const s = new THREE.Shape();
	s.moveTo(0, 0.28);
	s.lineTo(0.22, -0.2);
	s.lineTo(-0.22, -0.2);
	s.closePath();
	return new THREE.ShapeGeometry(s);
})();

// Player's point of view: elevated, behind the nut, looking down the neck.
const CAMERA_POSITION: [number, number, number] = [-2.5, 11, 9.5];
const CAMERA_TARGET: [number, number, number] = [7, -0.5, 0];
const CAMERA_FOV = 48;

// State colours — hex approximations of the OKLCH theme tokens (THREE can't
// parse oklch). Precedence mirrors the 2D CSS: target > correct > selected >
// pitch highlight > heat > active base.
const COLOR_BASE = "#e8e2d2";
const COLOR_SELECTED = "#e6b13a";
const COLOR_CORRECT = "#4ec77a";
const COLOR_TARGET = "#b088e6";
const COLOR_PITCH = "#d9a441";
const COLOR_HEAT = "#c85a4a";

interface Fretboard3DProps {
	zone: FretboardZone;
	settings: SettingsState;
	showLabels: boolean;
	selectedCellIds?: string[];
	correctCellIds?: string[];
	targetCellId?: string;
	highlightedPitchClass?: number;
	heatmap?: Record<string, number>;
	disabled?: boolean;
	onCellSelect?: (cell: FretboardCell) => void;
}

export default function Fretboard3D({
	zone,
	settings,
	showLabels,
	selectedCellIds = [],
	correctCellIds = [],
	targetCellId,
	highlightedPitchClass,
	heatmap = {},
	disabled = false,
	onCellSelect,
}: Fretboard3DProps) {
	const controlsRef = React.useRef<React.ComponentRef<
		typeof OrbitControls
	> | null>(null);

	const resetView = React.useCallback(() => {
		controlsRef.current?.reset();
	}, []);

	return (
		<div className="fretboard-3d">
			<Canvas
				className="fretboard-3d__canvas"
				dpr={[1, 2]}
				camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
			>
				<color attach="background" args={["#15161c"]} />
				<ambientLight intensity={0.7} />
				<directionalLight position={[6, 12, 8]} intensity={1.1} />
				<directionalLight position={[-8, 6, -6]} intensity={0.35} />

				<OrbitControls
					ref={controlsRef}
					target={CAMERA_TARGET}
					enablePan
					minDistance={4}
					maxDistance={40}
				/>

				<Neck settings={settings} />
				<Frets />
				<Nut />
				<Inlays settings={settings} />
				<Strings settings={settings} />

				{ALL_CELLS.map((cell) => {
					if (!isCellInZone(cell, zone)) {
						return null;
					}
					return (
						<Note
							key={cell.id}
							cell={cell}
							settings={settings}
							showLabel={showLabels}
							selected={selectedCellIds.includes(cell.id)}
							correct={correctCellIds.includes(cell.id)}
							target={targetCellId === cell.id}
							pitchHighlighted={highlightedPitchClass === cell.pitchClass}
							heat={heatmap[cell.id] ?? 0}
							disabled={disabled}
							onSelect={onCellSelect}
						/>
					);
				})}
			</Canvas>

			<div className="fretboard-3d__overlay">
				<Button type="button" variant="secondary" size="sm" onClick={resetView}>
					<RotateCcw />
					Reset view
				</Button>
			</div>
		</div>
	);
}

function Neck({ settings }: { settings: SettingsState }) {
	const wood = WOODS[settings.neckWood];
	const back = NECK_BACK_COLORS[settings.neckBackColor];
	const centerX = (NECK_START_X + NECK_END_X) / 2;
	const boardThickness = 0.22;

	return (
		<group>
			{/* Fretboard surface */}
			<mesh position={[centerX, SURFACE_Y - boardThickness / 2, 0]}>
				<boxGeometry args={[NECK_LENGTH, boardThickness, NECK_WIDTH]} />
				<meshStandardMaterial color={wood.color} roughness={wood.roughness} />
			</mesh>
			{/* Neck back */}
			<mesh
				position={[
					centerX,
					SURFACE_Y - boardThickness - NECK_BACK_DEPTH / 2,
					0,
				]}
			>
				<boxGeometry args={[NECK_LENGTH, NECK_BACK_DEPTH, NECK_WIDTH - 0.35]} />
				<meshStandardMaterial color={back.color} roughness={back.roughness} />
			</mesh>
		</group>
	);
}

function Nut() {
	return (
		<mesh position={[0, SURFACE_Y + 0.05, 0]}>
			<boxGeometry args={[0.16, 0.16, NECK_WIDTH]} />
			<meshStandardMaterial color="#efe9d8" roughness={0.4} />
		</mesh>
	);
}

function Frets() {
	const frets = [];
	for (let n = 1; n <= FRET_COUNT; n++) {
		frets.push(
			<mesh
				key={n}
				position={[fretX(n), SURFACE_Y + 0.02, 0]}
				rotation={[Math.PI / 2, 0, 0]}
			>
				<cylinderGeometry args={[0.03, 0.03, NECK_WIDTH, 12]} />
				<meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.3} />
			</mesh>,
		);
	}
	return <group>{frets}</group>;
}

function Inlays({ settings }: { settings: SettingsState }) {
	const shape = MARKER_STYLES[settings.neckMarkerStyle].shape;
	const y = SURFACE_Y + 0.011;

	return (
		<group>
			{MARKER_FRETS.map((fret) => {
				const x = (fretX(fret - 1) + fretX(fret)) / 2;
				const positions = DOUBLE_MARKER_FRETS.has(fret)
					? [-NECK_WIDTH / 5, NECK_WIDTH / 5]
					: [0];
				return positions.map((z) => (
					<InlayShape key={`${fret}:${z}`} shape={shape} x={x} y={y} z={z} />
				));
			})}
		</group>
	);
}

function InlayShape({
	shape,
	x,
	y,
	z,
}: {
	shape: "dot" | "block" | "sharkfin";
	x: number;
	y: number;
	z: number;
}) {
	const material = (
		<meshStandardMaterial
			color={INLAY_COLOR}
			roughness={0.25}
			metalness={0.1}
			emissive={INLAY_COLOR}
			emissiveIntensity={0.08}
		/>
	);

	if (shape === "block") {
		return (
			<mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
				<boxGeometry args={[0.55, NECK_WIDTH * 0.5, 0.02]} />
				{material}
			</mesh>
		);
	}

	if (shape === "sharkfin") {
		return (
			<mesh
				position={[x, y, z]}
				rotation={[-Math.PI / 2, 0, 0]}
				geometry={SHARKFIN_GEOMETRY}
			>
				{material}
			</mesh>
		);
	}

	return (
		<mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[0.17, 24]} />
			{material}
		</mesh>
	);
}

function Strings({ settings }: { settings: SettingsState }) {
	const length = NECK_END_X - noteX(0);
	const centerX = (noteX(0) + NECK_END_X) / 2;

	return (
		<group>
			{[6, 5, 4, 3, 2, 1].map((stringNumber) => {
				const n = stringNumber as 1 | 2 | 3 | 4 | 5 | 6;
				// Low E (6) thickest → high E (1) thinnest.
				const radius = 0.012 + (6 - stringNumber) * 0.0045;
				return (
					<mesh
						key={stringNumber}
						position={[
							centerX,
							SURFACE_Y + 0.09,
							stringZ(n, settings.handedness),
						]}
						rotation={[0, 0, Math.PI / 2]}
					>
						<cylinderGeometry args={[radius, radius, length, 8]} />
						<meshStandardMaterial
							color="#cdb98a"
							metalness={0.85}
							roughness={0.35}
						/>
					</mesh>
				);
			})}
		</group>
	);
}

// Cache label textures by note name so we never refetch fonts (offline-safe).
const labelTextureCache = new Map<string, THREE.CanvasTexture>();

function getLabelTexture(text: string, color: string): THREE.CanvasTexture {
	const key = `${text}|${color}`;
	const cached = labelTextureCache.get(key);
	if (cached) {
		return cached;
	}
	const size = 128;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.clearRect(0, 0, size, size);
		ctx.fillStyle = color;
		ctx.font = "bold 64px ui-sans-serif, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(text, size / 2, size / 2 + 4);
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.anisotropy = 4;
	labelTextureCache.set(key, texture);
	return texture;
}

function noteColor(state: {
	selected: boolean;
	correct: boolean;
	target: boolean;
	pitchHighlighted: boolean;
	heat: number;
}): { color: THREE.Color; emissive: string; emissiveIntensity: number } {
	if (state.target) {
		return {
			color: new THREE.Color(COLOR_TARGET),
			emissive: COLOR_TARGET,
			emissiveIntensity: 0.6,
		};
	}
	if (state.correct) {
		return {
			color: new THREE.Color(COLOR_CORRECT),
			emissive: COLOR_CORRECT,
			emissiveIntensity: 0.25,
		};
	}
	if (state.selected) {
		return {
			color: new THREE.Color(COLOR_SELECTED),
			emissive: COLOR_SELECTED,
			emissiveIntensity: 0.25,
		};
	}
	if (state.pitchHighlighted) {
		return {
			color: new THREE.Color(COLOR_PITCH),
			emissive: COLOR_PITCH,
			emissiveIntensity: 0.2,
		};
	}
	const color = new THREE.Color(COLOR_BASE);
	if (state.heat > 0) {
		color.lerp(new THREE.Color(COLOR_HEAT), Math.min(1, state.heat) * 0.7);
	}
	return { color, emissive: "#000000", emissiveIntensity: 0 };
}

// A pulsing violet ring on the fretboard marking the note to answer — the 3D
// equivalent of the 2D target cell's glow.
function TargetHighlight() {
	const ref = React.useRef<THREE.Mesh>(null);
	const material = React.useRef<THREE.MeshBasicMaterial>(null);

	useFrame((state) => {
		const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3);
		const scale = 1 + pulse * 0.2;
		ref.current?.scale.set(scale, scale, scale);
		if (material.current) {
			material.current.opacity = 0.6 + pulse * 0.4;
		}
	});

	return (
		<mesh ref={ref} position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<ringGeometry args={[0.3, 0.6, 48]} />
			<meshBasicMaterial
				ref={material}
				color={COLOR_TARGET}
				transparent
				opacity={0.9}
				side={THREE.DoubleSide}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}

function Note({
	cell,
	settings,
	showLabel,
	selected,
	correct,
	target,
	pitchHighlighted,
	heat,
	disabled,
	onSelect,
}: {
	cell: FretboardCell;
	settings: SettingsState;
	showLabel: boolean;
	selected: boolean;
	correct: boolean;
	target: boolean;
	pitchHighlighted: boolean;
	heat: number;
	disabled: boolean;
	onSelect?: (cell: FretboardCell) => void;
}) {
	const [hovered, setHovered] = React.useState(false);
	const x = noteX(cell.position.fret);
	const z = stringZ(cell.position.stringNumber, settings.handedness);
	const { color, emissive, emissiveIntensity } = noteColor({
		selected,
		correct,
		target,
		pitchHighlighted,
		heat,
	});

	const note = getDisplayNote(cell.midi, settings.accidentalMode, {
		scientific: cell.position.fret >= 12,
	});

	const interactive = !disabled && !!onSelect;
	const scale = hovered && interactive ? 1.15 : 1;

	return (
		<group position={[x, SURFACE_Y + 0.06, z]} scale={scale}>
			{target ? <TargetHighlight /> : null}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F <mesh> pointer events are WebGL raycasts, not DOM interactions */}
			<mesh
				rotation={[Math.PI / 2, 0, 0]}
				onClick={(event) => {
					if (!interactive) {
						return;
					}
					event.stopPropagation();
					onSelect?.(cell);
				}}
				onPointerOver={(event) => {
					if (!interactive) {
						return;
					}
					event.stopPropagation();
					setHovered(true);
				}}
				onPointerOut={() => setHovered(false)}
			>
				<cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
				<meshStandardMaterial
					color={color}
					emissive={emissive}
					emissiveIntensity={emissiveIntensity}
					roughness={0.4}
				/>
			</mesh>
			{showLabel ? (
				<mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[0.34, 0.34]} />
					<meshBasicMaterial
						map={getLabelTexture(note.name, "#1a1a1a")}
						transparent
					/>
				</mesh>
			) : null}
		</group>
	);
}
