/**
 * Merge class names. Supports strings, undefined, false, and conditional object.
 */
export function cn(
  ...inputs: (string | undefined | false | Record<string, boolean>)[]
): string {
  const classes: string[] = [];
  for (const x of inputs) {
    if (typeof x === 'string' && x) classes.push(x);
    else if (typeof x === 'object' && x !== null)
      for (const [k, v] of Object.entries(x)) if (v) classes.push(k);
  }
  return classes.join(' ');
}
