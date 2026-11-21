# 开发和运行

当前功能与配置以 [AI 接手说明](AI_HANDOFF.md) 为入口，逐文件用途见 [文件索引](FILE_MAP.md)。

## 环境和启动

Node.js 24、npm，使用 package-lock.json 安装。

```sh
npm ci
npm run dev
```

默认访问 `http://127.0.0.1:3000`。首页 `/`，后台 `/ops`，创作者申请 `/creators/apply`，投稿 `/creators/studio`，钱包 `/wallet`，生日三维页 `/receive`。可通过 `npm run dev -- --port 3194` 修改端口。

开发服务默认监听本机。演示接口使用 APP_MODE=demo，测试网交互单独走链 97。环境变量见 `.env.example` 与 AI 接手说明。默认 SQLite 与运营密钥保存在 `delivery/platform-demo/`，更改数据目录用 `MEMENT_DATA_DIR`。演示数据通过 `npx tsx scripts/seed-showcase.ts` 初始化。

## 验证

```sh
npm run typecheck
npm test
npm run test:nft
node --test scripts/testnet-contract-test.mjs
npm run build
npm start
```

CI 执行类型、业务与两份合约测试和构建。合约测试使用隔离本地链。浏览器历史检查脚本见 `scripts/`，依赖 Playwright，部分带有历史本机路径或端口。

## 交付和部署

生日页可通过 `npm run build:birthday` 单独导出静态网站到 `delivery/birthday-demo/`。整个平台包含 Node 服务、SQLite、受保护媒体和 Server Actions，需要可写持久目录及服务端运行环境。

平台公开上线仍需限流、资源配额、备份、共享会话和角色权限、交易自动核验及重组对账。当前下架控制网站入口，已部署测试合约仍可直接调用。正式主网平台发行需继续完成对应集成和验收。

## 贡献流程

先读 AGENTS、README、AI_HANDOFF 和当前平台规则。修改后更新相关文件说明与 STATUS，完成类型检查、业务测试和构建。涉及合约同时运行合约测试，并保持平台部署产物与源码一致。文档保留历史时请明确日期和当前摘要。凭据、私有申请资料、数据库与本地交付产物保存在被 Git 忽略的目录。
