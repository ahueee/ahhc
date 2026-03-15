---
name: skill-eval
description: Use when measuring skill effectiveness - quantifies trigger accuracy (does the skill fire when it should?) and output quality (does the skill produce good results?). Use for running evals, benchmarking, comparing skill versions, or optimizing skill descriptions for better triggering.
extends: skill-creator
---

# Skill Eval

## Overview

This skill provides the **measurement and quantification layer** for skill development. It answers two questions:

1. **Trigger Rate** — Does the skill get triggered when it should (and not when it shouldn't)?
2. **Skill Quality** — When triggered, does the skill produce good results?

**Core principle:** If you can't measure it, you can't improve it.

**Announce at start:** "I'm using skill-eval to measure and benchmark this skill."

**Prerequisite:** This skill extends [skill-creator](../skill-creator/SKILL.md). Read that first for the overall workflow.

## When to Use

- After writing or revising a skill (quality eval)
- After completing a skill and ready to ship (trigger rate optimization)
- When comparing two versions of a skill (A/B benchmark)
- When the user asks "is this skill actually working?"

## Two Measurement Dimensions

```
1. SKILL QUALITY (iterate throughout development)
   └── Does the skill produce good output?
   └── Tools: subagent test runs, grader, benchmark, eval-viewer

2. TRIGGER RATE (optimize after skill is stable)
   └── Does the skill fire at the right time?
   └── Tools: eval queries, run_loop.py, description optimizer
```

**Order matters:** Quality first, trigger rate second. No point optimizing trigger rate for a skill that doesn't work.

---

## Part 1: Skill Quality Eval

### Setting Up Evals

Create 2-3 realistic test prompts — the kind of thing a real user would actually say. Save to `evals/evals.json`:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for full schema (including the `assertions` field, added after first run).

### Running Test Cases

This is one continuous sequence — don't stop partway through.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory (`eval-0/`, `eval-1/`, etc.).

#### Step 1: Spawn all runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents in the same turn — one with the skill, one without. Launch everything at once so it all finishes around the same time.

**With-skill run:**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about>
```

**Baseline run** (same prompt, but the baseline depends on context):
- **Creating a new skill**: no skill at all. Same prompt, no skill path, save to `without_skill/outputs/`.
- **Improving an existing skill**: the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case:

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

#### Step 2: While runs are in progress, draft assertions

Don't wait — draft quantitative assertions for each test case and explain them to the user. Good assertions are objectively verifiable and have descriptive names.

Subjective skills (writing style, design quality) are better evaluated qualitatively — don't force assertions onto things that need human judgment.

Update `eval_metadata.json` and `evals/evals.json` with the assertions.

#### Step 3: As runs complete, capture timing data

When each subagent completes, you receive `total_tokens` and `duration_ms`. Save immediately to `timing.json`:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

This is the only opportunity to capture this data — it's not persisted elsewhere.

#### Step 4: Grade, aggregate, and launch the viewer

Once all runs are done:

1. **Grade each run** — read `agents/grader.md` and evaluate assertions against outputs. Save to `grading.json`. The `expectations` array must use fields `text`, `passed`, and `evidence` — the viewer depends on these exact field names. For programmatic assertions, write a script rather than eyeballing it.

2. **Aggregate into benchmark**:
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   Produces `benchmark.json` and `benchmark.md`. See `references/schemas.md` for the exact schema.

3. **Analyst pass** — read benchmark data and surface patterns. See `agents/analyzer.md` ("Analyzing Benchmark Results") for what to look for: non-discriminating assertions, high-variance evals, time/token tradeoffs.

4. **Launch the viewer**:
   ```bash
   nohup python <skill-eval-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

   **Headless environments:** Use `--static <output_path>` to write standalone HTML instead of starting a server.

5. **Tell the user** to review both "Outputs" tab (qualitative) and "Benchmark" tab (quantitative).

Note: always use `generate_review.py` to create the viewer; don't write custom HTML.

#### Step 5: Read the feedback

When the user is done, read `feedback.json`:

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."}
  ],
  "status": "complete"
}
```

Empty feedback means the user thought it was fine. Kill the viewer when done:

```bash
kill $VIEWER_PID 2>/dev/null
```

### The Iteration Loop

After improving the skill:

1. Apply improvements
2. Rerun all test cases into `iteration-<N+1>/`, including baselines
3. Launch the reviewer with `--previous-workspace`
4. Wait for user review
5. Read feedback, improve again, repeat

Keep going until the user is happy, feedback is all empty, or you're not making progress.

### Advanced: Blind Comparison

For rigorous comparison between two skill versions, read `agents/comparator.md` and `agents/analyzer.md`. Give two outputs to an independent agent without telling it which is which, and let it judge quality. Then analyze why the winner won.

Optional — most users won't need it.

---

## Part 2: Trigger Rate Optimization

The description field in SKILL.md frontmatter determines whether Claude invokes a skill. After confirming skill quality, optimize trigger accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — a mix of should-trigger (8-10) and should-not-trigger (8-10):

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

**Query quality rules:**
- Must be realistic — specific, detailed, with file paths, personal context, abbreviations, typos
- Should-trigger: different phrasings of same intent, uncommon use cases, competitive edge cases
- Should-not-trigger: **near-misses** that share keywords but need something different
- Avoid obviously irrelevant negative cases — they don't test anything

**Bad:** `"Format this data"`, `"Extract text from PDF"`

**Good:** `"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage"`

### Step 2: Review with user

Present the eval set using the HTML template:

1. Read `assets/eval_review.html`
2. Replace placeholders:
   - `__EVAL_DATA_PLACEHOLDER__` → JSON array (no quotes — it's a JS variable assignment)
   - `__SKILL_NAME_PLACEHOLDER__` → skill name
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → current description
3. Write to temp file and open: `open /tmp/eval_review_<skill-name>.html`
4. User edits, toggles, then clicks "Export Eval Set"
5. File downloads to `~/Downloads/eval_set.json`

### Step 3: Run the optimization loop

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

This handles the full optimization automatically:
- Splits eval set 60% train / 40% test
- Evaluates current description (3 runs per query for reliability)
- Uses Claude with extended thinking to propose improvements
- Re-evaluates on both train and test sets
- Selects best by test score (avoids overfitting)

While it runs, periodically tail output and give the user updates.

### Step 4: Apply the result

Take `best_description` from JSON output and update the skill's SKILL.md frontmatter. Show before/after and report scores.

### How Skill Triggering Works

Skills appear in Claude's `available_skills` list with name + description. Claude decides whether to consult a skill based on that description. Important: Claude only consults skills for tasks it can't easily handle on its own. Simple queries may not trigger even with a perfect description.

Your eval queries should be substantive enough that Claude would benefit from consulting a skill.

---

## Environment Adaptations

### Claude Code
Full workflow — subagents, browser viewer, `claude -p` for trigger optimization.

### Claude.ai
- **Quality eval**: No subagents. Run test cases yourself, one at a time. Skip baselines. Present results directly in conversation.
- **Benchmarking**: Skip quantitative benchmarking. Focus on qualitative feedback.
- **Trigger optimization**: Requires `claude -p` CLI. Skip it.

### Cowork
- Subagents work. If timeouts, run tests in series instead of parallel.
- No browser: use `--static <output_path>` for viewer.
- Feedback via downloaded `feedback.json` file.
- Trigger optimization should work fine via `claude -p` subprocess.

---

## Quick Reference

| Dimension | Question | Tools | When |
|-----------|----------|-------|------|
| **Quality** | Is the output good? | agents/*, eval-viewer, benchmark | Every iteration |
| **Trigger Rate** | Does it fire correctly? | run_loop.py, eval queries | After skill is stable |

## Common Mistakes

### ❌ Optimizing trigger before quality
**Problem:** Perfect trigger rate, but skill produces bad output
**Fix:** Always quality first, trigger second

### ❌ Skipping the viewer
**Problem:** Evaluating outputs yourself without showing the human
**Fix:** ALWAYS generate the eval viewer BEFORE evaluating yourself

### ❌ Non-discriminating assertions
**Problem:** Assertions that pass with or without the skill (e.g., "output is a file")
**Fix:** Use analyst pass to find these; redesign assertions to test what the skill uniquely adds

### ❌ Obvious negative trigger queries
**Problem:** "Write fibonacci" as a negative for a PDF skill — tests nothing
**Fix:** Use near-misses that share keywords but need something different

## Integration

**Parent skill:**
- **skill-creator** — Overall workflow

**Sibling skills:**
- **skill-structure** — Format and organization
- **skill-testing** — TDD methodology and pressure testing

## Reference Files

- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — How to do blind A/B comparison
- `agents/analyzer.md` — How to analyze benchmark patterns and why one version beat another
- `references/schemas.md` — JSON structures for evals.json, grading.json, benchmark.json, etc.
