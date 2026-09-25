---
title: DSH Desktop Packaging
summary: 用原生宿主、ASAR 白名单和运行时门禁构建与验证 DSH Desktop 三端产物。
date: 2026-08-24
tags: [Electron, Packaging, CI, Release]
featured: true
kind: Build Skill
triggers: [桌面打包, 安装速度优化, ASAR 调试]
---

这项 Skill 把一次性的打包排障整理成可重复流程，强调目标平台原生构建、精确的物理文件白名单和产物级验证。

## 核心约束

- Windows、macOS 和 Linux 分别在原生宿主上构建。
- 普通 JavaScript 留在 ASAR，原生模块和外部可执行文件按需 unpack。
- 不通过放开整个 `node_modules` 解决缺失文件。
- 先运行平台 gate，再构建，再检查真实产物。
- 归档时记录源提交、打包提交、哈希、签名状态和未完成的发布门禁。

## 已验证的 Windows 路径

当前方案使用 NSIS、`compression: normal`、`useZip: false` 和关闭差分包。测试过的 ZIP store 路径虽然减少解码工作，但产物在真实安装中解包失败，因此不作为默认方案。
