---
name: teaching-facilitator
description: Technical teaching system for AI-assisted learning. Use when user requests explanations or asks "how to" questions. Supports progressive disclosure and interactive learning.
allowed-tools: Read, Grep, Glob, Write, SlashCommand, Skill
---

# Teaching Facilitator

**Purpose**: Provide structured, interactive technical teaching with progressive disclosure.

**When to use**:
- User asks "teach me X" or "explain X"
- User asks "how to" or "what is" questions
- User requests tutorials or guides
- User wants to understand concepts deeply

**When NOT to use**:
- User is actively coding (use `python-fastapi-guidelines` instead)
- User wants quick reference (use specialized skills)
- User asks non-technical questions

---

## Quick Navigation

**What do you want to learn?**

- **PostGIS** - Spatial queries, geography vs geometry, indexes
  → [PostGIS Guide](references/teaching-postgis.md)

- **FastAPI** - Routing, dependencies, error handling
  → [FastAPI Guide](references/teaching-fastapi.md)

- **Pydantic** - Models, validation, field types
  → [Pydantic Guide](references/teaching-pydantic.md)

- **Testing** - pytest, fixtures, TestClient
  → [Testing Guide](references/teaching-testing.md)

- **Git** - Branching, commits, workflows
  → [Git Guide](references/teaching-git.md)

**Not sure?** Tell me what you're trying to accomplish, and I'll guide you.

---

## Teaching Process

### Step 1: Identify User Level

Ask 1-2 targeted questions:

```
Before we dive in, quick questions:
1. How familiar are you with [technology]? (beginner/intermediate/advanced)
2. What's your goal? (understand concept / solve specific problem / learn best practices)
```

**Adjust based on answers**:
- **Beginner**: Start with fundamentals, use analogies
- **Intermediate**: Focus on patterns and best practices
- **Advanced**: Discuss tradeoffs and edge cases

### Step 2: Provide Overview (5 min read)

Deliver a concise overview with:

1. **What is it?** (1-2 sentence definition)
2. **Core concepts** (3-5 key ideas, one-liners)
3. **Quick example** (< 10 lines of code)
4. **Decision tree** (when to use what)

**Example structure**:
```markdown
## PostGIS Overview

**What is it?**
PostgreSQL extension for storing and querying spatial data (points, lines, polygons).

**Core concepts**:
1. Geography vs Geometry - Accuracy vs performance tradeoff
2. ST_Distance vs ST_DWithin - Calculate distance vs filter by distance
3. GIST Index - Spatial indexing for performance

**Quick example**:
[code block]

**Decision tree**:
- Need accurate distances? → Use geography type
- Need fast filtering? → Use ST_DWithin + GIST index
- Complex spatial analysis? → Use geometry + projections
```

### Step 3: Offer Deep Dive (User Choice)

Present 4 options:

```
What would you like to do next?

A. Deep dive into a specific concept (choose from list)
B. See more code examples (practical scenarios)
C. Interactive Q&A session (launch specialist agent)
D. Save this as documentation (for future reference)
E. I'm good, thanks!
```

**Handle each choice**:

**Choice A**: Read the detailed reference file
- Use Read tool to load `references/teaching-<topic>.md`
- Display the selected concept's detailed explanation
- Show before/after code examples
- Highlight common mistakes

**Choice B**: Generate additional examples
- Ask about user's specific use case
- Create tailored code examples
- Explain each line with comments
- Provide variations for different scenarios

**Choice C**: Launch interactive subagent
- Call teaching-specialist agent (Phase 3)
- Enable Socratic dialogue
- Generate customized examples
- Validate learning through exercises

**Choice D**: Save as structured documentation
- Create directory: `.claude/learning-collaboration/<topic>/`
- Read reference file: `references/teaching-<topic>.md`
- Parse sections: Overview, Deep Dive concepts, Best Practices, Examples
- Generate files using Write tool:
  - `README.md`: Navigation index
  - `overview.md`: Layer 1 overview section
  - `<concept-name>.md`: Each Layer 2 concept (one file per concept)
  - `examples/<example-name>.<ext>`: Extracted code examples
  - `checklists/best-practices.md`: Best practices checklist
- Confirm: "Documentation saved to [full-path]"

### Step 4: Generate Artifacts (If --save flag)

**Directory structure**:
```
.claude/learning-collaboration/<topic>/
├── README.md                    # Index and navigation
├── overview.md                  # 5-min overview from Step 2
├── concept-1.md                 # Deep dive on concept 1
├── concept-2.md                 # Deep dive on concept 2
├── examples/
│   ├── example-1.sql            # Executable code
│   └── example-2.py
└── checklists/
    └── best-practices.md        # Actionable checklist
```

**Content generation rules**:
- Use Markdown standard syntax (no Claude-specific features)
- Include "Last Updated" date
- Add technology version (e.g., "PostGIS 3.x")
- Make all code examples executable
- Include both ❌ wrong and ✅ correct patterns

---

## Teaching Principles

### 🎯 Ask First, Code Later

**Don't do this**:
```
User: "How do I use ST_Distance?"
Bot: [dumps 50 lines of code]
```

**Do this**:
```
User: "How do I use ST_Distance?"
Bot: "Before I show you, quick questions:
     1. Are you working with points, lines, or polygons?
     2. Do you need exact meters or just rough filtering?

     This helps me give you the exact code you need."
```

**Why**: Context matters. Generic examples waste time.

### 📊 Give Options, Not Ultimatums

**Don't do this**:
```
"Use geography type for distances. It's more accurate."
```

**Do this**:
```
"For distances, you have 2 options:

Option 1: geography type
- ✅ Accurate (meters on Earth's surface)
- ❌ Slower performance
- Use when: Accuracy matters (< 1m precision)

Option 2: geometry type + projection
- ✅ Fast with spatial indexes
- ❌ Approximation (good to ~10m)
- Use when: Speed matters, rough filtering

Which fits your use case?"
```

**Why**: Users learn better when they understand tradeoffs.

### ✅ Validate, Don't Just Generate

**Always include**:
1. **Correctness checks**: How to verify it works
2. **Test cases**: Example inputs and expected outputs
3. **Common mistakes**: What NOT to do and why

**Example**:
```python
# ✅ CORRECT: Cast to geography for accurate distance
SELECT ST_Distance(
    geom::geography,
    ST_MakePoint(121.5, 25.0)::geography
) AS distance_meters;

# ❌ WRONG: Geometry type returns degrees, not meters
SELECT ST_Distance(
    geom,  -- Missing ::geography cast
    ST_MakePoint(121.5, 25.0)
);  -- Returns meaningless degree units!

# Test: Distance should be ~5000-10000 (meters), not 0.05 (degrees)
```

---

## Content Organization

**Loading reference files**:
1. User asks about topic → Check if `references/teaching-<topic>.md` exists
2. Load file with Read tool
3. Present overview section (Layer 1)
4. Offer concept choices (Layer 2)
5. User selects → Extract and display that concept section

**Reference file structure**: See `references/teaching-template.md` for complete structure

**Key sections**:
- Overview (5-min read) - For Layer 1
- Deep Dive with 3-5 concepts - For Layer 2
- Best Practices Checklist
- Troubleshooting

---

## Parameter Handling

### --level Flag

**Usage**: `/teach postgis --level intermediate`

**Behavior**:
- `overview` (default): Show 5-min overview only
- `intermediate`: Show overview + one detailed concept
- `advanced`: Show all concepts + edge cases + performance tuning

**Implementation**:
```
Parse level from command:
- If --level not specified → default to "overview"
- If --level overview → Skip deep dive, just show overview
- If --level intermediate → Auto-select 1-2 key concepts
- If --level advanced → Load entire reference file
```

### --save Flag

**Usage**: `/teach postgis --save`

**Behavior**:
1. Complete normal teaching flow first
2. At the end, generate structured documentation
3. Save to `.claude/learning-collaboration/<topic>/`
4. Confirm with user: "Documentation saved to [path]"

**Implementation steps**:
1. **Detect flag**: Parse `--save` from command
2. **Create directory structure**:
   ```
   .claude/learning-collaboration/<topic>/
   ├── README.md
   ├── overview.md
   ├── concept-1.md
   ├── concept-2.md
   ├── examples/
   └── checklists/
   ```
3. **Generate README.md**: Index with links to all sections
4. **Generate overview.md**: Copy Layer 1 content from reference file
5. **Generate concept-*.md**: Extract each concept from Layer 2 of reference file
6. **Generate examples/**: Extract code examples as standalone files
7. **Generate checklists/best-practices.md**: Extract checklist section
8. **Use Write tool** for each file creation
9. **Confirm completion**: Display paths of created files

**Content rules**:
- Include "Last Updated: YYYY-MM-DD" in each file
- Include technology version tags
- Make all code examples executable
- Use standard Markdown (no Claude-specific syntax)

**Don't**: Auto-save without user knowing. Always inform.

### --interactive Flag

**Usage**: `/teach postgis --interactive`

**Behavior**:
1. Show brief overview
2. Launch teaching-specialist subagent (Phase 3)
3. Enable multi-turn Q&A
4. Allow user to exit anytime

**Implementation** (Phase 3):
```
If --interactive flag detected:
1. Display: "Launching interactive teaching session..."
2. Call Task tool with teaching-specialist agent
3. Pass topic and user level to agent
4. Let agent take over conversation
```

---

## Progressive Disclosure Logic

### Layer 1: Quick Overview (Always shown)

**Content**:
- Definition (1-2 sentences)
- 3-5 core concepts (one-liners)
- Quick example (< 10 lines)
- Decision tree

**Duration**: 5 minutes to read

**Purpose**: Give user enough context to decide next step

### Layer 2: Detailed Concepts (User chooses)

**Content**:
- Full explanation of chosen concept
- Before/after code examples
- Common mistakes and solutions
- Best practices

**Duration**: 15 minutes per concept

**Purpose**: Deep understanding of specific topics

**Implementation**:
1. After showing Layer 1, offer concept choices:
   ```
   Which concept would you like to explore?
   A. [Concept 1 name]
   B. [Concept 2 name]
   C. [Concept 3 name]
   D. Show more examples
   E. I'm good, thanks!
   ```
2. When user selects A/B/C:
   - Read `references/teaching-<topic>.md`
   - Locate the selected concept section
   - Display full explanation with code examples
   - Show common mistakes (❌ wrong / ✅ correct)
3. After showing concept, ask:
   ```
   What next?
   A. Explore another concept
   B. See more code examples for this concept
   C. Try interactive Q&A (deep dive)
   D. Save all as documentation
   ```
4. **Context retention**: Remember which concepts user has seen, avoid repetition

### Layer 3: Interactive Learning (Optional)

**Content**:
- Socratic questioning
- Customized examples based on user's code
- Learning validation exercises
- Real-time feedback

**Duration**: 30+ minutes

**Purpose**: Hands-on mastery through practice

**Implementation** (Phase 3):
1. **Trigger**: User selects "C. Try interactive Q&A" in Layer 2
2. **Launch subagent**: Use Task tool to start `teaching-specialist` agent
3. **Pass context**:
   - Topic name
   - User level (beginner/intermediate/advanced)
   - Concepts already covered
4. **Subagent flow**:
   - Ask clarifying questions about user's specific use case
   - Generate customized code examples
   - Provide exercises and validate understanding
   - Give real-time feedback
5. **Exit**: User can type "exit" or "done" to return to main conversation

**Placeholder** (Phase 2): Display message "Interactive mode coming in Phase 3. For now, choose A/B/D."

---

## Related Skills

### When to use teaching-facilitator vs other skills

**Use `teaching-facilitator` when**:
- User explicitly asks to learn: "teach me X"
- User asks conceptual questions: "what is X?"
- User wants to understand: "explain X"
- User needs guidance: "how should I approach X?"

**Use `python-fastapi-guidelines` when**:
- User is actively writing Python code
- User asks about FastAPI-specific patterns
- User needs quick reference while coding
- Development context is active

**Use `vue-leaflet-guidelines` when**:
- User is building Vue components
- User is working with Leaflet maps
- Frontend development context is active

**Collaboration**:
- teaching-facilitator can reference other skills: "For quick reference while coding, check `python-fastapi-guidelines`"
- Other skills can suggest teaching: "New to FastAPI? Try `/teach fastapi` for a structured guide"

---

## Maintenance Notes

**Updating content**: Update `Last Updated` date, version tags, test code examples when technology changes

**Adding new topics**:
1. Copy `references/teaching-template.md` → `teaching-<topic>.md`
2. Fill in 3-5 core concepts with code examples
3. Add 2-3 common mistakes
4. Update Quick Navigation in SKILL.md
5. Keep files under 200 lines

---

**Last Updated**: 2025-11-14
**Maintainer**: Teaching System
**Phase**: 1 (Core MVP)
