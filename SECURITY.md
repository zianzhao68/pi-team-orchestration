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

Before the public repository is created, report vulnerabilities privately to
the package maintainer. After replacing the repository placeholders, enable
GitHub private vulnerability reporting and update this section with the
preferred contact method.
