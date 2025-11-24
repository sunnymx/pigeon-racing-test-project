# 🤖 AI-Driven Development Workflow (GPT-5 & Claude)

> *A practical workflow combining LLM automation with human review for reliable software development.*

---

## 🧭 Summary

This document outlines a lightweight and iterative workflow that leverages **GPT-5 Codex** and **Claude 4.5 Sonnet** as AI collaborators in code development.
By breaking projects into small, verifiable tickets and iterating through short generation–verification loops, developers can scale productivity while maintaining control and quality.

The philosophy: Don’t over-specify in advance. Instead, let the AI participate in discovery and refinement through rapid, reversible steps.

---

## 💡 Why

Historically, “AI writing code” was unreliable. But with GPT-5 and Claude 4.5, model determinism, reasoning, and test stability have improved dramatically.
This workflow takes advantage of those advancements to create an *AI-assisted engineering rhythm* that’s both scalable and auditable.

### Key Benefits

1. **Faster Generation–Verification Cycle**
   Each ticket represents a micro-step, small enough to review and correct quickly — like doing gradient descent in software form.

2. **Built-in Rollback & Versioning**
   Every ticket is tracked and committed independently, allowing instant rollbacks or model swaps.

3. **Reduced Regression Pressure**
   Modern models are disciplined — they no longer rewrite unrelated code — so reviews focus on correctness, not cleanup.

---

## 🧱 The Process

```
Spec → Tickets → Review → Implement → Test → Commit → Update Ticket
```

### 1️⃣ Spec: Write the Goal

Write a clear description of what to achieve and what’s out of scope. Avoid overly prescriptive pseudocode — LLMs need room to reason.

---

### 2️⃣ Tickets: Break Tasks Down

Use this prompt:

```plaintext
Please break the plan down into small, easy-to-test, actionable tickets in Markdown format 
and put them in the `docs/tickets` folder.
```

Each ticket should be reviewable in **1–2 minutes** and implemented in a single commit.

#### ✅ Example Ticket

```markdown
### ticket-001-pdf-parser-core

depends_on: none

**Summary:** Implement a basic PDF parser to extract text blocks.

**Why:** This serves as the foundation for later invoice parsing modules.

**Scope:** Add a `parse_pdf()` function in `invoice_parser/core.py` that extracts text blocks.

**Out-of-Scope:** Data normalization or OCR logic.

**Acceptance Criteria:**
- `parse_pdf('sample.pdf')` returns an array of text blocks.
- Passes unit test: `tests/test_pdf_parser.py::test_basic_parse`.

**Implementation Steps:**
1. Create `invoice_parser/core.py`.
2. Implement `parse_pdf()` using `pdfminer`.
3. Write and verify test coverage.

**Test/Validation:**
- Run `pytest -k test_pdf_parser`.
- Verify the structure of the parsed output.
```

---

### 3️⃣ Review: Co-Review with AI

Before running implementation, review each ticket with the model to ensure clarity, dependency alignment, and logical correctness.

### 4️⃣ Implement: Execute Step-by-Step

Run one ticket at a time using GPT-5 High, GPT-5 Codex, or Claude 4.5 Sonnet. Keep commits minimal and scoped.

### 5️⃣ Test: Self-Verification

Prompt example:

```plaintext
How can I confirm this implementation is correct? 
List 3 verification steps or test cases.
```

### 6️⃣ Commit: Small & Frequent

Commit immediately after each successful ticket to ensure atomic, traceable changes.

### 7️⃣ Update Ticket: Record Results

Document what passed, failed, or changed. These ticket files become a living log of decisions and learnings.

---

## 🧩 Recommended Prompts

### 🟢 GPT-5 Codex

```plaintext
Act as a disciplined coding agent.
Follow the provided ticket exactly.
Do not modify unrelated code.
Include deterministic unit tests.
After completion, summarize verification results.
```

### 🟣 Claude 4.5 Sonnet

```plaintext
You are a careful, structured collaborator.
For each ticket: read the spec, confirm understanding, implement only what’s in scope,
and generate both code and validation steps.
Explain briefly how correctness was ensured.
```

---

## ⚖️ Model Comparison

| Rank | Model                 | Strengths                                                    |
| ---- | --------------------- | ------------------------------------------------------------ |
| 🥇 1 | **GPT-5 High**        | Most stable and precise; excellent for multi-file reasoning. |
| 🥈 2 | **GPT-5 Codex**       | Fast, structured, and ideal for repo-integrated workflows.   |
| 🥉 3 | **Claude 4.5 Sonnet** | Excels at contextual understanding and long-form reasoning.  |
| —    | Gemini CLI / Jules    | Functional but limited; suffers from context loss.           |

---

## 📈 Productivity Metrics

* Average: **10 tickets/day**
* Each ticket: **1–2 story points**
* Review time: **≤ 2 min per ticket**
* Commits per day: **10–15**

This yields roughly **10× developer efficiency** with verifiable, test-driven progress.

---

## 🧠 Best Practices

1. **Keep tickets atomic.** One purpose per ticket.
2. **Maintain a Traceability Log.** Map ticket ↔ commit ↔ test (`docs/traceability.csv`).
3. **Adopt Dependency Graphs.** Add `depends_on:` for safe parallel execution.
4. **Commit Gatekeeper.** Only merge after tests pass.
5. **Weekly Ticket Compression.** Summarize completed tickets into knowledge docs.

---

## 🧩 Folder Structure Example

```
docs/
  ├── specs/
  │     └── spec-001-invoice-parser.md
  ├── tickets/
  │     ├── ticket-001-parse-core.md
  │     └── ticket-002-pdf-integration.md
  └── traceability.csv
src/
tests/
README.md
```

---

## 🔧 Suggested Improvements

| Improvement                 | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| **Ticket Dependency Graph** | Represent tasks as DAGs to enable parallel execution.    |
| **Self-Verification Layer** | Let AI generate verification plans after each commit.    |
| **Traceability Matrix**     | Map each ticket to its test and commit for auditability. |
| **Commit Gatekeeper**       | Block merges unless automated tests pass.                |
| **Knowledge Compression**   | Periodically summarize old tickets to reduce clutter.    |

These improvements turn the workflow into a **semi-autonomous development agent framework**.

---

## 💬 Philosophy

> **Humans design. AI executes.**
> When humans focus on intent and validation, and AI handles execution and iteration,
> development becomes faster, safer, and more creative.

---

## 🔁 Practical Loop Example

1. Draft a high-level spec (~5 min)
2. Generate 8–10 tickets via GPT-5 Codex
3. Review tickets with AI (~2 min each)
4. Implement → Test → Commit sequentially
5. Update logs and traceability
6. Weekly summarization prompt:

   ```plaintext
   Summarize completed tickets into a concise changelog and lessons learned.
   ```

---

## 📚 License

MIT © 2025

Contributions and enhancements are welcome — especially those extending agent orchestration for Claude or Codex.
