import "./ui/style.css";
import type {
	BackendId,
	DecompositionFile,
	GateDecomposition,
} from "./math/decompositions.js";
import { applyGate, GATES, type GateName } from "./math/gates.js";
import type { BlochVector } from "./math/statevector.js";
import {
	blochFromState,
	CARDINAL_STATES,
	type StateVector,
} from "./math/statevector.js";
import { BlochScene } from "./renderer/scene.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const labelLayer = document.getElementById("label-layer") as HTMLElement;
const blochEl = document.querySelector<HTMLElement>(
	'[data-testid="bloch-output"]',
);
if (!blochEl) throw new Error('Missing [data-testid="bloch-output"] element');
const blochOutput: HTMLElement = blochEl;

const zero = CARDINAL_STATES["|0⟩"];
if (!zero) throw new Error("Missing cardinal state |0⟩");
let currentState: StateVector = zero;
let selectedBackend: BackendId = "ibm";
let decompositions: DecompositionFile | null = null;

function setBlochOutput(v: BlochVector): void {
	const f = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);
	blochOutput.textContent = `${f(v.x)},${f(v.y)},${f(v.z)}`;
}

const scene = new BlochScene(canvas, labelLayer);

function setVector(state: StateVector): void {
	const v = blochFromState(state);
	setBlochOutput(v);
	scene.updateVector(v.x, v.y, v.z);
}

setVector(currentState);

// Load gate decompositions
fetch(`${import.meta.env.BASE_URL}gate_decompositions.json`)
	.then((r) => r.json() as Promise<DecompositionFile>)
	.then((data) => {
		decompositions = data;
		updateGateButtons();
	});

// Backend selector
document
	.querySelectorAll<HTMLButtonElement>("[data-backend]")
	.forEach((btn) => {
		btn.addEventListener("click", () => {
			selectedBackend = btn.dataset.backend as BackendId;
			document.querySelectorAll<HTMLElement>("[data-backend]").forEach((b) => {
				b.classList.toggle("active", b.dataset.backend === selectedBackend);
			});
			updateGateButtons();
			clearHwDisplay();
		});
	});

function updateGateButtons(): void {
	if (!decompositions) return;
	document.querySelectorAll<HTMLButtonElement>("[data-gate]").forEach((btn) => {
		const name = btn.dataset.gate as GateName;
		const supported =
			decompositions?.gates[name]?.hardware[selectedBackend] !== null;
		btn.disabled = !supported;
		btn.title = supported
			? ""
			: `Not supported on ${decompositions?.backends[selectedBackend]?.name ?? selectedBackend}`;
	});
}

function clearHwDisplay(): void {
	const steps = document.getElementById("hw-steps");
	const caveat = document.getElementById("hw-caveat");
	if (steps) steps.innerHTML = "";
	if (caveat) caveat.innerHTML = "";
}

function showHwSteps(gateData: GateDecomposition): void {
	const el = document.getElementById("hw-steps");
	if (!el) return;
	const steps = gateData.hardware[selectedBackend];
	if (!steps) {
		el.innerHTML = '<span class="hw-unsupported">Not supported</span>';
		return;
	}
	const caveat = document.getElementById("hw-caveat");
	if (caveat)
		caveat.innerHTML =
			'<span class="hw-caveat-text">Derived from Qiskit emulators — may not reflect real hardware</span>';

	el.innerHTML = steps
		.map(
			(s) =>
				`<span class="hw-step ${s.virtual ? "virtual" : "physical"}">${s.gate}${s.angle_rad !== undefined ? ` ${s.angle_rad.toFixed(2)}` : ""}</span>`,
		)
		.join('<span class="hw-sep">→</span>');
}

// Snap buttons
document.querySelectorAll<HTMLElement>("[data-state]").forEach((btn) => {
	const state = CARDINAL_STATES[btn.dataset.state ?? ""];
	if (!state) return;
	btn.addEventListener("click", () => {
		currentState = state;
		setVector(state);
		clearHwDisplay();
	});
});

// Gate buttons
document.querySelectorAll<HTMLButtonElement>("[data-gate]").forEach((btn) => {
	const name = btn.dataset.gate as GateName | undefined;
	const gate = name ? GATES[name] : undefined;
	if (!gate || !name) return;
	btn.addEventListener("click", () => {
		currentState = applyGate(currentState, gate);
		setVector(currentState);
		const gateData = decompositions?.gates[name];
		if (gateData) showHwSteps(gateData);
	});
});

scene.startLoop((): void => {});
