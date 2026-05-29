import { GATES } from "../math/gates.js";
import {
	applyCX,
	applyCZ,
	applySingleQubit,
	initialState,
	type MultiSV,
} from "./multi-statevector.js";
import type { ParsedCircuit } from "./parser.js";

export interface BasisState {
	label: string;
	probability: number;
	phase: number;
}

export interface StateSnapshot {
	gate: string;
	states: BasisState[];
}

function snapshot(label: string, sv: MultiSV, n: number): StateSnapshot {
	return {
		gate: label,
		states: sv.map((amp, i) => ({
			label: i.toString(2).padStart(n, "0"),
			probability: amp.re ** 2 + amp.im ** 2,
			phase: Math.atan2(amp.im, amp.re),
		})),
	};
}

export function runCircuit(parsed: ParsedCircuit): StateSnapshot[] {
	const { n_qubits, instructions } = parsed;
	let sv = initialState(n_qubits);
	const steps: StateSnapshot[] = [snapshot("initial", sv, n_qubits)];

	for (const instr of instructions) {
		if (instr.type === "measure") {
			steps.push(snapshot("MEASURE", sv, n_qubits));
		} else if (instr.type === "single") {
			sv = applySingleQubit(sv, GATES[instr.gate], instr.qubit, n_qubits);
			steps.push(snapshot(`${instr.gate} ${instr.qubit}`, sv, n_qubits));
		} else if (instr.type === "cx") {
			sv = applyCX(sv, instr.control, instr.target, n_qubits);
			steps.push(snapshot(`CX ${instr.control} ${instr.target}`, sv, n_qubits));
		} else if (instr.type === "cz") {
			sv = applyCZ(sv, instr.q1, instr.q2, n_qubits);
			steps.push(snapshot(`CZ ${instr.q1} ${instr.q2}`, sv, n_qubits));
		}
	}
	return steps;
}
