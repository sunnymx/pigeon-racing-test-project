# Project Cleanup Skill

**Name:** `project-cleanup`
**Type:** Project Skill (Team-shared via git)
**Version:** 1.0.0
**Created:** 2025-11-05

## Purpose

Automates post-development cleanup tasks including:
- Test script organization
- Documentation updates
- Changelog generation
- File structure maintenance

## Usage

Invoke this skill when completing work sessions or after implementing features/fixes:

```
Use project-cleanup skill to organize my work
```

Or let Claude decide when it's needed. The skill description triggers on phrases like:
- "organize tests"
- "update documentation"
- "cleanup project"
- "after completing work"

## Files

- **SKILL.md** - Main skill definition with instructions
- **cleanup_helper.sh** - Helper script for scanning project state
- **README.md** - This file

## Testing the Helper Script

Run the helper directly to see current project state:

```bash
.claude/skills/project-cleanup/cleanup_helper.sh
```

Expected output:
- List of test files in project root
- Documentation status
- Test directory structure
- Recent file changes

## Integration with Git

This skill is automatically available to the team through git:

1. Changes committed to `.claude/skills/project-cleanup/`
2. Team members pull changes
3. Skill immediately available in their Claude Code

No extra installation or setup required!

## Customization

To modify this skill for your team:

1. Edit `SKILL.md` to change behavior
2. Update helper script as needed
3. Commit changes to git
4. Team members get updates on next pull

## Examples

### After Bug Fix Session

**Invoke:** "I finished fixing the map responsive issue, please cleanup"

**Actions:**
- Moves test_map_*.py to tests/ui/
- Updates docs/README.md with bug fix
- Updates CLAUDE.md with responsive design notes
- Creates/updates changelog

### After Feature Implementation

**Invoke:** "Organize project after implementing export feature"

**Actions:**
- Moves export tests to tests/integration/
- Updates feature list in documentation
- Documents API changes
- Updates changelog

## Maintenance

**Update the skill when:**
- Project structure changes
- New documentation patterns emerge
- Team workflows evolve

**Version history in SKILL.md** - Document changes there

## Related Documentation

- [Main README](../../../docs/README.md)
- [CLAUDE.md](../../../CLAUDE.md)
- [Test Documentation](../../../tests/README.md)
- [Changelog](../../../docs/CHANGELOG_2025-11-05.md)

---

**Maintained by:** Development Team
**Questions?** See SKILL.md or ask Claude Code
