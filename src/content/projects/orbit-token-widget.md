---
title: Orbit Token Widget
summary: Windows 桌面常驻的 token 用量气泡，数字底下烧着一排火焰，火势由实时消耗速率驱动。纯 PowerShell + WinForms。
date: 2026-08-28
tags: [PowerShell, WinForms, Windows, Desktop]
featured: true
role: 个人项目
status: 日常在用
image: /images/project-orbit-token-widget.png
repository: https://github.com/zp-home/orbit-token-widget
---

一个常驻桌面的小气泡，显示当天的 token 用量和花费。整个程序就一个 `widget.ps1`，没有运行时依赖——系统自带的 PowerShell 5.1 就能跑，不用装 Node，也不用打包。

## 几个刻意的选择

- **数字连续爬升，而不是每次轮询跳一格。** 把整个轮询间隔铺满匀速插值，看起来像在实时燃烧，而不是一个定时刷新的表格。
- **火焰强度绑定真实速率。** 数字底下那排火苗的高度直接由当前烧 token 的速率驱动，烧得猛就火光冲天，闲下来完全熄灭——这是一个瞟一眼就懂的状态指示，不需要读数。
- **无任务栏图标、置顶、可拖动、位置自动记忆。** 它要一直在那儿，但不占据窗口列表。
- **首次配置走 CDP 取 token。** 点一下打开浏览器登录，脚本直接读走 `refresh_token`，不用手动复制粘贴。

## 结构

`widget.ps1` 一个文件装下 UI、动画、鉴权和轮询；两个 `.vbs` 负责无控制台窗口启动和重启；`shoot_widget.ps1` 是调试用的窗口截图工具，本页这张图就是它拍的。
