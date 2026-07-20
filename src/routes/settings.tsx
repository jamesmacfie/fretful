import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Upload } from "lucide-react";
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
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { useTrainer } from "#/features/fretboard/trainer-provider";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
	const {
		progress,
		updateSettings,
		exportProgress,
		importProgress,
		resetProgress,
		persistenceAvailable,
	} = useTrainer();
	const settings = progress.settings;
	const [exportText, setExportText] = React.useState("");
	const [importText, setImportText] = React.useState("");
	const [importMessage, setImportMessage] = React.useState("");
	const [resetArmed, setResetArmed] = React.useState(false);
	const [resetMessage, setResetMessage] = React.useState("");

	const updateExport = () => {
		setExportText(exportProgress());
	};

	const importFromText = () => {
		const result = importProgress(importText);
		setImportMessage(result.message);
	};

	const requestReset = () => {
		setResetArmed(true);
		setResetMessage("");
	};

	const confirmReset = () => {
		resetProgress();
		setExportText("");
		setResetArmed(false);
		setResetMessage(
			"Learning progress reset. Display and sound settings were kept.",
		);
	};

	const cancelReset = () => {
		setResetArmed(false);
	};

	return (
		<div className="page-stack settings-workbench">
			<section className="page-heading">
				<div>
					<p className="app-kicker">Settings</p>
					<h2>Display, sound, and local progress.</h2>
				</div>
				<p>
					Progress is stored only in this browser. Private or incognito sessions
					may clear it when the last private tab closes.
				</p>
			</section>

			{!persistenceAvailable ? (
				<section className="notice-band">
					Browser storage is currently unavailable, so progress may not persist
					after refresh.
				</section>
			) : null}

			<section className="settings-grid">
				<SettingGroup title="Practice">
					<SwitchSetting
						label="Auto-advance on correct"
						checked={settings.autoAdvanceOnCorrect}
						onCheckedChange={(checked) =>
							updateSettings({ autoAdvanceOnCorrect: checked })
						}
					/>
				</SettingGroup>

				<SettingGroup title="Display">
					<SelectSetting
						label="Handedness"
						value={settings.handedness}
						onValueChange={(value) =>
							updateSettings({ handedness: value as "right" | "left" })
						}
						options={[
							{ value: "right", label: "Right-handed" },
							{ value: "left", label: "Left-handed" },
						]}
					/>
					<SelectSetting
						label="Note spelling"
						value={settings.accidentalMode}
						onValueChange={(value) =>
							updateSettings({ accidentalMode: value as "sharps" | "flats" })
						}
						options={[
							{ value: "sharps", label: "Sharps" },
							{ value: "flats", label: "Flats" },
						]}
					/>
					<SwitchSetting
						label="Study labels"
						checked={settings.showNoteLabelsInStudy}
						onCheckedChange={(checked) =>
							updateSettings({ showNoteLabelsInStudy: checked })
						}
					/>
					<SwitchSetting
						label="Hide string labels"
						checked={settings.hideStringLabels}
						onCheckedChange={(checked) =>
							updateSettings({ hideStringLabels: checked })
						}
					/>
					<SwitchSetting
						label="Fret numbers"
						checked={settings.showFretNumbers}
						onCheckedChange={(checked) =>
							updateSettings({ showFretNumbers: checked })
						}
					/>
					<SwitchSetting
						label="High contrast"
						checked={settings.highContrast}
						onCheckedChange={(checked) =>
							updateSettings({ highContrast: checked })
						}
					/>
				</SettingGroup>

				<SettingGroup title="Fretboard">
					<SelectSetting
						label="View"
						value={settings.fretboardView}
						onValueChange={(value) =>
							updateSettings({ fretboardView: value as "2d" | "3d" })
						}
						options={[
							{ value: "2d", label: "2D board" },
							{ value: "3d", label: "3D guitar" },
						]}
					/>
					<SelectSetting
						label="Fret markers"
						value={settings.neckMarkerStyle}
						onValueChange={(value) =>
							updateSettings({
								neckMarkerStyle: value as "dots" | "blocks" | "sharkfin",
							})
						}
						options={[
							{ value: "dots", label: "Dots" },
							{ value: "blocks", label: "Blocks" },
							{ value: "sharkfin", label: "Sharkfin" },
						]}
					/>
					<SelectSetting
						label="Fretboard wood"
						value={settings.neckWood}
						onValueChange={(value) =>
							updateSettings({
								neckWood: value as "rosewood" | "maple" | "ebony",
							})
						}
						options={[
							{ value: "rosewood", label: "Rosewood" },
							{ value: "maple", label: "Maple" },
							{ value: "ebony", label: "Ebony" },
						]}
					/>
					<SelectSetting
						label="Neck back colour"
						value={settings.neckBackColor}
						onValueChange={(value) =>
							updateSettings({
								neckBackColor: value as
									| "natural"
									| "mahogany"
									| "black"
									| "cream"
									| "blue",
							})
						}
						options={[
							{ value: "natural", label: "Natural" },
							{ value: "mahogany", label: "Mahogany" },
							{ value: "black", label: "Black" },
							{ value: "cream", label: "Cream" },
							{ value: "blue", label: "Blue" },
						]}
					/>
				</SettingGroup>

				<SettingGroup title="Sound">
					<SwitchSetting
						label="Sound"
						checked={settings.soundEnabled}
						onCheckedChange={(checked) =>
							updateSettings({ soundEnabled: checked })
						}
					/>
					<SwitchSetting
						label="Spoken prompts"
						checked={settings.spokenPrompts}
						onCheckedChange={(checked) =>
							updateSettings({ spokenPrompts: checked })
						}
					/>
					<SelectSetting
						label="Timbre"
						value={settings.timbre}
						onValueChange={() => updateSettings({ timbre: "clean-electric" })}
						options={[{ value: "clean-electric", label: "Clean electric" }]}
					/>
					<div className="setting-row">
						<div>
							<Label>Timer length</Label>
							<p>{settings.timerSeconds} seconds for Pace mode</p>
						</div>
						<Slider
							min={2}
							max={12}
							step={1}
							value={[settings.timerSeconds]}
							onValueChange={([value]) =>
								updateSettings({ timerSeconds: value ?? settings.timerSeconds })
							}
							className="setting-slider"
						/>
					</div>
				</SettingGroup>
			</section>

			<section className="section-band">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Progress</p>
						<h2>Reset learning progress</h2>
					</div>
				</div>
				<div className="reset-panel">
					<div className="reset-panel__copy">
						<p>
							Clear completed checkpoints, unlocked modules, sessions, weak-spot
							stats, and the review queue. Display and sound settings stay as
							they are.
						</p>
						<ul className="inline-list" aria-label="Current progress">
							<li>{progress.stats.sessionsCompleted} sessions</li>
							<li>
								{progress.course.completedCheckpointIds.length} checkpoints
							</li>
							<li>{progress.stats.reviewQueue.length} review items</li>
						</ul>
					</div>
					<div className="reset-actions">
						{resetArmed ? (
							<>
								<Button
									type="button"
									variant="destructive"
									onClick={confirmReset}
								>
									<RotateCcw />
									Confirm reset
								</Button>
								<Button type="button" variant="outline" onClick={cancelReset}>
									Cancel
								</Button>
							</>
						) : (
							<Button type="button" variant="outline" onClick={requestReset}>
								<RotateCcw />
								Reset Progress
							</Button>
						)}
					</div>
				</div>
				{resetArmed ? (
					<p className="reset-warning">
						This cannot be undone unless you export a backup first.
					</p>
				) : null}
				{resetMessage ? <p className="import-message">{resetMessage}</p> : null}
			</section>

			<section className="section-band">
				<div className="section-heading">
					<div>
						<p className="app-kicker">Backup</p>
						<h2>Export and import progress JSON</h2>
					</div>
				</div>
				<div className="backup-grid">
					<div className="backup-panel">
						<Button type="button" onClick={updateExport}>
							<Download />
							Export Progress
						</Button>
						<Textarea
							value={exportText}
							readOnly
							aria-label="Exported progress JSON"
							placeholder="Exported progress appears here."
						/>
					</div>
					<div className="backup-panel">
						<Button type="button" variant="secondary" onClick={importFromText}>
							<Upload />
							Import Progress
						</Button>
						<Textarea
							value={importText}
							onChange={(event) => setImportText(event.target.value)}
							aria-label="Progress JSON to import"
							placeholder="Paste a Fretful v1 progress export."
						/>
						{importMessage ? (
							<p className="import-message">{importMessage}</p>
						) : null}
					</div>
				</div>
			</section>
		</div>
	);
}

function SettingGroup({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="setting-group">
			<h3>{title}</h3>
			{children}
		</section>
	);
}

function SelectSetting({
	label,
	value,
	onValueChange,
	options,
}: {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
}) {
	return (
		<div className="setting-row">
			<Label>{label}</Label>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger>
					<SelectValue
						placeholder={
							options.find((option) => option.value === value)?.label ?? value
						}
					/>
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

function SwitchSetting({
	label,
	checked,
	onCheckedChange,
}: {
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="setting-row">
			<Label>{label}</Label>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
