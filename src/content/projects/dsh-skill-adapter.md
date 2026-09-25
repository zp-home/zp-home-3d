---
title: DSH Skill Adapter
summary: 处理不同 Agent 平台在 Skill frontmatter、目录和调用控制上的细小不兼容，让迁移失败可以被报告，而不是静默丢字段。
date: 2026-08-14
tags: [Agent Skills, CLI, Plugin, Interoperability]
featured: true
role: 个人项目
status: 可用原型
image: /images/project-skill-adapter.webp
repository: https://github.com/zp-home/dsh-skill-adapter
---

最初我以为迁移 Skill 只是复制 `SKILL.md`。实际接入后，失败往往来自很小但会改变语义的差异：有的平台用 `when-to-use`，有的用 `when_to_use`；name 可能包含空格和大写；调用控制字段命名不同；资源目录存在，但主文件没有完整描述它们。

## 问题一：不能把“不认识的字段”直接删除

如果适配器只抽取自己认识的几个字段，Skill 看似导入成功，`allowed-tools`、metadata 或调用策略却已经丢失。项目因此只对 DSH 必需字段做归一化：缺少 `name` 或 `description` 时跳过并报告；非法 name 转为 kebab-case；`when-to-use` 与 `when_to_use` 统一为 `whenToUse`；其余未知字段保留在 metadata，来源仓库、ref 和路径也一起保存。

## 问题二：一次性导入和运行时挂载是两种不同需求

CLI 适合审查后写入 `~/.dsh/skills`：可以 dry-run、输出 JSON 报告，并把归一化后的文件固定下来。DSH Plugin 则注册 `SkillProvider`，从本地或 GitHub 动态列出 Skills，适合持续跟随远端来源。两者共用 core 解析逻辑，但不会把“安装 adapter 插件”误写成“已经审查并信任所有远端 Skill”。

## 为什么没有引入完整 YAML 运行时

core 使用零运行时依赖的受限 frontmatter 解析器，目的是让 CLI 和插件交付简单、行为可控。这也意味着它不是通用 YAML 实现：复杂锚点、自定义标签或平台私有结构必须明确报告为兼容性限制，不能假装全部支持。`npm run check` 与 smoke test 覆盖本地源、GitHub 源、字段归一化、跳过原因和两种输出路径。

这个项目最终解决的不是“复制提示词”，而是让一个有主文件、资源、来源和调用边界的能力包在迁移后仍然可追溯；尚未解决的是不同平台工具权限语义的完全等价转换。
