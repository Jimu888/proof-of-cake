# 第二轮：作者风格探索

用户否定首轮后重新制作的三个可点击原型：

- existence.html：存在证明，银色生日雕塑与巨字海报。
- only-you.html：只给你，朱红色单向赠予宣言。
- specimen-garden.html：怪诞标本园，自由排布、可拖动和选择作品。

比较入口：index.html。与第一轮共用同一个本地服务器：

```sh
python3 -m http.server 3188 --bind 127.0.0.1 --directory design-demos
```

打开 http://127.0.0.1:3188/round-2/index.html 。HTML、prototype.js、assets 必须保持相对位置。选择作品、输入名字、预览礼物与本地分享均为演示，没有钱包、付款或 NFT 操作。

## 设计方法与证据

本轮用户明确允许 Impeccable、Hallmark。方法、工具运行边界和修正记录见 review.md。Hallmark 静态检查通过；其渲染依赖不可用，已另用 Playwright 实测。Impeccable 加载器执行被系统拒绝，按文档直接阅读上下文并应用手册，没有宣称完整 detector 或独立评审流程完成。

## 素材

assets/chrome-candle.png：内置 ImageGen 生成的透明背景雕塑。提示词见 assets/image-prompt.md。

assets/wild-wish.svg、little-sun.svg：程序绘制的概念图形。均非用户原作或在售作品。

字体由 Google Fonts 官方字体库取得并自托管，SIL OFL 授权见 assets/FONT-LICENSES.txt，来源见 assets/font-sources.json。

## 验证

scripts/design_round2_qa.py：320、375、768、1280、1440、1920 六个宽度；赠送预览、输入校验、作品切换、拖动、本地分享、减少动态、控制台及桌面首屏动作。需 Python Playwright、Chromium 和本地服务器；不加入基础 API CI 的依赖。

待用户选方向后，记录选择，再集成到正式 Next.js 前端。
