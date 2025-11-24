---
name: npm
description: NPM (Node Package Manager) package management and JavaScript/Node.js project operations. Use when installing packages, managing dependencies, running scripts, or working with Node.js projects.
---

# NPM Expert

## When to Use This Skill

Activate when working with:
- NPM package installation
- Node.js dependency management
- Package.json scripts
- JavaScript/TypeScript projects

## Important Note

When using npm in non-interactive environments, you cannot use interactive shells. Use the `yes` command to auto-confirm prompts:

```bash
# Auto-confirm npm prompts
yes | npm install package-name

# Or use --yes flag
npm install --yes package-name
```

## Common NPM Commands

### Package Management
```bash
# Install dependencies
npm install                   # Install all from package.json
npm install package-name      # Install specific package
npm install -D package-name   # Install as dev dependency
npm install -g package-name   # Install globally

# Update packages
npm update
npm update package-name

# Remove packages
npm uninstall package-name
npm uninstall -g package-name
```

### Scripts
```bash
npm run build
npm run test
npm run dev
npm start
```

### Package Info
```bash
npm list                      # List installed packages
npm outdated                  # Check for updates
npm audit                     # Security audit
npm audit fix                 # Auto-fix vulnerabilities
```

## Best Practices

- Use `package-lock.json` for consistent installs
- Run `npm audit` regularly for security
- Use semantic versioning
- Document scripts in package.json

## Resources

- NPM Docs: https://docs.npmjs.com/
