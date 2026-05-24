# Design - Fretful

A locked Hallmark design system for the Fretful app. Every page shares this system; page-level variety comes from app workflow layout, not from changing theme, accent, or typography.

## Genre
Atmospheric app UI for a modern music-learning tool: dark studio surface, warm amber signal, calm motion, and a fretboard-first visual hierarchy.

## Macrostructure Family
- App pages: Workbench. The interface should feel like a practice surface with compact controls around the task.
- Course and Review pages: Map / Diagram treatment inside the same Workbench shell. Course modules and weak-spot review should read spatially.
- Content pages: compact app panels, not marketing sections.

## Theme
- `--color-paper` oklch(12% 0.018 275)
- `--color-paper-2` oklch(16% 0.019 275)
- `--color-paper-3` oklch(20% 0.021 275)
- `--color-ink` oklch(95% 0.012 78)
- `--color-ink-2` oklch(80% 0.014 78)
- `--color-rule` oklch(28% 0.02 275)
- `--color-accent` oklch(78% 0.17 72)
- `--color-focus` oklch(84% 0.17 72)

## Typography
- Display: Tomorrow, weight 700, normal.
- Body: Geist, weight 400.
- Metrics: Geist Mono, weight 600.
- Display tracking: 0.
- Type scale: major-third-inspired app scale in `tokens.css`.

## Spacing
4-point named scale in `tokens.css`. App CSS uses named tokens and responsive clamps, not page-specific raw spacing systems.

## Motion
- UI transitions are transform, opacity, color, and shadow only.
- No scroll choreography.
- Reduced motion collapses transitions to near-instant opacity and color changes.

## Microinteractions
- Primary actions use warm amber fill sparingly.
- Success and error states use color plus icon/text, never red/green alone.
- Focus rings are immediate and visible.
- Mobile hit targets stay at or above 44 px.

## Fretboard Rules
- The fretboard is the primary visual asset.
- Full 6 string x 25 fret layout remains horizontally scrollable when needed.
- String labels stay sticky.
- Portrait mobile keeps the landscape-orientation tip.
- Only the fretboard may create intentional horizontal scrolling.

## What Pages Must Share
- Floating dark app chrome.
- Bottom mobile route dock.
- Dark Bloom palette and warm amber active/focus language.
- Tomorrow/Geist/Geist Mono type roles.
- Compact panel rhythm and tokenized controls.

## What Pages May Differ On
- Home may emphasize next action and live progress.
- Course may use spatial map/card sequencing.
- Lesson may compact aggressively in mobile landscape.
- Review may emphasize fretboard heatmap and diagnostic panels.
- Settings may stay denser and quieter than practice views.

## Exports

### tokens.css
See `tokens.css` at the project root. It is the canonical token interface for this app.
