---
applyTo: "docs/**/*.md"
---

# Documentation Instructions

When creating or modifying documentation files in the `docs/` directory, follow these guidelines to maintain consistency and quality.

## File Naming Conventions ⚠️ MANDATORY

**CRITICAL:** All documentation files MUST follow these naming conventions. Non-compliant files will be rejected.

### Pattern Rules

**For Agent-Specific Documentation:**
```
{agent-name}.{category}.{specific-topic}.md
```
- ✅ `coding-agent.implementation.status.md`
- ✅ `coding-agent.overview.md`
- ✅ `brainstorming-agent.rfc.initialize.md`
- ❌ `coding-agent.md` (too generic, missing category)
- ❌ `status.md` (missing agent and category)
- ❌ `Coding-Agent.md` (uppercase not allowed)

**For General/Cross-Cutting Documentation:**
```
{category}.{specific-topic}.md
```
- ✅ `refactoring.agent-isolation-changelog.md`
- ✅ `documentation.naming-conventions-fix.md`
- ✅ `agent.architecture-and-development-guide.md`
- ❌ `REFACTORING-CHANGELOG-2025-12-17.md` (uppercase, date in filename)
- ❌ `README.md` (exception only for root-level)

### Strict Rules

1. **ALWAYS lowercase** - No uppercase letters allowed (except root README.md)
2. **NO dates in filename** - Use descriptive names, dates go in content
3. **MUST have category** - Every file needs a category level
4. **Use hyphens** - For multi-word topics: `tool-refactor-plan` not `tool_refactor_plan`
5. **Use dots** - For hierarchy: `agent.category.topic.md`

### Standard Categories

Use these established categories (add new ones sparingly):

| Category | Purpose | Examples |
|----------|---------|----------|
| `overview` | Main index/entry point | `coding-agent.overview.md` |
| `rfc` | Request for Comments, design proposals | `coding-agent.rfc.tool-system.md` |
| `implementation` | Implementation guides, status, summaries | `coding-agent.implementation.plan.md` |
| `architecture` | Architecture designs and validations | `coding-agent.architecture.production-validation.md` |
| `analysis` | Analysis documents and investigations | `coding-agent.analysis.middleware-best-practices.md` |
| `references` | External references and comparisons | `coding-agent.references.aider.flow-and-agentic.md` |
| `testing` | Testing strategies and results | `coding-agent.testing-github-toolkit.md` |
| `validation` | Validation checklists and assessments | `coding-agent.validation.checklist.md` |
| `deployment` | Deployment guides and checklists | `coding-agent.deployment.checklist.md` |
| `documentation` | Meta-documentation about docs | `coding-agent.documentation.graph.md` |
| `prd` | Product Requirements Documents | `coding-agent.prd.simplify-studio.complete.md` |
| `issues` | Issue tracking and resolution | `coding-agent.issues.closed.checkpoint-404.md` |
| `refactoring` | Refactoring changelogs and plans | `refactoring.agent-isolation-changelog.md` |

### Naming Patterns

**General Documentation:**
Use dot notation for cross-cutting or general documentation:
- `agent.architecture-and-development-guide.md`
- `api.streaming-implementation.md`
- `implementation.deployment-checklist.md`

**Agent-Specific Documentation:**
Use hybrid notation (dash + dot) for agent-specific content:
- `{agent}-{topic}.{subtopic}.{description}.md`
- Examples: `coding-agent.implementation.tool-refactor-plan.md`, `brainstorming-agent.analysis.requirements.md`
- Use when documenting features, implementations, or analysis specific to a particular agent

**Code Review Documentation:**
Use prefix notation for production readiness code reviews:
- `code-review.{branch-or-feature-name}.md`
- Examples: `code-review.feat-git-reset-tool.md`, `code-review.enhance-read-file.md`
- Use for documenting code review assessments following the code-review.instructions.md template
- Always include GitLab frontmatter when applicable for MR integration

## Front Matter Requirements

Include front matter at the top of every documentation file:

```yaml
---
title: Descriptive Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
version: X.Y.Z
status: Draft | In Review | Production Ready
changelog:
  - version: X.Y.Z
    date: YYYY-MM-DD
    changes: "Brief description of changes"
audience: Who this document is for
reference:
  - Link to related documentation
---

# Document Title
```

### Special Front Matter for Code Reviews

When creating code review documents that will be posted to GitLab merge requests, always include GitLab tracking information:

```yaml
---
gitlab:
  branch: "feature-branch-name"
  mr_id: 123
  note_id: 456
---
```

**GitLab Frontmatter Fields:**
- `branch`: Current git branch name (use `git branch --show-current`)
- `mr_id`: GitLab merge request ID (numeric)
- `note_id`: GitLab note/comment ID for updates (numeric, optional for new comments)

**When to add GitLab frontmatter:**
- When creating code review documents for GitLab MR comments
- When updating existing GitLab comments (include `note_id`)
- For documents that will be tracked in GitLab issues/MRs

## Content Structure

### For Technical Guides
1. **Summary** - Brief overview of what the document covers
2. **Problem Statement** - What problem this solves
3. **Solutions** - Detailed implementation guidance
4. **Examples** - Code samples, screenshots, or practical examples
5. **Best Practices** - Do's and don'ts
6. **Troubleshooting** - Common issues and solutions

### For Reference Documentation
1. **Overview** - What this component/feature does
2. **API Reference** - Functions, classes, parameters
3. **Configuration** - Setup and configuration options
4. **Examples** - Usage examples
5. **Migration Guide** - If applicable

## Writing Style

- Use clear, concise language
- Include code examples with syntax highlighting
- Use relative links to other documentation files
- Keep lines under 100 characters for readability
- Use headers consistently (H1 for title, H2 for sections, etc.)

## Real-World Examples

### Recent Convention Fixes (December 2025)

**Case Study: Naming Convention Cleanup**

Fixed 6 non-compliant files:

| Old (❌ Wrong) | New (✅ Correct) | Issue Fixed |
|---------------|-----------------|-------------|
| `coding-agent.md` | `coding-agent.overview.md` | Added category |
| `coding-agent.status.md` | `coding-agent.implementation.status.md` | Added category |
| `coding-agent.summary.md` | `coding-agent.implementation.summary.md` | Added category |
| `REFACTORING-CHANGELOG-2025-12-17.md` | `refactoring.agent-isolation-changelog.md` | Removed uppercase + date |
| `DOCUMENTATION-UPDATE-2025-12-17.md` | `documentation.refactoring-update-summary.md` | Removed uppercase + date |
| `DOCUMENTATION-CONVENTIONS-FIX-2025-12-17.md` | `documentation.naming-conventions-fix.md` | Removed uppercase + date |

**Result:** 100% compliance, 22+ cross-references updated

**See:** `documentation.naming-conventions-fix.md` for full details

### Code Review Files (March 2026)

**Case Study: Code Review Documentation Pattern**

Established pattern for production readiness code reviews:

| Pattern | Example | Purpose |
|---------|---------|---------|
| `code-review.{branch-name}.md` | `code-review.feat-git-reset-tool.md` | Git reset tool implementation review |
| `code-review.{branch-name}.md` | `code-review.enhance-read-file.md` | Read file tool enhancement review |

**Key Characteristics:**
- Always use `code-review.` prefix for categorization
- Follow branch/feature naming conventions
- Include GitLab frontmatter for MR integration when applicable
- Follow code-review.instructions.md template structure

**Result:** Consistent code review documentation across all feature branches

## Quality Checklist

Before committing documentation:

### Naming Conventions ⚠️ CRITICAL
- [ ] **Filename is all lowercase** (no uppercase letters)
- [ ] **Has proper category** (e.g., implementation, rfc, architecture)
- [ ] **No dates in filename** (dates go in front matter)
- [ ] **Uses hyphens for multi-word** (not underscores)
- [ ] **Uses dots for hierarchy** (`agent.category.topic.md`)
- [ ] **Follows pattern:** `{agent}.{category}.{topic}.md` OR `{category}.{topic}.md`
- [ ] **For code reviews:** Use `code-review.{branch-or-feature-name}.md` pattern

### Content Quality
- [ ] Front matter is complete and accurate
- [ ] Content is technically accurate
- [ ] Links are working and use relative paths
- [ ] Code examples are tested and functional
- [ ] Document has been reviewed by subject matter expert
- [ ] Changelog updated with meaningful descriptions

### Cross-References
- [ ] Updated main overview index if major document
- [ ] Updated documentation.graph.md if adding relationships
- [ ] Updated related documents that reference this file
- [ ] Verified all incoming links still work

## When to Create Documentation

Create new documentation when:
- Implementing new features or major changes
- Adding new components or APIs
- Resolving complex issues that may recur
- Onboarding new team members
- Documenting architectural decisions

## Naming Convention Enforcement

### Before Creating/Renaming Files

**ALWAYS check compliance:**

```bash
# Check if filename follows convention
echo "your-filename.md" | grep -E '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+\.md$'
# If no output = non-compliant

# Examples of checks:
# ✅ coding-agent.implementation.status.md
# ✅ refactoring.agent-isolation-changelog.md  
# ❌ CHANGELOG-2025-12-17.md (uppercase + date)
# ❌ coding-agent.md (missing category)
```

### Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct | Reason |
|---------|-----------|---------|
| `CHANGELOG-2025-12-17.md` | `refactoring.agent-isolation-changelog.md` | No uppercase, no dates |
| `coding-agent.md` | `coding-agent.overview.md` | Must have category |
| `status.md` | `coding-agent.implementation.status.md` | Too generic |
| `Coding_Agent_Status.md` | `coding-agent.implementation.status.md` | No uppercase, use hyphens |
| `tool-refactor.md` | `coding-agent.implementation.tool-refactor-plan.md` | Missing agent + category |
| `tools.read-file.code-review.md` | `code-review.enhance-read-file.md` | Code reviews use `code-review.` prefix |
| `api.auth.code-review.md` | `code-review.auth-enhancement.md` | Code reviews are not API-specific |

### When Renaming Files

1. Use `git mv` to preserve history
2. Update ALL references in other documentation files
3. Update `coding-agent.documentation.graph.md` if indexed there
4. Update `{agent}.overview.md` if it's a major document
5. Create a changelog entry documenting the rename

### Reference Update Checklist

When renaming a file, search and update references:

```bash
# Find all references to old filename
grep -r "old-filename.md" docs/

# Common places to check:
# - {agent}.overview.md (main index)
# - {agent}.documentation.graph.md (navigation)
# - Related implementation/RFC documents
# - README files
```

## Tools and Validation

### Automated Checks

```bash
# Check all docs for naming compliance
find docs/ -name "*.md" -type f | while read file; do
  basename "$file" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+\.md$' || echo "❌ Non-compliant: $file"
done

# Find files with uppercase letters
find docs/ -name "*.md" -type f | grep '[A-Z]'

# Find files with dates in filename
find docs/ -name "*.md" -type f | grep -E '[0-9]{4}-[0-9]{2}-[0-9]{2}'
```

### Manual Validation

- Check naming compliance using regex pattern above
- Validate all relative links work
- Verify category is from standard list
- Review with subject matter experts before publishing
- Run automated checks before committing

## Integration with Development Workflow

- Documentation should be part of the development process
- Update documentation alongside code changes
- Use documentation in code reviews
- Keep documentation in sync with implementation

## GitLab Integration for Code Reviews

For code review documents with GitLab frontmatter:

**Tools for frontmatter:**
- Use `make comment` to create new comments
- Use `make update-comment NOTE_ID='123'` to update existing comments
- Frontmatter is automatically parsed and used for GitLab API calls

**Workflow:**
1. Create code review document with GitLab frontmatter
2. Run `make comment DOC=docs/code-review.{branch}.md` to post to GitLab MR
3. For updates, include `note_id` in frontmatter and use `make update-comment`