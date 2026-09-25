---
title: DSH Best Dev Optimizer
summary: 让两个会话同改一个文件时的 FS_STALE_VERSION 冲突由插件确定性恢复，而不是指望模型自己重读重试。
date: 2026-08-18
tags: [TypeScript, Cordis, Plugin, Concurrency]
featured: false
role: 个人项目
status: 可用原型
image: /images/project-dev-optimizer.svg
repository: https://github.com/zp-home/dsh-best-dev-optimizer
---

DSH 的 `edit` 工具本来就会在版本过期时拒绝写入，报 `FS_STALE_VERSION`，并在错误信息里附上一句"重新读取文件，然后重试"。这个乐观并发控制的设计是对的，问题出在最后一步：提示能不能生效，取决于背后的模型愿不愿意照做。弱一点的模型经常把这次工具调用当成终点，转头去做别的事，把这次修改悄悄丢掉。

这个插件把那一步从建议变成机制。

## 做法

- 挂在 `tools/execute` 上——和沙箱、超时策略同一个扩展点，不改 `edit` 本身。
- 只包裹配置里指定的工具，默认只有 `edit`。
- 命中 `FS_STALE_VERSION` 时，用同一个会话身份内部发起一次真正的 `read`，刷新 `fs-observation-policy` 里缓存的版本号，模型上下文里也会诚实地多出这条读取记录。
- 然后重放一次原始调用，只重放一次。

## 边界

`edit` 按字面量 `old_string` 定位，所以重放等价于"人工重新读取再重试"：锚点文本在新内容里仍然唯一，编辑就正常落地，不会覆盖别人刚写的东西；锚点本身被改掉了，重试会真实失败（`FS_EDIT_NOT_FOUND` / `FS_AMBIGUOUS_EDIT`），冲突照样暴露给模型，不会被静默吞掉。

`write` 默认不在重试范围内。它是整文件覆盖，盲目重放等于把另一个会话刚写的内容直接抹掉——正是版本保护机制本来要防的丢失更新。
