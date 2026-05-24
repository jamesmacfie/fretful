/// <reference types="vitest/config" />

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig(({ mode }) => {
	const isTest = mode === "test" || Boolean(process.env.VITEST);
	const plugins: PluginOption[] = [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	];

	if (!isTest) {
		plugins.splice(1, 0, cloudflare({ viteEnvironment: { name: "ssr" } }));
		plugins.push(
			VitePWA({
				includeAssets: [
					"favicon.ico",
					"favicon.svg",
					"logo192.png",
					"logo512.png",
					"manifest.json",
					"robots.txt",
				],
				injectRegister: null,
				manifest: false,
				registerType: "prompt",
				workbox: {
					cleanupOutdatedCaches: true,
					globPatterns: [
						"**/*.{css,html,ico,js,json,png,svg,txt,webmanifest,woff,woff2}",
					],
					navigateFallback: "/",
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
							handler: "StaleWhileRevalidate",
							options: {
								cacheName: "google-font-stylesheets",
							},
						},
						{
							urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
							handler: "CacheFirst",
							options: {
								cacheName: "google-font-files",
								expiration: {
									maxAgeSeconds: 60 * 60 * 24 * 365,
									maxEntries: 30,
								},
							},
						},
					],
				},
			}),
		);
	}

	return {
		resolve: { tsconfigPaths: true },
		test: {
			environment: "jsdom",
		},
		plugins,
	};
});

export default config;
