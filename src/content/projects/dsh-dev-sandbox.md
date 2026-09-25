---
title: DSH Dev Sandbox
summary: 为了解决“测试一个坏插件会连开发环境一起破坏”的问题，构建可销毁的 DSH Web 镜像，并处理 Profile、进程和凭据继承边界。
date: 2026-08-21
tags: [Developer Tools, Sandbox, Plugin, Automation]
featured: false
role: 个人项目
status: 开发工具
image: /images/project-dev-sandbox.png
repository: https://github.com/zp-home/dsh-dev-sandbox
---

这个项目不是从“需要一个沙盒面板”开始的，而是从一次反复出现的开发困境开始：插件新增 patch 行后要重启 Host，坏插件可能让当前 Profile 无法组合；此时负责修复它的 Agent、会话和工具也在同一个被破坏的实例里。

## 问题一：测试环境和开发本体共享了太多状态

最初需要隔离的不只是端口。DSH 的会话、storage、settings、Profile bundle 和包链接都可能影响复现结果。只换一个端口启动 `dsh web`，仍然会把本机配置、上一次运行残留和当前插件组合带进测试。

因此每个沙盒拥有独立的 `DSH_HOME`、端口、Profile、会话与日志目录。待测插件通过 junction 挂入隔离 Profile；销毁实例时删除整棵隔离目录。需要复现“纯净环境正常、本机组合失败”时，可以镜像当前 Web Profile 的 bundle 与包链接，但不会复制 session、storage、缓存和凭据。

## 问题二：不能猜 `profiles/web`，也不能随手调用环境里的 pnpm

接入 Desktop 时，我发现外部插件很容易做出四个错误假设：写死 `profiles/web`、调用 PATH 中偶然存在的 pnpm、跨 Host generation 保存 service 引用，以及本地构建失败后仍启动镜像。

在 [Desktop Issue #427](https://github.com/anywhere-labs/dsh-desktop/issues/427) 和 [PR #428](https://github.com/anywhere-labs/dsh-desktop/pull/428) 中，我把实现收敛到公开服务边界：

- 从 `desktopProfiles.current.dir` 取得 Desktop 真正选中的 Profile，而不是猜目录。
- 让 `desktopProfiles` 与 `desktopPnpm` 位于同一个 nested injection，使任一服务卸载时 adapter 同步结束。
- 只有显式本地 checkout 构建才调用 `desktopPnpm.run()`，并为输出 drain、deadline、cancel 与 `done` 完成建立完整生命周期。
- 构建非零退出、被 signal 终止或 Promise reject 时不再继续启动镜像。

参考实现通过了 typecheck、10 项测试、构建和 clean mirror 验证。上游文档 PR 仍是 open，所以网站只把它写作“已验证的公开方案”，不写成 Desktop 已交付能力。

## 问题三：源码检出和全局安装的 CLI 入口不同

早期实现只能从源码仓库的 `apps/cli/src/bin.ts` 启动。当插件安装到 npm 版 DSH 后，这个路径不存在。后续修复把定位顺序扩展为 cwd、启动中的 CLI 与插件依赖：源码检出使用 `tsx/esm` 入口，全局安装读取 `@deepseek-ai/dsh` 声明的编译 CLI。启动失败时回收子进程，停止先发 SIGTERM，超时后再强制结束，并用持久状态文件在宿主重启后校正“看起来仍在运行”的旧 PID。

## 最终提供的工作流

- GUI 中扫描插件构建产物、创建、启动、重启、查看日志和销毁镜像。
- 通过 `sandbox_start`、`sandbox_logs`、`sandbox_verify` 等工具让 Agent 驱动同一流程。
- clean 验证可以输出脱敏的 compatibility attestation；本机路径、Profile bundles 与原始日志只保留为诊断信息。
- 控制路由只接受回环请求。宿主 API/模型继承默认可用，但可以关闭；它是显式能力，不是“沙盒天然安全”的假设。

## 仍然存在的边界

沙盒是真实进程，会占用端口、CPU 和磁盘；`destroy` 是不可逆删除。它验证的是 DSH Web 镜像，不是第二个 Electron 应用，也不能替代安装包、原生窗口、签名和平台权限测试。当前 [Settings workbench PR #1](https://github.com/zp-home/dsh-dev-sandbox/pull/1) 已通过 11 项测试与人工 Desktop 验证，但仍在项目分支中评审。
