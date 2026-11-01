# Proof of Cake · 项目底座

面向加密用户的生日艺术礼物平台。平台及签约艺术家提供作品，用户以 Binance Agent ID（`.ai`）挑选、署名并直接赠送到朋友的钱包。

**当前阶段：可运行的 CryptoGift 黑金前端 Demo 与接口骨架；不登录真实钱包、不收款、不铸造或发送 NFT。** 名称只是项目代号，可随时调整。

先看 [黑金交互 Demo](design-demos/round-7-implementation/README.md)。用户已提供新的首页及收礼参考，并要求实现；过去六轮探索保留对照。

## 从这里开始

- [产品范围与已确认方向](docs/PRODUCT.md)
- [技术架构：含白话说明与系统图](docs/ARCHITECTURE.md)
- [数据结构](docs/DATA_MODEL.md)
- [接口与状态约定](docs/API.md)
- [分阶段路线与完成标准](docs/ROADMAP.md)
- [当前进度、下一步与待定事项](docs/STATUS.md)
- [决策记录](docs/DECISIONS.md)
- [官方参考与素材管理](docs/REFERENCES.md)
- [开发、验证和部署](docs/DEVELOPMENT.md)

## 本地运行

需要 Node.js 24（见 `.nvmrc`）及 npm。

```sh
npm ci
npm run dev
```

打开 `http://127.0.0.1:3000` 查看首页，`/receive` 体验收礼；`/api/catalog` 查看演示接口目录。前端占位作品与旧接口目录尚未统一。演示接口说明见 [API](docs/API.md)。

```sh
npm run typecheck
npm test
npm run build
```

## 目录

```text
design-demos/  三个独立前端设计原型、比较入口、概念素材与截图
src/app/       正式网站与服务端接口入口，目前只有 JSON 接口
src/domain/    作品与赠送业务规则，独立于页面
src/server/    仅在服务端运行的配置与保护
contracts/     后续合约开发位置，当前没有可部署合约
infra/         数据库与部署设计，当前没有已执行迁移
assets/        经确认可提交的原创素材与授权记录
research/      调研笔记、用户反馈和资料索引
scripts/       后续维护脚本
tests/        业务边界验证
 docs/         项目文档与状态
```

仓库作为项目资料的统一入口。不要提交密钥、助记词、真实用户数据或私人祝福。大型源文件使用后续配置的 Git LFS 或私有素材存储，并在仓库保留索引；公开展示素材另行确认授权。
