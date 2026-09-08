---
name: pi-team-orchestration
description: Orchestrate multiple Pi Web child sessions from one manager using loopback HTTP APIs, isolated task scopes, file-based handoffs, review gates, and low-frequency ERROR/COMPLETED callbacks. Use when a project needs parallel Pi agents, persistent specialist sessions, cross-session coordination, or non-blocking delegation with central approval.
compatibility: Requires a local Pi Web instance and Node.js 22 or newer.
license: MIT
---

# Pi Team Orchestration

Use a hub-and-spoke topology: the current manager session is the only authority
that assigns work, routes handoffs, requests reviews, accepts results, and reports
to the user.

## Mandatory rules

1. Use the local Pi Web HTTP API. Do not drive interactive TUI input, launch
   `pi -p` for normal delegation, or edit session JSONL files.
2. Bind only to loopback. Never expose Pi Web or this workflow to the public
   network, read credentials, or disable trust/safety checks.
3. Child sessions must not create or dispatch other sessions.
4. Child-to-child free-form messaging is disabled by default. Route dependencies
   through manager-approved artifacts and explicit manager prompts.
5. Give every task a unique task ID, one owning session, explicit write scopes,
   acceptance gates, and a finite stopping point.
6. Do not send a second task to a busy session. A timeout is not evidence that
   submission failed; inspect the original session before retrying.
7. HTTP/RPC `success` means accepted, not completed. Completion requires the
   child handoff plus manager verification.
8. Only wake the manager for `ERROR` or `COMPLETED`. Do not callback for normal
   progress, tool calls, heartbeats, checkpoints, or successful launches.
9. A child callback is fire-and-forget. It must not wait for an acknowledgement
   or start a callback loop.
10. Do not automatically create an independent review session after every
    completion. Use proportional review: manager reproduction plus user review
    is sufficient for small diagnostics, data checks, reports, and visual
    artifacts. Default to an independent reviewer for substantial code changes,
    cross-module integration, production safety/authorization paths, or when
    the user explicitly requests one.

Read [references/protocol.md](references/protocol.md) before creating a team or
delegating a multi-session task.

## Discover the local runtime

Resolve this skill directory first, then use its helper:

```bash
node scripts/pi-team.mjs models
node scripts/pi-team.mjs running
```

The default endpoint is `http://127.0.0.1:30141`. Override it only with a
loopback URL through `PI_WEB_URL`.

## Create or reuse a child

Prefer persistent role sessions over creating a new session per prompt:

```bash
node scripts/pi-team.mjs create \
  --cwd "D:/absolute/project" \
  --provider openai-codex \
  --model gpt-5.6-sol \
  --thinking medium
```

Save the returned `sessionId` in the manager-owned task registry. Before reuse:

```bash
node scripts/pi-team.mjs status --session SESSION_ID
```

## Dispatch without blocking

Write the full task contract to a project file or use a message file. The
manager prompt must tell the child that it is the executor, prohibit
sub-delegation, define write scopes and gates, and require it to stop after
handoff.

```bash
node scripts/pi-team.mjs dispatch \
  --session SESSION_ID \
  --message-file coordination/pi-team/tasks/TASK_ID/prompt.md
```

`dispatch` refuses a session that Pi Web reports as actively streaming. It
returns after Pi Web accepts the prompt; do not wait for the child turn.

## Coordinate work

- The manager owns `task.json` and the global registry.
- Each child writes only inside its assigned source scopes and task directory.
- Cross-session handoffs use immutable report files and explicit artifact paths,
  hashes, test commands, and known risks.
- A reviewer reads the implementer's handoff and should not overwrite the
  implementation unless the manager explicitly assigns a repair task.
- The manager independently checks decisive evidence before accepting work.
- Review is selective rather than ritual: route to a reviewer only when the
  task's size, integration surface, safety impact, or user request justifies it.

## Low-frequency callback

After writing an error or final handoff artifact, the child may make exactly one
callback:

```bash
node scripts/pi-team.mjs report \
  --manager MANAGER_SESSION_ID \
  --task TASK_ID \
  --event COMPLETED \
  --summary "Implementation and tests complete" \
  --artifact "coordination/pi-team/tasks/TASK_ID/handoff.md"
```

Allowed events:

- `ERROR`: unrecoverable failure, safety issue, blocked decision, invalid task
  assumption, or failure requiring manager intervention.
- `COMPLETED`: all assigned work and required self-tests are finished and the
  final handoff artifact exists.

Intermediate progress belongs in `status.json` and must not trigger a callback.

## Manager response

When receiving `AGENT_REPORT_V1`:

1. Deduplicate by `report_id`.
2. Read the referenced artifact instead of trusting the short notification.
3. For `ERROR`, inspect evidence and decide whether to repair, reroute, stop, or
   ask the user.
4. For `COMPLETED`, run the acceptance gate or route the artifact to the assigned
   reviewer.
5. Report to the user immediately only for errors needing attention or after
   manager acceptance of fully completed work.
6. Never auto-retry indefinitely. Any repair or review cycle must be explicitly
   bounded by the task contract.
