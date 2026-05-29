import { add, type Complex, c, mul } from "./complex.js";
import type { StateVector } from "./statevector.js";

export type GateRow = [Complex, Complex];
export type GateMatrix = [GateRow, GateRow];

const S2 = 1 / Math.sqrt(2);
const C4 = Math.cos(Math.PI / 4);
const S4 = Math.sin(Math.PI / 4);

export type GateName =
	| "X"
	| "Y"
	| "Z"
	| "H"
	| "S"
	| "S†"
	| "T"
	| "T†"
	| "SX"
	| "SX†"
	| "I";

export const GATES: { [K in GateName]: GateMatrix } = {
	// Pauli
	X: [
		[c(0), c(1)],
		[c(1), c(0)],
	],
	Y: [
		[c(0), c(0, -1)],
		[c(0, 1), c(0)],
	],
	Z: [
		[c(1), c(0)],
		[c(0), c(-1)],
	],
	// Hadamard
	H: [
		[c(S2), c(S2)],
		[c(S2), c(-S2)],
	],
	// Phase
	S: [
		[c(1), c(0)],
		[c(0), c(0, 1)],
	],
	"S†": [
		[c(1), c(0)],
		[c(0), c(0, -1)],
	],
	T: [
		[c(1), c(0)],
		[c(0), c(C4, S4)],
	],
	"T†": [
		[c(1), c(0)],
		[c(0), c(C4, -S4)],
	],
	// Square root of X — (1/2)[[1+i, 1-i], [1-i, 1+i]]
	SX: [
		[c(0.5, 0.5), c(0.5, -0.5)],
		[c(0.5, -0.5), c(0.5, 0.5)],
	],
	"SX†": [
		[c(0.5, -0.5), c(0.5, 0.5)],
		[c(0.5, 0.5), c(0.5, -0.5)],
	],
	// Identity
	I: [
		[c(1), c(0)],
		[c(0), c(1)],
	],
};

export function applyGate(sv: StateVector, gate: GateMatrix): StateVector {
	const [alpha, beta] = sv;
	const [[a, b], [r, s]] = gate;
	return [add(mul(a, alpha), mul(b, beta)), add(mul(r, alpha), mul(s, beta))];
}
