import type { BlochVector } from "../math/statevector.js";

export class Animator {
	private currentVec: BlochVector = { x: 0, y: 0, z: 1 };
	private outputEl: HTMLElement;

	constructor(outputEl: HTMLElement) {
		this.outputEl = outputEl;
	}

	set(v: BlochVector): void {
		this.currentVec = v;
		const f = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);
		this.outputEl.textContent = `${f(v.x)},${f(v.y)},${f(v.z)}`;
	}

	current(): BlochVector {
		return this.currentVec;
	}
}
