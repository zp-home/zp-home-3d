---
title: 把 Agent Skill 当成可发布的软件包
summary: Skill 不只是 SKILL.md，还需要触发描述、资源边界、安全审计、版本和发布后的检索验证。
date: 2026-08-12
tags: [Agent Skills, Release, Security, Metadata]
featured: true
readingTime: 6 min
reactionIssue: 3
source: https://github.com/zp-home/skillhub-publish-optimizer
---

一个 Skill 在本机能运行，不代表它适合公开发布。压缩包里可能混入凭据、缓存、样例输出，也可能因为描述过于宽泛而在错误的任务中被触发。

## 发布前的四层检查

### 结构

确认 `SKILL.md` frontmatter、目录名、资源链接和 UI metadata 一致。删除模板残留与无用资源。

### 权限与秘密

审计 scripts、环境变量读取、网络访问和文件范围。对 ZIP 做最终内容清单，而不是只看工作目录。

### 可发现性

名称要说明能力，description 要同时包含“做什么”和“什么时候触发”。展示文案可以更短，但不能替代触发描述。

### 可追溯发布

版本、Git commit、Release asset 和平台条目应该能相互对应。上架后再次搜索关键词，确认真实展示结果与预期一致。
