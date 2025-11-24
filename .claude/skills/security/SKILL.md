---
name: security
description: Security best practices and vulnerability detection for application development. Checks for authentication/authorization issues, secure communication, sensitive data storage, input validation, and common security vulnerabilities. Use when reviewing code for security, implementing authentication, handling sensitive data, or performing security audits.
allowed-tools: [Read, Grep, Glob, Bash]
---

# Security Best Practices Expert

## When to Use This Skill

Activate when the user needs help with:
- Security reviews and vulnerability scanning
- Authentication and authorization implementation
- Secure data storage and transmission
- Input validation and sanitization
- Security configuration and hardening
- Compliance with security standards

## Core Security Principles

### 1. Secure Communication
- Always use HTTPS for web traffic
- Use SSH for remote connections
- Encrypt data in transit (TLS 1.2+)
- Validate SSL/TLS certificates

### 2. Sensitive Data Protection
- **NEVER store passwords, tokens, or API keys in code**
- **NEVER commit sensitive data to version control**
- Use environment variables for secrets
- Encrypt sensitive data at rest
- Use secure key management systems (AWS KMS, HashiCorp Vault, etc.)

### 3. Principle of Least Privilege
- Grant minimum necessary permissions
- Use role-based access control (RBAC)
- Regularly audit and revoke unused access
- Implement time-limited access tokens

### 4. Input Validation
- Validate and sanitize ALL user inputs
- Use parameterized queries (prevent SQL injection)
- Escape output properly (prevent XSS)
- Whitelist input rather than blacklist
- Implement rate limiting

## Common Security Checks

### Authentication & Authorization
- ✅ Proper password hashing (bcrypt, Argon2, scrypt)
- ✅ Multi-factor authentication (MFA) support
- ✅ Session management and timeout
- ✅ Token-based auth (JWT with proper expiration)
- ✅ Authorization checks before sensitive operations

### Data Security
- ✅ Encrypt sensitive data at rest
- ✅ Secure storage of credentials
- ✅ No hardcoded secrets
- ✅ Proper key rotation policies
- ✅ Secure backup procedures

### API Security
- ✅ Authentication on all endpoints
- ✅ Rate limiting and throttling
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ API versioning

### Error Handling
- ❌ NEVER expose stack traces to users
- ❌ NEVER leak sensitive information in errors
- ✅ Log security events appropriately
- ✅ Implement proper exception handling
- ✅ Use secure error reporting

## Security Code Review Checklist

When reviewing code for security:

1. **Check for hardcoded secrets**: `grep -r "password\|api_key\|token\|secret" --include="*.py" --include="*.js"`
2. **SQL Injection**: Look for string concatenation in SQL queries
3. **XSS**: Check for unescaped user input in templates
4. **Authentication**: Verify proper password hashing, not plain text
5. **Authorization**: Ensure users can't access unauthorized resources
6. **HTTPS**: Verify SSL/TLS configuration
7. **Dependencies**: Check for known vulnerable dependencies

## Examples

### Example 1: Password Storage Review
**User**: "Review this authentication code for security"
**Response**:
```
[auth.py, Line 45] :closed_lock_with_key: CRITICAL: Password stored in plain text!
Current: user.password = password
Fix: user.password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

[auth.py, Line 78] :closed_lock_with_key: No rate limiting on login attempts
Recommendation: Implement exponential backoff or CAPTCHA after 3 failed attempts
```

### Example 2: API Key Security
**User**: "How should I store this API key?"
**Response**:
- Use environment variables (.env file)
- NEVER commit to git (add .env to .gitignore)
- Use secret management service in production
- Example: `API_KEY = os.getenv('API_KEY')`

### Example 3: SQL Injection Prevention
**User**: "Check this database query"
**Response**:
```
[db.py, Line 102] :closed_lock_with_key: SQL Injection vulnerability!
Current: cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
Fix: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```

## Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- Security Headers: https://securityheaders.com/
- SSL Labs: https://www.ssllabs.com/ssltest/

## Important Notes

- Always complete the requested task
- Address security concerns in-line if possible
- Communicate issues in code comments or PR feedback
- Balance security with usability
- Stay updated on latest security vulnerabilities
