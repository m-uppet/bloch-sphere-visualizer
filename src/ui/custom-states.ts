import { abs2 } from "../math/complex.js";
import { parseComplex } from "../math/parse-complex.js";
import { blochFromState, type StateVector } from "../math/statevector.js";
import type { BlochScene } from "../renderer/scene.js";

const MAX = 4;
const COLORS: ReadonlyArray<{ hex: number; css: string }> = [
	{ hex: 0xff9900, css: "#ff9900" },
	{ hex: 0x00d4ff, css: "#00d4ff" },
	{ hex: 0xff4488, css: "#ff4488" },
	{ hex: 0x88ff44, css: "#88ff44" },
];

export function initCustomStates(scene: BlochScene): void {
	let nextId = 0;
	const usedColors = new Set<number>();

	const list = document.getElementById("custom-states-list")!;
	const addBtn = document.getElementById("add-state-btn") as HTMLButtonElement;

	function syncAddBtn(): void {
		addBtn.disabled = usedColors.size >= MAX;
	}

	function nextColorIdx(): number | null {
		for (let i = 0; i < MAX; i++) {
			if (!usedColors.has(i)) return i;
		}
		return null;
	}

	function addRow(): void {
		const ci = nextColorIdx();
		if (ci === null) return;

		const id = `cs${nextId++}`;
		usedColors.add(ci);
		const { hex, css } = COLORS[ci];

		scene.addArrow(id, hex);

		const row = document.createElement("div");
		row.className = "cs-row";
		row.innerHTML = `
			<div class="cs-row-header">
				<span class="cs-dot" style="background:${css}"></span>
				<span class="cs-name">State ${ci + 1}</span>
				<button class="cs-remove" type="button" title="Remove">✕</button>
			</div>
			<div class="cs-inputs">
				<span class="cs-amp-label">α</span>
				<input class="cs-amp-input" id="${id}-a" type="text" placeholder="e.g. 1/sqrt(2)" autocomplete="off" spellcheck="false">
				<span class="cs-amp-label">β</span>
				<input class="cs-amp-input" id="${id}-b" type="text" placeholder="e.g. -1/sqrt(2)" autocomplete="off" spellcheck="false">
			</div>
			<div class="cs-bloch" id="${id}-v">—</div>`;
		list.appendChild(row);

		const aIn = row.querySelector<HTMLInputElement>(`#${id}-a`)!;
		const bIn = row.querySelector<HTMLInputElement>(`#${id}-b`)!;
		const vEl = row.querySelector<HTMLElement>(`#${id}-v`)!;

		function refresh(): void {
			const aVal = aIn.value.trim();
			const bVal = bIn.value.trim();
			const alpha = aVal ? parseComplex(aVal) : null;
			const beta = bVal ? parseComplex(bVal) : null;

			aIn.classList.toggle("error", !!aVal && alpha === null);
			bIn.classList.toggle("error", !!bVal && beta === null);

			if (alpha === null || beta === null) {
				vEl.textContent = "—";
				vEl.style.color = "";
				scene.updateArrow(id, 0, 0, 0);
				return;
			}

			const norm2 = abs2(alpha) + abs2(beta);
			if (norm2 < 1e-10) {
				vEl.textContent = "zero vector";
				scene.updateArrow(id, 0, 0, 0);
				return;
			}

			const n = Math.sqrt(norm2);
			const sv: StateVector = [
				{ re: alpha.re / n, im: alpha.im / n },
				{ re: beta.re / n, im: beta.im / n },
			];
			const v = blochFromState(sv);
			const fmt = (x: number) => (Math.abs(x) < 5e-4 ? 0 : x).toFixed(3);
			vEl.textContent = `${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)}`;
			vEl.style.color = css;
			scene.updateArrow(id, v.x, v.y, v.z);
		}

		aIn.addEventListener("input", refresh);
		bIn.addEventListener("input", refresh);

		row.querySelector<HTMLButtonElement>(".cs-remove")!.addEventListener("click", () => {
			scene.removeArrow(id);
			row.remove();
			usedColors.delete(ci);
			syncAddBtn();
		});

		syncAddBtn();
	}

	addBtn.addEventListener("click", addRow);
}
