export default function Pet({ mood }: { mood: "idle" | "happy" }) {
  // Roams and reacts to progress. No chat, no guilt: it only celebrates a day you showed up.
  return <div className="pet" aria-hidden="true" title={mood === "happy" ? "Nice work today" : "Ready when you are"}>{mood === "happy" ? "🐱✨" : "🐱"}</div>;
}
