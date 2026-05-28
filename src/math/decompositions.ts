export interface HardwareStep {
	gate: string;
	virtual: boolean;
	angle_rad?: number;
}

export interface GateDecomposition {
	bloch_rotations: unknown[];
	hardware: {
		ibm: HardwareStep[] | null;
		alice_bob: HardwareStep[] | null;
	};
}

export interface BackendInfo {
	name: string;
	native_gates: string[];
	virtual_gates: string[];
}

export interface DecompositionFile {
	backends: Record<string, BackendInfo>;
	gates: Record<string, GateDecomposition>;
}

export type BackendId = "ibm" | "alice_bob";
