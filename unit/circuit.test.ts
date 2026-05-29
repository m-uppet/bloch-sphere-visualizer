import { describe, expect, it } from "vitest";
import {
	applyCX,
	applyCZ,
	applySingleQubit,
	initialState,
} from "../src/circuit/multi-statevector.js";
import { parse } from "../src/circuit/parser.js";
import { runCircuit } from "../src/circuit/simulator.js";
import { GATES } from "../src/math/gates.js";

const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 10);
const prob = (sv: ReturnType<typeof initialState>, i: number) =>
	sv[i]!.re ** 2 + sv[i]!.im ** 2;

// ── Multi-qubit statevector ───────────────────────────────────────────────────

describe("initialState", () => {
	it("2 qubits starts at |00⟩", () => {
		const sv = initialState(2);
		near(prob(sv, 0), 1); // |00⟩
		near(prob(sv, 1), 0);
		near(prob(sv, 2), 0);
		near(prob(sv, 3), 0);
	});
});

describe("applySingleQubit", () => {
	it("H on q0 of |00⟩ gives equal superposition on q0", () => {
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.H, 0, 2);
		near(prob(sv, 0), 0.5); // |00⟩
		near(prob(sv, 1), 0);
		near(prob(sv, 2), 0.5); // |10⟩
		near(prob(sv, 3), 0);
	});

	it("X on q0 flips |00⟩ to |10⟩", () => {
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.X, 0, 2);
		near(prob(sv, 0), 0);
		near(prob(sv, 2), 1); // |10⟩
	});

	it("X on q1 flips |00⟩ to |01⟩", () => {
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.X, 1, 2);
		near(prob(sv, 1), 1); // |01⟩
	});
});

describe("applyCX", () => {
	it("CX on |00⟩ does nothing (control=0)", () => {
		let sv = initialState(2);
		sv = applyCX(sv, 0, 1, 2);
		near(prob(sv, 0), 1);
	});

	it("CX on |10⟩ gives |11⟩", () => {
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.X, 0, 2); // |10⟩
		sv = applyCX(sv, 0, 1, 2);
		near(prob(sv, 3), 1); // |11⟩
	});

	it("H then CX prepares Bell state", () => {
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.H, 0, 2);
		sv = applyCX(sv, 0, 1, 2);
		near(prob(sv, 0), 0.5); // |00⟩
		near(prob(sv, 1), 0);
		near(prob(sv, 2), 0);
		near(prob(sv, 3), 0.5); // |11⟩
	});
});

describe("applyCZ", () => {
	it("CZ flips phase of |11⟩ only", () => {
		// start in equal superposition of all 2-qubit states
		let sv = initialState(2);
		sv = applySingleQubit(sv, GATES.H, 0, 2);
		sv = applySingleQubit(sv, GATES.H, 1, 2);
		sv = applyCZ(sv, 0, 1, 2);
		// |00⟩ |01⟩ |10⟩ amplitudes unchanged, |11⟩ phase flipped
		near(sv[0]!.re, 0.5); // |00⟩ positive
		near(sv[1]!.re, 0.5); // |01⟩ positive
		near(sv[2]!.re, 0.5); // |10⟩ positive
		near(sv[3]!.re, -0.5); // |11⟩ negated
	});
});

// ── Parser ────────────────────────────────────────────────────────────────────

describe("parser", () => {
	it("parses Bell circuit", () => {
		const result = parse("H 0\nCX 0 1");
		expect("circuit" in result).toBe(true);
		if ("circuit" in result) {
			expect(result.circuit.n_qubits).toBe(2);
			expect(result.circuit.instructions).toHaveLength(2);
		}
	});

	it("infers qubit count from max index", () => {
		const result = parse("H 0\nCX 0 2");
		if ("circuit" in result) expect(result.circuit.n_qubits).toBe(3);
	});

	it("ignores comment lines", () => {
		const result = parse("# Bell state\nH 0\nCX 0 1");
		if ("circuit" in result)
			expect(result.circuit.instructions).toHaveLength(2);
	});

	it("returns error for unknown gate", () => {
		const result = parse("FOO 0");
		expect("error" in result).toBe(true);
	});

	it("returns error for CX with same qubit", () => {
		const result = parse("CX 0 0");
		expect("error" in result).toBe(true);
	});

	it("returns error for empty circuit", () => {
		const result = parse("# just a comment");
		expect("error" in result).toBe(true);
	});
});

// ── Simulator ─────────────────────────────────────────────────────────────────

describe("runCircuit", () => {
	it("Bell circuit produces 3 snapshots (initial + H + CX)", () => {
		const result = parse("H 0\nCX 0 1");
		if (!("circuit" in result)) throw new Error("parse failed");
		const steps = runCircuit(result.circuit);
		expect(steps).toHaveLength(3);
	});

	it("initial snapshot is |00⟩ with prob 1", () => {
		const result = parse("H 0\nCX 0 1");
		if (!("circuit" in result)) throw new Error("parse failed");
		const steps = runCircuit(result.circuit);
		const initial = steps[0]!;
		expect(initial.states[0]!.probability).toBeCloseTo(1);
		expect(initial.states[1]!.probability).toBeCloseTo(0);
	});

	it("final Bell snapshot has |00⟩ and |11⟩ at 50% each", () => {
		const result = parse("H 0\nCX 0 1");
		if (!("circuit" in result)) throw new Error("parse failed");
		const steps = runCircuit(result.circuit);
		const final = steps[steps.length - 1]!;
		expect(final.states[0]!.probability).toBeCloseTo(0.5); // |00⟩
		expect(final.states[3]!.probability).toBeCloseTo(0.5); // |11⟩
	});

	it("Grover final state has |11⟩ probability ≈ 1", () => {
		const grover =
			"H 0\nH 1\nCZ 0 1\nH 0\nH 1\nX 0\nX 1\nCZ 0 1\nX 0\nX 1\nH 0\nH 1";
		const result = parse(grover);
		if (!("circuit" in result)) throw new Error("parse failed");
		const steps = runCircuit(result.circuit);
		const final = steps[steps.length - 1]!;
		expect(final.states[3]!.probability).toBeCloseTo(1); // |11⟩
	});
});
