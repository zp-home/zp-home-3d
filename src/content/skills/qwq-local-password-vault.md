---
title: QWQ Local Password Vault
summary: 让 Agent 在 Windows 本机通过 DPAPI 管理密码、API Key、SSH 凭据和部署 Token，默认不回显明文。
date: 2026-08-24
tags: [Security, DPAPI, Credentials, Windows]
featured: true
kind: Security Skill
skillhub:
  url: https://skillhub.cn/skills/qwq-local-password-vault
  version: 1.0.1
  downloads: 86
  stars: 2
  installs: 0
triggers: [保存凭据, 读取密码, 密钥轮换]
---

这项 Skill 为本机开发和部署工作提供明确的秘密信息处理边界：凭据使用 Windows DPAPI 加密，调用者按条目读取，不把密码散落在项目文档、Shell 历史或聊天记录中。

## 核心约束

- 加密数据绑定当前 Windows 用户环境。
- 列表操作只显示名称、类型和元数据，不显示秘密值。
- 读取时优先复制到剪贴板，并在设定时间后自动清理。
- 更新、轮换和删除都要求明确目标，避免宽泛的批量操作。
- 不扫描或导出整个密码库，不把真实凭据写进日志和网站内容。

网站仅展示 Skill 的公开说明与 SkillHub 指标，不读取本地密码库中的任何条目。
