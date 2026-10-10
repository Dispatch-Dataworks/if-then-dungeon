/** Predicate AST. Precedence: NOT > AND > OR, left-to-right within a tier. No parentheses in v0.1. */
export type Predicate =
  | { kind: "sensor"; id: string }
  | { kind: "not"; operand: Predicate }
  | { kind: "and"; left: Predicate; right: Predicate }
  | { kind: "or"; left: Predicate; right: Predicate };

export type Token =
  | { kind: "sensor"; id: string }
  | { kind: "op"; op: "NOT" | "AND" | "OR" };

/** Parse a flat token list into a predicate AST. Throws on an invalid sequence. */
export function parsePredicate(tokens: readonly Token[]): Predicate {
  let pos = 0;
  const peek = () => tokens[pos];

  function parseOr(): Predicate {
    let left = parseAnd();
    while (peek()?.kind === "op" && (peek() as { op: string }).op === "OR") {
      pos++;
      left = { kind: "or", left, right: parseAnd() };
    }
    return left;
  }
  function parseAnd(): Predicate {
    let left = parseNot();
    while (peek()?.kind === "op" && (peek() as { op: string }).op === "AND") {
      pos++;
      left = { kind: "and", left, right: parseNot() };
    }
    return left;
  }
  function parseNot(): Predicate {
    const t = peek();
    if (t?.kind === "op" && t.op === "NOT") {
      pos++;
      return { kind: "not", operand: parseNot() };
    }
    if (t?.kind === "sensor") {
      pos++;
      return { kind: "sensor", id: t.id };
    }
    throw new Error(`Unexpected token at position ${pos}`);
  }

  const result = parseOr();
  if (pos !== tokens.length) throw new Error(`Unexpected token at position ${pos}`);
  return result;
}
