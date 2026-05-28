export interface Complex {
	re: number;
	im: number;
}

export function c(re: number, im = 0): Complex {
	return { re, im };
}

export function add(a: Complex, b: Complex): Complex {
	return { re: a.re + b.re, im: a.im + b.im };
}

export function mul(a: Complex, b: Complex): Complex {
	return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function conj(a: Complex): Complex {
	return { re: a.re, im: -a.im };
}

export function abs2(a: Complex): number {
	return a.re * a.re + a.im * a.im;
}
