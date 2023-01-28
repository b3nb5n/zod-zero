import { z } from 'zod';

export const zero = <T>(schema: z.ZodType<T>): T => {
	if (schema instanceof z.ZodString) return '' as T;
	if (schema instanceof z.ZodNumber) {
		let min = 0;
		const divisors: Array<number> = [];

		for (const check of schema._def.checks) {
			if (check.kind === 'min') {
				const inclusive = check.inclusive ? 0 : 1;
				min = Math.max(check.value + inclusive, min);
			} else if (check.kind === 'multipleOf') {
				divisors.push(check.value);
			}
		}

		if (divisors.length) {
			const gcd = (a: number, b: number): number => (a ? gcd(b % a, a) : b);
			const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
			if (!min) return divisors.reduce(lcm) as T;
			// TODO LCM with minimum
		}

		return min as T;
	}

	if (schema instanceof z.ZodBigInt) return BigInt(0) as T;
	if (schema instanceof z.ZodBoolean) return false as T;
	if (schema instanceof z.ZodDate) return new Date(Math.max(Date.now(), schema.minDate?.getTime() ?? 0)) as T;
	if (schema instanceof z.ZodSymbol) return Symbol() as T;
	if (schema instanceof z.ZodUndefined) return undefined as T;
	if (schema instanceof z.ZodNull) return null as T;
	if (schema instanceof z.ZodAny) return undefined as T;
	if (schema instanceof z.ZodUnknown) return undefined as T;
	if (schema instanceof z.ZodNever) return undefined as T;
	if (schema instanceof z.ZodVoid) return undefined as T;

	if (schema instanceof z.ZodArray) {
		const length = schema._def.exactLength?.value ?? schema._def.minLength?.value ?? 0;
		return new Array(length).fill(zero(schema.element)) as T;
	}

	if (schema instanceof z.ZodObject) {
		return Object.fromEntries(Object.entries(schema.shape).map(([key, schema]) => [key, zero(schema as any)])) as T;
	}

	if (schema instanceof z.ZodUnion) return zero(schema._def.options[0]);
	if (schema instanceof z.ZodDiscriminatedUnion) return zero(schema._def.options[0]);
	// if (schema instanceof z.ZodIntersection) return null; // TODO
	if (schema instanceof z.ZodTuple) return schema.items.map((item: z.ZodTypeAny) => zero(item));
	if (schema instanceof z.ZodRecord) return {} as T;
	if (schema instanceof z.ZodMap) return new Map() as T;
	if (schema instanceof z.ZodSet) return new Set() as T;
	if (schema instanceof z.ZodFunction) return (() => {}) as T;
	if (schema instanceof z.ZodLazy) return zero(schema.schema);
	if (schema instanceof z.ZodLiteral) return schema.value;
	if (schema instanceof z.ZodEnum) return schema.Values[0];
	if (schema instanceof z.ZodNativeEnum) return schema._def.values[0];
	if (schema instanceof z.ZodPromise) return Promise.resolve(() => zero(schema._def.type)) as T;
	if (schema instanceof z.ZodNullable) return null as T;

	return undefined as T;
};

enum Test {
	A,
	B,
	C = 'hello',
}

console.log(
	zero(
		z.object({
			a: z.string(),
			b: z.number().min(2),
			c: z.array(z.string()).min(3),
			d: z.literal('hello'),
			e: z.nativeEnum(Test),
		})
	)
);
