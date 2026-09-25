---
title: Astah Diagram Automation
summary: 用 Astah Java API 在事务中创建、修改和校验 .asta UML 图，避免直接编辑二进制工程文件。
date: 2026-08-25
tags: [UML, Astah, Java, Automation]
featured: true
kind: Modeling Skill
repository: https://github.com/zp-home/astah-diagram-automation
skillhub:
  url: https://skillhub.cn/skills/astah-diagram-automation
  version: 1.0.0
  downloads: 37
  stars: 1
  installs: 0
triggers: [Astah 自动化, UML 建模, 类图生成, 时序图自动化, .asta 校验]
---

UML 建模最容易做错的自动化方式，是把 `.asta` 当成文本去修改。它不是 XML 或 JSON，而是 Astah 的二进制工程数据；直接编辑通常只会得到一个无法打开的文件。

这项 Skill 固定了另一条路径：用 Java 程序调用 Astah API 打开工程，在事务中创建或删除模型元素与图形表示，保存后再运行校验程序确认结果。它覆盖类图、组件图、SoftBlock 图、时序图和鲁棒图。

## 流程约束

- **先看再改。** 使用 `DumpAstah` 输出包、图、类和 presentation 数量，确认目标位置，而不是凭猜测写入。
- **写前备份。** 以可写方式打开之前，先按时间戳复制目标 `.asta` 文件。
- **模型与表示分开处理。** 创建模型元素不等于它已经出现在图上，两者必须分别创建和检查。
- **改完重新打开。** 保存后重新读取工程，确认模型对象、关系和可视节点均可访问。
- **按图类型校验。** 时序图等结构变更后运行 `VerifySequenceBoundaries` 一类的验证器，不能把布局成功当作 UML 语义正确。

工具源码集中在 `asta_tools/`，编译和运行时显式传入 `astah-api.jar` 与 `astah-pro.jar` 路径。这样换机器或 Astah 版本不匹配时会明确失败，而不是悄悄生成一张空图。
