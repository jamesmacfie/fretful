import type { MarkerStyle, NeckBackColor, NeckWood } from "./types";

// Side-dot inlay positions and the frets that get a double marker.
export const MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
export const DOUBLE_MARKER_FRETS = new Set([12, 24]);

export const INLAY_COLOR = "#f2ecdc"; // pearloid / bone

export type MarkerShape = "dot" | "block" | "sharkfin";

export const MARKER_STYLES: Record<MarkerStyle, { shape: MarkerShape }> = {
	dots: { shape: "dot" },
	blocks: { shape: "block" },
	sharkfin: { shape: "sharkfin" },
};

export interface WoodMaterial {
	color: string;
	roughness: number;
}

export const WOODS: Record<NeckWood, WoodMaterial> = {
	rosewood: { color: "#3b2416", roughness: 0.72 },
	maple: { color: "#d9b988", roughness: 0.55 },
	ebony: { color: "#1a1512", roughness: 0.5 },
};

export const NECK_BACK_COLORS: Record<NeckBackColor, WoodMaterial> = {
	natural: { color: "#c99a5b", roughness: 0.6 },
	mahogany: { color: "#6b3320", roughness: 0.6 },
	black: { color: "#16161a", roughness: 0.45 },
	cream: { color: "#e8dcc0", roughness: 0.55 },
	blue: { color: "#2e5b8a", roughness: 0.4 },
};
