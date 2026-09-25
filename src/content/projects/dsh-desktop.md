---
title: DSH Desktop
summary: 从真实故障复现到跨平台门禁，记录我在 DSH Desktop 中处理更新、安装器、窗口交互、ACL 沙箱和 Profile 生命周期的过程。
date: 2026-09-01
tags: [Electron, TypeScript, Packaging, Open Source]
featured: true
role: 开源贡献者
status: 持续协作
image: /images/project-desktop.webp
repository: https://github.com/anywhere-labs/dsh-desktop
website: https://dshdesktop.cn
---

这不是一个由我独立拥有的项目，而是一组发生在 DSH Desktop 官方仓库中的公开工程贡献。我主要处理那些“功能看起来简单，但跨过 Electron、Cordis Host、Profile 与安装器后就会失效”的问题。下面只写可以从 Issue、PR、测试或证据报告复查的过程；`open`、`closed` 与 `merged` 明确分开。

## 公开贡献快照

截至 2026-09-01，公开记录包含 13 个作者 PR 和 7 个作者 Issue。13 个 PR 合计涉及 116 次文件变更，约 `+5701 / -105`；其中 3 个已合并，7 个仍在评审，3 个关闭或由我主动撤回。代码量只是工作范围，不代表所有方案已经成为官方交付。

重点记录包括：已合并的 Market 自更新 [#507](https://github.com/anywhere-labs/dsh-desktop/pull/507)、运行中升级安装器 [#618](https://github.com/anywhere-labs/dsh-desktop/pull/618) 和滚动后标题栏拖动 [#621](https://github.com/anywhere-labs/dsh-desktop/pull/621)；仍在评审的打包回归 [#488](https://github.com/anywhere-labs/dsh-desktop/pull/488)、Host-only Bundle [#464](https://github.com/anywhere-labs/dsh-desktop/pull/464)、卸载流程 [#535](https://github.com/anywhere-labs/dsh-desktop/pull/535)、安装速度 [#603](https://github.com/anywhere-labs/dsh-desktop/pull/603) 和 Windows ACL 控制台 [#629](https://github.com/anywhere-labs/dsh-desktop/pull/629)。

公开提出并跟踪的 Issue 包括 [#506](https://github.com/anywhere-labs/dsh-desktop/issues/506)、[#492](https://github.com/anywhere-labs/dsh-desktop/issues/492)、[#463](https://github.com/anywhere-labs/dsh-desktop/issues/463)、[#427](https://github.com/anywhere-labs/dsh-desktop/issues/427)、[#407](https://github.com/anywhere-labs/dsh-desktop/issues/407)、[#405](https://github.com/anywhere-labs/dsh-desktop/issues/405) 和 [#402](https://github.com/anywhere-labs/dsh-desktop/issues/402)。

## 问题一：内置 Market 落后 3 个版本，却没有升级按钮

**现象。** Desktop 2.0.2 内置 `dshmarket@1.17.1`，npm 与 GitHub 已经是 `1.20.0`，但界面没有“升级市场”，`/dsh-market/updates?force=1` 也完全不返回市场自身。

**最初容易误判的方向。** 表面像是版本比较或按钮条件错误，实际两个环节都只看了 Profile dependencies；Desktop 为避免修改用户 Profile，却是从应用依赖图提供 Market。运行中的包因此存在，但不在更新检查的输入集合里。

**处理。** 在 [PR #507](https://github.com/anywhere-labs/dsh-desktop/pull/507) 中，我把宿主提供的包名和运行版本加入更新检查与缓存键；第一次升级时允许它转为 Profile 本地依赖；客户端同时从 `updates` 与 `installed` 推导自身包名。还补了真实挂载 `/dsh-market/updates` 的集成回归测试，避免只测一段孤立函数。

**结果。** 7 项聚焦测试、Desktop 完整构建和远程 Windows/macOS CI 均通过，该 PR 已于 2026-08-24 合并。vendor patch 仍是兼容层：上游 Market 发布相同修复并被 Desktop 升级后，应删除而不是永久保留。

## 问题二：安装器把“目录里有进程”误当成 Desktop 正在运行

**现象。** 旧安装器只要发现某个进程路径位于安装目录，就会阻止升级；同时 Desktop 关闭窗口后仍可能驻留托盘，直接覆盖又会遇到主进程占用文件。

**定位。** 这是两个不同问题：检测条件过宽，以及新安装器必须和正在运行的旧版本完成一次有序交接。只强杀进程会丢失清理机会；只发送新参数又无法兼容不认识该参数的 2.0.2。

**处理。** [PR #618](https://github.com/anywhere-labs/dsh-desktop/pull/618) 将检测收窄为精确的 `DSH Desktop.exe`，安装器通过 `--dsh-installer-quit` 和 Electron 单实例通道请求 Cordis/Desktop 正常关闭；对旧版本只保留精确进程名回退。

**验证。** 我实际跑了 `2.0.2 -> 2.0.3 -> 2.0.3` 的安装、运行中升级、同版本覆盖和卸载闭环，并检查进程、快捷方式、卸载项与 `active-run.json` 清理。Windows package gate 的 180 项测试及 201 节点运行时闭包通过；该 PR 已合并。

## 问题三：长会话滚动后，标题栏看得见却拖不动

**现象。** Windows 增强模式在长会话滚动到底部后，顶部 32px 标题区域仍然可见，但大部分横向位置无法移动窗口。`z-index` 与视觉层级看起来都正常。

**根因。** Electron/Chromium 解析 `-webkit-app-region` 时受 DOM 收集顺序影响。caption 早于 conversation/details 渲染，后出现的 `no-drag` 后代在滚动后覆盖了拖动命中区；视觉上“在上面”并不等于原生 app region 最后生效。

**处理与证据。** [PR #621](https://github.com/anywhere-labs/dsh-desktop/pull/621) 只调整 Windows caption 的 DOM 顺序，让它位于滚动表面之后、overlay 与 resize handle 之前。我用真实 Electron 窗口和 `GetWindowRect` 测量：修复前滚动后请求位移 `(120,80)` 得到 `(0,0)`，修复后得到 `(110,73)`；兼容模式和扩展窗口作为对照也保持可拖动。该 PR 已合并。

## 问题四：Windows `workspace-write` 在部分机器上无输出退出

受影响环境中的受限子进程在 DLL 初始化阶段以 `0xC0000142` 退出，stdout/stderr 都为空。受控二分显示：CLI 宿主有控制台时正常，Electron 图形宿主无控制台时失败；让受限进程自己创建控制台会在令牌收紧之后触发问题。

[PR #629](https://github.com/anywhere-labs/dsh-desktop/pull/629) 的方案是在精确校验过的 Desktop ACL 跳板进程进入上游 runner 前分配并隐藏控制台，让后续受限子进程继承它，同时不改变受限令牌、ACE、作业对象和 fail-closed 策略。本机能验证真实 GUI/ACL 路径和越界写入拒绝，但不能自然复现报告机器上的原始崩溃码，因此 PR 明确保留“需在受影响高完整性主机复测”的发布门禁，当前仍为 open。

## 一次主动撤回：不能把本地闭环等同于可合并

[PR #649](https://github.com/anywhere-labs/dsh-desktop/pull/649) 调查的是 Vision 回复已经到达、HTTP 也为 200，但输入框永久只读的问题。故障注入证明 renderer 的 unary carrier 可以忽略 abort 并永不结算；只修 Host 包后 Electron 仍不恢复，因为 rc.2 还内联了一份旧 renderer client。

我完成了 deadline 结算、39 项上游 carrier 测试、647 项扩大测试和 Electron 二次发送闭环，但共享 runtime PR 受权限限制未能创建，随后基线前进又让远程预检出现无关差异。我最终主动撤回该 Desktop PR，仅保留证据与边界。这项记录对我很重要：能解释根因和做出本地补丁，不代表已经满足上游所有权与合并条件。

## 打包验证中的取舍

- 将普通 JavaScript 和资源收回 `app.asar`，只为原生模块、可执行文件和真实路径资源保留 unpack 白名单。
- 排除 source map、TypeScript 源码和非目标架构原生文件。
- 为 packaged runtime、Loader、Profile、CLI 与 installer 建立产物级校验。
- 明确 Windows、macOS 和 Linux 的原生宿主、签名和 headless gate 边界。

打包优化不是单目标。比如 [PR #603](https://github.com/anywhere-labs/dsh-desktop/pull/603) 中 NSIS `store` 模式在同机静默安装只快 16.451 秒（4.73%），却让安装器增大到原来的 4.41 倍；22,920 个落盘文件和终端安全扫描仍是主要成本。因此该方案保持 open，并把 portable ZIP 留在默认压缩路径。此前个人维护分支把安装器缩到约 116 MiB 的结果同样只作为工程验证，不写成官方主线成果。

完整门禁在这台 Windows 机器上经常会留下 7 项 `symlinkSync` 的 `EPERM`。我的处理方式是报告完整通过/失败数量、证明失败发生在既有 fixture 的环境前置条件，并单独补跑受影响后未执行的 gate；不会把“与改动无关”改写成“全部通过”。
