import { abs2, type Complex, c, conj, mul } from "./complex.js";

export type StateVector = [Complex, Complex];

export interface BlochVector {
	x: number;
	y: number;
	z: number;
}

export function blochFromState(sv: StateVector): BlochVector {
	const [alpha, beta] = sv;
	const product = mul(conj(alpha), beta);
	return {
		x: 2 * product.re,
		y: 2 * product.im,
		z: abs2(alpha) - abs2(beta),
	};
}

const S2 = 1 / Math.sqrt(2);

export const CARDINAL_STATES: Record<string, StateVector> = {
	"|0⟩": [c(1), c(0)],
	"|1⟩": [c(0), c(1)],
	"|+⟩": [c(S2), c(S2)],
	"|-⟩": [c(S2), c(-S2)],
	"|i⟩": [c(S2), c(0, S2)],
	"|-i⟩": [c(S2), c(0, -S2)],
};
