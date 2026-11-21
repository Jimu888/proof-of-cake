# 仓库逐文件说明

更新于 2026-11-21。每个入库文件占一行。阅读当前实现先看 `AI_HANDOFF.md`，历史原型可按需查看。运行时数据库、环境文件、依赖与构建产物由忽略规则管理。新增、删除或移动文件时请同步本索引。

本索引覆盖 470 个文件，包括本文件。压缩包内部清单由归档源提交确定，见 `archives/README.md`。

## .github

| 文件 | 用途 |
| --- | --- |
| `.github/workflows/ci.yml` | GitHub Actions 验证工作流，安装依赖、类型检查、业务及合约测试、生产构建 |

## archives

| 文件 | 用途 |
| --- | --- |
| `archives/README.md` | 旧生日三维测试包的源提交、范围、校验值和复现方式 |
| `archives/birthday-3d-test-8889adc.zip` | 提交 8889adc 的生日三维测试源码包，含 GLB 与依赖锁文件，省略历史设计稿 |

## assets

| 文件 | 用途 |
| --- | --- |
| `assets/README.md` | 原创素材及授权资料的预留目录说明 |

## contracts

| 文件 | 用途 |
| --- | --- |
| `contracts/README.md` | 生日个例和平台测试合约的用途及验证入口 |
| `contracts/birthday/MementBirthday.sol` | 生日个例单枚不可转让 NFT 合约，发行者直接铸造、持有人按规则销毁 |
| `contracts/platform/MementTestGift.sol` | 平台测试赠礼合约，固定价格与版数、付款铸造、订单防重、可提分成和转让/销毁规则 |
| `contracts/platform/test-gift.artifact.json` | 平台测试合约 ABI 与部署字节码，合约测试检查其与当前源码一致 |

## design-demos

| 文件 | 用途 |
| --- | --- |
| `design-demos/README.md` | 初轮设计与参考的说明、选择状态及检查记录 |
| `design-demos/assets/study-1.svg` | 初轮设计与参考独立矢量插画 study-1 |
| `design-demos/assets/study-2.svg` | 初轮设计与参考独立矢量插画 study-2 |
| `design-demos/assets/study-3.svg` | 初轮设计与参考独立矢量插画 study-3 |
| `design-demos/birthday-minimal/README.md` | 生日极简页面的说明、选择状态及检查记录 |
| `design-demos/birthday-minimal/edge-report.json` | 生日极简页面的自动验收结果 edge-report.json |
| `design-demos/birthday-minimal/qa-report.json` | 生日极简页面的自动验收结果 qa-report.json |
| `design-demos/birthday-minimal/screenshots/sealed-1440-next.png` | 生日极简页面的浏览器截图 sealed-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-minimal/screenshots/sealed-390-next.png` | 生日极简页面的浏览器截图 sealed-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-minimal/screenshots/sealed-390-static.png` | 生日极简页面的浏览器截图 sealed-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-minimal/screenshots/world-1440-next.png` | 生日极简页面的浏览器截图 world-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-minimal/screenshots/world-390-next.png` | 生日极简页面的浏览器截图 world-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-minimal/screenshots/world-390-static.png` | 生日极简页面的浏览器截图 world-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/README.md` | 生日手机优化的说明、选择状态及检查记录 |
| `design-demos/birthday-mobile/final-mobile-390.png` | 生日手机优化的浏览器截图 final-mobile-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/loading-qa.json` | 生日手机优化的自动验收结果 loading-qa.json |
| `design-demos/birthday-mobile/mobile-1440x900.png` | 生日手机优化的浏览器截图 mobile-1440x900，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-320x568.png` | 生日手机优化的浏览器截图 mobile-320x568，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-360x640.png` | 生日手机优化的浏览器截图 mobile-360x640，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-390x844.png` | 生日手机优化的浏览器截图 mobile-390x844，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-430x932.png` | 生日手机优化的浏览器截图 mobile-430x932，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-667x375.png` | 生日手机优化的浏览器截图 mobile-667x375，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-768x1024.png` | 生日手机优化的浏览器截图 mobile-768x1024，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/mobile-844x390.png` | 生日手机优化的浏览器截图 mobile-844x390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/network-fallback.png` | 生日手机优化的浏览器截图 network-fallback，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/published-mobile-390.png` | 生日手机优化的浏览器截图 published-mobile-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-mobile/qa-report.json` | 生日手机优化的自动验收结果 qa-report.json |
| `design-demos/birthday-model-update/published-mobile.png` | 生日模型更新的浏览器截图 published-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-model-update/qa-report.json` | 生日模型更新的自动验收结果 qa-report.json |
| `design-demos/birthday-motion/qa-report.json` | 生日动效迭代的自动验收结果 qa-report.json |
| `design-demos/birthday-motion/screenshots/archive-check-3191.png` | 生日动效迭代的浏览器截图 archive-check-3191，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/archive-check-3192.png` | 生日动效迭代的浏览器截图 archive-check-3192，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/nft-pending-1440.png` | 生日动效迭代的浏览器截图 nft-pending-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/nft-pending-390.png` | 生日动效迭代的浏览器截图 nft-pending-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/published-jihua-zhiwai-mobile.png` | 生日动效迭代的浏览器截图 published-jihua-zhiwai-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/sealed-1440-next.png` | 生日动效迭代的浏览器截图 sealed-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/sealed-390-next.png` | 生日动效迭代的浏览器截图 sealed-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/sealed-390-static.png` | 生日动效迭代的浏览器截图 sealed-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/world-1440-next.png` | 生日动效迭代的浏览器截图 world-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/world-390-next.png` | 生日动效迭代的浏览器截图 world-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-motion/screenshots/world-390-static.png` | 生日动效迭代的浏览器截图 world-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/edge-report.json` | 生日三维首次发布的自动验收结果 edge-report.json |
| `design-demos/birthday-release/qa-report.json` | 生日三维首次发布的自动验收结果 qa-report.json |
| `design-demos/birthday-release/screenshots/sealed-1440-next.png` | 生日三维首次发布的浏览器截图 sealed-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/screenshots/sealed-390-next.png` | 生日三维首次发布的浏览器截图 sealed-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/screenshots/sealed-390-static.png` | 生日三维首次发布的浏览器截图 sealed-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/screenshots/world-1440-next.png` | 生日三维首次发布的浏览器截图 world-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/screenshots/world-390-next.png` | 生日三维首次发布的浏览器截图 world-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-release/screenshots/world-390-static.png` | 生日三维首次发布的浏览器截图 world-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-roof-detail/README.md` | 生日车顶细节优化的说明、选择状态及检查记录 |
| `design-demos/birthday-roof-detail/published-mobile.png` | 生日车顶细节优化的浏览器截图 published-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-roof-detail/qa-report.json` | 生日车顶细节优化的自动验收结果 qa-report.json |
| `design-demos/birthday-roof-detail/zoomed-320x568.png` | 生日车顶细节优化的浏览器截图 zoomed-320x568，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-roof-detail/zoomed-390x844.png` | 生日车顶细节优化的浏览器截图 zoomed-390x844，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-roof-detail/zoomed-844x390.png` | 生日车顶细节优化的浏览器截图 zoomed-844x390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/edge-report.json` | 生日连续开箱的自动验收结果 edge-report.json |
| `design-demos/birthday-seamless/qa-report.json` | 生日连续开箱的自动验收结果 qa-report.json |
| `design-demos/birthday-seamless/screenshots/scene-1440-next.png` | 生日连续开箱的浏览器截图 scene-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/scene-390-next.png` | 生日连续开箱的浏览器截图 scene-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/scene-390-static.png` | 生日连续开箱的浏览器截图 scene-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/sealed-1440-next.png` | 生日连续开箱的浏览器截图 sealed-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/sealed-390-next.png` | 生日连续开箱的浏览器截图 sealed-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/sealed-390-static.png` | 生日连续开箱的浏览器截图 sealed-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-seamless/screenshots/unfolding-1440.png` | 生日连续开箱的浏览器截图 unfolding-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/README.md` | 生日星点与上下拖动的说明、选择状态及检查记录 |
| `design-demos/birthday-sky-pitch/opened-1440.png` | 生日星点与上下拖动的浏览器截图 opened-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/opened-320.png` | 生日星点与上下拖动的浏览器截图 opened-320，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/opened-390.png` | 生日星点与上下拖动的浏览器截图 opened-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/published-mobile.png` | 生日星点与上下拖动的浏览器截图 published-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/qa-report.json` | 生日星点与上下拖动的自动验收结果 qa-report.json |
| `design-demos/birthday-sky-pitch/sealed-1440.png` | 生日星点与上下拖动的浏览器截图 sealed-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/sealed-320.png` | 生日星点与上下拖动的浏览器截图 sealed-320，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-sky-pitch/sealed-390.png` | 生日星点与上下拖动的浏览器截图 sealed-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/README.md` | 生日统一场景的说明、选择状态及检查记录 |
| `design-demos/birthday-unified/edge-report.json` | 生日统一场景的自动验收结果 edge-report.json |
| `design-demos/birthday-unified/qa-report.json` | 生日统一场景的自动验收结果 qa-report.json |
| `design-demos/birthday-unified/screenshots/lid-open-1440.png` | 生日统一场景的浏览器截图 lid-open-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/parcel-1440-next.png` | 生日统一场景的浏览器截图 parcel-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/parcel-390-next.png` | 生日统一场景的浏览器截图 parcel-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/parcel-390-static.png` | 生日统一场景的浏览器截图 parcel-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/world-1440-next.png` | 生日统一场景的浏览器截图 world-1440-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/world-390-next.png` | 生日统一场景的浏览器截图 world-390-next，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/world-390-static.png` | 生日统一场景的浏览器截图 world-390-static，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/birthday-unified/screenshots/world-emerging-1440.png` | 生日统一场景的浏览器截图 world-emerging-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/brand-spec.md` | 初轮设计与参考的设计说明或过程记录 brand-spec |
| `design-demos/dir-1.html` | 初轮设计与参考可独立打开的静态原型 dir-1 |
| `design-demos/dir-2.html` | 初轮设计与参考可独立打开的静态原型 dir-2 |
| `design-demos/dir-3.html` | 初轮设计与参考可独立打开的静态原型 dir-3 |
| `design-demos/direction-approved.md` | 初轮设计与参考的设计说明或过程记录 direction-approved |
| `design-demos/directions.md` | 初轮设计与参考的设计说明或过程记录 directions |
| `design-demos/index.html` | 初轮设计与参考可独立打开的静态原型 index |
| `design-demos/qa-report.json` | 初轮设计与参考的自动验收结果 qa-report.json |
| `design-demos/references/web-reference-board-1.jpg` | 初轮设计与参考的参考或方向图像 web-reference-board-1 |
| `design-demos/references/web-reference-board-2.jpg` | 初轮设计与参考的参考或方向图像 web-reference-board-2 |
| `design-demos/references/web-reference-board.jpg` | 初轮设计与参考的参考或方向图像 web-reference-board |
| `design-demos/round-10-crypto-logos/README.md` | 第十轮加密文化 Logo的说明、选择状态及检查记录 |
| `design-demos/round-10-crypto-logos/qa-report.json` | 第十轮加密文化 Logo的自动验收结果 qa-report.json |
| `design-demos/round-10-crypto-logos/screenshots/all-directions-1440.png` | 第十轮加密文化 Logo的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-10-crypto-logos/screenshots/all-directions-390.png` | 第十轮加密文化 Logo的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-10-crypto-logos/screenshots/overview-1440.png` | 第十轮加密文化 Logo的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-10-crypto-logos/screenshots/overview-390.png` | 第十轮加密文化 Logo的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-11-abstract-logos/README.md` | 第十一轮抽象 Logo的说明、选择状态及检查记录 |
| `design-demos/round-11-abstract-logos/qa-report.json` | 第十一轮抽象 Logo的自动验收结果 qa-report.json |
| `design-demos/round-11-abstract-logos/screenshots/all-directions-1440.png` | 第十一轮抽象 Logo的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-11-abstract-logos/screenshots/all-directions-390.png` | 第十一轮抽象 Logo的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-11-abstract-logos/screenshots/overview-1440.png` | 第十一轮抽象 Logo的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-11-abstract-logos/screenshots/overview-390.png` | 第十一轮抽象 Logo的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-12-gift-crypto/README.md` | 第十二轮礼物符号与加密变化的说明、选择状态及检查记录 |
| `design-demos/round-12-gift-crypto/qa-report.json` | 第十二轮礼物符号与加密变化的自动验收结果 qa-report.json |
| `design-demos/round-12-gift-crypto/screenshots/all-directions-1440.png` | 第十二轮礼物符号与加密变化的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-12-gift-crypto/screenshots/all-directions-390.png` | 第十二轮礼物符号与加密变化的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-12-gift-crypto/screenshots/overview-1440.png` | 第十二轮礼物符号与加密变化的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-12-gift-crypto/screenshots/overview-390.png` | 第十二轮礼物符号与加密变化的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-13-pixel-bows/README.md` | 第十三轮像素蝴蝶结的说明、选择状态及检查记录 |
| `design-demos/round-13-pixel-bows/qa-report.json` | 第十三轮像素蝴蝶结的自动验收结果 qa-report.json |
| `design-demos/round-13-pixel-bows/screenshots/all-directions-1440.png` | 第十三轮像素蝴蝶结的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-13-pixel-bows/screenshots/all-directions-390.png` | 第十三轮像素蝴蝶结的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-13-pixel-bows/screenshots/overview-1440.png` | 第十三轮像素蝴蝶结的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-13-pixel-bows/screenshots/overview-390.png` | 第十三轮像素蝴蝶结的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-14-gift-symbols/README.md` | 第十四轮像素礼盒/吊牌/信封的说明、选择状态及检查记录 |
| `design-demos/round-14-gift-symbols/qa-report.json` | 第十四轮像素礼盒/吊牌/信封的自动验收结果 qa-report.json |
| `design-demos/round-14-gift-symbols/screenshots/all-directions-1440.png` | 第十四轮像素礼盒/吊牌/信封的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-14-gift-symbols/screenshots/all-directions-390.png` | 第十四轮像素礼盒/吊牌/信封的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-14-gift-symbols/screenshots/overview-1440.png` | 第十四轮像素礼盒/吊牌/信封的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-14-gift-symbols/screenshots/overview-390.png` | 第十四轮像素礼盒/吊牌/信封的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/README.md` | 第二轮作者风格原型的说明、选择状态及检查记录 |
| `design-demos/round-2/assets/FONT-LICENSES.txt` | 第二轮作者风格原型字体或素材许可 |
| `design-demos/round-2/assets/chrome-candle.png` | 第二轮作者风格原型的参考或方向图像 chrome-candle |
| `design-demos/round-2/assets/font-sources.json` | 第二轮作者风格原型字体来源索引 |
| `design-demos/round-2/assets/fonts-inline.css` | 第二轮作者风格原型自托管字体的内联样式 |
| `design-demos/round-2/assets/hanken.ttf` | 第二轮作者风格原型原型自托管字体 hanken |
| `design-demos/round-2/assets/image-prompt.md` | 第二轮作者风格原型的设计说明或过程记录 image-prompt |
| `design-demos/round-2/assets/league-spartan.ttf` | 第二轮作者风格原型原型自托管字体 league-spartan |
| `design-demos/round-2/assets/little-sun.svg` | 第二轮作者风格原型独立矢量插画 little-sun |
| `design-demos/round-2/assets/qingke.ttf` | 第二轮作者风格原型原型自托管字体 qingke |
| `design-demos/round-2/assets/teko.ttf` | 第二轮作者风格原型原型自托管字体 teko |
| `design-demos/round-2/assets/wild-wish.svg` | 第二轮作者风格原型独立矢量插画 wild-wish |
| `design-demos/round-2/direction-approved.md` | 第二轮作者风格原型的设计说明或过程记录 direction-approved |
| `design-demos/round-2/directions.md` | 第二轮作者风格原型的设计说明或过程记录 directions |
| `design-demos/round-2/existence.html` | 第二轮作者风格原型可独立打开的静态原型 existence |
| `design-demos/round-2/hallmark/README.md` | 第二轮作者风格原型的说明、选择状态及检查记录 |
| `design-demos/round-2/hallmark/preflight.json` | 第二轮作者风格原型方向参数或执行前检查记录 |
| `design-demos/round-2/hallmark/static-check.txt` | 第二轮作者风格原型静态检查结果 |
| `design-demos/round-2/index.html` | 第二轮作者风格原型可独立打开的静态原型 index |
| `design-demos/round-2/only-you.html` | 第二轮作者风格原型可独立打开的静态原型 only-you |
| `design-demos/round-2/prototype.js` | 第二轮作者风格原型静态原型的共享交互逻辑 |
| `design-demos/round-2/qa-report.json` | 第二轮作者风格原型的自动验收结果 qa-report.json |
| `design-demos/round-2/review.md` | 第二轮作者风格原型的设计说明或过程记录 review |
| `design-demos/round-2/screenshots/comparison.jpg` | 第二轮作者风格原型的浏览器截图 comparison，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/existence-desktop.png` | 第二轮作者风格原型的浏览器截图 existence-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/existence-gift.png` | 第二轮作者风格原型的浏览器截图 existence-gift，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/existence-mobile.png` | 第二轮作者风格原型的浏览器截图 existence-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/index-1440.png` | 第二轮作者风格原型的浏览器截图 index-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/index-375.png` | 第二轮作者风格原型的浏览器截图 index-375，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/only-you-desktop.png` | 第二轮作者风格原型的浏览器截图 only-you-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/only-you-gift.png` | 第二轮作者风格原型的浏览器截图 only-you-gift，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/only-you-mobile.png` | 第二轮作者风格原型的浏览器截图 only-you-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/specimen-garden-desktop.png` | 第二轮作者风格原型的浏览器截图 specimen-garden-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/specimen-garden-gift.png` | 第二轮作者风格原型的浏览器截图 specimen-garden-gift，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/screenshots/specimen-garden-mobile.png` | 第二轮作者风格原型的浏览器截图 specimen-garden-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-2/spec.md` | 第二轮作者风格原型的设计说明或过程记录 spec |
| `design-demos/round-2/specimen-garden.html` | 第二轮作者风格原型可独立打开的静态原型 specimen-garden |
| `design-demos/round-2/surface-brief.md` | 第二轮作者风格原型的设计说明或过程记录 surface-brief |
| `design-demos/round-3-image-studies/01-cryptographic-specimen.png` | 第三轮密码学视觉图稿的参考或方向图像 01-cryptographic-specimen |
| `design-demos/round-3-image-studies/01-cryptographic-specimen.png.json` | 第三轮密码学视觉图稿中同名图稿的生成参数与记录 |
| `design-demos/round-3-image-studies/02-protocol-paper.png` | 第三轮密码学视觉图稿的参考或方向图像 02-protocol-paper |
| `design-demos/round-3-image-studies/02-protocol-paper.png.json` | 第三轮密码学视觉图稿中同名图稿的生成参数与记录 |
| `design-demos/round-3-image-studies/03-dark-signal.png` | 第三轮密码学视觉图稿的参考或方向图像 03-dark-signal |
| `design-demos/round-3-image-studies/03-dark-signal.png.json` | 第三轮密码学视觉图稿中同名图稿的生成参数与记录 |
| `design-demos/round-3-image-studies/BRIEF.md` | 第三轮密码学视觉图稿的设计说明或过程记录 BRIEF |
| `design-demos/round-3-image-studies/README.md` | 第三轮密码学视觉图稿的说明、选择状态及检查记录 |
| `design-demos/round-3-image-studies/prompts.json` | 第三轮密码学视觉图稿图像生成/修订提示记录 |
| `design-demos/round-4-platform-identity/01-white-index.png` | 第四轮平台与作品风格分离图稿的参考或方向图像 01-white-index |
| `design-demos/round-4-platform-identity/01-white-index.png.json` | 第四轮平台与作品风格分离图稿中同名图稿的生成参数与记录 |
| `design-demos/round-4-platform-identity/02-black-archive.png` | 第四轮平台与作品风格分离图稿的参考或方向图像 02-black-archive |
| `design-demos/round-4-platform-identity/02-black-archive.png.json` | 第四轮平台与作品风格分离图稿中同名图稿的生成参数与记录 |
| `design-demos/round-4-platform-identity/03-free-exhibition.png` | 第四轮平台与作品风格分离图稿的参考或方向图像 03-free-exhibition |
| `design-demos/round-4-platform-identity/03-free-exhibition.png.json` | 第四轮平台与作品风格分离图稿中同名图稿的生成参数与记录 |
| `design-demos/round-4-platform-identity/04-recipient-first.png` | 第四轮平台与作品风格分离图稿的参考或方向图像 04-recipient-first |
| `design-demos/round-4-platform-identity/04-recipient-first.png.json` | 第四轮平台与作品风格分离图稿中同名图稿的生成参数与记录 |
| `design-demos/round-4-platform-identity/BRIEF.md` | 第四轮平台与作品风格分离图稿的设计说明或过程记录 BRIEF |
| `design-demos/round-4-platform-identity/README.md` | 第四轮平台与作品风格分离图稿的说明、选择状态及检查记录 |
| `design-demos/round-4-platform-identity/prompts.json` | 第四轮平台与作品风格分离图稿图像生成/修订提示记录 |
| `design-demos/round-4-platform-identity/references/user-ink-sheep.png` | 第四轮平台与作品风格分离图稿的参考或方向图像 user-ink-sheep |
| `design-demos/round-5-curated-boutique/01-white-curation.png` | 第五轮精品陈列图稿的参考或方向图像 01-white-curation |
| `design-demos/round-5-curated-boutique/01-white-curation.png.json` | 第五轮精品陈列图稿中同名图稿的生成参数与记录 |
| `design-demos/round-5-curated-boutique/02-black-salon.png` | 第五轮精品陈列图稿的参考或方向图像 02-black-salon |
| `design-demos/round-5-curated-boutique/02-black-salon.png.json` | 第五轮精品陈列图稿中同名图稿的生成参数与记录 |
| `design-demos/round-5-curated-boutique/03-editorial-collection.png` | 第五轮精品陈列图稿的参考或方向图像 03-editorial-collection |
| `design-demos/round-5-curated-boutique/03-editorial-collection.png.json` | 第五轮精品陈列图稿中同名图稿的生成参数与记录 |
| `design-demos/round-5-curated-boutique/BRIEF.md` | 第五轮精品陈列图稿的设计说明或过程记录 BRIEF |
| `design-demos/round-5-curated-boutique/README.md` | 第五轮精品陈列图稿的说明、选择状态及检查记录 |
| `design-demos/round-5-curated-boutique/prompts.json` | 第五轮精品陈列图稿图像生成/修订提示记录 |
| `design-demos/round-6-skill-comparison/01-frontend-design.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 01-frontend-design.direction |
| `design-demos/round-6-skill-comparison/01-frontend-design.png` | 第六轮多设计方法对照的参考或方向图像 01-frontend-design |
| `design-demos/round-6-skill-comparison/01-frontend-design.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/02-ui-ux-pro-max.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 02-ui-ux-pro-max.direction |
| `design-demos/round-6-skill-comparison/02-ui-ux-pro-max.png` | 第六轮多设计方法对照的参考或方向图像 02-ui-ux-pro-max |
| `design-demos/round-6-skill-comparison/02-ui-ux-pro-max.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/03-taste-skill.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 03-taste-skill.direction |
| `design-demos/round-6-skill-comparison/03-taste-skill.png` | 第六轮多设计方法对照的参考或方向图像 03-taste-skill |
| `design-demos/round-6-skill-comparison/03-taste-skill.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/04-hallmark.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 04-hallmark.direction |
| `design-demos/round-6-skill-comparison/04-hallmark.png` | 第六轮多设计方法对照的参考或方向图像 04-hallmark |
| `design-demos/round-6-skill-comparison/04-hallmark.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/05-impeccable.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 05-impeccable.direction |
| `design-demos/round-6-skill-comparison/05-impeccable.png` | 第六轮多设计方法对照的参考或方向图像 05-impeccable |
| `design-demos/round-6-skill-comparison/05-impeccable.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/06-huashu-design.direction.md` | 第六轮多设计方法对照的设计说明或过程记录 06-huashu-design.direction |
| `design-demos/round-6-skill-comparison/06-huashu-design.png` | 第六轮多设计方法对照的参考或方向图像 06-huashu-design |
| `design-demos/round-6-skill-comparison/06-huashu-design.png.json` | 第六轮多设计方法对照中同名图稿的生成参数与记录 |
| `design-demos/round-6-skill-comparison/BRIEF.md` | 第六轮多设计方法对照的设计说明或过程记录 BRIEF |
| `design-demos/round-6-skill-comparison/IMPECCABLE-DIRECTION.md` | 第六轮多设计方法对照的设计说明或过程记录 IMPECCABLE-DIRECTION |
| `design-demos/round-6-skill-comparison/README.md` | 第六轮多设计方法对照的说明、选择状态及检查记录 |
| `design-demos/round-6-skill-comparison/RUNS.md` | 第六轮多设计方法对照的设计说明或过程记录 RUNS |
| `design-demos/round-6-skill-comparison/SKILL-INVENTORY.md` | 第六轮多设计方法对照的设计说明或过程记录 SKILL-INVENTORY |
| `design-demos/round-6-skill-comparison/drafts/04-hallmark-v1.png` | 第六轮多设计方法对照的参考或方向图像 04-hallmark-v1 |
| `design-demos/round-6-skill-comparison/drafts/05-impeccable-v1.png` | 第六轮多设计方法对照的参考或方向图像 05-impeccable-v1 |
| `design-demos/round-6-skill-comparison/impeccable-seed.txt` | 第六轮多设计方法对照的设计说明或过程记录 impeccable-seed |
| `design-demos/round-6-skill-comparison/prompts.json` | 第六轮多设计方法对照图像生成/修订提示记录 |
| `design-demos/round-6-skill-comparison/revision-prompts.json` | 第六轮多设计方法对照图像生成/修订提示记录 |
| `design-demos/round-6-skill-comparison/taste/direction.json` | 第六轮多设计方法对照方向参数或执行前检查记录 |
| `design-demos/round-7-implementation/README.md` | 第七轮黑金前端实现的说明、选择状态及检查记录 |
| `design-demos/round-7-implementation/interaction-report.json` | 第七轮黑金前端实现的自动验收结果 interaction-report.json |
| `design-demos/round-7-implementation/qa-report.json` | 第七轮黑金前端实现的自动验收结果 qa-report.json |
| `design-demos/round-7-implementation/screenshots/detail-1440.png` | 第七轮黑金前端实现的浏览器截图 detail-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/detail-390.png` | 第七轮黑金前端实现的浏览器截图 detail-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/home-1440.png` | 第七轮黑金前端实现的浏览器截图 home-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/home-390.png` | 第七轮黑金前端实现的浏览器截图 home-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/letter-1440.png` | 第七轮黑金前端实现的浏览器截图 letter-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/letter-390.png` | 第七轮黑金前端实现的浏览器截图 letter-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/opening-1440.png` | 第七轮黑金前端实现的浏览器截图 opening-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/sealed-1440.png` | 第七轮黑金前端实现的浏览器截图 sealed-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-7-implementation/screenshots/sealed-390.png` | 第七轮黑金前端实现的浏览器截图 sealed-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/README.md` | 第八轮精品陈列与三维包装的说明、选择状态及检查记录 |
| `design-demos/round-8-refinement/brand-lab-source.tsx.txt` | 第八轮精品陈列与三维包装当时页面源码快照，保留历史对照 |
| `design-demos/round-8-refinement/qa-report.json` | 第八轮精品陈列与三维包装的自动验收结果 qa-report.json |
| `design-demos/round-8-refinement/screenshots/brands-1440.png` | 第八轮精品陈列与三维包装的浏览器截图 brands-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/brands-390.png` | 第八轮精品陈列与三维包装的浏览器截图 brands-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/home-1440.png` | 第八轮精品陈列与三维包装的浏览器截图 home-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/home-390.png` | 第八轮精品陈列与三维包装的浏览器截图 home-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/open-3d-1440.png` | 第八轮精品陈列与三维包装的浏览器截图 open-3d-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/open-3d-390.png` | 第八轮精品陈列与三维包装的浏览器截图 open-3d-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/three-1440.png` | 第八轮精品陈列与三维包装的浏览器截图 three-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-8-refinement/screenshots/three-390.png` | 第八轮精品陈列与三维包装的浏览器截图 three-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-9-mement-logos/README.md` | 第九轮 Mement 字标提案的说明、选择状态及检查记录 |
| `design-demos/round-9-mement-logos/brand-lab-source.tsx.txt` | 第九轮 Mement 字标提案当时页面源码快照，保留历史对照 |
| `design-demos/round-9-mement-logos/qa-report.json` | 第九轮 Mement 字标提案的自动验收结果 qa-report.json |
| `design-demos/round-9-mement-logos/screenshots/all-directions-1440.png` | 第九轮 Mement 字标提案的浏览器截图 all-directions-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-9-mement-logos/screenshots/all-directions-390.png` | 第九轮 Mement 字标提案的浏览器截图 all-directions-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-9-mement-logos/screenshots/overview-1440.png` | 第九轮 Mement 字标提案的浏览器截图 overview-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/round-9-mement-logos/screenshots/overview-390.png` | 第九轮 Mement 字标提案的浏览器截图 overview-390，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/comparison.jpg` | 初轮设计与参考的浏览器截图 comparison，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-1-desktop.png` | 初轮设计与参考的浏览器截图 dir-1-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-1-first.png` | 初轮设计与参考的浏览器截图 dir-1-first，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-1-gift-preview.png` | 初轮设计与参考的浏览器截图 dir-1-gift-preview，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-1-mobile.png` | 初轮设计与参考的浏览器截图 dir-1-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-1-tablet.png` | 初轮设计与参考的浏览器截图 dir-1-tablet，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-2-desktop.png` | 初轮设计与参考的浏览器截图 dir-2-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-2-first.png` | 初轮设计与参考的浏览器截图 dir-2-first，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-2-gift-preview.png` | 初轮设计与参考的浏览器截图 dir-2-gift-preview，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-2-mobile.png` | 初轮设计与参考的浏览器截图 dir-2-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-2-tablet.png` | 初轮设计与参考的浏览器截图 dir-2-tablet，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-3-desktop.png` | 初轮设计与参考的浏览器截图 dir-3-desktop，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-3-first.png` | 初轮设计与参考的浏览器截图 dir-3-first，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-3-gift-preview.png` | 初轮设计与参考的浏览器截图 dir-3-gift-preview，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-3-mobile.png` | 初轮设计与参考的浏览器截图 dir-3-mobile，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/dir-3-tablet.png` | 初轮设计与参考的浏览器截图 dir-3-tablet，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/index-1440.png` | 初轮设计与参考的浏览器截图 index-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/index-375.png` | 初轮设计与参考的浏览器截图 index-375，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/thumbs-1440.png` | 初轮设计与参考的浏览器截图 thumbs-1440，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/screenshots/thumbs-375.png` | 初轮设计与参考的浏览器截图 thumbs-375，文件名标记状态/视口，供历史视觉核对 |
| `design-demos/spec.md` | 初轮设计与参考的设计说明或过程记录 spec |
| `design-demos/thumbs.html` | 初轮设计与参考可独立打开的静态原型 thumbs |

## docs

| 文件 | 用途 |
| --- | --- |
| `docs/AI_HANDOFF.md` | 当前 AI 接手入口，功能边界、数据流、路由、环境变量和待办 |
| `docs/API.md` | HTTP 接口、状态与校验约定，包含演示接口演进 |
| `docs/ARCHITECTURE.md` | 初始架构、模块责任与目标部署设计，顶部指向当前接手说明 |
| `docs/CREATOR_MODEL.md` | 邀请创作者、授权与收入合作方案 |
| `docs/DATA_MODEL.md` | 作品、订单、赠礼等数据模型的设计说明 |
| `docs/DECISIONS.md` | 早期产品和技术选择记录 |
| `docs/DEVELOPMENT.md` | 当前本地运行、验证命令与部署准备边界 |
| `docs/FILE_MAP.md` | 本逐文件索引，说明每个入库文件的责任 |
| `docs/PLATFORM_V1.md` | 当前平台已确认的发行、转让、销毁、分成与接收规则 |
| `docs/PRODUCT.md` | 产品方向和历次视觉需求，当前规则由 PLATFORM_V1 优先 |
| `docs/REFERENCES.md` | 官方参考与素材管理入口 |
| `docs/ROADMAP.md` | 初始分阶段开发路线，当前完成情况另见 STATUS |
| `docs/STATUS.md` | 当前交接摘要、验证结果与按时间保留的开发历史 |
| `docs/releases/BIRTHDAY_DEMO.md` | 生日三维交付的版本演进、模型与视觉验证记录 |
| `docs/releases/BIRTHDAY_NFT_PLAN.md` | 生日个例发行准备、固定发布与主网交易追溯记录 |
| `docs/releases/PLATFORM_DEMO.md` | 平台演示流程、创作者审核及测试网验收操作 |

## infra

| 文件 | 用途 |
| --- | --- |
| `infra/README.md` | 数据库、部署与基础设施资料的预留目录说明 |

## public

| 文件 | 用途 |
| --- | --- |
| `public/birthday/asset-info.json` | 当前生日模型的文件信息、校验哈希和来源记录 |
| `public/birthday/birthday.glb` | 生日完整三维场景模型，包含作品与太阳/星星等原作环境 |
| `public/birthday/draco/README.md` | 随模型提供的 Draco 解码器说明 |
| `public/birthday/draco/draco_decoder.js` | Draco 模型压缩的 JavaScript 解码实现 |
| `public/birthday/draco/draco_decoder.wasm` | Draco 模型压缩的 WebAssembly 解码模块 |
| `public/birthday/draco/draco_wasm_wrapper.js` | 加载和调用 Draco WASM 的包装器 |
| `public/birthday/licenses/materials-sources.json` | 模型素材来源索引，含 materials 来源资料 |
| `public/birthday/licenses/materials.txt` | 生日模型中 materials 素材的许可说明 |
| `public/birthday/licenses/plants-sources.json` | 模型素材来源索引，含 plants 来源资料 |
| `public/birthday/licenses/plants.txt` | 生日模型中 plants 素材的许可说明 |
| `public/birthday/licenses/shoes.txt` | 生日模型中 shoes 素材的许可说明 |
| `public/birthday/poster.png` | 生日模型静态封面、加载/失败降级与分享预览图 |
| `public/birthday/scene.json` | 导出模型的场景说明与参数资料 |
| `public/brand-studies/dearbit.svg` | 早期命名 Logo 矢量候选 dearbit，用于品牌对照页 |
| `public/brand-studies/forkeeps.svg` | 早期命名 Logo 矢量候选 forkeeps，用于品牌对照页 |
| `public/brand-studies/mement-v2/a-monogram.svg` | 字母/轨道/缎带 Logo 矢量候选 a-monogram，用于品牌对照页 |
| `public/brand-studies/mement-v2/b-orbit.svg` | 字母/轨道/缎带 Logo 矢量候选 b-orbit，用于品牌对照页 |
| `public/brand-studies/mement-v2/c-ribbon.svg` | 字母/轨道/缎带 Logo 矢量候选 c-ribbon，用于品牌对照页 |
| `public/brand-studies/mement-v2/d-imprint.svg` | 字母/轨道/缎带 Logo 矢量候选 d-imprint，用于品牌对照页 |
| `public/brand-studies/mement-v2/e-arches.svg` | 字母/轨道/缎带 Logo 矢量候选 e-arches，用于品牌对照页 |
| `public/brand-studies/mement-v3/a-signature.svg` | 签名/Merkle/哈希/密码朋克 Logo 矢量候选 a-signature，用于品牌对照页 |
| `public/brand-studies/mement-v3/b-merkle.svg` | 签名/Merkle/哈希/密码朋克 Logo 矢量候选 b-merkle，用于品牌对照页 |
| `public/brand-studies/mement-v3/c-hash.svg` | 签名/Merkle/哈希/密码朋克 Logo 矢量候选 c-hash，用于品牌对照页 |
| `public/brand-studies/mement-v3/d-cypher.svg` | 签名/Merkle/哈希/密码朋克 Logo 矢量候选 d-cypher，用于品牌对照页 |
| `public/brand-studies/mement-v3/e-commitment.svg` | 签名/Merkle/哈希/密码朋克 Logo 矢量候选 e-commitment，用于品牌对照页 |
| `public/brand-studies/mement-v3/hash-source.json` | 哈希 Logo 的生成输入与参数，便于复现 |
| `public/brand-studies/mement-v4/a-offset.svg` | 偏移/隐核/干涉/折叠/交叠 Logo 矢量候选 a-offset，用于品牌对照页 |
| `public/brand-studies/mement-v4/b-core.svg` | 偏移/隐核/干涉/折叠/交叠 Logo 矢量候选 b-core，用于品牌对照页 |
| `public/brand-studies/mement-v4/c-interference.svg` | 偏移/隐核/干涉/折叠/交叠 Logo 矢量候选 c-interference，用于品牌对照页 |
| `public/brand-studies/mement-v4/d-fold.svg` | 偏移/隐核/干涉/折叠/交叠 Logo 矢量候选 d-fold，用于品牌对照页 |
| `public/brand-studies/mement-v4/e-entangle.svg` | 偏移/隐核/干涉/折叠/交叠 Logo 矢量候选 e-entangle，用于品牌对照页 |
| `public/brand-studies/mement-v5/a-knot.svg` | 结扣/包裹/像素/封印/交织 Logo 矢量候选 a-knot，用于品牌对照页 |
| `public/brand-studies/mement-v5/b-parcel.svg` | 结扣/包裹/像素/封印/交织 Logo 矢量候选 b-parcel，用于品牌对照页 |
| `public/brand-studies/mement-v5/c-pixel.svg` | 结扣/包裹/像素/封印/交织 Logo 矢量候选 c-pixel，用于品牌对照页 |
| `public/brand-studies/mement-v5/d-seal.svg` | 结扣/包裹/像素/封印/交织 Logo 矢量候选 d-seal，用于品牌对照页 |
| `public/brand-studies/mement-v5/e-weave.svg` | 结扣/包裹/像素/封印/交织 Logo 矢量候选 e-weave，用于品牌对照页 |
| `public/brand-studies/mement-v6/a-wide.svg` | 像素蝴蝶结细化 Logo 矢量候选 a-wide，用于品牌对照页 |
| `public/brand-studies/mement-v6/b-short.svg` | 像素蝴蝶结细化 Logo 矢量候选 b-short，用于品牌对照页 |
| `public/brand-studies/mement-v6/c-void.svg` | 像素蝴蝶结细化 Logo 矢量候选 c-void，用于品牌对照页 |
| `public/brand-studies/mement-v6/d-box.svg` | 像素蝴蝶结细化 Logo 矢量候选 d-box，用于品牌对照页 |
| `public/brand-studies/mement-v6/e-folded.svg` | 像素蝴蝶结细化 Logo 矢量候选 e-folded，用于品牌对照页 |
| `public/brand-studies/mement-v7/a-parcel.svg` | 像素礼盒/包裹/开箱/吊牌/信封 Logo 矢量候选 a-parcel，用于品牌对照页 |
| `public/brand-studies/mement-v7/b-cube.svg` | 像素礼盒/包裹/开箱/吊牌/信封 Logo 矢量候选 b-cube，用于品牌对照页 |
| `public/brand-studies/mement-v7/c-open.svg` | 像素礼盒/包裹/开箱/吊牌/信封 Logo 矢量候选 c-open，用于品牌对照页 |
| `public/brand-studies/mement-v7/d-tag.svg` | 像素礼盒/包裹/开箱/吊牌/信封 Logo 矢量候选 d-tag，用于品牌对照页 |
| `public/brand-studies/mement-v7/e-letter.svg` | 像素礼盒/包裹/开箱/吊牌/信封 Logo 矢量候选 e-letter，用于品牌对照页 |
| `public/brand-studies/mement.svg` | 早期命名 Logo 矢量候选 mement，用于品牌对照页 |
| `public/cryptogift/FONT-LICENSES.txt` | 首页自托管字体许可与来源 |
| `public/cryptogift/birthday-hand-OFL.txt` | 生日手写字体开放许可 |
| `public/cryptogift/birthday-hand.woff` | 生日信件用手写字体 |
| `public/cryptogift/birthday-wenkai-OFL.txt` | 霞鹜文楷字体开放许可 |
| `public/cryptogift/birthday-wenkai.woff` | 生日中文文楷字体 |
| `public/cryptogift/cat.png` | 宇航猫概念礼物图像，平台演示素材 |
| `public/cryptogift/flower.png` | 透明雕塑花概念礼物图像，平台演示素材 |
| `public/cryptogift/gift-open.png` | 旧黑金打开礼盒透明图像及降级素材 |
| `public/cryptogift/gift.png` | 旧黑金闭合礼盒透明图像及降级素材 |
| `public/cryptogift/hanken.ttf` | 平台自托管 Hanken 字体 |
| `public/cryptogift/hero.png` | 早期黑金首页的空间背景图 |
| `public/cryptogift/ink-sheep.png` | 水墨羊原作参考及概念礼物图像 |
| `public/cryptogift/obsidian-texture.png` | 黑曜石风格礼盒/三维包装的材质贴图 |
| `public/cryptogift/portal.png` | 早期黑金页面的空间门廊图像 |
| `public/cryptogift/prompts.json` | 黑金素材生成提示和素材记录 |
| `public/cryptogift/teko.ttf` | 平台标题自托管 Teko 字体 |

## research

| 文件 | 用途 |
| --- | --- |
| `research/README.md` | 调研与用户反馈资料的预留目录说明 |

## scripts

| 文件 | 用途 |
| --- | --- |
| `scripts/README.md` | 维护脚本用途和运行说明 |
| `scripts/birthday-export-entry.tsx` | 独立生日静态网页的 React 入口，传入素材路径与既有铸造记录 |
| `scripts/birthday-nft-compile.mjs` | 使用固定 Solidity 编译配置生成生日合约产物到本地 delivery |
| `scripts/birthday-nft-factory.mjs` | 生日 CREATE2 工厂地址、节点参数和已部署工厂/运行字节码核验 |
| `scripts/birthday-nft-mainnet-check.mjs` | 生日主网准备只读检查与费用估计 |
| `scripts/birthday-nft-prepare.mjs` | 检查固定元数据、模拟 CREATE2 部署，输出未签名参数 |
| `scripts/birthday-nft-test.mjs` | 生日个例合约的本地链测试 |
| `scripts/birthday-nft-verify.mjs` | 双节点核对生日合约代码、NFT 状态和既有交易 |
| `scripts/birthday_mobile_loading_qa.py` | 生日手机慢网、加载失败和性能降级检查 |
| `scripts/birthday_mobile_qa.py` | 生日多个手机/横屏视口的排版与触控检查 |
| `scripts/birthday_receive_qa.py` | 生日初版桌面/手机开箱、三维加载和错误降级的浏览器检查 |
| `scripts/birthday_roof_detail_qa.py` | 生日车顶细节、缩放与移动端查看检查 |
| `scripts/birthday_sky_pitch_qa.py` | 生日新增星点闪烁、上下旋转范围和性能检查 |
| `scripts/build-birthday-demo.mjs` | 打包独立生日静态网页或作品归档，校验模型哈希并复制依赖素材 |
| `scripts/creator-review.ts` | 本机人工查看作者申请、记录通过/拒绝的命令行入口 |
| `scripts/cryptogift_qa.py` | 早期黑金首页及收礼交互的浏览器检查 |
| `scripts/design_qa.py` | 第一轮静态设计原型的浏览器与响应式检查 |
| `scripts/design_round2_qa.py` | 第二轮三个作者风格原型的交互及响应式检查 |
| `scripts/seed-showcase.ts` | 生成联动的三位示例作者、三件作品、六笔样例订单及一笔模拟结算 |
| `scripts/testnet-compile.mjs` | 编译平台测试合约，提供 ABI 与字节码 |
| `scripts/testnet-contract-test.mjs` | 本地链验证付款铸造、整数分账、提款隔离、版数和转让/销毁规则 |
| `scripts/testnet-deployment.mjs` | 为独立测试赠礼合约生成未签名部署参数 |

## src

| 文件 | 用途 |
| --- | --- |
| `src/app/api/catalog/route.ts` | GET 统一已陈列与概念作品目录及预设祝福 |
| `src/app/api/demo/creator-applications/route.ts` | POST 作者申请，支持 JSON 和带附件表单，来源校验及幂等入队 |
| `src/app/api/demo/gifts/route.ts` | POST 早期临时赠礼演示接口，保留兼容 |
| `src/app/api/demo/orders/route.ts` | POST 当前演示赠礼订单，来源校验、JSON 限长、幂等保存与公开返回 |
| `src/app/api/health/route.ts` | GET 应用健康状态 |
| `src/app/api/testnet/route.ts` | GET 测试网状态或指定交易核验，确认成功后记录销售 |
| `src/app/api/wallet/route.ts` | GET 会话状态，POST 签名挑战、核验和退出，设置 HttpOnly Cookie |
| `src/app/brand-lab/abstract/page.tsx` | 历史抽象 Logo 提案页 |
| `src/app/brand-lab/classic/page.tsx` | 历史字母/轨道/缎带等 Logo 提案页 |
| `src/app/brand-lab/crypto/page.tsx` | 历史签名、Merkle、哈希、密码朋克和承诺 Logo 页 |
| `src/app/brand-lab/gifts/page.tsx` | 历史蝴蝶结、礼盒与密码学变化提案页 |
| `src/app/brand-lab/page.tsx` | 当前像素礼物符号提案页，比较礼盒、包裹、开箱、吊牌、信封 |
| `src/app/brand-lab/pixel-bows/page.tsx` | 历史像素蝴蝶结细化提案页 |
| `src/app/creators/apply/page.tsx` | 创作者申请页面入口与元数据 |
| `src/app/creators/studio/actions.ts` | 服务端投稿操作，验证授权和输入、检查图片头与像素、缩放转 WebP 后保存 |
| `src/app/creators/studio/form.tsx` | 投稿表单，凭证、图像/封面、简介、售价、版数和发行规则 |
| `src/app/creators/studio/page.tsx` | 创作者投稿工作台页面入口 |
| `src/app/gift/[token]/page.tsx` | 读取随机令牌对应的有效演示订单并渲染收礼页 |
| `src/app/gift/testnet/[transaction]/page.tsx` | 核验测试网交易后呈现收礼，处理待确认和无效记录 |
| `src/app/gifts/[id]/page.tsx` | 按作品 ID 读取已陈列作品与测试发行状态，渲染详情及赠礼组件 |
| `src/app/globals.css` | 站点通用样式、品牌探索页及生日三维收礼体验样式 |
| `src/app/layout.tsx` | 应用根布局、中文语言和站点元数据 |
| `src/app/media/[id]/[kind]/route.ts` | 按作品 ID、image/cover 和发布状态返回图片，运营可读取待审素材 |
| `src/app/ops/[section]/page.tsx` | 运营三分区页面，creators/works/sales，含筛选、分页、审核、定价和统计 |
| `src/app/ops/actions.ts` | 运营服务端操作，登录退出、审核、凭证、销售导入、测试版准备绑定和演示结算 |
| `src/app/ops/attachments/[id]/[position]/route.ts` | 登录运营查看或下载指定申请附件 |
| `src/app/ops/creator-detail.tsx` | 作者资料详情弹窗与关闭交互 |
| `src/app/ops/invite.tsx` | 生成及复制创作者上传凭证的客户端组件 |
| `src/app/ops/page.tsx` | 运营密钥登录页，已登录跳转作者审核 |
| `src/app/ops/sales.csv/route.ts` | 运营销售 CSV 导出，校验权限和过滤条件 |
| `src/app/page.tsx` | 首页服务端入口，读取统一目录并渲染首页组件 |
| `src/app/platform.css` | 平台详情/表单/收礼页、创作者和运营后台样式 |
| `src/app/receive/birthday/page.tsx` | 复用 /receive 的生日个例别名 |
| `src/app/receive/demo/page.tsx` | 使用早期客户端组件的概念礼物开箱原型 |
| `src/app/receive/page.tsx` | 《计划之外》生日三维收礼页和元数据 |
| `src/app/testnet/page.tsx` | 旧测试网页入口重定向到钱包页 |
| `src/app/wallet/page.tsx` | 将 WalletConnect 配置、作品购买或部署参数传给钱包交互组件 |
| `src/components/birthday-parcel.ts` | 在生日共享三维舞台中创建纸盒与包装结构 |
| `src/components/birthday-receive.tsx` | 生日礼物开箱状态、信件、署名日期、提示与固定交易通知 |
| `src/components/birthday-scene.tsx` | 生日 GLB 加载与渲染、星光、太阳材质、相机拖动/缩放、移动端性能和失败降级 |
| `src/components/birthday-view-config.ts` | 生日原作相机、目标、视场角和水平/垂直旋转范围 |
| `src/components/creator-application.tsx` | 作者申请客户端表单，多个作品链接、附件及提交反馈 |
| `src/components/crypto-gift.tsx` | 平台首页与旧收礼原型，短暂开场、统一网格、详情及旧客户端赠言流程 |
| `src/components/gift-checkout.tsx` | 作品详情、规则说明、祝福输入、订单核对和演示分享链接 |
| `src/components/gift-sculpture.tsx` | 早期黑金三维礼盒包装网格、开盖、拖动及降级展示 |
| `src/components/platform-receive.tsx` | 通用作品开箱、直接显示信件和规则，接收演示或测试网结果 |
| `src/components/testnet-issuance.tsx` | 后台测试版发行客户端入口，填写收款地址并跳到钱包完成部署 |
| `src/components/wallet-login.tsx` | 多插件发现、OKX/币安/MetaMask/WalletConnect 连接、签名登录、部署和购买交易 |
| `src/domain/artwork-policy.ts` | 创作者转让/销毁规则、分成类型、整数最小单位分账与规则文案 |
| `src/domain/catalog.ts` | 内置三件概念作品、Artwork 类型、祝福及图像地址辅助函数 |
| `src/domain/creator-applications.ts` | 作者申请类型、作品链接和字段校验、申请记录生成 |
| `src/domain/gifts.ts` | 早期演示赠礼服务，身份输入校验、内存容量和幂等保护 |
| `src/domain/orders.ts` | 演示订单类型、仓储约定、输入校验、快照和公开结果 |
| `src/lib/test-gift.ts` | 钱包和服务端使用的平台测试赠礼合约 ABI |
| `src/lib/testnet.ts` | BSC 测试网链 97、RPC、浏览器和 tBNB 参数 |
| `src/ports/integrations.ts` | 早期身份解析、钱包认证和链上核验的目标接口类型，实际接入模块另见 server |
| `src/server/application-upload.ts` | 读取申请附件表单，流式限长、数量/大小及扩展名与文件头检查 |
| `src/server/creator-application-repository.ts` | SQLite 私有申请与附件仓储，事务防重、人工审核、查询分页 |
| `src/server/data-directory.ts` | 确定 MEMENT_DATA_DIR 或默认本地数据目录 |
| `src/server/mode.ts` | 演示 API 模式保护，拒绝非 demo 模式 |
| `src/server/operations.ts` | 运营 SQLite 存储，投稿凭证、作品、价格历史、测试版绑定、销售及演示结算 |
| `src/server/operator-auth.ts` | 运营密钥生成与验证、可撤销的进程内会话及 Cookie |
| `src/server/order-repository.ts` | SQLite 演示订单仓储，事务、过期清理、容量及随机令牌查询 |
| `src/server/public-catalog.ts` | 将运营已陈列作品与内置概念目录合并，供页面与接口共用 |
| `src/server/request-json.ts` | JSON 请求流式字节限长与标准输入错误 |
| `src/server/revenue-config.ts` | 读取并验证服务端分成比例和版本，创建新订单快照 |
| `src/server/testnet-gifts.ts` | 测试网节点、三次确认、原始调用/金额/事件/区块核验和销售入账 |
| `src/server/testnet-release.ts` | 按作品生成部署参数，核验链上部署与价格/分成/元数据并准备绑定 |
| `src/server/wallet-auth.ts` | 一次性钱包签名挑战、站点/浏览器/过期校验、会话读取和撤销 |

## tests

| 文件 | 用途 |
| --- | --- |
| `tests/artwork-policy.test.ts` | 验证转让/销毁独立、整数分账守恒、快照及非法配置 |
| `tests/creator-applications.test.ts` | 验证申请边界、链接、幂等、人工审核和跨连接恢复 |
| `tests/gifts.test.ts` | 验证早期输入、重复提交、容量及非演示模式拒绝 |
| `tests/orders.test.ts` | 验证订单防篡改、持久快照、幂等、事务回滚与过期 |
| `tests/request-json.test.ts` | 验证分块请求超过字节上限立即停止读取 |
| `tests/wallet-auth.test.ts` | 验证钱包签名主体、站点/浏览器绑定、一次性挑战与会话撤销 |

## 根目录

| 文件 | 用途 |
| --- | --- |
| `.env.example` | 环境变量样例，提供演示模式、分成、钱包连接及测试合约配置 |
| `.gitignore` | Git 忽略规则，涵盖环境文件、依赖、构建、SQLite 和本地交付目录 |
| `.nvmrc` | 约定使用的 Node.js 主版本 |
| `AGENTS.md` | AI 在本仓库工作的约定和 Next.js 本地文档提示 |
| `README.md` | 项目总入口、当前功能、启动命令、验证命令与接手文档链接 |
| `next-env.d.ts` | Next.js 自动生成的 TypeScript 环境类型引用 |
| `next.config.ts` | Next.js 运行配置、表单请求上限、构建追踪排除本地交付目录 |
| `package-lock.json` | 锁定 npm 依赖树，供 npm ci 重现安装 |
| `package.json` | 项目依赖、Node.js 要求与 npm 脚本 |
| `tsconfig.json` | TypeScript 编译选项和项目源码范围 |
