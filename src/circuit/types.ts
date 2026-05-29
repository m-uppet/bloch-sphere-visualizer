export interface Gate {
	name: string;
	qubits: number[];
	cbits: number[];
}

export interface Circuit {
	id: string;
	label: string;
	description: string;
	qubits: number;
	cbits: number;
	gates: Gate[];
}

export interface PlacedGate {
	gate: Gate;
	col: number;
}
