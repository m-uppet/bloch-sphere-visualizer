import type { StateSnapshot } from "./simulator.js";

const NS = "http://www.w3.org/2000/svg";

function phaseToColor(phase: number): string {
	const h = (((phase + Math.PI) / (2 * Math.PI)) * 360).toFixed(0);
	return `hsl(${h},80%,50%)`;
}

function svgEl(
	tag: string,
	attrs: Record<string, string | number>,
): SVGElement {
	const e = document.createElementNS(NS, tag) as SVGElement;
	for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
	return e;
}

export function renderHistogram(el: SVGSVGElement, snap: StateSnapshot): void {
	while (el.firstChild) el.removeChild(el.firstChild);

	const n = snap.states.length;
	const containerW = (el.parentElement?.clientWidth ?? 800) - 40;
	const GAP = 4;
	const BAR_W = Math.max(16, Math.floor((containerW - GAP) / n - GAP));
	const MAX_H = 160;
	const LABEL_H = 18;
	const width = n * (BAR_W + GAP) + GAP;
	const height = MAX_H + LABEL_H + 4;

	el.setAttribute("width", String(width));
	el.setAttribute("height", String(height));
	el.setAttribute("viewBox", `0 0 ${width} ${height}`);

	const title = document.createElementNS(NS, "title");
	title.textContent = `State after ${snap.gate}`;
	el.appendChild(title);

	for (let i = 0; i < n; i++) {
		const state = snap.states[i]!;
		const x = GAP + i * (BAR_W + GAP);
		const barH = Math.max(
			state.probability * MAX_H,
			state.probability > 0.001 ? 1 : 0,
		);
		const color =
			state.probability > 0.001 ? phaseToColor(state.phase) : "#1e2530";

		el.appendChild(
			svgEl("rect", {
				x,
				y: MAX_H - barH,
				width: BAR_W,
				height: barH,
				fill: color,
			}),
		);

		if (n <= 8) {
			el.appendChild(
				Object.assign(
					svgEl("text", {
						x: x + BAR_W / 2,
						y: MAX_H + LABEL_H - 2,
						"text-anchor": "middle",
						fill: "#7d8590",
						"font-size": 10,
						"font-family": "monospace",
					}),
					{ textContent: `|${state.label}⟩` },
				),
			);
		}
	}
}
