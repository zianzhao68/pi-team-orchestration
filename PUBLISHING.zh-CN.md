# Pi Team Orchestration 发布教程

本教程适用于第一次把本项目发布到 GitHub、npm 和 Pi Packages。

项目目录：

```text
D:/robot/pi-team-orchestration
```

## 0. 发布前准备

需要准备：

1. 一个 GitHub 账号；
2. 一个已验证邮箱的 npm 账号；
3. npm 账号已启用发布所需的双重认证，或使用符合 npm 要求的发布令牌；
4. 本机已安装 Git、Node.js 22+、npm 和 Pi。

检查命令：

```bash
git --version
node --version
npm --version
pi --version
```

Node.js 必须显示 `v22` 或更高版本。

## 1. 进入项目目录

Git Bash：

```bash
cd /d/robot/pi-team-orchestration
```

PowerShell：

```powershell
cd D:\robot\pi-team-orchestration
```

后续命令都在这个目录执行。

## 2. 检查 npm 包名

```bash
npm view pi-team-orchestration
```

如果返回 `E404 Not Found`，通常表示名称尚未被注册，可以继续。

如果显示了别人的包，必须修改 `package.json` 中的 `name`，例如改为：

```json
"name": "@你的npm用户名/pi-team-orchestration"
```

改用 scope 后，安装命令也要改为：

```bash
pi install npm:@你的npm用户名/pi-team-orchestration
```

## 3. 创建空 GitHub 仓库

打开：

```text
https://github.com/new
```

填写：

- Repository name：`pi-team-orchestration`
- Visibility：`Public`
- 不要勾选初始化 README
- 不要添加 `.gitignore`
- 不要添加 License

本地项目已经包含这些文件；在 GitHub 再创建一份可能导致首次推送冲突。

创建后记下仓库地址，例如：

```text
https://github.com/your-name/pi-team-orchestration
```

## 4. 替换 GitHub 占位符

打开 `package.json`，将三处：

```text
YOUR_GITHUB_USERNAME
```

全部替换为真实 GitHub 用户名或组织名。

例如用户名是 `octocat`，应得到：

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/octocat/pi-team-orchestration.git"
},
"homepage": "https://github.com/octocat/pi-team-orchestration#readme",
"bugs": {
  "url": "https://github.com/octocat/pi-team-orchestration/issues"
}
```

然后执行严格发布检查：

```bash
npm run check:publish
```

预期结果：

```text
Package validation passed for publishing.
```

如果提示 `Replace YOUR_GITHUB_USERNAME`，说明还有占位符未替换。

## 5. 运行测试

```bash
npm test
```

预期三个测试全部通过：

- helper 可以显示帮助；
- 未知命令会失败；
- 非 loopback 的 Pi Web URL 会被拒绝。

再运行包结构检查：

```bash
npm run check:package
```

预期：

```text
Package validation passed.
```

## 6. 检查将被发布的文件

```bash
npm pack --dry-run
```

确认清单中包含：

```text
README.md
LICENSE
CHANGELOG.md
SECURITY.md
package.json
skills/pi-team-orchestration/SKILL.md
skills/pi-team-orchestration/references/protocol.md
skills/pi-team-orchestration/scripts/pi-team.mjs
```

确认清单中不包含密码、令牌、私钥、个人配置、日志或项目数据。

## 7. 用 Pi 做本地加载测试

```bash
pi -e D:/robot/pi-team-orchestration
```

进入 Pi 后执行：

```text
/skill:pi-team-orchestration
```

也可以输入：

```text
请使用 pi-team-orchestration，说明如何发现本机 Pi Web 会话，但不要创建新会话。
```

确认 Pi 能读取 Skill，并且引用的 `references/` 和 `scripts/` 路径有效。
完成后退出临时 Pi 会话。

## 8. 初始化并推送 Git 仓库

先配置 Git 身份；如果已经配置，可以跳过：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

初始化并提交：

```bash
git init
git branch -M main
git add .
git status
git commit -m "feat: publish initial pi team orchestration skill"
```

添加远程仓库：

```bash
git remote add origin https://github.com/zianzhao68/pi-team-orchestration.git
git push -u origin main
```

打开 GitHub 仓库页面，确认文件已经出现，并确认仓库是 Public。

## 9. 登录 npm

```bash
npm login
```

按照浏览器或终端提示完成登录，然后验证：

```bash
npm whoami
```

该命令必须输出你的 npm 用户名。

## 10. 最后一次发布前检查

```bash
npm run check:publish
npm test
npm pack --dry-run
git status
```

发布前应满足：

- `check:publish` 通过；
- 测试全部通过；
- 包文件清单正确；
- `git status` 没有遗漏的重要修改；
- `package.json` 版本为 `0.1.0`；
- npm 包名仍然可用。

再次检查包名：

```bash
npm view pi-team-orchestration
```

## 11. 发布到 npm

```bash
npm publish
```

本项目的 `publishConfig.access` 已设为 `public`。发布时 npm 可能要求输入
一次性验证码，按提示完成即可。

看到类似以下内容表示成功：

```text
+ pi-team-orchestration@0.1.0
```

注意：npm 的同一名称、同一版本一旦发布，不能覆盖。发现问题时必须发布
新版本，而不是再次发布 `0.1.0`。

## 12. 验证 npm 包

```bash
npm view pi-team-orchestration version description keywords
```

预期版本是：

```text
0.1.0
```

网页地址：

```text
https://www.npmjs.com/package/pi-team-orchestration
```

## 13. 用 Pi 从 npm 安装

```bash
pi install npm:pi-team-orchestration
pi list
```

重新启动 Pi，然后执行：

```text
/skill:pi-team-orchestration
```

如果当前机器原先通过全局 Skill 目录加载过同名 Skill，Pi 可能提示名称
冲突并保留先发现的版本。发布验证时可以：

1. 在另一台干净机器测试；或
2. 暂时移走 `~/.pi/agent/skills/pi-team-orchestration`；或
3. 使用 `pi -e npm:pi-team-orchestration` 在干净配置中检查。

不要直接删除原 Skill，确认 npm 版本工作正常后再决定如何迁移。

## 14. 检查 Pi Packages

`package.json` 已包含：

```json
"keywords": ["pi-package"]
```

这是进入 Pi Packages Gallery 的关键发现标记。发布并等待索引后，打开：

```text
https://pi.dev/packages
```

搜索：

```text
pi-team-orchestration
```

如果没有立即出现：

1. 确认 npm 页面是 Public；
2. 确认 npm 页面显示 `pi-package` keyword；
3. 确认发布的 tarball 中包含 `package.json` 和 Skill；
4. 稍后重新检查 Gallery 索引。

## 15. 可选：增加 Gallery 预览图

先把 PNG、JPEG、GIF 或 WebP 图片放到稳定的公开 HTTPS 地址，然后在
`package.json` 的 `pi` 字段中加入：

```json
"pi": {
  "skills": ["./skills"],
  "image": "https://你的公开地址/demo.png"
}
```

如使用视频，只支持 MP4：

```json
"pi": {
  "skills": ["./skills"],
  "video": "https://你的公开地址/demo.mp4"
}
```

不要填写本地文件路径。修改后必须发布新版本才能更新 npm 和 Gallery。

## 16. 后续发布新版本

修改代码并测试后，根据变更类型选择：

```bash
npm version patch
```

适合修复，例如 `0.1.0 -> 0.1.1`。

```bash
npm version minor
```

适合向后兼容的新功能，例如 `0.1.0 -> 0.2.0`。

```bash
npm version major
```

适合破坏兼容性的变化，例如 `0.1.0 -> 1.0.0`。

然后：

```bash
git push
git push --tags
npm publish
```

用户更新：

```bash
pi update npm:pi-team-orchestration
```

## 常见错误

### `ENEEDAUTH`

没有登录 npm：

```bash
npm login
npm whoami
```

### `E403`

常见原因：

- 包名已被占用；
- npm 邮箱未验证；
- 账号没有发布权限；
- 双重认证或令牌策略不满足发布要求。

### `EOTP`

npm 要求一次性验证码。使用认证器中的当前验证码，并重新执行发布。

### `You cannot publish over the previously published versions`

该版本已存在。先提升版本：

```bash
npm version patch
npm publish
```

### Pi 找不到 Skill

依次检查：

```bash
pi list
npm view pi-team-orchestration
```

然后确认发布包中存在：

```text
skills/pi-team-orchestration/SKILL.md
```

并确认 `package.json` 中存在：

```json
"pi": {
  "skills": ["./skills"]
}
```
