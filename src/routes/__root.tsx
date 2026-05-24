import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "#/components/app-shell";
import { TrainerProvider } from "#/features/fretboard/trainer-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Fretful | Progressive Guitar Fretboard Trainer",
			},
			{
				name: "description",
				content:
					"A local-first guitar fretboard note trainer with progressive lessons, audio recall, and weak-spot review.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<TrainerProvider>
					<AppShell>{children}</AppShell>
				</TrainerProvider>
				<Scripts />
			</body>
		</html>
	);
}
