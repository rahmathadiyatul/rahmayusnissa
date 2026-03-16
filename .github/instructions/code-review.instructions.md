---
name: Code Review Skill
description: Production readiness code review for completed features
applyTo: "**"
---

# Code Review Skill

When the user requests a code review, follow this template to assess production readiness.

## When to Use

**Mandatory:**
- After completing major feature
- Before merge to main
- After each task in subagent-driven development

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

1. **Get git SHAs:**
   ```bash
   BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
   HEAD_SHA=$(git rev-parse HEAD)
   ```

2. **Fill in placeholders:**
   - `{WHAT_WAS_IMPLEMENTED}` - What you just built
   - `{PLAN_OR_REQUIREMENTS}` - What it should do
   - `{BASE_SHA}` - Starting commit
   - `{HEAD_SHA}` - Ending commit
   - `{DESCRIPTION}` - Brief summary

3. **Act on feedback:**
   - Fix Critical issues immediately
   - Fix Important issues before proceeding
   - Note Minor issues for later

## Frontmatter for GitLab Integration

When creating code review documents that will be posted to GitLab merge requests, always include frontmatter with GitLab tracking information:

```yaml
---
gitlab:
  branch: "feature-branch-name"
  mr_id: 123
  note_id: 456
---
```

**Frontmatter Fields:**
- `branch`: Current git branch name (use `git branch --show-current`)
- `mr_id`: GitLab merge request ID (numeric)
- `note_id`: GitLab note/comment ID for updates (numeric, optional for new comments)

**When to add frontmatter:**
- When creating code review documents for GitLab MR comments
- When updating existing GitLab comments (include `note_id`)
- For documents that will be tracked in GitLab issues/MRs

**Tools for frontmatter:**
- Use `make comment` to create new comments
- Use `make update-comment NOTE_ID='123'` to update existing comments
- Frontmatter is automatically parsed and used for GitLab API calls

## Review Template

### What Was Implemented

{DESCRIPTION}

### Requirements/Plan

{PLAN_REFERENCE}

### Git Range to Review

**Base:** {BASE_SHA}
**Head:** {HEAD_SHA}

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

### Diff Changes Summary

Provide a summary of key changes with before/after code snippets for critical modifications. Include git diff output for major architectural changes.

**Key Changes Overview:**
- [List major changes with file references]
- [Include before/after snippets for complex fixes]

### Review Checklist

**Code Quality:**
- Clean separation of concerns?
- Proper error handling?
- Type safety (if applicable)?
- DRY principle followed?
- Edge cases handled?

**Architecture:**
- Sound design decisions?
- Scalability considerations?
- Performance implications?
- Security concerns?
- Database models in correct location (`src/db/models/`, not `src/models/`)?
- Single Base instance used across all models?

**Testing:**
- Tests actually test logic (not mocks)?
- Edge cases covered?
- Integration tests where needed?
- All tests passing?

**Requirements:**
- All plan requirements met?
- Implementation matches spec?
- No scope creep?
- Breaking changes documented?

**Production Readiness:**
- Migration strategy (if schema changes)?
- Backward compatibility considered?
- Documentation complete?
- No obvious bugs?

**Refactoring Safety (mandatory when existing code is modified):**
- Existing features still work after changes? (regression check — test features NOT in scope of this PR)
- Are all async/computed results actually consumed, not silently overwritten by a later assignment?
- Variable assignments traced end-to-end through modified functions (no orphaned overwrites)?
- Dead code removed cleanly without leaving stray assignments that corrupt data flow?

### Output Format

#### Strengths
[What's well done? Be specific.]

#### Issues

##### Critical (Must Fix)
[Bugs, security issues, data loss risks, broken functionality]

##### Important (Should Fix)
[Architecture problems, missing features, poor error handling, test gaps]

##### Minor (Nice to Have)
[Code style, optimization opportunities, documentation improvements]

**For each issue:**
- **Rationale**: Why this issue matters (security, performance, maintainability, etc.)
- **Impacted Files**: List of files affected by this issue
- **References**: Links to official docs, security advisories, or ecosystem best practices
- **Expected Code Changes**: 
  - **Before**: Code snippet showing current problematic implementation
  - **After**: Code snippet showing fixed implementation
  - **Diff**: Git-style diff showing exact changes
- **Explanation of Fix**: Detailed explanation of the chosen approach, including why this approach over alternatives
- **File:line reference**: Specific location of the issue
- **What's wrong**: Brief description of the problem
- **Why it matters**: Impact on production readiness
- **How to fix**: Step-by-step implementation guidance

#### Recommendations
[Improvements for code quality, architecture, or process]

#### Assessment

**Ready to merge?** [Yes/No/With fixes]

**Reasoning:** [Technical assessment in 1-2 sentences]

### Example Output

```
### Strengths
- Clean database schema with proper migrations (db.ts:15-42)
- Comprehensive test coverage (18 tests, all edge cases)
- Good error handling with fallbacks (summarizer.ts:85-92)

### Issues

#### Important
1. **Missing help text in CLI wrapper**
   - **Rationale**: Users cannot discover advanced features without documentation, leading to poor user experience and underutilization of functionality.
   - **Impacted Files**: index-conversations.ts (lines 1-31)
   - **References**: [CLI Best Practices](https://docs.npmjs.com/cli/v9/using-npm/scripts#command-line-scripts) - Standard CLI tools provide --help flags
   - **Expected Code Changes**:
     - **Before**:
       ```typescript
       const args = process.argv.slice(2);
       // No help handling
       ```
     - **After**:
       ```typescript
       const args = process.argv.slice(2);
       if (args.includes('--help') || args.includes('-h')) {
         console.log('Usage: node index.js [options]');
         console.log('--concurrency <number>: Set concurrency level');
         process.exit(0);
       }
       ```
     - **Diff**:
       ```diff
       + if (args.includes('--help') || args.includes('-h')) {
       +   console.log('Usage: node index.js [options]');
       +   console.log('--concurrency <number>: Set concurrency level');
       +   process.exit(0);
       + }
       ```
   - **Explanation of Fix**: Added standard --help/-h flag handling. This approach follows Unix CLI conventions and is more discoverable than inline documentation. Alternative approaches like config files were considered but rejected as they add complexity for simple CLI usage.
   - **File:line reference**: index-conversations.ts:1-31
   - **What's wrong**: No --help flag, users won't discover --concurrency
   - **Why it matters**: Poor discoverability leads to feature underutilization
   - **How to fix**: Add --help case with usage examples

2. **Date validation missing**
   - **Rationale**: Invalid inputs can cause silent failures or unexpected behavior, making debugging difficult.
   - **Impacted Files**: search.ts (lines 25-27)
   - **References**: [ISO 8601 Standard](https://www.iso.org/iso-8601-date-and-time-format.html) - Standard date format specification
   - **Expected Code Changes**:
     - **Before**:
       ```typescript
       const date = new Date(input);
       // No validation
       ```
     - **After**:
       ```typescript
       const date = new Date(input);
       if (isNaN(date.getTime())) {
         throw new Error(`Invalid date format: ${input}. Expected ISO 8601 format (e.g., 2023-12-19)`);
       }
       ```
     - **Diff**:
       ```diff
       + if (isNaN(date.getTime())) {
       +   throw new Error(`Invalid date format: ${input}. Expected ISO 8601 format (e.g., 2023-12-19)`);
       + }
       ```
   - **Explanation of Fix**: Added runtime validation with descriptive error messages. Chose exception throwing over silent failure to make issues visible. Considered returning null but exceptions provide better error propagation in async contexts.
   - **File:line reference**: search.ts:25-27
   - **What's wrong**: Invalid dates silently return no results
   - **Why it matters**: Silent failures are hard to debug
   - **How to fix**: Validate ISO format, throw error with example

#### Minor
1. **Progress indicators**
   - **Rationale**: Long-running operations without feedback frustrate users and can appear as hangs.
   - **Impacted Files**: indexer.ts (line 130)
   - **References**: [CLI UX Guidelines](https://clig.dev/) - Progress indicators improve user experience
   - **Expected Code Changes**:
     - **Before**:
       ```typescript
       for (let i = 0; i < items.length; i++) {
         processItem(items[i]);
       }
       ```
     - **After**:
       ```typescript
       for (let i = 0; i < items.length; i++) {
         console.log(`Processing ${i + 1} of ${items.length}...`);
         processItem(items[i]);
       }
       ```
     - **Diff**:
       ```diff
       + console.log(`Processing ${i + 1} of ${items.length}...`);
       ```
   - **Explanation of Fix**: Added simple progress logging. Chose console.log over progress bars to avoid dependencies. Considered progress bars but kept it simple for CLI compatibility.
   - **File:line reference**: indexer.ts:130
   - **Impact**: Users don't know how long to wait
   - **How to fix**: Add "X of Y" counter

### Recommendations
- Add progress reporting for user experience
- Consider config file for excluded projects (portability)

### Assessment

**Ready to merge: With fixes**

**Reasoning:** Core implementation is solid with good architecture and tests. Important issues (help text, date validation) are easily fixed and don't affect core functionality.
```

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

---

**Reference:** [obra/superpowers Code Review Skill](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/)
