---
name: skill-structure
description: Use when organizing skill content, creating SKILL.md files, or applying progressive disclosure patterns - defines the anatomy and format of effective skills
extends: skill-creator
---

# Skill Structure

## Overview

This skill defines HOW to structure skill content for maximum effectiveness and discoverability.

**Core principle:** Progressive disclosure - only load what's needed, when it's needed.

**Prerequisite:** This skill extends [skill-creator](../skill-creator/SKILL.md). Read that first for the overall workflow.

## Anatomy of a Skill

```
skill-name/
├── SKILL.md              (required)
│   ├── YAML frontmatter  (required: name, description)
│   └── Markdown body     (instructions)
└── Bundled Resources     (optional)
    ├── scripts/          - Executable code
    ├── references/       - Heavy documentation
    └── assets/           - Templates, icons, fonts
```

## SKILL.md Format

### Frontmatter (YAML)

Only two fields are read for discovery:

```yaml
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions and symptoms]
extends: parent-skill-name  # optional
---
```

**Name rules:**
- Letters, numbers, hyphens only
- No parentheses, special characters
- Use verb-first active voice: `creating-skills` not `skill-creation`

**Description rules:**
- Start with "Use when..."
- Focus on TRIGGERING CONDITIONS, not what the skill does
- Include symptoms, situations, contexts
- Max ~500 characters
- Third person (injected into system prompt)

```yaml
# ❌ BAD: Summarizes process (agent may skip reading skill)
description: Use for TDD - write test first, watch it fail, write minimal code

# ✅ GOOD: Triggering conditions only
description: Use when implementing any feature or bugfix, before writing code
```

### Body Structure

```markdown
# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.
"Announce at start:" statement.

## When to Use
Bullet list with symptoms and use cases.
Small flowchart IF decision is non-obvious.
When NOT to use.

## [Core Content]
The main instructions, patterns, or reference material.

## Quick Reference
Table or bullets for scanning.

## Common Mistakes
What goes wrong + fixes.

## Integration
- Called by: [other skills]
- Pairs with: [related skills]
```

## Progressive Disclosure

Skills use a three-level loading system:

| Level | When Loaded | Target Size |
|-------|-------------|-------------|
| 1. Metadata | Always in context | ~100 words |
| 2. SKILL.md body | When skill triggers | <5k words |
| 3. Bundled resources | On demand | Unlimited |

### Pattern 1: High-level with References

```markdown
# PDF Processing

## Quick Start
Basic example inline.

## Advanced Features
- **Form filling**: See [forms.md](forms.md)
- **API reference**: See [reference.md](reference.md)
```

Agent loads reference files only when needed.

### Pattern 2: Domain-Specific Organization

```
cloud-deploy/
├── SKILL.md              (workflow + selection)
└── references/
    ├── aws.md            (AWS patterns)
    ├── gcp.md            (GCP patterns)
    └── azure.md          (Azure patterns)
```

When user chooses AWS, agent only reads `aws.md`.

### Pattern 3: Conditional Details

```markdown
## Basic Usage
Simple inline content.

**For advanced scenarios:** See [advanced.md](advanced.md)
**For troubleshooting:** See [debug.md](debug.md)
```

## Resource Classification

### scripts/
Executable code for repetitive or deterministic tasks.

**When to include:**
- Same code rewritten repeatedly
- Deterministic reliability needed
- Can be executed without loading into context

**Example:** `scripts/rotate_pdf.py`

### references/
Documentation loaded into context as needed.

**When to include:**
- Heavy reference (100+ lines)
- Domain-specific details
- API documentation

**Best practice:** For files >100 lines, include table of contents.

### assets/
Files used in output, not loaded into context.

**When to include:**
- Templates (HTML, PPTX)
- Images, icons
- Boilerplate code

**Example:** `assets/template.html`

## What NOT to Include

Do NOT create:
- README.md
- INSTALLATION_GUIDE.md
- CHANGELOG.md
- User-facing documentation

Skills are for agents, not humans.

## Search Optimization

### 1. Rich Description
Include all "when to use" in description (not in body).

### 2. Keyword Coverage
Use words agents would search:
- Error messages: "ENOTEMPTY", "race condition"
- Symptoms: "flaky", "hanging", "timeout"
- Tools: Actual commands, library names

### 3. Cross-References
Use skill name only, with explicit markers:

```markdown
# ✅ GOOD
**REQUIRED:** Use skill-testing for validation.

# ❌ BAD: Force-loads file
@skills/skill-testing/SKILL.md
```

## Token Efficiency

**Targets:**
- Frequently-loaded skills: <200 words
- Other skills: <500 words

**Techniques:**
- Move details to reference files
- Use cross-references instead of repeating
- Compress examples
- Reference `--help` for tool flags

## Quick Reference

| Element | Location | Notes |
|---------|----------|-------|
| Name + description | Frontmatter | Always loaded |
| Core workflow | SKILL.md body | <500 words ideal |
| Heavy reference | references/ | Load on demand |
| Executable code | scripts/ | Run without reading |
| Output templates | assets/ | Copy, don't read |

## Common Mistakes

### ❌ Everything in SKILL.md
**Problem:** 2000+ word files bloat context
**Fix:** Move heavy content to references/

### ❌ Process in description
**Problem:** Agent follows description, skips skill body
**Fix:** Description = triggering conditions only

### ❌ Deep nesting
**Problem:** references/level1/level2/file.md hard to discover
**Fix:** Keep references one level from SKILL.md

## Integration

**Parent skill:**
- **skill-creator** - Overall workflow

**Sibling skills:**
- **skill-testing** - Validation (for discipline skills)
- **skill-eval** - Quantitative benchmarking and trigger optimization
