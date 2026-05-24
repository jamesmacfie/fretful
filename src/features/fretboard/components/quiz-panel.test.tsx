import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getModule } from "../curriculum";
import { TrainerProvider } from "../trainer-provider";
import { QuizPanel } from "./quiz-panel";

function renderQuiz(mode: "name-note" | "find-all") {
	const module = getModule("b-open-strings");

	return render(
		<TrainerProvider>
			<QuizPanel
				module={
					mode === "find-all"
						? {
								...module,
								availableModes: [...module.availableModes, "find-all"],
							}
						: module
				}
				mode={mode}
			/>
		</TrainerProvider>,
	);
}

describe("QuizPanel", () => {
	beforeEach(() => {
		const store = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				clear: () => store.clear(),
				getItem: (key: string) => store.get(key) ?? null,
				removeItem: (key: string) => store.delete(key),
				setItem: (key: string, value: string) => store.set(key, value),
			},
		});
		vi.spyOn(Math, "random").mockReturnValue(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		cleanup();
	});

	it("announces specific feedback for an incorrect note-name answer", async () => {
		renderQuiz("name-note");

		fireEvent.click(await screen.findByRole("button", { name: "A" }));

		expect(await screen.findByText(/Not yet/i)).toBeTruthy();
		expect(screen.getByText(/Correct answer: E/i)).toBeTruthy();
	});

	it("auto-advances after a correct answer by default", async () => {
		renderQuiz("name-note");

		fireEvent.click(await screen.findByRole("button", { name: "E" }));

		expect(await screen.findByText(/Correct: E/i)).toBeTruthy();
		await waitFor(
			() => {
				expect(screen.getByText("2/12")).toBeTruthy();
			},
			{ timeout: 1200 },
		);
	});

	it("requires every duplicate location before Find All is correct", async () => {
		renderQuiz("find-all");

		fireEvent.click(await screen.findByTestId("cell-6:0"));
		fireEvent.click(screen.getByRole("button", { name: /Submit 1/i }));

		expect(await screen.findByText(/Not yet/i)).toBeTruthy();

		fireEvent.click(screen.getByTestId("cell-1:0"));
		fireEvent.click(screen.getByRole("button", { name: /Submit 2/i }));

		expect(await screen.findByText(/Correct: E/i)).toBeTruthy();
	});
});
