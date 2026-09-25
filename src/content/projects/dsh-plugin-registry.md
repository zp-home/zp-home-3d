---
title: DSH Plugin Registry
summary: 为 DSH 插件建立可审核的中央协调层，用固定来源、版本范围和上下文语义检查已知命名冲突，同时明确区分“无冲突”与“未能验证”。
date: 2026-09-08
tags: [Node.js, GitHub Actions, JSON Schema, Supply Chain]
featured: true
role: 项目发起 / 开源贡献
status: v2 已合并，持续加固
image: /images/project-dsh-plugin-registry.svg
repository: https://github.com/oh-my-dsh/dsh-plugin-registry
---

DSH 的扩展面不只有一个 Plugin ID。npm package、Loader、Cordis service、模型 tool、用户 command、Skill、event、settings namespace 和 Web route 分别有不同的作用域与冲突规则。只做字符串去重会把合法覆盖和共享事件误判为冲突；完全不协调，又会让两个插件在组合运行时才发现彼此占用了同一个入口。

我先在个人仓库实现并验证注册表，再通过上游 [PR #1](https://github.com/oh-my-dsh/dsh-plugin-registry/pull/1) 将完整的 v2 契约迁入社区仓库。该 PR 修改 24 个文件、增加 3,769 行，已在 2026 年 8 月 31 日合并。

## 正式登记和候选发现必须是两种数据

注册表同时维护两条链路：

- `registry/entries/` 保存经过审核、固定到 40 位来源 commit 的正式登记，并确定性生成机器可读索引。
- `discovery/candidates.json` 收集 GitHub topic、代码搜索和 manifest 证据，只作为审核队列，不预留任何名称。

这是项目最重要的边界。搜索命中、仓库描述和 star 数只能证明“值得查看”，不能证明一个运行时名称真的由该插件声明。只有来源、兼容范围和上下文经过审查的 entry 才能参与冲突判定。

## 同名不总是冲突

`dsh-plugin-registry/v2` 按扩展面的真实语义判断风险：Loader 要看 composition layer 与覆盖意图，service、tool 和 command 要比较 scope，Skill 还要比较 provider 与 rank，event 是共享通道，只有不兼容的发布者 Schema 才应告警，Web route 则至少需要同时比较 kind、path 和 router scope。

所有声明还必须与 Harness SemVer 范围相交。两个只在不同版本生效的同名接口，不应该被写成当前运行时冲突。端口则属于部署组合问题，不进入静态名称预留。

## 让客户端能够可靠地失败

项目提供零运行时依赖的 CLI、复合 GitHub Action、JSON Schema、来源验证和确定性索引检查。客户端可以在发布前精确查询，也可以在 CI 中检查完整登记清单。

网络失败、索引格式错误或契约版本不支持时，结果必须是“未知 / 未检查”，不能降级成“名称可用”。正在审查的 [PR #2](https://github.com/oh-my-dsh/dsh-plugin-registry/pull/2) 继续加固这条边界：补全 index Schema，拒绝重复身份、非确定排序、非法 UTF-8 与超限输入，并统一本地和远程的 5 MiB 读取上限。该 PR 仍为 open，本页不把它计入已发布能力。

## 这项工作的价值

注册表不是全网唯一性证明，也不会下载或执行第三方插件代码。它做的是更克制的事情：把已经审核的公开事实放进一个可复现契约，让 CLI、CI 和 Agent Skill 能够给出相同结论，并让“没有发现已知冲突”和“根本没有检查成功”保持可区分。
