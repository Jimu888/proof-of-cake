# Mement AI 接手说明

更新于 2026-11-21。请先读本文与 `PLATFORM_V1.md`，再按 `FILE_MAP.md` 定位具体文件。`AGENTS.md` 是仓库工作约定。文档下方的历史记录可能描述更早的实现，以当前代码和最新日期记录为准。

## 当前交付范围

整个项目是一个 Next.js 16 App Router 应用，使用 React 19、TypeScript、Three.js、ethers、Node.js 24 内置 SQLite。一个应用同时提供前台、运营后台、文件访问与 API。

| 功能 | 当前实现与边界 |
| --- | --- |
| 首页和选礼 | 短暂可跳过的开场、等尺寸作品网格、统一目录、作品详情与赠礼表单。后续九张首页概念图仍待选择，尚未替换当前 UI |
| 创作者申请 | 最多 10 条作品链接，创作形式含其他，最多 3 个各 8 MB 附件，支持常见图片/PDF/DOC/DOCX。私有队列、人工审核、表格与详情弹窗 |
| 投稿与陈列 | 审核通过后由运营生成上传凭证，作者在工作台提交图片、封面、简介、定价、版数、转让及销毁规则，运营审核后陈列 |
| 投稿规格 | 静态 JPG/PNG/WebP，作品及封面各 20 MB 以内、2400 万像素以内，校验后按原比例缩至最长边 2400 并转 WebP。平台通用投稿尚未支持视频/GLB |
| 运营后台 | `/ops` 登录后进入创作者、作品定价、销售结算三个分区，筛选与分页、附件查看、定价历史、交易导入和 CSV 导出 |
| 演示赠礼 | SQLite 订单、价格/规则/分成快照、幂等重试、七天有效的随机分享链接、开箱与信件、样例销售和模拟结算 |
| 钱包登录 | OKX、币安钱包、MetaMask，EIP-6963 插件发现与 EIP-1193 注入。签名挑战绑定网站和浏览器，服务端核验。WalletConnect 需要项目 ID |
| 平台测试网 | 链 97，按作品准备部署参数，钱包确认后核验绑定。购买时支付并铸造到接收地址，三次确认后核验并记账 |
| 分成 | 默认艺术家 50%、平台 50%。购买将应得收入计入合约可提余额，由各方钱包提款。后台的演示结算按钮只更改演示记录 |
| 生日个例 | `/receive` 为《计划之外》完整三维体验，独立静态导出、手机视角、开箱、星光与祝福。个例主网 NFT 已发行，链上记录见生日发行文档 |

主题特展和内封资产见 [演示说明](releases/VAULT_GIFT_DEMO.md)。首页 `/#series` 进入特展，生肖固定路由为 `/series/zodiac`，兼容旧分享参数。新测试发行版支持可赎回的 tBNB 和兼容 ERC-20，演示订单与测试链记录分别展示。

## 已确认产品规则

所有正式礼品都是 NFT，正式赠送走链上。每个发行版本由作者独立选择可否转让、持有人可否销毁，已发行版本固定。分成调整用于未来发行或订单，原快照继续保留。当前合约的价格和分成在部署时固定，改价或改分成需新版本。收礼人直接打开链接欣赏，接收无需登录或领取。

站点与作品风格各自独立，作品可有水墨、卡通、像素、彩色、黑白等不同风格。Mement 名称暂定，Logo 尚未最终选定。早期品牌与首页原型在 `design-demos/` 和 `/brand-lab`，参考稿进入主界面需另行决定。

## 核心数据流

1. 作者在 `/creators/apply` 提交申请。`application-upload.ts` 读取并验证附件，`creator-application-repository.ts` 保存申请与附件。
2. 运营在 `/ops/creators` 审核，生成投稿凭证。`operations.ts` 保存凭证哈希，作者用凭证在 `/creators/studio` 投稿。
3. `studio/actions.ts` 验证并规范图片。`operations.ts` 保存作品与价格历史。`public-catalog.ts` 合并已陈列作品和内置概念目录。首页、详情页与目录接口共享数据。
4. 演示赠礼走 `/api/demo/orders`，`domain/orders.ts` 创建快照，`order-repository.ts` 保存，`/gift/[token]` 读取并展示。旧 `/api/demo/gifts` 继续提供早期临时接口。
5. 测试发行走后台 Server Actions → `testnet-release.ts` → 钱包发送部署 → 三次确认核验后绑定作品合约。`wallet-login.tsx` 完成插件选择、签名登录和购买交互。
6. `/api/testnet` 与 `/gift/testnet/[transaction]` 调用 `testnet-gifts.ts`，核对交易调用、金额、铸造事件和区块，再将销售按哈希去重入库。

## 路由速查

| 路径 | 作用 |
| --- | --- |
| `/` | 平台首页 |
| `/gifts/[id]` | 作品详情、演示赠礼及测试网购买入口 |
| `/gift/[token]` | 持久化演示订单收礼 |
| `/gift/testnet/[transaction]` | 测试网赠礼核验和收礼 |
| `/creators/apply` | 作者主动申请 |
| `/creators/studio` | 持上传凭证投稿 |
| `/ops` | 运营登录 |
| `/ops/creators` | 作者审核 |
| `/ops/works` | 作品、定价及测试版发行 |
| `/ops/sales` | 销售、分账与演示结算 |
| `/ops/sales.csv` | 需要运营会话的销售导出 |
| `/ops/attachments/[id]/[position]` | 需要运营会话的申请附件 |
| `/media/[id]/[kind]` | 作品或封面文件，按发布状态及运营权限读取 |
| `/wallet` | 钱包登录、测试网购买/部署 |
| `/testnet` | 跳转 `/wallet` |
| `/receive`、`/receive/birthday` | 生日 3D 个例 |
| `/receive/demo` | 早期客户端收礼原型 |
| `/brand-lab` 及其子页 | 多轮 Logo 探索 |
| `/api/catalog`、`/api/health` | 统一目录和健康检查 |
| `/api/demo/creator-applications` | 申请提交 |
| `/api/demo/orders`、`/api/demo/gifts` | 当前与历史演示赠礼接口 |
| `/api/wallet`、`/api/testnet` | 签名会话及测试网核验 |

## 启动与数据

```sh
npm ci
npm run dev
# 可选，生成三位作者、三件作品和六笔演示订单
npx tsx scripts/seed-showcase.ts
```

需要 Node.js 24。默认端口 3000，可用 `npm run dev -- --port 3194` 更换。开发与生产启动默认监听本机。生成样例是显式操作，会向当前数据目录写入演示记录。

默认数据目录 `delivery/platform-demo/` 包含 `orders.sqlite`、`applications.sqlite`、`operations.sqlite` 和 `operator.key`。SQLite 按需建表，订单、作者、附件和后台数据保存在本地。可通过 `MEMENT_DATA_DIR` 指定独立目录。运营密钥在第一次校验登录时生成，可在本机读取，或直接设置 `MEMENT_OPERATOR_KEY` 后重启。新克隆项目拥有自己的数据与密钥。

钱包与运营会话使用服务端进程内存，重启需重新登录。部署需要持久可写磁盘。全平台包含服务端与 SQLite，需要运行 Node 服务，生日静态导出则可以独立托管到 Cloudflare Pages。

## 环境变量

| 变量 | 含义 |
| --- | --- |
| `APP_MODE` | 演示 API 模式，当前允许 `demo` |
| `ARTIST_REVENUE_BPS` | 新订单/发行默认艺术家比例，0–10000，默认 5000 |
| `REVENUE_SPLIT_VERSION` | 订单分成配置版本，默认 `split-v1` |
| `MEMENT_DATA_DIR` | 本地持久目录，默认 `delivery/platform-demo` |
| `MEMENT_OPERATOR_KEY` | 可选运营登录密钥 |
| `MEMENT_ORIGIN` | 与浏览器一致的网站 origin，远程部署需 HTTPS，用于签名与来源校验 |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID，配置后可扫码连接 |
| `MEMENT_TESTNET_CONTRACT` | 独立测试合约地址，可按作品在后台绑定其他合约 |
| `MEMENT_LOCAL_TESTNET_RPC` | 隔离验收用本地链 97 RPC，仅允许 `http://127.0.0.1:端口` |
| `NEXT_PUBLIC_BIRTHDAY_SENDER`、`NEXT_PUBLIC_BIRTHDAY_MESSAGE` | 生日页构建时的公开署名和祝福，默认示例文字 |
| `NEXT_PUBLIC_BIRTHDAY_TITLE`、`NEXT_PUBLIC_BIRTHDAY_RECIPIENT` | 静态导出脚本保留的定义项，当前页面标题与称呼仍为代码固定值 |
| `BIRTHDAY_MINT_TRANSACTION` | 生日独立导出的既有铸造交易，配置后显示固定链上链接 |
| `BIRTHDAY_ISSUER_ADDRESS` | 生日 NFT 参数准备及只读核验使用的公开发行地址 |

`.env.example` 提供常用配置。个人环境文件保持在本机。浏览器能读取 `NEXT_PUBLIC_` 编译出的值。生日发布时所用的个性化环境、发行计划和交付产物在被忽略的 `delivery/`，当前克隆凭仓库默认值运行。

## 历史生日版本

`archives/birthday-3d-test-8889adc.zip` 与标签 `birthday-3d-test-v0.1` 固定首次上传的生日三维测试基线，参见 `archives/README.md`。当前 `main` 同时保存后续生日渲染改进与平台开发。

生日导出可执行 `npm run build:birthday`，作品归档可执行 `npm run build:birthday-artwork`。产物进入 `delivery/`。`birthday-nft-prepare.mjs` 只准备未签名参数，读取发行文档后使用。历史主网发行记录用于追溯现有个例。

## 验证与交接边界

```sh
npm run typecheck
npm test
npm run test:nft
node --test scripts/testnet-contract-test.mjs
npm run build
```

GitHub Actions 执行以上检查。Python 浏览器脚本提供历史视觉验收，需要 Playwright 和对应浏览器，部分脚本有旧本机端口与路径。修改前先阅读脚本参数。

已知待办包括公网 BSC 测试网真实插件与手机扫码验收、生产数据库与共享会话、角色权限、上传扫描与对象存储、部署限流和配额、合约停售、自动事件同步、区块重组撤销与对账、提款对账、主网平台发行审核及独立合约审计。WalletConnect 间接依赖和 Ganache 测试工具此前有依赖告警。当前接手与上传检查以 STATUS 的最新记录为准。

`.ai` 在产品中是用户希望使用的身份入口，平台目前未接入可信名字解析。测试网收礼使用完整 EVM 地址。`src/ports/integrations.ts` 是较早的目标接口，实际实现以 `src/server/` 和调用关系为准。
