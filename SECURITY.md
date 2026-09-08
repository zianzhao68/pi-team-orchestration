# Security Policy

## Trust boundary

This package controls local Pi Web sessions and may cause agents to execute
commands with the current user's permissions. Review the skill and helper
source before installing it.

The helper intentionally accepts only plain HTTP loopback endpoints:

- `127.0.0.1`
- `localhost`
- `::1`

Do not reverse-proxy Pi Web to a public interface for use with this package.
Do not place credentials in task files, callback summaries, logs, or repository
history.

## Reporting a vulnerability

Please use the repository's
[private vulnerability reporting](https://github.com/zianzhao68/pi-team-orchestration/security/advisories/new).
Do not disclose credentials, exploitable details, or unpatched vulnerabilities
in a public issue.
