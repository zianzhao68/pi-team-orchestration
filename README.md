# Pi Team Orchestration

[中文](#中文说明) | [English](#english)

A [Pi package](https://pi.dev/packages) that provides a reusable skill for
coordinating multiple local Pi Web sessions from one manager session.

The skill uses:

- one manager as the control plane;
- persistent child sessions with explicit task ownership;
- isolated read/write scopes;
- file-based task contracts and handoffs;
- proportional review gates;
- low-frequency `ERROR` and `COMPLETED` callbacks.

> **Security:** Pi skills can instruct an agent to execute commands. Review this
> package before installation. This skill only accepts an HTTP loopback Pi Web
> endpoint and must not be used to expose Pi Web to a public network.

## 中文说明

### 环境要求

- Pi 和本机运行的 Pi Web
- Node.js 22 或更高版本
- Pi Web 默认地址：`http://127.0.0.1:30141`

### 安装

```bash
pi install npm:pi-team-orchestration
```

仅在当前运行中临时加载：

```bash
pi -e npm:pi-team-orchestration
```

安装后可以明确调用：

```text
/skill:pi-team-orchestration
```

也可以直接描述需要，例如：

```text
请使用 pi-team-orchestration，为这个项目建立一个实现、测试和审查团队。
```

### 工作方式

```text
用户 <-> 管理器会话
          |-- 实现会话
          |-- 集成会话
          `-- 验证会话
```

子会话不得继续创建子会话。任务之间通过管理器批准的文件交接，避免循环
委派、重复工作和并发修改同一文件。

### Helper 命令

Skill 内部使用以下 helper；npm 安装后也会提供 `pi-team` 命令：

```bash
pi-team models
pi-team running
pi-team create --cwd "D:/absolute/project"
pi-team status --session SESSION_ID
pi-team dispatch --session SESSION_ID --message-file task-prompt.md
pi-team report --manager MANAGER_SESSION_ID --task TASK_ID \
  --event COMPLETED --summary "任务完成" --artifact path/to/handoff.md
```

如 Pi Web 使用不同端口，只能配置 HTTP loopback 地址：

```bash
PI_WEB_URL=http://127.0.0.1:3000 pi-team models
```

完整协调规则参见
[`protocol.md`](skills/pi-team-orchestration/references/protocol.md)。

### 更新和卸载

```bash
pi update npm:pi-team-orchestration
pi remove npm:pi-team-orchestration
```

## English

### Requirements

- Pi with a local Pi Web instance
- Node.js 22 or newer
- Default Pi Web endpoint: `http://127.0.0.1:30141`

### Install

```bash
pi install npm:pi-team-orchestration
```

Load it for one run without installing:

```bash
pi -e npm:pi-team-orchestration
```

Invoke the skill explicitly:

```text
/skill:pi-team-orchestration
```

Or ask Pi to use the skill when a project needs parallel agents, persistent
specialists, controlled handoffs, or independent review.

### Development

```bash
npm test
npm run check:package
npm pack --dry-run
```

Maintainers can follow the step-by-step
[Chinese publishing guide](PUBLISHING.zh-CN.md).

Before publishing, replace every `YOUR_GITHUB_USERNAME` placeholder in
`package.json`, then run:

```bash
npm run check:publish
npm publish
```

## License

[MIT](LICENSE)
