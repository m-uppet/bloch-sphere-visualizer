import type { Complex } from "./complex.js";

/**
 * Evaluate a real arithmetic expression.
 * Allowed identifiers: sqrt, pi, exp, sin, cos.
 */
function evalReal(expr: string): number | null {
	const stripped = expr.replace(
		/\bsqrt\b|\bpi\b|\bexp\b|\bsin\b|\bcos\b/g,
		"",
	);
	if (/[a-zA-Z]/.test(stripped)) return null;
	try {
		const js = expr
			.replace(/\bsqrt\b/g, "Math.sqrt")
			.replace(/\bpi\b/g, "Math.PI")
			.replace(/\bexp\b/g, "Math.exp")
			.replace(/\bsin\b/g, "Math.sin")
			.replace(/\bcos\b/g, "Math.cos");
		// biome-ignore lint/security/noNewFunction: restricted to safe math identifiers
		const v = new Function(`"use strict"; return (${js})`)() as unknown;
		return typeof v === "number" && isFinite(v) ? v : null;
	} catch {
		return null;
	}
}

/** Split an expression into top-level additive terms. */
function splitAdditive(s: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let start = 0;
	for (let k = 1; k < s.length; k++) {
		if (s[k] === "(") depth++;
		else if (s[k] === ")") depth--;
		else if (!depth && (s[k] === "+" || s[k] === "-")) {
			const t = s.slice(start, k);
			if (t) out.push(t);
			start = k;
		}
	}
	const last = s.slice(start);
	if (last) out.push(last);
	return out;
}

// Standalone imaginary unit 'i': not part of an identifier like 'pi', 'sin', 'sqrt'
const LONE_I = /(?<![a-zA-Z])i(?![a-zA-Z])/;

/**
 * Parse a complex number expression.
 *
 * Supports:
 *   real:       "1/sqrt(2)", "-0.5", "pi/4"
 *   imaginary:  "i", "-i", "i/sqrt(2)", "-i*pi"
 *   mixed:      "1/sqrt(2)+i/sqrt(2)", "cos(pi/4)-i*sin(pi/4)"
 *   phase:      "exp(i*pi/4)"  →  cos(π/4) + i·sin(π/4)
 *   unicode:    "1/√2", "π/4"
 *
 * Returns null if the expression cannot be parsed.
 */
export function parseComplex(input: string): Complex | null {
	const s = input
		.trim()
		.replace(/\s+/g, "")
		.replace(/π/g, "pi")
		.replace(/√/g, "sqrt");

	if (!s) return null;

	// exp(i*angle) → cos(angle) + i·sin(angle)
	const expM = s.match(/^([+-]?)exp\(i\*(.+)\)$/);
	if (expM) {
		const sign = expM[1] === "-" ? -1 : 1;
		const angle = evalReal(expM[2]);
		if (angle === null) return null;
		return { re: sign * Math.cos(angle), im: sign * Math.sin(angle) };
	}

	const terms = splitAdditive(s);
	const realTerms: string[] = [];
	const imagTerms: string[] = [];

	for (const t of terms) {
		(LONE_I.test(t) ? imagTerms : realTerms).push(t);
	}

	const reExpr = realTerms.length ? realTerms.join("") : "0";
	// Replace standalone 'i' with '1' to extract imaginary coefficients
	const imExpr = imagTerms.length
		? imagTerms
				.map((t) => t.replace(/(?<![a-zA-Z])i(?![a-zA-Z])/g, "1"))
				.join("")
		: "0";

	const re = evalReal(reExpr);
	const im = evalReal(imExpr);
	if (re === null || im === null) return null;
	return { re, im };
}
