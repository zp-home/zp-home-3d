---
title: DSH Market
summary: 对 DSH Market 上游仓库的公开 Fork 与集成研究记录；保留安装来源、版本身份和 Desktop 宿主边界，不冒充个人原创项目。
date: 2026-08-23
tags: [TypeScript, Plugin Ecosystem, Search, Desktop]
featured: false
role: 上游 Fork / 研究
status: 跟踪上游
image: /images/project-market.webp
repository: https://github.com/dsh-market/dsh-market
website: https://dshmarket.com
---

这个页面刻意不写成“我开发了一个插件市场”。`zp-home/dsh-market` 是 `dsh-market/dsh-market` 的公开 Fork，当前没有可以归因给 `zp-home` 的独立作者提交。保留它是为了记录我在 Desktop 与生态目录集成时研究过的边界，而不是把上游功能当作个人成果。

## 实际遇到的集成问题

Desktop 内置 Market 时，应用依赖图中已经有运行版本，但用户 Profile dependencies 中没有对应条目。结果是 Market 可以运行，却无法在自己的更新检查中发现自身。这个问题最终在 DSH Desktop [Issue #506](https://github.com/anywhere-labs/dsh-desktop/issues/506) 与已合并 [PR #507](https://github.com/anywhere-labs/dsh-desktop/pull/507) 中解决，而不是提交到这个 Fork。

这次排查让我明确了三个必须分开的身份：宿主提供的运行包、Profile 本地安装包、目录中可发现但尚不可安装的条目。浏览来源可以接受更丰富的社区元数据；真正安装前仍应独立验证 npm 包名、精确版本、仓库回链、完整性和生命周期脚本。`dsh-recommend` 接入 Market 的提案也因此只请求可选目录来源，不请求默认选择、安全背书或远程执行安装命令。

## 为什么不再作为首页重点项目

上游 Fork、研究记录和已合并到另一个仓库的修复都值得保留，但它们不等于这个 Fork 有独立交付。网站将它从 featured 项目中移出；后续只有出现明确、公开且可归因的提交，才会补充为具体贡献案例。
