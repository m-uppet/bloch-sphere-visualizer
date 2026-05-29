import type { Circuit, PlacedGate } from "./types.js";

export function layout(circuit: Circuit): PlacedGate[] {
	const nextFree = new Array<number>(circuit.qubits).fill(0);
	const placed: PlacedGate[] = [];

	for (const gate of circuit.gates) {
		const col = Math.max(...gate.qubits.map((q) => nextFree[q]));
		placed.push({ gate, col });
		for (const q of gate.qubits) nextFree[q] = col + 1;
	}

	return placed;
}

export function columnCount(placed: PlacedGate[]): number {
	return placed.length === 0 ? 0 : Math.max(...placed.map((p) => p.col)) + 1;
}
