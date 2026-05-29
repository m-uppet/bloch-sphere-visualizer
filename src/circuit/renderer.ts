import { columnCount, layout } from "./layout.js";
import type { Circuit } from "./types.js";

const NS = "http://www.w3.org/2000/svg";

// Layout constants (px)
const WIRE_SPACING = 60;
const COL_WIDTH = 72;
const BOX = 48;
const LEFT_MARGIN = 56;
const RIGHT_MARGIN = 32;
const TOP_MARGIN = 24;
const BOTTOM_MARGIN = 24;
const CTRL_R = 6;
const TARGET_R = 14;

const GATE_COLORS: Record<string, string> = {
	h: "#c0392b",
	x: "#2c5f8a",
	y: "#2c5f8a",
	z: "#2c5f8a",
	s: "#2c5f8a",
	sdg: "#2c5f8a",
	t: "#2c5f8a",
	tdg: "#2c5f8a",
	measure: "#555",
	reset: "#555",
};

const GATE_LABELS: Record<string, string> = {
	h: "H",
	x: "X",
	y: "Y",
	z: "Z",
	s: "S",
	sdg: "S†",
	t: "T",
	tdg: "T†",
	measure: "M",
	reset: "|0⟩",
};

function el(
	tag: string,
	attrs: Record<string, string | number> = {},
): SVGElement {
	const e = document.createElementNS(NS, tag) as SVGElement;
	for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
	return e;
}

function wireY(q: number): number {
	return TOP_MARGIN + q * WIRE_SPACING;
}

function colX(col: number): number {
	return LEFT_MARGIN + col * COL_WIDTH + COL_WIDTH / 2;
}

export function render(svgEl: SVGSVGElement, circuit: Circuit): void {
	while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
	const titleEl = el("title");
	titleEl.textContent = "Quantum circuit diagram";
	svgEl.appendChild(titleEl);

	const placed = layout(circuit);
	const cols = columnCount(placed);
	const width = LEFT_MARGIN + cols * COL_WIDTH + RIGHT_MARGIN;
	const height = TOP_MARGIN + circuit.qubits * WIRE_SPACING + BOTTOM_MARGIN;

	svgEl.setAttribute("width", String(width));
	svgEl.setAttribute("height", String(height));
	svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);

	// Qubit wire labels + lines
	for (let q = 0; q < circuit.qubits; q++) {
		const y = wireY(q);
		svgEl.appendChild(
			el("text", {
				x: LEFT_MARGIN - 8,
				y,
				"dominant-baseline": "middle",
				"text-anchor": "end",
				fill: "#7d8590",
				"font-size": 13,
				"font-family": "monospace",
			}),
		).textContent = `q${q}`;
		svgEl.appendChild(
			el("line", {
				x1: LEFT_MARGIN,
				y1: y,
				x2: width - RIGHT_MARGIN,
				y2: y,
				stroke: "#444",
				"stroke-width": 1.5,
			}),
		);
	}

	// Gates
	for (const { gate, col } of placed) {
		const cx = colX(col);
		const name = gate.name.toLowerCase();

		if (name === "cx" || name === "cnot") {
			drawCNOT(svgEl, cx, gate.qubits[0]!, gate.qubits[1]!);
		} else if (name === "cz") {
			drawCZ(svgEl, cx, gate.qubits[0]!, gate.qubits[1]!);
		} else if (name === "swap") {
			drawSWAP(svgEl, cx, gate.qubits[0]!, gate.qubits[1]!);
		} else if (name === "ccx" || name === "toffoli") {
			drawToffoli(svgEl, cx, gate.qubits[0]!, gate.qubits[1]!, gate.qubits[2]!);
		} else if (name === "barrier") {
			drawBarrier(svgEl, cx, circuit.qubits);
		} else {
			drawBox(svgEl, cx, gate.qubits[0]!, name);
		}
	}
}

function drawBox(
	svg: SVGSVGElement,
	cx: number,
	q: number,
	name: string,
): void {
	const cy = wireY(q);
	const color = GATE_COLORS[name] ?? "#2c5f8a";
	const label = GATE_LABELS[name] ?? name.toUpperCase();
	svg.appendChild(
		el("rect", {
			x: cx - BOX / 2,
			y: cy - BOX / 2,
			width: BOX,
			height: BOX,
			rx: 4,
			fill: color,
			stroke: "#888",
			"stroke-width": 1,
		}),
	);
	svg.appendChild(
		el("text", {
			x: cx,
			y: cy,
			"text-anchor": "middle",
			"dominant-baseline": "middle",
			fill: "white",
			"font-size": 14,
			"font-family": "monospace",
			"font-weight": "600",
		}),
	).textContent = label;
}

function drawCNOT(
	svg: SVGSVGElement,
	cx: number,
	ctrl: number,
	tgt: number,
): void {
	const cy = wireY(ctrl);
	const ty = wireY(tgt);
	svg.appendChild(
		el("line", {
			x1: cx,
			y1: cy,
			x2: cx,
			y2: ty,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(el("circle", { cx, cy, r: CTRL_R, fill: "white" }));
	svg.appendChild(
		el("circle", {
			cx,
			cy: ty,
			r: TARGET_R,
			fill: "none",
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(
		el("line", {
			x1: cx - TARGET_R,
			y1: ty,
			x2: cx + TARGET_R,
			y2: ty,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(
		el("line", {
			x1: cx,
			y1: ty - TARGET_R,
			x2: cx,
			y2: ty + TARGET_R,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
}

function drawCZ(svg: SVGSVGElement, cx: number, q1: number, q2: number): void {
	const y1 = wireY(q1);
	const y2 = wireY(q2);
	svg.appendChild(
		el("line", {
			x1: cx,
			y1,
			x2: cx,
			y2,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(el("circle", { cx, cy: y1, r: CTRL_R, fill: "white" }));
	svg.appendChild(el("circle", { cx, cy: y2, r: CTRL_R, fill: "white" }));
}

function drawSWAP(
	svg: SVGSVGElement,
	cx: number,
	q1: number,
	q2: number,
): void {
	const y1 = wireY(q1);
	const y2 = wireY(q2);
	const d = 9;
	svg.appendChild(
		el("line", {
			x1: cx,
			y1,
			x2: cx,
			y2,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	for (const cy of [y1, y2]) {
		svg.appendChild(
			el("line", {
				x1: cx - d,
				y1: cy - d,
				x2: cx + d,
				y2: cy + d,
				stroke: "white",
				"stroke-width": 2,
			}),
		);
		svg.appendChild(
			el("line", {
				x1: cx - d,
				y1: cy + d,
				x2: cx + d,
				y2: cy - d,
				stroke: "white",
				"stroke-width": 2,
			}),
		);
	}
}

function drawToffoli(
	svg: SVGSVGElement,
	cx: number,
	c1: number,
	c2: number,
	tgt: number,
): void {
	const ys = [wireY(c1), wireY(c2), wireY(tgt)];
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const ty = wireY(tgt);
	svg.appendChild(
		el("line", {
			x1: cx,
			y1: minY,
			x2: cx,
			y2: maxY,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(
		el("circle", { cx, cy: wireY(c1), r: CTRL_R, fill: "white" }),
	);
	svg.appendChild(
		el("circle", { cx, cy: wireY(c2), r: CTRL_R, fill: "white" }),
	);
	svg.appendChild(
		el("circle", {
			cx,
			cy: ty,
			r: TARGET_R,
			fill: "none",
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(
		el("line", {
			x1: cx - TARGET_R,
			y1: ty,
			x2: cx + TARGET_R,
			y2: ty,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
	svg.appendChild(
		el("line", {
			x1: cx,
			y1: ty - TARGET_R,
			x2: cx,
			y2: ty + TARGET_R,
			stroke: "white",
			"stroke-width": 1.5,
		}),
	);
}

function drawBarrier(svg: SVGSVGElement, cx: number, nQubits: number): void {
	const y1 = wireY(0) - WIRE_SPACING / 2;
	const y2 = wireY(nQubits - 1) + WIRE_SPACING / 2;
	svg.appendChild(
		el("line", {
			x1: cx,
			y1,
			x2: cx,
			y2,
			stroke: "#555",
			"stroke-width": 1.5,
			"stroke-dasharray": "4 3",
		}),
	);
}
