import "../ui/style.css";
import { renderHistogram } from "./histogram.js";
import { parse } from "./parser.js";
import { render } from "./renderer.js";
import type { StateSnapshot } from "./simulator.js";
import { runCircuit } from "./simulator.js";
import type { Circuit } from "./types.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const svgEl = document.getElementById(
	"circuit-svg",
) as unknown as SVGSVGElement;
const textarea = document.getElementById(
	"circuit-input",
) as HTMLTextAreaElement;
const runBtn = document.getElementById("run-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const errorEl = document.getElementById("parse-error") as HTMLElement;
const stepLabel = document.getElementById("step-label") as HTMLElement;
const histSvg = document.getElementById(
	"histogram-svg",
) as unknown as SVGSVGElement;
const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
const resultsSection = document.getElementById(
	"circuit-results",
) as HTMLElement;

// ── Preset circuits ───────────────────────────────────────────────────────────
const PRESETS: Record<string, { circuit: Circuit; text: string }> = {
	bell_phi_plus: {
		text: "H 0\nCX 0 1",
		circuit: {
			id: "bell_phi_plus",
			label: "",
			description: "",
			qubits: 2,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "cx", qubits: [0, 1], cbits: [] },
			],
		},
	},
	bell_phi_minus: {
		text: "H 0\nCX 0 1\nZ 0",
		circuit: {
			id: "bell_phi_minus",
			label: "",
			description: "",
			qubits: 2,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "cx", qubits: [0, 1], cbits: [] },
				{ name: "z", qubits: [0], cbits: [] },
			],
		},
	},
	bell_psi_plus: {
		text: "H 0\nCX 0 1\nX 0",
		circuit: {
			id: "bell_psi_plus",
			label: "",
			description: "",
			qubits: 2,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "cx", qubits: [0, 1], cbits: [] },
				{ name: "x", qubits: [0], cbits: [] },
			],
		},
	},
	bell_psi_minus: {
		text: "H 0\nCX 0 1\nX 0\nZ 0",
		circuit: {
			id: "bell_psi_minus",
			label: "",
			description: "",
			qubits: 2,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "cx", qubits: [0, 1], cbits: [] },
				{ name: "x", qubits: [0], cbits: [] },
				{ name: "z", qubits: [0], cbits: [] },
			],
		},
	},
	grover: {
		text: "H 0\nH 1\n# Oracle: mark |11⟩\nCZ 0 1\n# Diffuser\nH 0\nH 1\nX 0\nX 1\nCZ 0 1\nX 0\nX 1\nH 0\nH 1",
		circuit: {
			id: "grover",
			label: "Grover",
			description: "",
			qubits: 2,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "h", qubits: [1], cbits: [] },
				{ name: "cz", qubits: [0, 1], cbits: [] },
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "h", qubits: [1], cbits: [] },
				{ name: "x", qubits: [0], cbits: [] },
				{ name: "x", qubits: [1], cbits: [] },
				{ name: "cz", qubits: [0, 1], cbits: [] },
				{ name: "x", qubits: [0], cbits: [] },
				{ name: "x", qubits: [1], cbits: [] },
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "h", qubits: [1], cbits: [] },
			],
		},
	},
	ghz: {
		text: "H 0\nCX 0 1\nCX 0 2",
		circuit: {
			id: "ghz",
			label: "GHZ",
			description: "",
			qubits: 3,
			cbits: 0,
			gates: [
				{ name: "h", qubits: [0], cbits: [] },
				{ name: "cx", qubits: [0, 1], cbits: [] },
				{ name: "cx", qubits: [0, 2], cbits: [] },
			],
		},
	},
};

// ── State ─────────────────────────────────────────────────────────────────────
let steps: StateSnapshot[] = [];
let stepIdx = 0;

// ── Step navigation ───────────────────────────────────────────────────────────
function showStep(idx: number): void {
	stepIdx = Math.max(0, Math.min(idx, steps.length - 1));
	const snap = steps[stepIdx]!;
	const total = steps.length - 1;
	stepLabel.textContent =
		stepIdx === 0
			? "Initial state"
			: `Step ${stepIdx} / ${total} — after ${snap.gate}`;
	renderHistogram(histSvg, snap);
	prevBtn.disabled = stepIdx === 0;
	nextBtn.disabled = stepIdx === steps.length - 1;
}

prevBtn.addEventListener("click", () => showStep(stepIdx - 1));
nextBtn.addEventListener("click", () => showStep(stepIdx + 1));

document.addEventListener("keydown", (e) => {
	if (e.target === textarea) return;
	if (e.key === "ArrowLeft") showStep(stepIdx - 1);
	if (e.key === "ArrowRight") showStep(stepIdx + 1);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function parsedToCircuit(parsed: ReturnType<typeof parse>): Circuit | null {
	if ("error" in parsed) return null;
	const gates = parsed.circuit.instructions.flatMap(
		(instr): Circuit["gates"] => {
			if (instr.type === "single")
				return [
					{ name: instr.gate.toLowerCase(), qubits: [instr.qubit], cbits: [] },
				];
			if (instr.type === "cx")
				return [
					{ name: "cx", qubits: [instr.control, instr.target], cbits: [] },
				];
			if (instr.type === "cz")
				return [{ name: "cz", qubits: [instr.q1, instr.q2], cbits: [] }];
			return [];
		},
	);
	return {
		id: "custom",
		label: "",
		description: "",
		qubits: parsed.circuit.n_qubits,
		cbits: 0,
		gates,
	};
}

// startStep: 0 = initial, -1 = final
function execute(startStep: number): void {
	errorEl.textContent = "";
	const result = parse(textarea.value);
	if ("error" in result) {
		errorEl.textContent = result.error.message;
		resultsSection.style.visibility = "hidden";
		return;
	}
	const circuit = parsedToCircuit(result);
	if (circuit) render(svgEl, circuit);
	steps = runCircuit(result.circuit);
	resultsSection.style.visibility = "visible";
	showStep(startStep < 0 ? steps.length - 1 : startStep);
}

// ── Buttons ───────────────────────────────────────────────────────────────────
runBtn.addEventListener("click", () => execute(-1));
resetBtn.addEventListener("click", () => {
	if (steps.length) showStep(0);
});

textarea.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) execute(steps.length - 1);
});

// Live diagram update on valid input (no simulation)
textarea.addEventListener("input", () => {
	const result = parse(textarea.value);
	const circuit = parsedToCircuit(result);
	if (circuit) render(svgEl, circuit);
});

// ── Preset selection ──────────────────────────────────────────────────────────
function selectPreset(id: string): void {
	const preset = PRESETS[id];
	if (!preset) return;
	render(svgEl, preset.circuit);
	textarea.value = preset.text;
	execute(0);
}

document
	.querySelectorAll<HTMLButtonElement>("[data-circuit]")
	.forEach((btn) => {
		btn.addEventListener("click", () => {
			for (const b of document.querySelectorAll<HTMLElement>("[data-circuit]"))
				b.classList.remove("active");
			btn.classList.add("active");
			selectPreset(btn.dataset.circuit ?? "bell_phi_plus");
		});
	});

selectPreset("bell_phi_plus");

// Re-render histogram on resize so bars fill available width
window.addEventListener("resize", () => {
	const snap = steps[stepIdx];
	if (snap) renderHistogram(histSvg, snap);
});
