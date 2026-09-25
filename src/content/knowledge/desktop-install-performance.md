---
title: Electron 安装速度优化，不只是换一个压缩参数
summary: 从 ASAR 布局、物理文件数量、原生依赖裁剪和安装器边界解释 Windows 安装为什么慢。
date: 2026-08-24
tags: [Electron, NSIS, Performance, Packaging]
featured: true
readingTime: 8 min
reactionIssue: 2
source: https://github.com/zp-home/deepseek-harness-desktop/tree/build/windows-latest-20260824
---

Electron 安装器解压时 CPU 没跑满，直觉上很容易归因于“单线程 7z”。但实际安装吞吐同时受归档解码、零散文件创建、杀毒扫描、磁盘写入和安装器控制流程影响。

## 先看文件布局

如果把整个应用和 `node_modules` 放进 `app.asar.unpacked`，安装器面对的是大量物理文件。即使单个文件很小，创建、扫描和复制的固定成本仍然存在。

更有效的方向是：

1. 把普通 JavaScript 与资源合并进 `app.asar`。
2. 只 unpack 原生模块、外部 executable、真实路径 Worker 和目录枚举资源。
3. 删除 source map、TypeScript 源码和非目标 CPU 架构。
4. 用 packaged-runtime gate 拒绝白名单回退。

## 为什么不直接使用 ZIP store

`useZip: true` 与无压缩 ZIP 理论上减少了解码成本，也可能避开临时目录的二次复制。但在固定工具链的真实安装中，约 477.59 MiB 的安装器很快以退出码 2 解包失败。

这说明“更快的理论路径”必须经过完整的真实安装验证。构建成功、包能列出文件，都不能替代安装器落盘、启动、升级和卸载测试。

## 多线程不是一个配置开关

Electron Builder 当前 NSIS 目标没有暴露一个可安全开启的多线程解码选项。自定义多线程 archive 或 NSIS plugin 会连带改变 updater、签名、错误恢复和卸载边界，应视为新安装器实现。

在保留标准安装器的前提下，减少归档字节、物理文件和重复复制通常是风险更低的优化方式。
