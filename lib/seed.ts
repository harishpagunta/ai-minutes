
type L = { title: string; body: string; q: string; opts: string[]; a: number; why: string };
type C = { title: string; description: string; goals: string[]; lessons: L[] };

export const GOALS = ["Prompting", "AI agents", "Everyday tasks", "Fact-checking"] as const;

const COURSES: C[] = [
  {
    title: "Prompting that works",
    description: "Get reliably better answers from any AI chat tool in a few minutes a day.",
    goals: ["Prompting", "Everyday tasks"],
    lessons: [
      {
        title: "Context beats cleverness",
        body: "The biggest upgrade to any prompt is context. An AI model only knows what is in the conversation, so tell it who the answer is for, what you are trying to achieve, and what a good result looks like.\n\n\"Write an email\" gets a generic email. \"Write a 100-word email to a vendor who is two weeks late on an invoice. Keep it firm but polite\" gets something you can send.",
        q: "Which prompt is most likely to produce a usable first draft?",
        opts: ["Write a status update.", "Write a status update for my director about the vendor delay: 3 bullets, plain tone, ending with the decision I need from her.", "Write something good about the project.", "Status update please, make it smart."],
        a: 1, why: "It names the audience, the content, the format and the goal. The model no longer has to guess any of them.",
      },
      {
        title: "Show, don't describe",
        body: "If you want a specific style or format, paste one example of what good looks like. Models are very good at copying a pattern.\n\nTwo or three examples of the input-and-output you want is often enough. This is called few-shot prompting, and it is usually faster than writing long rules.",
        q: "You want every product description in your team's house style. What is the quickest reliable approach?",
        opts: ["Write a 2-page style guide first.", "Paste two or three existing descriptions as examples and ask for a new one in the same style.", "Ask the AI to be more creative.", "Repeat the request in capital letters."],
        a: 1, why: "Examples carry tone, length and structure all at once, which is hard to describe in words.",
      },
      {
        title: "Iterate, don't restart",
        body: "A first answer is a draft. Instead of starting over, reply with what to change: \"shorter\", \"drop the jargon\", \"keep point 2, rewrite point 3\".\n\nThe model keeps the conversation as context, so small precise follow-ups beat a brand-new prompt.",
        q: "The answer is good except the third paragraph is too technical. What should you do?",
        opts: ["Start a new chat and retype everything.", "Accept it as it is.", "Reply asking to rewrite only the third paragraph in plain language, keeping the rest.", "Ask for a longer answer."],
        a: 2, why: "Targeted feedback changes just what is wrong and preserves what already works.",
      },
    ],
  },
  {
    title: "What is an AI agent?",
    description: "Understand agents, tools and RAG without any code.",
    goals: ["AI agents"],
    lessons: [
      {
        title: "Chatbot vs agent",
        body: "A chatbot answers. An agent acts. An AI agent is a model that can decide on steps, use tools (search, a calendar, a spreadsheet) and keep going until a goal is done.\n\nThe model supplies the judgement; the tools supply the ability to affect the real world.",
        q: "Which of these is the clearest example of an agent?",
        opts: ["A model that explains what a spreadsheet is.", "A model that reads your inbox, finds invoices, and adds them to a spreadsheet using tools.", "A model that translates one sentence.", "A model that writes a poem."],
        a: 1, why: "It plans multiple steps and uses tools to take real actions toward a goal.",
      },
      {
        title: "Tools are the hands",
        body: "A tool is a function the model can ask to be run: search the web, look up a record, send a message. The model does not run it itself. The surrounding software does, and returns the result to the model.\n\nThat is why agents can be wrong in two ways: bad reasoning, or a tool returning bad data.",
        q: "An agent reports a wrong number from your CRM. What are the two places to look first?",
        opts: ["Only the user interface.", "The model's reasoning and the data the tool returned.", "The keyboard.", "Nothing, agents are always right."],
        a: 1, why: "Agents combine model judgement with tool results, so either one can introduce the error.",
      },
      {
        title: "RAG in plain words",
        body: "RAG stands for retrieval-augmented generation. Before answering, the system looks up relevant documents (your policies, your wiki) and hands them to the model along with your question.\n\nIt lets the model answer from your information instead of guessing from memory, and it can point to where the answer came from.",
        q: "What problem does RAG mainly address?",
        opts: ["Making the model type faster.", "Letting the model answer using your own up-to-date documents instead of memory alone.", "Making images sharper.", "Removing the need for any review."],
        a: 1, why: "Retrieval supplies relevant source material at question time, grounding the answer.",
      },
    ],
  },
  {
    title: "Trust but verify",
    description: "Spot hallucinations and check AI output before it reaches anyone else.",
    goals: ["Fact-checking", "Everyday tasks"],
    lessons: [
      {
        title: "Why AI sounds sure and is wrong",
        body: "Language models predict plausible text. They are not looking facts up, so they can produce a confident sentence with a made-up number, quote or source. This is called a hallucination.\n\nConfidence of tone says nothing about accuracy.",
        q: "An AI gives you a precise statistic with a named report. What should you assume?",
        opts: ["It is correct because it is precise.", "It may be invented. Check the original source before using it.", "It is correct if the tone is professional.", "It is wrong, always."],
        a: 1, why: "Precision and polish are not evidence. Verify against the real source.",
      },
      {
        title: "The 3-minute check",
        body: "Before sharing AI output: (1) find the claims that matter, the numbers, names, dates and quotes, (2) verify each against a primary source, (3) ask the AI where it got it and open that link yourself.\n\nYou do not need to check every sentence, just the ones that would hurt if wrong.",
        q: "You have limited time. What do you verify first?",
        opts: ["The grammar.", "The numbers, names, dates and quotes that the decision depends on.", "The length.", "The headings."],
        a: 1, why: "Checking the high-stakes factual claims gives the most protection for the least time.",
      },
      {
        title: "Know what not to paste",
        body: "Public AI tools may store what you type. Do not paste customer data, passwords, unreleased financials or anything your company marks confidential unless your workplace has approved the tool.\n\nWhen unsure, remove names and identifiers or ask your IT or security team.",
        q: "You want help summarising a customer complaint email. What is the safest move?",
        opts: ["Paste it with the full name and phone number.", "Remove names and identifying details first, or use an approved tool.", "Paste it into any free tool.", "Post it publicly for suggestions."],
        a: 1, why: "Anonymising or using an approved tool protects customer data.",
      },
    ],
  },
];

type Q = (sql: string, params?: any[]) => Promise<Record<string, any>[]>;

export async function seed(q: Q) {
  const n = (await q("SELECT COUNT(*)::int c FROM courses"))[0].c as number;
  if (n > 0) return;
  for (const [ci, c] of COURSES.entries()) {
    const id = (await q("INSERT INTO courses(title,description,goals,position) VALUES (?,?,?,?) RETURNING id", [c.title, c.description, JSON.stringify(c.goals), ci]))[0].id;
    for (const [li, l] of c.lessons.entries())
      await q("INSERT INTO lessons(course_id,position,title,body,question,options,answer_idx,explanation) VALUES (?,?,?,?,?,?,?,?)",
        [id, li, l.title, l.body, l.q, JSON.stringify(l.opts), l.a, l.why]);
  }
  for (const k of ["goal_matching", "lenses", "analytics", "pet"])
    await q("INSERT INTO flags(key,enabled) VALUES (?,1) ON CONFLICT DO NOTHING", [k]);
}
