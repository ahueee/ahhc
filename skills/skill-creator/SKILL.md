---
name: skill-creator
description: Use when creating new skills or improving existing skills - provides the master workflow for building effective, reusable agent knowledge
---

# Skill Creator

## Overview

Skills transform experience into reusable knowledge. A good skill enables future agents to replicate your success without repeating your mistakes.

**Core principle:** Skills are tested documentation, not just written documentation.

**Announce at start:** "I'm using the skill-creator skill to build a new skill."

## When Testing is Required

**MANDATORY testing (use skill-testing):**
- Discipline-enforcing skills (TDD, verification protocols, mandatory workflows)
- Skills with "MUST", "NEVER", "REQUIRED" language
- Skills that could be rationalized away under pressure

**Optional testing:**
- Reference skills (API docs, syntax guides)
- Pattern documentation (mental models, design patterns)
- Tool documentation (command references)

```
Is this skill trying to enforce discipline or change behavior?
├─ yes → Testing is MANDATORY (skill-testing)
└─ no  → Testing is optional, structure is key (skill-structure)
```

## Three-Phase Process

### Phase 1: Structure → skill-structure

Answers: "What should a skill contain?"

- YAML frontmatter format
- Directory organization
- Progressive disclosure patterns
- Resource classification (scripts, references, assets)

**Use skill-structure when:** Creating the skeleton, organizing content, ensuring proper format.

### Phase 2: Validation → skill-testing

Answers: "Does this skill actually work?"

- TDD for Documentation (RED → GREEN → REFACTOR)
- Pressure testing with subagents
- Closing rationalization loopholes
- Bulletproofing against shortcuts

**Use skill-testing when:** Skill enforces discipline or mandates behavior.

### Phase 3: Measurement → skill-eval

Answers: "How well does this skill perform?"

- Quantitative quality benchmarking (pass_rate, time, tokens)
- Trigger rate optimization (description accuracy)
- Blind A/B comparison between versions
- Visual review with eval-viewer

**Use skill-eval when:** Measuring skill effectiveness, optimizing trigger accuracy, or comparing versions.

## Workflow

```
1. CONCEIVE
   └── What problem does this skill solve?
   └── Who will use it? (future agents)
   └── Is it discipline-enforcing or reference?

2. STRUCTURE (skill-structure)
   └── Create directory and SKILL.md skeleton
   └── Apply progressive disclosure
   └── Organize resources

3. TEST (skill-testing) - if discipline-enforcing
   └── RED: Run pressure scenarios without skill
   └── Document baseline failures and rationalizations

4. WRITE
   └── Fill SKILL.md addressing specific failures
   └── Use skill-structure patterns

5. VERIFY (skill-testing) - if discipline-enforcing
   └── GREEN: Run same scenarios with skill
   └── Confirm compliance

6. HARDEN (skill-testing) - if discipline-enforcing
   └── REFACTOR: Find new loopholes
   └── Add explicit counters
   └── Re-test until bulletproof

7. MEASURE (skill-eval)
   └── Quality: Run evals, benchmark, review outputs
   └── Trigger: Optimize description for trigger accuracy
```

## Skill Types Quick Reference

| Type | Example | Testing Required? |
|------|---------|-------------------|
| **Discipline** | TDD, verification-before-completion | ✅ MANDATORY |
| **Technique** | condition-based-waiting, root-cause-tracing | ⚠️ Recommended |
| **Pattern** | flatten-with-flags, defensive-programming | ❌ Optional |
| **Reference** | API docs, command syntax | ❌ Optional |

## Quick Start

### Creating a Discipline Skill

```bash
# 1. Create structure
mkdir skills/my-discipline-skill
# 2. Read skill-structure for format
# 3. Read skill-testing for TDD process
# 4. Follow RED → GREEN → REFACTOR
```

### Creating a Reference Skill

```bash
# 1. Create structure
mkdir skills/my-reference-skill
# 2. Read skill-structure for format
# 3. Write content following progressive disclosure
# 4. No testing required
```

## Common Mistakes

### ❌ Writing without testing (for discipline skills)

**Problem:** Skill sounds good but agents rationalize around it
**Fix:** Use skill-testing to find and plug loopholes

### ❌ Over-engineering reference skills

**Problem:** Testing overhead for simple documentation
**Fix:** Only test discipline-enforcing skills

### ❌ Skipping structure

**Problem:** Inconsistent format, hard to discover
**Fix:** Always use skill-structure for proper organization

## Integration

**Sub-skills (read these for details):**
- **skill-structure** - Format, organization, progressive disclosure
- **skill-testing** - TDD validation, pressure testing, bulletproofing
- **skill-eval** - Quantitative benchmarking, trigger rate optimization, eval viewer

**Pairs with:**
- **test-driven-development** - Same RED → GREEN → REFACTOR philosophy
- **verification-before-completion** - Verify skills work before deployment
