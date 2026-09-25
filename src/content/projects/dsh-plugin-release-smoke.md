---
title: DSH Plugin Engineering Workflow
summary: 围绕插件创建、升级、测试和发布，补齐命名冲突检查、引导式工作流、Docker 冷启动与配对评测，把 Skill 说明变成可执行的证据链。
date: 2026-09-08
tags: [Docker, Node.js, Agent Skills, Evaluation]
featured: true
role: 开源贡献者
status: 持续协作
image: /images/project-dsh-plugin-upgrade-skill.png
repository: https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill
---

这项工作属于 `oh-my-dsh/dsh-plugin-upgrade-skill` 组织仓库，不是我的独立项目。最初我通过 [PR #34](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/34) 为 `plugin-test` 增加 Docker release smoke runner；随后工作范围继续扩展到插件命名、中央注册表、生命周期编排和 Skill 配对评测。

## 从一个测试工具扩展为工程工作流

- [PR #34](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/34) 把打包产物的精确版本冷启动变成可重复执行的 Docker 冒烟测试，修改 6 个文件、增加 972 行。
- [PR #36](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/36) 为 `plugin-write` 增加离线命名校验与中央注册表只读查询，修改 13 个文件、增加 1,721 行。
- [PR #87](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/87) 和 [PR #88](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/88) 增加引导式生命周期编排与运行前菜单，让一次插件任务先明确目标、验证范围和权限边界。
- [PR #112](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/112) 提交 Claude Code + Opus 5 的有 Skill / 无 Skill 配对阶段报告，保留任务级得分与基准设施缺陷，而不是只报告平均分。

这些改动已经合并。当前 [PR #190](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/pull/190) 正在进一步接通中央注册表：默认完成离线校验和只读查询，保留原始索引 SHA-256，并把本地仓库写入与外部发布拆成两个授权边界。它仍在审查中，因此这里将其标为进行中的工作。

## 原来的问题：规则写得很完整，但每次仍要手工测试

`plugin-test` 已经要求发布前使用打包产物、精确 DSH 版本、隔离 Profile 和真实入口做冷启动验证。然而仓库只有规范和一次性 Docker 命令，没有一个工具负责临时目录、容器生命周期、退出码、资源采样、日志脱敏和报告格式。

结果是同一个升级任务在不同机器上会得到完全不同的“验证证据”：有人只跑构建，有人挂本地源码，有人启动后没有检查退出，还有人把含 token 的原始日志直接保存。规范能够指导人工操作，却不能稳定产出可比较、机器可读的结果。

## 为什么拆成宿主侧与容器侧

宿主侧 `docker-release-smoke.mjs` 负责验证结构化配置、计算插件 tarball SHA-256、创建临时目录、只读挂载输入、采样 `docker stats`、分类失败并生成 JSON/Markdown 报告。无论成功或失败，都在 `finally` 路径清理容器、原始日志和隔离 Profile。

容器侧 `container-runner.mjs` 负责另一组不能交给宿主猜测的事实：安装精确 pnpm 与 `@deepseek-ai/dsh` 版本，读取实际解析到的 package metadata，再通过真实 `dsh plugin --profile ... add` 安装 tarball，冷启动配置的 DSH 入口，执行可选 argv 探针并验证 SIGTERM 退出。

所有外部命令都以 argv 执行，不拼接 shell 字符串；输入包只读挂载。这样不仅降低注入风险，也让报告能准确保存“执行了哪个程序和哪些参数”，而不是一段难以重新解析的命令文本。

## 一次失败的探针比一次顺利通过更有价值

第一次实际验证使用 HTTP 探针访问 DSH 页面，但没有携带启动时生成的页面 token。runner 正确把它归类为 `probe` 失败，并把启动 URL 中的 token 替换成 `[REDACTED]`。

我没有把这个失败改写成“服务启动失败”。容器日志已经证明 Host 正常冷启动，问题是探针没有满足认证协议。最终临时测试改为 TCP 连通性检查，验证发布包能否安装、监听和退出；需要验证页面业务行为时，仍应另写理解 token/认证流程的功能探针或浏览器测试。

## 实际验证结果

最终 Docker 运行使用 `node:24-bookworm`、pnpm `11.24.0` 和 `@deepseek-ai/dsh@0.1.2-alpha.2`：

- 临时插件 tarball 经真实插件命令安装并激活。
- `dsh web --no-open` 冷启动与 TCP 探针通过。
- SIGTERM 清理通过，容器退出码为 0。
- 6 项 runner 单测与仓库完整测试通过。
- 总耗时 94,113 ms，采集 45 个资源样本。
- 报告保留插件包、容器镜像和脱敏 JSON 的 SHA-256，原始日志不提交到仓库。

资源样本只用于发现明显异常。离散的 `docker stats --no-stream` 峰值不能写成性能基准，也不能据此比较不同插件的性能。

## 没有被这个 runner 解决的问题

当前流程没有覆盖真实供应商凭据、浏览器端功能、完整安全扫描、多操作系统与多 DSH 版本矩阵。使用带版本标签的镜像也不等于镜像内容永久不变；要求完全不可变复现时仍应固定 digest。私有依赖的注册表凭据注入同样不在本 PR 范围内。

这项贡献的价值不是“用了 Docker”，而是把发布前一句抽象要求拆成可执行步骤、失败分类、清理责任和可公开证据，同时清楚写出它不能证明什么。
