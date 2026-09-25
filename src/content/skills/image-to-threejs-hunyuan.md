---
title: Image to Three.js with Hunyuan3D
summary: 将单张或多视角图片转换为 GLB，并交付经过浏览器验证的 Three.js / React Three Fiber 页面。
date: 2026-08-25
tags: [Hunyuan3D, Three.js, 3D, Visual QA]
featured: true
kind: 3D Pipeline Skill
skillhub:
  url: https://skillhub.cn/skills/image-to-threejs-hunyuan
  version: 1.0.3
  downloads: 107
  stars: 2
  installs: 0
triggers: [图片转 3D, GLB 生成, Three.js 页面]
---

这项 Skill 连接图片预处理、Hunyuan3D 推理、GLB 检查和 Web 端展示，不把模型生成结束当作最终交付。

## 工作流

1. 检查输入图片、视角顺序、背景和可见结构。
2. 使用本地 Hunyuan3D，或在明确配置后调用云端提供方。
3. 校验网格、材质、纹理、坐标轴、尺寸和文件体积。
4. 在 Three.js 或 React Three Fiber 中配置相机、PBR 灯光、控制器和加载状态。
5. 用真实浏览器截图、画布像素和桌面/移动视口检查非空渲染与构图。

单张图片只能推断不可见结构，不等同于精确测量重建。本地路径需要 Python、模型权重和 NVIDIA CUDA 环境；显存受限时应降低纹理与网格预算。
