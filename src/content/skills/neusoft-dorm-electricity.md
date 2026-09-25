---
title: Neusoft Dorm Electricity
summary: 查询大连东软信息学院软件园校区三期宿舍电费余额，支持授权账号登录、宿舍号查询和基础排障。
date: 2026-08-25
tags: [Campus Service, Automation, Python, Security]
featured: false
kind: Campus Service Skill
skillhub:
  url: https://skillhub.cn/skills/neusoft-dorm-electricity
  version: 1.0.0
  downloads: 54
  stars: 2
  installs: 0
triggers: [宿舍电费, 剩余电量, 校园生活服务]
---

这项 Skill 把校园缴费服务中的宿舍电费查询整理为可重复流程，返回房间号、电费余额、可用时的剩余电量和上游状态信息。

## 使用边界

- 只在用户提供并授权使用校园账号、密码和宿舍号后查询。
- 账号配置与会话数据留在本机，禁止提交到仓库。
- 输出不包含密码、Session Cookie 或原始登录载荷。
- 支持单次覆盖宿舍号，但不批量枚举房间。
- 登录失败时优先检查凭据和上游 SSO 状态，不绕过认证。

网站不保存或处理校园凭据，只链接到公开 Skill 说明和公开平台指标。
