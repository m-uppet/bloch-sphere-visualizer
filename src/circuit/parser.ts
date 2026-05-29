import type { GateName } from "../math/gates.js";

export type Instruction =
	| { type: "single"; gate: GateName; qubit: number }
	| { type: "cx"; control: number; target: number }
	| { type: "cz"; q1: number; q2: number }
	| { type: "measure" };

export interface ParsedCircuit {
	n_qubits: number;
	instructions: Instruction[];
}

export interface ParseError {
	message: string;
}

const GATE_MAP: Record<string, GateName> = {
	H: "H",
	X: "X",
	Y: "Y",
	Z: "Z",
	S: "S",
	"S†": "S†",
	SDG: "S†",
	T: "T",
	"T†": "T†",
	TDG: "T†",
	SX: "SX",
	"SX†": "SX†",
	SXDG: "SX†",
	I: "I",
};

export function parse(
	text: string,
): { circuit: ParsedCircuit } | { error: ParseError } {
	const lines = text.split("\n");
	const instructions: Instruction[] = [];
	let maxQubit = -1;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		if (!raw) continue;
		const line = raw.trim();
		if (!line || line.startsWith("#")) continue;

		const parts = line.split(/\s+/);
		const name = (parts[0] ?? "").toUpperCase();

		if (name === "MEASURE") {
			instructions.push({ type: "measure" });
			continue;
		}

		if (name === "CZ") {
			if (parts.length < 3)
				return {
					error: { message: `Line ${i + 1}: CZ requires two qubit indices` },
				};
			const q1 = Number(parts[1]);
			const q2 = Number(parts[2]);
			if (!Number.isInteger(q1) || !Number.isInteger(q2) || q1 < 0 || q2 < 0)
				return { error: { message: `Line ${i + 1}: invalid qubit index` } };
			if (q1 === q2)
				return { error: { message: `Line ${i + 1}: CZ qubits must differ` } };
			maxQubit = Math.max(maxQubit, q1, q2);
			instructions.push({ type: "cz", q1, q2 });
			continue;
		}

		if (name === "CX") {
			if (parts.length < 3)
				return {
					error: { message: `Line ${i + 1}: CX requires two qubit indices` },
				};
			const ctrl = Number(parts[1]);
			const tgt = Number(parts[2]);
			if (
				!Number.isInteger(ctrl) ||
				!Number.isInteger(tgt) ||
				ctrl < 0 ||
				tgt < 0
			)
				return { error: { message: `Line ${i + 1}: invalid qubit index` } };
			if (ctrl === tgt)
				return {
					error: {
						message: `Line ${i + 1}: CX control and target must differ`,
					},
				};
			maxQubit = Math.max(maxQubit, ctrl, tgt);
			instructions.push({ type: "cx", control: ctrl, target: tgt });
			continue;
		}

		const gateName = GATE_MAP[name];
		if (!gateName)
			return {
				error: { message: `Line ${i + 1}: unknown gate "${parts[0]}"` },
			};
		if (parts.length < 2)
			return {
				error: {
					message: `Line ${i + 1}: gate ${name} requires a qubit index`,
				},
			};
		const qubit = Number(parts[1]);
		if (!Number.isInteger(qubit) || qubit < 0)
			return { error: { message: `Line ${i + 1}: invalid qubit index` } };
		maxQubit = Math.max(maxQubit, qubit);
		instructions.push({ type: "single", gate: gateName, qubit });
	}

	if (instructions.filter((i) => i.type !== "measure").length === 0)
		return { error: { message: "Circuit has no instructions" } };

	return { circuit: { n_qubits: maxQubit + 1, instructions } };
}
