import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";

const MODEL = "claude-opus-5-5";
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;
const client = () => new Anthropic();

export const LENSES = ["analogy", "example", "deep-dive"] as const;
export type Lens = (typeof LENSES)[number];

const LENS_PROMPT: Record<Lens, string> = {
  analogy: "Re-explain the lesson as a single everyday analogy for a non-technical working professional in India.",
  example: "Re-explain the lesson through one concrete real-world workplace example (HR, marketing, operations or project management).",
  "deep-dive": "Re-explain the lesson in more depth for someone who wants the 'why' behind it, still in plain language.",
};

/** Lenses change the framing only. They must not add, remove or alter a fact. */
export async function lens(lessonTitle: string, body: string, kind: Lens): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system:
      "You rewrite short lessons for a micro-learning app. Hard rules: do not add, remove or change any fact or claim from the lesson; do not invent statistics, names or sources; max 150 words; plain text, no markdown headings.",
    messages: [{ role: "user", content: `${LENS_PROMPT[kind]}\n\nLesson title: ${lessonTitle}\n\nLesson:\n${body}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  return res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
}

export const CourseDraft = z.object({
  title: z.string(),
  description: z.string(),
  goals: z.array(z.enum(["Prompting", "AI agents", "Everyday tasks", "Fact-checking"])),
  lessons: z.array(z.object({
    title: z.string(),
    body: z.string().describe("Plain-language lesson, 60-120 words, readable in under 3 minutes"),
    question: z.string(),
    options: z.array(z.string()).length(4),
    answer_idx: z.number().int().min(0).max(3),
    explanation: z.string().describe("The correct idea in one or two sentences, shown after any answer"),
  })).min(3).max(6),
});
export type CourseDraftT = z.infer<typeof CourseDraft>;

/** Drafts are generated only from admin-supplied source text, then reviewed by a human before publishing. */
export async function draftCourse(topic: string, source: string): Promise<CourseDraftT> {
  const res = await client().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(CourseDraft) },
    system:
      "You draft micro-lessons for non-technical working professionals. Use ONLY facts stated in the SOURCE. If the source does not support a claim, leave it out. No invented statistics, quotes or links. Each lesson ends with one multiple-choice quick check with exactly one correct option.",
    messages: [{ role: "user", content: `Topic: ${topic}\n\nSOURCE:\n${source}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (!res.parsed_output) throw new Error("Model output did not match the course schema.");
  return res.parsed_output;
}
