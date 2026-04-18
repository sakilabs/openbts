const OPERATOR_DOT: Record<string, string> = {
  "T-Mobile": "🔴",
  Orange: "🟠",
  Play: "🟣",
  Plus: "🟢",
};

export function operatorDot(name: string): string {
  for (const [key, dot] of Object.entries(OPERATOR_DOT)) if (name.includes(key)) return `${dot} `;
  return "";
}
