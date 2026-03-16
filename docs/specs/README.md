# Feature Specifications (Speckit)

This directory contains feature specifications for all MyCircle micro frontends, following the Speckit workflow.

## Workflow

1. **Spec first**: Before coding a new MFE, create a spec folder:
   ```bash
   pnpm new-spec my-feature-name
   ```

2. **Fill out spec.md**: Define requirements, user stories, acceptance criteria

3. **Plan**: Fill out plan.md with architecture decisions and integration points

4. **Tasks**: Break down work in tasks.md

5. **Implement**: Create feature branch and code

6. **CI Guard**: PRs adding new MFEs without specs will be blocked

## Folder Structure

```
docs/specs/
├── _templates/          # Document templates (used by new-spec script)
│   ├── spec.md          # Requirements & acceptance criteria
│   ├── plan.md          # Implementation plan
│   ├── tasks.md         # Work breakdown
│   ├── research.md      # Technical investigation
│   ├── data-model.md    # Entity definitions
│   └── _changelog.md    # Change history
├── 001-city-search/     # First feature
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   └── _changelog.md
├── 002-weather-display/
│   └── ...
└── README.md            # This file
```

## Numbering

Features are numbered sequentially (001, 002, ...). Numbers are never reused or reordered -- they create a permanent historical record of when features were designed.

## Status Values

- **Draft**: Initial writing, not ready for review
- **In Review**: Ready for feedback
- **Approved**: Ready for implementation
- **Implemented**: Code is merged to main
- **Deprecated**: Feature removed or replaced
