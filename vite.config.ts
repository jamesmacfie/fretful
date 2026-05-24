/// <reference types="vitest/config" />

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

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
