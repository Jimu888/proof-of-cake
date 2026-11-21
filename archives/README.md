# 生日 3D 测试版归档

归档日期为 2026-11-21。这里保留平台开发之前、已上传 GitHub 的生日三维演示代码，方便回看与复现。

| 项目 | 内容 |
| --- | --- |
| 压缩包 | [birthday-3d-test-8889adc.zip](birthday-3d-test-8889adc.zip) |
| 源提交 | `8889adc49dbfd693b7a55e7c62d501e86a33ae7a` |
| 对应标签 | `birthday-3d-test-v0.1` |
| 包大小 | 34,660,017 字节 |
| SHA-256 | `aebe8d3588a307bcfa0eb20d3d6b4d0216eff876e2e3935eda2e7b163c21a547` |

ZIP 从该提交直接导出，保留当时全部顶层文件和目录，省略 `design-demos/` 的历史设计稿及截图以减少体积。完整历史可以通过标签取回。压缩包包含源码、原始 GLB、封面、本地 Draco 解码器、依赖锁文件和当时的项目文档。解压后使用 Node.js 24 执行 `npm ci`、`npm run dev`，进入 `/receive` 查看。`npm run build:birthday` 可生成独立静态版本，产物位于 `delivery/birthday-demo/`。

这个包对应首次接入生日模型的测试基线。之后的完整环境模型、手机优化、星光、手写祝福和个例主网发行记录随当前代码与文档保留。复现最终生日页面应查阅 `docs/releases/BIRTHDAY_DEMO.md` 和当前 `src/components/birthday-*`。包内文档描述归档时的历史状态。

归档由 Git 已跟踪文件生成，环境配置、运行数据库、密钥和本地交付目录独立保存在开发机。平台后续开发以仓库 `main` 为入口。
