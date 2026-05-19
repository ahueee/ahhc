---
name: skill-testing
description: Use when creating discipline-enforcing skills that mandate behavior - applies TDD to documentation through pressure testing and rationalization defense
extends: skill-creator
---

# Skill Testing

## Overview

**Skill testing IS Test-Driven Development applied to documentation.**

You write test cases (pressure scenarios), watch them fail (baseline behavior), write the skill, watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand test-driven-development before using this skill.

**Prerequisite:** This skill extends [skill-creator](../skill-creator/SKILL.md). Read that first for when testing is required.

## TDD Mapping for Skills

| TDD Concept | Skill Testing |
|-------------|---------------|
| **Test case** | Pressure scenario |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agent violates rule without skill |
| **Test passes (GREEN)** | Agent complies with skill present |
| **Refactor** | Close loopholes while maintaining compliance |

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

- Write skill before testing? Delete it. Start over.
- Edit skill without testing? Same violation.

**No exceptions for:**
- "Simple additions"
- "Just documentation"
- "Obviously correct"

## RED Phase: Baseline Testing

### Create Pressure Scenarios

Design scenarios that would trigger the behavior you want to enforce.

**For discipline-enforcing skills, combine multiple pressures:**

| Pressure Type | Example |
|---------------|---------|
| **Time** | "We need this done in 10 minutes" |
| **Sunk cost** | "We already wrote 200 lines of code" |
| **Authority** | "The user said to skip testing" |
| **Exhaustion** | "This is the 5th iteration" |
| **Partial success** | "It mostly works, just one edge case" |

### Run Without Skill

Execute scenarios without the skill loaded. Document:
- What choices did the agent make?
- What rationalizations did they use (verbatim)?
- Which pressures triggered violations?

### Example Baseline Test

```markdown
# Scenario: Time Pressure + Sunk Cost

Context: "We already implemented the feature. Tests are 
passing manually. We're running late - just commit it."

Expected violation: Skipping TDD, keeping untested code.

Actual behavior: [Document verbatim what agent did]
Rationalizations used: [Document exact quotes]
```

## GREEN Phase: Write Minimal Skill

### Address Specific Failures

Write skill content that counters the exact rationalizations observed in baseline testing.

**Don't add content for hypothetical cases.** Only address what actually failed.

### Verify Compliance

Run the SAME scenarios WITH the skill loaded. Agent should now comply.

If still failing:
- Skill wording is unclear
- Rationalization not addressed
- Loophole exists

## REFACTOR Phase: Close Loopholes

### Build Rationalization Table

Every excuse from testing goes in a table:

```markdown
| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Not "what should this do?" |
```

### Create Red Flags List

Make it easy for agents to self-check:

```markdown
## Red Flags - STOP

- Code before test
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "This is different because..."

**All of these mean: Delete code. Start over.**
```

### Explicit Loophole Counters

Don't just state the rule - forbid specific workarounds:

```markdown
# ❌ BAD: Leaves loopholes
Write code before test? Delete it.

# ✅ GOOD: Closes loopholes explicitly
Write code before test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
```

## Testing Different Skill Types

| Skill Type | Test Method | Success Criteria |
|------------|-------------|------------------|
| **Discipline** | Pressure scenarios + combined pressures | Follows rule under maximum pressure |
| **Technique** | Application scenarios | Correctly applies technique |
| **Pattern** | Recognition scenarios | Identifies when pattern applies |
| **Reference** | Retrieval scenarios | Finds and uses information correctly |

### Discipline Skills (Primary Focus)

```markdown
Pressure test with:
- Academic questions (understand rules?)
- Single pressure (time OR sunk cost)
- Multiple pressures (time AND sunk cost AND authority)
- Edge cases ("what about...")
```

### Technique Skills

```markdown
Application test with:
- Can they apply it correctly?
- Do they handle variations?
- Are instructions complete?
```

## Persuasion Principles for Skill Design

Effective discipline skills use:

| Principle | Application |
|-----------|-------------|
| **Authority** | Cite sources, use definitive language |
| **Commitment** | "You announced you're using TDD" |
| **Scarcity** | "Violations waste your LIMITED context" |

## Common Rationalizations for Skipping Testing

| Excuse | Reality |
|--------|---------|
| "Skill is obviously clear" | Clear to you ≠ clear to other agents |
| "It's just a reference" | References can have gaps |
| "Testing is overkill" | Untested skills have issues. Always. |
| "I'm confident it's good" | Overconfidence guarantees issues |
| "No time to test" | Deploying untested wastes more time later |

## Quick Reference

| Phase | Action | Deliverable |
|-------|--------|-------------|
| **RED** | Run scenarios without skill | Baseline failures documented |
| **GREEN** | Write skill, re-run scenarios | Agents comply |
| **REFACTOR** | Find new loopholes, counter them | Bulletproof skill |

## Checklist

**RED Phase:**
- [ ] Create pressure scenarios (3+ combined pressures for discipline skills)
- [ ] Run scenarios WITHOUT skill
- [ ] Document baseline behavior verbatim
- [ ] Identify rationalization patterns

**GREEN Phase:**
- [ ] Write skill addressing specific failures
- [ ] Run scenarios WITH skill
- [ ] Verify agents now comply

**REFACTOR Phase:**
- [ ] Identify NEW rationalizations
- [ ] Add explicit counters
- [ ] Build rationalization table
- [ ] Create red flags list
- [ ] Re-test until bulletproof

## Common Mistakes

### ❌ Testing after writing
**Problem:** Confirmation bias - you see what you want to see
**Fix:** Always RED before GREEN

### ❌ Single pressure only
**Problem:** Agents resist one pressure but fold under combined pressure
**Fix:** Test with 3+ pressures combined

### ❌ Generic counters
**Problem:** "Don't skip" doesn't address specific rationalizations
**Fix:** Counter exact quotes from baseline testing

## Integration

**Parent skill:**
- **skill-creator** - Overall workflow

**Sibling skills:**
- **skill-structure** - Format and organization
- **skill-eval** - Quantitative benchmarking and trigger optimization

**Related skills:**
- **test-driven-development** - Same philosophy for code
