---
title: DSH Chat
summary: 把 DSH Web 从单机会话界面扩展为带身份、组织、私聊、工作项、通知和审计的协作系统，并完成插件、Host 与 Relay 的真实集成验收。
date: 2026-08-31
tags: [TypeScript, React, SQLite, Security]
featured: true
role: 核心实现贡献
status: P0-a 已验收
image: /images/project-dsh-chat.png
repository: https://github.com/xyingsoft/dsh-chat
---

DSH Chat 是一组运行在 DeepSeek Harness Web 中的协作插件。它没有另建一套拥有特权的聊天内核，而是把身份、组织、私聊、工作项、通知和审计拆成可以独立装载、独立卸载的 Cordis 插件。

从 2026 年 8 月 29 日到 31 日，我在主仓库完成并合并了 37 个 PR，另在独立 Relay 仓库完成 1 个开户与设备会话 PR。数量不是项目价值本身，但这些小步 PR 留下了一条可以逐段复查的实现路径：先锁定契约和状态机，再接持久化与 Host API，最后进入真实 Desktop、Relay 和多进程验收。

## 先让文档、契约和代码说同一种语言

[PR #4](https://github.com/xyingsoft/dsh-chat/pull/4) 建立 Yarn 4 workspace 与固定来源的 DSH 运行时；随后 [PR #6](https://github.com/xyingsoft/dsh-chat/pull/6) 和 [PR #7](https://github.com/xyingsoft/dsh-chat/pull/7) 把错误码目录与 11 组领域状态集合变成测试可校验的契约。

这样做是为了避免实现过程中最常见的一类漂移：文档写着一种状态，服务端接受另一种值，客户端又按第三种分支渲染。协议变更必须先改唯一设计依据，再通过契约测试把差异暴露出来。

## 把消息之外的协作行为放进同一条证据链

- [PR #13](https://github.com/xyingsoft/dsh-chat/pull/13) 完成联系人准入与私聊投递。
- [PR #14](https://github.com/xyingsoft/dsh-chat/pull/14) 加入工作项、依赖成环检测和通知收件箱。
- [PR #15](https://github.com/xyingsoft/dsh-chat/pull/15) 将审计事件作为仅追加记录写入。
- [PR #25](https://github.com/xyingsoft/dsh-chat/pull/25) 与 [PR #26](https://github.com/xyingsoft/dsh-chat/pull/26) 补齐消息编辑、撤回、发送状态、outbox 消费与 SSE 通知。

关键约束是“业务写入与审计同事务”。如果消息已经修改、审计却因第二次写入失败而缺失，系统就无法回答谁在什么时候改变了什么。通知也不直接依赖一次在线推送：outbox 与游标补拉保留恢复路径，SSE 只负责降低实时延迟。

## 从能运行到真实接通

[PR #28](https://github.com/xyingsoft/dsh-chat/pull/28) 用一个 Relay 和两个拥有独立本地库的 Host 完成三进程集成验收；[PR #30](https://github.com/xyingsoft/dsh-chat/pull/30) 到 [PR #32](https://github.com/xyingsoft/dsh-chat/pull/32) 则把自建客户端包、真实会话数据和可伸缩聊天抽屉装进 DSH Desktop。页面配图就是这轮真实装载留下的界面证据。

最后，[PR #35](https://github.com/xyingsoft/dsh-chat/pull/35) 接通 Plugin 与 Relay，[PR #37](https://github.com/xyingsoft/dsh-chat/pull/37) 和 Relay 的 [PR #1](https://github.com/xyingsoft/dsh-chat-relay/pull/1) 完成邀请码、设备凭据和 token 认证闭环。设备侧同时保留 Ed25519 请求签名、nonce 去重与时间偏移窗口，避免把一个可复制的会话 token 当成全部身份依据。

## 当前边界

仓库仍处于未发布阶段。P0-a 的骨架与验收清单已经覆盖，但 P0-b 以及群聊、附件、企业治理和端到端加密仍是后续阶段；会话列表也还有聚合查询缺口。项目页记录的是已经合并并验收的部分，不把路线图上的入口写成可用功能。

这次实现让我更确定：协作产品的难点不在聊天气泡，而在身份、状态、恢复、审计和跨进程边界能否共同成立。界面只是最后一层证据。
