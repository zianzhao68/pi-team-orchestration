# Pi Team Coordination Protocol

## 1. Topology

The manager is the single control plane. Children are execution workers:

```text
user <-> manager
           |-- implementation/training child
           |-- integration/optimization child
           `-- verification/advisor child
```

Children exchange results through manager-approved files, not autonomous chat.
This prevents circular delegation, contradictory decisions, duplicated work,
and concurrent edits to the same files.

## 2. Project layout

Use this default layout unless the project already has an equivalent:

```text
coordination/pi-team/
├── registry.json
└── tasks/
    └── TASK_ID/
        ├── task.json
        ├── prompt.md
        ├── status.json
        ├── reports/
        │   └── 001.json
        ├── artifacts.json
        └── handoff.md
```

Ownership:

- Manager only: `registry.json`, `task.json`, task assignment and acceptance.
- Assigned child only: `status.json`, `reports/`, `artifacts.json`, `handoff.md`.
- Source files: only the child whose `writeScopes` include those paths.

Prefer one task directory per worker. Never let several children update one
shared status or handoff file concurrently.

## 3. Task contract

Suggested `task.json`:

```json
{
  "version": 1,
  "taskId": "TRAIN-R3",
  "ownerSessionId": "SESSION_ID",
  "role": "training",
  "objective": "Train and evaluate the approved model",
  "readScopes": ["configs/", "data/manifests/"],
  "writeScopes": ["parallel/training/", "coordination/pi-team/tasks/TRAIN-R3/"],
  "dependencies": [],
  "acceptanceGates": [
    "dataset leakage audit passes",
    "training process launches exactly once",
    "final frozen-set evaluation is recorded"
  ],
  "maxRepairCycles": 1,
  "managerSessionId": "MANAGER_SESSION_ID",
  "reportPolicy": {
    "callbackEvents": ["ERROR", "COMPLETED"],
    "progressCallbacks": false
  }
}
```

The dispatch prompt must repeat critical boundaries; do not assume the child
will infer them from the JSON.

## 4. State model

Normal internal states:

```text
ASSIGNED -> RUNNING -> CHECKPOINT -> READY_FOR_REVIEW -> ACCEPTED -> DONE
```

Exceptional states:

```text
BLOCKED | FAILED | CANCELLED
```

State changes are stored locally. They do not wake the manager unless mapped to:

- `ERROR`: `BLOCKED`, `FAILED`, a safety violation, or a required decision.
- `COMPLETED`: all assigned work, self-tests, and final handoff are complete.

`READY_FOR_REVIEW` is internal. The child emits `COMPLETED`; the manager then
decides whether review is required.

Independent review is risk-triggered, not mandatory for every completion.
Manager reproduction and direct user review are sufficient for small
diagnostics, data checks, reports, and visual artifacts. Use an independent
reviewer by default for substantial code changes, cross-module integration,
production safety or authorization paths, or when the user asks for one.

## 5. Final handoff

`handoff.md` should contain:

```markdown
# TASK_ID handoff

## Result
One-paragraph outcome.

## Changed files
- path: purpose

## Evidence
- exact command: result
- artifact path and hash

## Requirements and gates
- PASS/FAIL per gate

## Risks and unresolved items
- explicit list, or "none"

## Recommended next action
- one bounded action
```

Large logs remain in artifact files. Do not copy them into callbacks.

## 6. Callback envelope

The helper posts a prompt to the manager with `streamingBehavior=followUp`:

```text
AGENT_REPORT_V1
report_id: UUID
task_id: TRAIN-R3
event: COMPLETED
severity: info
summary: Training and final evaluation finished
artifact: coordination/pi-team/tasks/TRAIN-R3/handoff.md
source_session: SESSION_ID
instruction: Read the artifact, verify it, and do not trust this notification alone.
```

For `ERROR`, severity is `error`. A blocked decision is represented as
`event: ERROR` with the decision requirement described in `summary` and the
evidence stored in the artifact.

The request ID is correlation metadata, not a guaranteed idempotency key.
Therefore the manager must deduplicate `report_id`.

## 7. Reporting to the user

The manager should not forward every child message.

Notify the user only when:

1. an error requires user attention, changes safety/cost/scope, or cannot be
   resolved within the agreed contract; or
2. work is fully completed, checked to the proportional level selected by the
   manager, and ready for delivery or user review.

Child completion is not user-facing completion. Manager verification must
happen first; a separate reviewer is used only when proportional review calls
for one.

## 8. Long-running external jobs

An agent may launch a remote training or build process and then stop. Treat the
external process and the Pi child turn as separate states.

- Record PID, log path, output path, launch command, resource allocation, and
  watcher details in `status.json`.
- Do not keep the manager or child turn open for hours.
- A dedicated watcher may update local status silently.
- The watcher wakes the manager only on process/evaluation `ERROR` or final
  `COMPLETED`.
- Never infer failure merely because a Pi child is idle after safely launching
  the external job.
