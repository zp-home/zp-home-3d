# zp-home-3d

[zp-home](https://zp-home.github.io/) 的 3D 演示版：7 页全屏幻灯片，three.js 场景随翻页切换机位。

在线地址：https://zp-home.github.io/zp-home-3d/

## 本地开发

需要 Node.js 24 及 npm。

```bash
npm ci
npm run dev
```

本地地址为 `http://localhost:4321/zp-home-3d/`。

## 内容来源

`src/content/` 下的项目、Skill、知识文章与主站 [zp-home.github.io](https://github.com/zp-home/zp-home.github.io) 同构，页面里的项目卡片、统计数字都从这里读取。主站内容更新后，把对应 Markdown 和 `public/images/` 下的图片同步过来即可。

页面中「阅读完整案例」「进入项目档案」「查看 Skills」等链接指向主站对应页面。

## 部署

推送到 `main` 后由 `.github/workflows/deploy.yml` 构建并发布到 GitHub Pages（Pages 来源为 GitHub Actions）。
