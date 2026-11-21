# Mement

面向加密用户的精选数字艺术礼物平台。创作者经审核后上传作品，用户挑选、购买并直接赠送 NFT 到朋友的钱包，收礼人打开链接即可欣赏作品与祝福。产品名暂定 Mement，仓库名沿用 `proof-of-cake`。

截至 2026-11-21，仓库包含可运行的平台前后台、创作者审核与投稿、作品定价、销售和演示结算、钱包签名登录、BSC 测试网发行与交易核验，以及《计划之外》生日 3D 个例。平台公网测试网钱包验收及主网支付上线仍有待完成。

## 接手入口

- [AI 接手说明](docs/AI_HANDOFF.md) 介绍当前功能、数据流、启动方式、环境配置和已知缺口。
- [逐文件说明](docs/FILE_MAP.md) 列出仓库中每个文件的用途，按路径分组。
- [平台规则](docs/PLATFORM_V1.md) 记录发行规则、50/50 分成和直接送达等已确认决定。
- [当前进度](docs/STATUS.md) 顶部为当前摘要，下方保存历史推进记录。
- [生日 3D 测试版归档](archives/README.md) 提供早期生日演示 ZIP 和历史标签。
- [平台流程与测试网操作](docs/releases/PLATFORM_DEMO.md)、[生日个例说明](docs/releases/BIRTHDAY_DEMO.md)、[生日 NFT 发行记录](docs/releases/BIRTHDAY_NFT_PLAN.md)。

## 本地启动

使用 Node.js 24 和 npm。

```sh
npm ci
npm run dev
```

默认访问 `http://127.0.0.1:3000`。首页 `/`，作者申请 `/creators/apply`，作者投稿 `/creators/studio`，运营后台 `/ops`，钱包登录 `/wallet`，生日三维个例 `/receive`。运营首次登录会在本地数据目录生成 `operator.key`，也可通过 `MEMENT_OPERATOR_KEY` 配置。

演示数据可以通过下列命令生成，包含三位示例作者、三件作品和六笔样例订单。

```sh
npx tsx scripts/seed-showcase.ts
```

默认数据保存在被 Git 忽略的 `delivery/platform-demo/`，可用 `MEMENT_DATA_DIR` 指定可写目录。新克隆的项目需自行初始化数据。具体配置见 [AI 接手说明](docs/AI_HANDOFF.md)。

## 验证

```sh
npm run typecheck
npm test
npm run test:nft
node --test scripts/testnet-contract-test.mjs
npm run build
```

CI 同样运行这些检查。合约测试在本地隔离链执行。生日个例已单独发行过主网 NFT，平台的购买与发行功能当前使用 BSC 测试网配置。

## 目录概览

| 目录 | 用途 |
| --- | --- |
| `src/app/` | 页面、接口、服务端表单操作和样式 |
| `src/components/` | 首页、钱包、赠礼、收礼和三维体验 |
| `src/domain/` | 作品、申请、订单、规则与整数分账 |
| `src/server/` | SQLite 存储、后台权限、签名登录和链上核验 |
| `src/lib/` | 测试网参数和客户端合约 ABI |
| `contracts/` | 生日个例合约、平台测试合约和编译产物 |
| `public/` | 网站图像、字体、品牌提案、生日模型与许可 |
| `scripts/` | 编译、静态导出、样例数据和验证工具 |
| `tests/` | 业务与权限边界测试 |
| `docs/` | 产品、技术、接口、交付记录和接手说明 |
| `archives/` | 生日测试版压缩归档 |
| `design-demos/` | 历史视觉探索、原型、截图和检查记录 |
| `assets/`、`infra/`、`research/` | 素材、基础设施和调研资料的预留入口 |

运行配置、登录密钥、数据库、申请附件和本地发行交付包保存在开发机。仓库保持私有。公开展示的生日个例资料具有独立发布记录。
