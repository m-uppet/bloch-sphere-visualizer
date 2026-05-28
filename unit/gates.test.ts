import { describe, expect, it } from "vitest";
import { applyGate, GATES } from "../src/math/gates.js";
import { blochFromState, CARDINAL_STATES } from "../src/math/statevector.js";

const g = (gate: string, state: string) =>
	blochFromState(
		applyGate(CARDINAL_STATES[state]!, GATES[gate as keyof typeof GATES]!),
	);

const near = (
	a: { x: number; y: number; z: number },
	[ex, ey, ez]: [number, number, number],
) => {
	expect(a.x).toBeCloseTo(ex, 10);
	expect(a.y).toBeCloseTo(ey, 10);
	expect(a.z).toBeCloseTo(ez, 10);
};

describe("X gate (π rotation around X)", () => {
	it("|0⟩ → |1⟩", () => near(g("X", "|0⟩"), [0, 0, -1]));
	it("|1⟩ → |0⟩", () => near(g("X", "|1⟩"), [0, 0, 1]));
	it("|+⟩ unchanged", () => near(g("X", "|+⟩"), [1, 0, 0]));
	it("|-⟩ unchanged", () => near(g("X", "|-⟩"), [-1, 0, 0]));
});

describe("Y gate (π rotation around Y)", () => {
	it("|0⟩ → |1⟩ south pole", () => near(g("Y", "|0⟩"), [0, 0, -1]));
	it("|1⟩ → |0⟩ north pole", () => near(g("Y", "|1⟩"), [0, 0, 1]));
	it("|+⟩ → |-⟩", () => near(g("Y", "|+⟩"), [-1, 0, 0]));
	it("|i⟩ unchanged", () => near(g("Y", "|i⟩"), [0, 1, 0]));
});

describe("Z gate (π rotation around Z)", () => {
	it("|0⟩ unchanged", () => near(g("Z", "|0⟩"), [0, 0, 1]));
	it("|1⟩ unchanged", () => near(g("Z", "|1⟩"), [0, 0, -1]));
	it("|+⟩ → |-⟩", () => near(g("Z", "|+⟩"), [-1, 0, 0]));
	it("|-⟩ → |+⟩", () => near(g("Z", "|-⟩"), [1, 0, 0]));
	it("|i⟩ → |-i⟩", () => near(g("Z", "|i⟩"), [0, -1, 0]));
});

describe("H gate (π rotation around (X+Z)/√2)", () => {
	it("|0⟩ → |+⟩", () => near(g("H", "|0⟩"), [1, 0, 0]));
	it("|1⟩ → |-⟩", () => near(g("H", "|1⟩"), [-1, 0, 0]));
	it("|+⟩ → |0⟩", () => near(g("H", "|+⟩"), [0, 0, 1]));
	it("|-⟩ → |1⟩", () => near(g("H", "|-⟩"), [0, 0, -1]));
	it("H² = I on |0⟩", () => {
		const mid = applyGate(CARDINAL_STATES["|0⟩"]!, GATES.H!);
		near(blochFromState(applyGate(mid, GATES.H!)), [0, 0, 1]);
	});
});

describe("S gate (π/2 rotation around Z)", () => {
	it("|0⟩ unchanged", () => near(g("S", "|0⟩"), [0, 0, 1]));
	it("|+⟩ → |i⟩", () => near(g("S", "|+⟩"), [0, 1, 0]));
	it("|i⟩ → |-⟩", () => near(g("S", "|i⟩"), [-1, 0, 0]));
	it("S⁴ = I on |+⟩", () => {
		let state = CARDINAL_STATES["|+⟩"]!;
		for (let i = 0; i < 4; i++) state = applyGate(state, GATES.S!);
		near(blochFromState(state), [1, 0, 0]);
	});
});

describe("S† gate (-π/2 rotation around Z)", () => {
	it("|+⟩ → |-i⟩", () => near(g("S†", "|+⟩"), [0, -1, 0]));
	it("S then S† restores |+⟩", () => {
		const mid = applyGate(CARDINAL_STATES["|+⟩"]!, GATES.S!);
		near(blochFromState(applyGate(mid, GATES["S†"]!)), [1, 0, 0]);
	});
});

describe("T gate (π/4 rotation around Z)", () => {
	it("|0⟩ unchanged", () => near(g("T", "|0⟩"), [0, 0, 1]));
	it("|+⟩ rotates π/4 on equator", () => {
		const s = Math.SQRT2 / 2;
		near(g("T", "|+⟩"), [s, s, 0]);
	});
	it("T⁴ = Z: 4×T on |+⟩ gives |-⟩", () => {
		let state = CARDINAL_STATES["|+⟩"]!;
		for (let i = 0; i < 4; i++) state = applyGate(state, GATES.T!);
		near(blochFromState(state), [-1, 0, 0]);
	});
});

describe("T† gate (-π/4 rotation around Z)", () => {
	it("|0⟩ unchanged", () => near(g("T†", "|0⟩"), [0, 0, 1]));
	it("|i⟩ rotates -π/4 on equator", () => {
		const s = Math.SQRT2 / 2;
		near(g("T†", "|i⟩"), [s, s, 0]);
	});
	it("T then T† restores |+⟩", () => {
		const mid = applyGate(CARDINAL_STATES["|+⟩"]!, GATES.T!);
		near(blochFromState(applyGate(mid, GATES["T†"]!)), [1, 0, 0]);
	});
});

describe("SX gate (π/2 rotation around X)", () => {
	it("|0⟩ → −Y axis (0,−1,0)", () => near(g("SX", "|0⟩"), [0, -1, 0]));
	it("|1⟩ → +Y axis (0,1,0)", () => near(g("SX", "|1⟩"), [0, 1, 0]));
	it("SX² = X: two SX on |0⟩ gives |1⟩", () => {
		const mid = applyGate(CARDINAL_STATES["|0⟩"]!, GATES.SX!);
		near(blochFromState(applyGate(mid, GATES.SX!)), [0, 0, -1]);
	});
});

describe("SX† gate (−π/2 rotation around X)", () => {
	it("|0⟩ → +Y axis (0,1,0)", () => near(g("SX†", "|0⟩"), [0, 1, 0]));
	it("SX then SX† restores |0⟩", () => {
		const mid = applyGate(CARDINAL_STATES["|0⟩"]!, GATES.SX!);
		near(blochFromState(applyGate(mid, GATES["SX†"]!)), [0, 0, 1]);
	});
});

describe("I gate (identity)", () => {
	it("|0⟩ unchanged", () => near(g("I", "|0⟩"), [0, 0, 1]));
	it("|+⟩ unchanged", () => near(g("I", "|+⟩"), [1, 0, 0]));
	it("|i⟩ unchanged", () => near(g("I", "|i⟩"), [0, 1, 0]));
});
