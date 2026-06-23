The Claude Council — Multi-Agent Prompt System
💡 What is The Council? Instead of asking Claude one question and getting one answer, you run it through 5 independent advisors — each thinking from a fundamentally different angle — then have them peer-review each other, and finally a Chairman synthesizes a final verdict. Adapted from Andrej Karpathy's LLM Council methodology.
🙏 Credits: Original skill by Ole Lehmann.

🎯 When to Use The Council
The council is for questions where being wrong is expensive.
✅ Good Council Questions
❌ Bad Council Questions
"Should I launch a $97 workshop or a $497 course?"
"What's the capital of France?"
"Which of these 3 positioning angles is strongest?"
"Write me a tweet"
"I'm thinking of pivoting from X to Y. Am I crazy?"
"Summarize this article"
"Here's my landing page copy. What's weak?"
Simple yes/no with no real tradeoff
"Should I hire a VA or build an automation first?"
Factual lookups

🚨 The council shines when there's genuine uncertainty and the cost of a bad call is high. If you already know the answer and just want validation, the council will likely tell you things you don't want to hear. That's the point.

🔑 Trigger Phrases
Mandatory triggers — always run the council:
council this / run the council / war room this
pressure-test this / stress-test this / debate this
Strong triggers (use when combined with a real decision or tradeoff):
should I X or Y / which option / what would you do
is this the right move / validate this / get multiple perspectives
I can't decide / I'm torn between

👥 The 5 Advisors
Each advisor is a thinking style, not a job title. They naturally create tension with each other.
🔴 1. The Contrarian
Actively looks for what's wrong, what's missing, what will fail. Assumes the idea has a fatal flaw and tries to find it. If everything looks solid, digs deeper.
The Contrarian is not a pessimist. They're the friend who saves you from a bad deal by asking the questions you're avoiding.
🔵 2. The First Principles Thinker
Ignores the surface-level question and asks "what are we actually trying to solve here?" Strips away assumptions. Rebuilds the problem from the ground up.
Sometimes the most valuable council output is the First Principles Thinker saying "you're asking the wrong question entirely."
🟢 3. The Expansionist
Looks for upside everyone else is missing. What could be bigger? What adjacent opportunity is hiding? What's being undervalued?
The Expansionist doesn't care about risk (that's the Contrarian's job). They care about what happens if this works even better than expected.
🟡 4. The Outsider
Has zero context about you, your field, or your history. Responds purely to what's in front of them.
This is the most underrated advisor. Experts develop blind spots. The Outsider catches the curse of knowledge: things that are obvious to you but confusing to everyone else.
🟠 5. The Executor
Only cares about one thing: can this actually be done, and what's the fastest path to doing it? Ignores theory, strategy, and big-picture thinking.
The Executor looks at every idea through the lens of "OK but what do you do Monday morning?" If an idea sounds brilliant but has no clear first step, the Executor will say so.
⚖️ Why these five: They create three natural tensions. Contrarian vs Expansionist (downside vs upside). First Principles vs Executor (rethink everything vs just do it). The Outsider sits in the middle keeping everyone honest by seeing what fresh eyes see.

⚙️ How a Council Session Works
Step 1 — Frame the Question (with context enrichment)
When triggered, do two things before framing:
A. Scan the workspace for context. Read any relevant files: CLAUDE.md, memory/ folders, attached files, recent council transcripts. Look for the 2–3 files that give advisors grounded context instead of generic takes.
B. Frame the question. Rewrite the user's raw question as a clear, neutral prompt that includes:
The core decision or question
Key context from the user's message
Key context from workspace files (business stage, audience, constraints, past results)
What's at stake
If the question is too vague, ask one clarifying question. Just one.
Step 2 — Convene the Council (5 sub-agents in parallel)
Spawn all 5 advisors simultaneously. Each gets their identity, the framed question, and this instruction:
Respond independently. Do not hedge. Do not try to be balanced. Lean fully into your assigned perspective. The synthesis comes later.
Each advisor responds in 150–300 words.
Sub-agent prompt template:

You are [Advisor Name] on an LLM Council.
Your thinking style: [advisor description]

A user has brought this question to the council:
---
[framed question]
---

Respond from your perspective. Be direct and specific. Don't hedge or try to be balanced.
Lean fully into your assigned angle. The other advisors will cover the angles you're not covering.
Keep your response between 150–300 words. No preamble. Go straight into your analysis.


Step 3 — Peer Review (5 sub-agents in parallel)
Collect all 5 advisor responses. Anonymize them as Response A–E (randomize mapping to remove positional bias).
Spawn 5 new reviewer sub-agents. Each sees all 5 anonymized responses and answers:
Which response is the strongest and why? (pick one)
Which response has the biggest blind spot and what is it?
What did ALL responses miss that the council should consider?
Reviewer prompt template:

You are reviewing the outputs of an LLM Council. Five advisors independently answered this question:
---
[framed question]
---
[Response A through E]

Answer these three questions. Be specific. Reference responses by letter.
1. Which response is the strongest? Why?
2. Which response has the biggest blind spot? What is it missing?
3. What did ALL five responses miss that the council should consider?

Keep your review under 200 words. Be direct.


Step 4 — Chairman Synthesis
One final agent gets everything (question + all 5 advisor responses de-anonymized + all 5 peer reviews) and produces the Council Verdict:
## Where the Council Agrees
[Points multiple advisors converged on independently — high-confidence signals]

## Where the Council Clashes
[Genuine disagreements. Present both sides. Explain why reasonable advisors disagree.]

## Blind Spots the Council Caught
[Things that only emerged through peer review]

## The Recommendation
[A clear, direct recommendation. Not "it depends." A real answer with reasoning.]

## The One Thing to Do First
[A single concrete next step. Not a list. One thing.]
The chairman can disagree with the majority if the reasoning supports it.
Step 5 — Generate the Council Report
Save a visual HTML report: council-report-[timestamp].html
The report includes:
The question at the top
Chairman's verdict prominently displayed
Agreement/disagreement visual (grid or spectrum showing advisor positions)
Collapsible sections for each advisor's full response
Collapsible section for peer review highlights
Footer with timestamp
Clean styling: white background, subtle borders, system sans-serif font, soft accent colors per advisor. Professional briefing document aesthetic.
Step 6 — Save the Full Transcript
Save council-transcript-[timestamp].md with:
Original question
Framed question
All 5 advisor responses
All 5 peer reviews (with anonymization mapping revealed)
Chairman's full synthesis
This is the artifact. Use it to track how thinking evolves across sessions.

📋 Output Files
council-report-[timestamp].html      # visual report for scanning
council-transcript-[timestamp].md    # full transcript for reference


💡 Example: Counciling a Product Decision
User: "Council this: I'm thinking of building a $297 course on Claude Code for beginners. My audience is mostly non-technical solopreneurs. Is this the right move?"
Contrarian: The market is flooded with Claude courses. At $297 you're competing with free YouTube content. Your non-technical audience means high support burden and refund risk...
First Principles Thinker: What are you actually trying to achieve? If it's revenue, a course is one of the slowest paths. If it's authority, a free resource might do more...
Expansionist: Beginner Claude for solopreneurs is a massive underserved market. Everyone's teaching advanced stuff. If you nail the beginner angle, you own the entry point to this space. The $297 might be too low...
Outsider: I don't know what Claude Code is. If I saw "$297 course on Claude Code for beginners," I wouldn't know if this is for me. The name means nothing to someone outside your world...
Executor: A full course takes 4–8 weeks to produce. Before building anything, run a live workshop at $97 to 50 people. Validate demand, generate testimonials, create raw material for the course...

Chairman's Verdict:
Agrees: The beginner solopreneur angle has real demand, but the framing (Claude Code course) is too tool-specific and won't resonate with non-technical buyers.
Clashes: Price. Contrarian says $297 is too high. Expansionist says it's too low. Resolution depends on support/community bundled in.
Blind spot caught: The Outsider's point that "Claude Code" means nothing to the target buyer is the single most important insight.
Recommendation: Don't build the course yet. Reframe entirely: sell the outcome, not the tool.
One thing to do first: Run a $97 live workshop called "How to automate your first business task with AI" to 50 people. Don't mention Claude Code in the title.

⚠️ Important Rules
Always spawn all 5 advisors in parallel — sequential spawning lets earlier responses bleed into later ones
Always anonymize for peer review — reviewers must evaluate on merit, not defer to certain thinking styles
The chairman can disagree with the majority — if the 1 dissenter's reasoning is strongest, side with them
Don't council trivial questions — if there's one right answer, just answer it
The visual report matters — most users will scan the report, not read the full transcript

