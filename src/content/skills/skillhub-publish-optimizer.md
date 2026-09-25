---
title: SkillHub Publish Optimizer
summary: 自动完成 Skill 校验、安全打包、发布文案、GitHub Release 交接与 SkillHub 上架检查。
date: 2026-08-12
tags: [Agent Skills, Release, Validation, Automation]
featured: true
kind: Release Skill
repository: https://github.com/zp-home/skillhub-publish-optimizer
skillhub:
  url: https://skillhub.cn/skills/skillhub-publish-optimizer
  version: 1.1.1
  downloads: 66
  stars: 1
  installs: 0
triggers: [Skill 打包, 发布审计, SkillHub 上架]
---

Skill 的发布风险不只在代码，还包括 ZIP 中的秘密文件、模糊的触发描述和不可复现的版本信息。该 Skill 把这些检查放进统一的交付流程。

## 工作流

- 检查 `SKILL.md` 结构与触发描述。
- 扫描压缩包内容，排除凭据、缓存和无关产物。
- 生成中英文名称、描述、版本和更新说明。
- 建立 GitHub Release 与 SkillHub 之间的可追溯交接。
- 上架后复查搜索关键词和展示结果。
