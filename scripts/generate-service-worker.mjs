import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const clientDirectory = fileURLToPath(new URL("../dist/client", import.meta.url));

async function collectFiles(directory, prefix = "") {
	const entries = await readdir(join(directory, prefix), {
		withFileTypes: true,
	});
	const files = [];

	for (const entry of entries) {
		const relativePath = prefix ? join(prefix, entry.name) : entry.name;

		if (entry.isDirectory()) {
			files.push(...(await collectFiles(directory, relativePath)));
			continue;
		}

		if (entry.isFile()) {
			files.push(relativePath);
		}
	}

	return files;
}

async function getBuildRevision(directory) {
	const hash = createHash("sha256");
	const files = await collectFiles(directory);

	for (const relativePath of files) {
		if (relativePath === "sw.js" || relativePath.startsWith("workbox-")) {
			continue;
		}

		hash.update(relativePath);
		hash.update(await readFile(join(directory, relativePath)));
	}

	return hash.digest("hex");
}

const revision = await getBuildRevision(clientDirectory);
const { count, size, warnings } = await generateSW({
	additionalManifestEntries: [{ revision, url: "/" }],
	cleanupOutdatedCaches: true,
	clientsClaim: true,
	globDirectory: clientDirectory,
	globPatterns: [
		"**/*.{css,html,ico,js,json,png,svg,txt,webmanifest,woff,woff2}",
	],
	navigateFallback: "/",
	navigateFallbackDenylist: [/^\/api\//, /^\/__tanstack/],
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
	skipWaiting: false,
	swDest: join(clientDirectory, "sw.js"),
});

for (const warning of warnings) {
	console.warn(warning);
}

console.log(
	`Generated service worker with ${count} precached files (${size} bytes).`,
);
