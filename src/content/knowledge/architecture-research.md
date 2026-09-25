---
title: 开源技术选型需要留下可反驳的证据
summary: 从搜索候选到形成架构决策，如何避免只凭星数、印象或单个 Demo 做选择。
date: 2026-08-12
tags: [Architecture, Open Source, Research, ADR]
featured: false
readingTime: 7 min
reactionIssue: 1
source: https://github.com/zp-home/architecture-open-source-research
---

开源调研最常见的问题不是找不到候选，而是候选之间缺少同一尺度的比较。星数可以表示关注度，却不能说明许可证、维护能力、接口稳定性或和当前系统的边界是否匹配。

## 一份可用的调研记录

至少应该包含：

- 仓库与发布包的真实身份。
- License、维护节奏和安全状态。
- 核心能力实际落在哪些模块。
- 需要复用、改造或隔离的具体边界。
- 放弃其他候选的原因。
- 验证假设所需的最小实验。

好的技术选型不是让结论显得确定，而是让后来的人可以检查证据、反驳假设并在条件变化后更新决定。
