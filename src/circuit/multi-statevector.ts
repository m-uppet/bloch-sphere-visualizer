import { add, type Complex, mul } from "../math/complex.js";
import type { GateMatrix } from "../math/gates.js";

export type MultiSV = Complex[];

export function initialState(n: number): MultiSV {
	const sv: MultiSV = Array.from({ length: 2 ** n }, () => ({
		re: 0,
		im: 0,
	}));
	sv[0] = { re: 1, im: 0 };
	return sv;
}

export function applySingleQubit(
	sv: MultiSV,
	gate: GateMatrix,
	qubit: number,
	n: number,
): MultiSV {
	const out = [...sv];
	const bit = n - 1 - qubit;

	for (let i = 0; i < 2 ** n; i++) {
		if ((i >> bit) & 1) continue;
		const j = i | (1 << bit);
		const a0 = sv[i] as Complex;
		const a1 = sv[j] as Complex;
		out[i] = add(mul(gate[0][0], a0), mul(gate[0][1], a1));
		out[j] = add(mul(gate[1][0], a0), mul(gate[1][1], a1));
	}
	return out;
}

export function applyCZ(
	sv: MultiSV,
	q1: number,
	q2: number,
	n: number,
): MultiSV {
	const out = [...sv];
	const b1 = n - 1 - q1;
	const b2 = n - 1 - q2;
	for (let i = 0; i < 2 ** n; i++) {
		if ((i >> b1) & 1 && (i >> b2) & 1) {
			const a = sv[i] as Complex;
			out[i] = { re: -a.re, im: -a.im };
		}
	}
	return out;
}

export function applyCX(
	sv: MultiSV,
	control: number,
	target: number,
	n: number,
): MultiSV {
	const out = [...sv];
	const cBit = n - 1 - control;
	const tBit = n - 1 - target;

	for (let i = 0; i < 2 ** n; i++) {
		if (!((i >> cBit) & 1)) continue;
		if ((i >> tBit) & 1) continue;
		const j = i | (1 << tBit);
		[out[i], out[j]] = [sv[j] as Complex, sv[i] as Complex];
	}
	return out;
}
