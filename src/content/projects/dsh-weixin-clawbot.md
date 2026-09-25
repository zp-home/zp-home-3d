---
title: DSH Weixin ClawBot
summary: 把腾讯官方 iLink 长轮询接入 DSH Host，并处理远程会话复用、即时取消、授权隔离、失败重试与审批边界。
date: 2026-08-24
tags: [Weixin, Remote Control, Plugin, Messaging]
featured: false
role: 个人项目
status: 持续迭代
image: /images/project-weixin.jpg
repository: https://github.com/zp-home/dsh-weixin-clawbot
---

这个项目的第一版目标只是“在微信里给 DSH 发消息”。真正实现后，难点很快变成：手机消息到达时应该复用哪个 Session，长任务运行期间如何取消，Host 重启后哪些状态可以恢复，以及一个聊天入口到底应该拥有多大的机器权限。

## 问题一：通道是 Host-only Bundle，没有页面可以帮它保存状态

插件不修改桌面微信，不注入客户端，也不增加 Web 页面。它通过腾讯官方 ClawBot/iLink 长轮询运行在 DSH Host 中。这种形态避免了桌面注入，却要求游标、授权用户、Session 映射与 Outbox 都由 Host 侧持久化；一次性 headless 进程结束后无法继续收消息。

这个实现还暴露了 DSH Desktop 的测试缺口：完整 Profile smoke 当时只覆盖带 Client UI 的 Bundle，没有验证通过 `dsh.profile.bundles` 安装、只插入 Host entry 的第三方连接器。我据此提交 [Issue #463](https://github.com/anywhere-labs/dsh-desktop/issues/463) 与 [PR #464](https://github.com/anywhere-labs/dsh-desktop/pull/464)，用产品无关 fixture 覆盖 layer 发现、普通 Agent/credential/preset service 和可选 Desktop capability。真实 `@local/dsh-weixin@0.2.0` tarball 也在隔离 Desktop Profile 中完成未配对冷启动与状态命令验证；上游 PR 仍为 open。

## 问题二：普通队列会让 `/cancel` 失去意义

如果所有微信消息按顺序进入同一任务队列，前一个长任务没有结束时，`/cancel` 和 `/steer` 只能排在它后面，等执行到时已经太迟。实现中把取消与纠偏命令从普通消息队列分离，在最近的 DSH step 边界立即处理；普通任务仍保持每个授权用户自己的队列和持久 Session。

Session 不能只存一个短 ID。插件需要验证微信用户与 Session 的所有权，复用 Web/Desktop 已经打开的 Agent 时不能重复创建或错误释放，同时在 Host 重启后恢复映射。未知斜杠命令则转交 DSH 原生命令系统，避免在插件里复制 `/plan`、`/goal`、`/compact` 的实现。

## 问题三：微信发送成功不能作为唯一完成条件

iLink 临时网络失败时，如果先把任务标记完成再发送回复，结果会永久丢失。因此回复先进入持久 Outbox，再指数退避发送；Host 重启后继续重试。任务收到后可立即回执，长任务按间隔报告进度，`/task`、`/queue` 与 `/doctor` 提供通道侧诊断。

## 权限不是一个开关

首次扫码账号成为主用户，新增用户通过短时一次性邀请码授权。不同微信用户的 Session 索引隔离，未授权消息在进入 Agent 前丢弃。默认权限是 `workspace-write`；越界操作需要对应用户在微信中处理 5 分钟一次性审批码，完整机器权限则要求精确的确认命令。Token 存入 DSH credential provider，不写入普通状态文件。

## 已验证与未完成

当前测试覆盖 iLink 协议、Unicode 分段、旧状态迁移、命令解析、授权审计、Outbox 与一次性审批生命周期，并验证 DSH `0.1.0-rc.8` 和 `0.1.1-rc.2`。目前只处理文字与微信侧语音转写；图片、文件和媒体回传还需要 CDN AES 下载、类型/大小限制、隔离落盘与过期清理，因此明确留在路线图中，不能从“能收消息”推导为“支持所有微信内容”。
