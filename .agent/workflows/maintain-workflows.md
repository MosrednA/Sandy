---
description: How to maintain and update project workflows
---

# Maintaining Project Workflows

To ensure our development processes remain efficient and accurate, all workflows in `.agent/workflows/` must be kept in sync with the current state of the codebase.

## When to Update Workflows

You **MUST** review and update workflows whenever:
- A new material, feature, or tool is added.
- Existing functionality is removed or significantly refactored.
- The project structure or build process changes (e.g., new scripts in `package.json`).
- You find an inaccuracy or outdated information while following a workflow.

## Maintenance Checklist

1. **Review Existing Workflows**: Check `.agent/workflows/` for any documents affected by your changes.
2. **Update Material Lists**: If you added/removed a material, update the "Material IDs Currently Used" and "Categories for UI" sections in `add-material.md`.
3. **Update Technical Steps**: Ensure code snippets and file paths in workflows match the current implementation.
4. **Mandatory README Sync**: Ensure the `README.md` is also updated to reflect the changes (as per the specific requirement in `add-material.md`).
5. **Verify New Processes**: If a step has changed, verify it yourself before finalizing the workflow update.

## Creating New Workflows

Create a new workflow when a complex task is repeated and lacks clear documentation (e.g., "How to add a new Shader effect" or "How to deploy the API"). Follow the standard YAML frontmatter format:

```markdown
---
description: [Short title]
---
# [Title]
...steps...
```
