import { getPitch } from "./note-engine";

type AudioWindow = Window &
	typeof globalThis & {
		webkitAudioContext?: typeof AudioContext;
	};

export function createBrowserAudioContext() {
	if (typeof window === "undefined") {
		return undefined;
	}

	const AudioContextCtor =
		window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

	if (!AudioContextCtor) {
		return undefined;
	}

	return new AudioContextCtor();
}

export async function resumeAudioContext(context: AudioContext) {
	if (context.state !== "running") {
		await context.resume();
	}
}

export function playMidiNote(
	context: AudioContext | undefined,
	midi: number,
	durationSeconds = 0.65,
) {
	if (!context || context.state !== "running") {
		return;
	}

	const now = context.currentTime;
	const pitch = getPitch(midi, "sharps");
	const output = context.createGain();
	const filter = context.createBiquadFilter();
	const body = context.createOscillator();
	const brightness = context.createOscillator();
	const bodyGain = context.createGain();
	const brightnessGain = context.createGain();

	body.type = "triangle";
	body.frequency.value = pitch.frequency;
	brightness.type = "sawtooth";
	brightness.frequency.value = pitch.frequency;

	filter.type = "lowpass";
	filter.frequency.setValueAtTime(2400, now);
	filter.frequency.exponentialRampToValueAtTime(900, now + durationSeconds);

	bodyGain.gain.setValueAtTime(0.26, now);
	brightnessGain.gain.setValueAtTime(0.045, now);
	output.gain.setValueAtTime(0.0001, now);
	output.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
	output.gain.exponentialRampToValueAtTime(0.14, now + 0.11);
	output.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

	body.connect(bodyGain);
	brightness.connect(brightnessGain);
	bodyGain.connect(filter);
	brightnessGain.connect(filter);
	filter.connect(output);
	output.connect(context.destination);

	body.start(now);
	brightness.start(now);
	body.stop(now + durationSeconds + 0.03);
	brightness.stop(now + durationSeconds + 0.03);
}

export function speakText(text: string) {
	if (typeof window === "undefined" || !window.speechSynthesis) {
		return;
	}

	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 0.95;
	utterance.pitch = 1;
	window.speechSynthesis.speak(utterance);
}
