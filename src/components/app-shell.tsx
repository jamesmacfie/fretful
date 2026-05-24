import { Link, useLocation } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	Gauge,
	Home,
	Settings,
	Volume2,
	VolumeX,
} from "lucide-react";

import { Button } from "#/components/ui/button";
import { getCourseProgress } from "#/features/fretboard/review";
import { useTrainer } from "#/features/fretboard/trainer-provider";

const NAV_ITEMS = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/course", label: "Course", icon: BookOpen },
	{ to: "/lesson", label: "Lesson", icon: Gauge },
	{ to: "/review", label: "Review", icon: BarChart3 },
	{ to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const {
		progress,
		currentModule,
		audioReady,
		enableSound,
		liveMessage,
		persistenceAvailable,
	} = useTrainer();
	const courseProgress = getCourseProgress(progress);

	return (
		<div className="app-shell">
			<a className="skip-link" href="#main-content">
				Skip to content
			</a>
			<div className="app-chrome">
				<header className="app-header">
					<div className="app-header__brand">
						<div className="brand-mark" aria-hidden="true">
							<img
								src="/favicon.svg"
								alt=""
								className="brand-mark__icon"
								decoding="async"
							/>
						</div>
						<div>
							<p className="app-kicker">Progressive fretboard recall</p>
							<h1>Fretful</h1>
						</div>
					</div>
					<div className="app-header__status">
						<span>{courseProgress.percent}% course</span>
						<span>{currentModule.title}</span>
						{!persistenceAvailable ? (
							<span className="status-warning">Storage unavailable</span>
						) : null}
					</div>
					<Button
						type="button"
						variant={audioReady ? "secondary" : "default"}
						size="sm"
						onClick={enableSound}
						className="sound-button"
						aria-label={audioReady ? "Sound ready" : "Enable sound"}
						title={audioReady ? "Sound ready" : "Enable sound"}
					>
						{audioReady ? <Volume2 /> : <VolumeX />}
						<span className="sound-button__label">
							{audioReady ? "Sound ready" : "Enable sound"}
						</span>
					</Button>
				</header>

				<nav className="app-nav" aria-label="Primary">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive =
							item.to === "/"
								? location.pathname === "/"
								: location.pathname.startsWith(item.to);

						return (
							<Link
								key={item.to}
								to={item.to}
								className="app-nav__link"
								data-active={isActive ? "true" : undefined}
								aria-current={isActive ? "page" : undefined}
							>
								<Icon aria-hidden="true" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</div>

			<main id="main-content" className="app-main">
				{children}
			</main>
			<output className="sr-only" aria-live="polite" aria-atomic="true">
				{liveMessage}
			</output>
		</div>
	);
}
