# Security Policy

## Supported Versions

MyCircle follows a rolling release model. Only the latest version deployed to production is supported with security updates.

| Version | Supported |
| ------- | --------- |
| Latest (main branch) | Yes |
| Previous releases | No |

## Reporting a Vulnerability

If you discover a security vulnerability in MyCircle, please report it responsibly:

1. **Do NOT open a public GitHub issue** for security vulnerabilities.
2. Email the maintainer at **youpeng.huang@outlook.com** with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You can expect an initial response within **48 hours**.
4. We will work with you to understand and address the issue before any public disclosure.

## Scope

The following are in scope for security reports:

- Authentication and authorization flaws
- Data exposure or leakage (Firestore rules, API keys)
- Cross-site scripting (XSS) or injection vulnerabilities
- Insecure API endpoints (Cloud Functions)
- Firebase security rule bypasses

## Out of Scope

- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report upstream instead)
- Issues requiring physical access to a user's device

## Acknowledgments

We appreciate responsible disclosure and will credit reporters (with permission) in our release notes.
