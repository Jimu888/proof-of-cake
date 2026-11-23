# Mement 下一阶段开发任务单（AI 编码执行规范）

> **使用说明**：本文档由项目架构师起草，供执行编码的 AI 模型直接阅读并在 `proof-of-cake` 仓库内分阶段落地。
> **执行前必读仓库约定**：先阅读 `AGENTS.md`、`README.md`、`docs/AI_HANDOFF.md`、`docs/PLATFORM_V1.md` 与 `docs/STATUS.md`。
> **安全与范围红线**：
> - 严禁请求、存储或提交任何私钥、助记词、API Key 或真实用户隐私。
> - 所有链上合约开发与验证仅限 **本地隔离链与 BSC 测试网（Chain ID 97）**，严禁任何主网部署或真实资金交易。
> - 演示数据必须明确标明“演示/测试网”，绝不将演示锁仓资产呈现为真实已锁定或已赎回的链上资金。
> - 严禁破坏既有的 `/receive`（《计划之外》生日 3D 个例）、`/ops/*`（运营后台）及现有 16 项业务测试。

---

## 目标总览

本轮迭代包含 **两大核心升级**，请按 **Phase 1 → Phase 2 → Phase 3** 顺序分步实现，每完成一个 Phase 需运行验证命令确保全绿再进入下一 Phase：

1. **全站信息架构重构（常设陈列 + 主题特展）**：将顶导收敛回 4 项极简结构，把「十二生肖」归位为「展厅 · 主题特展 01」，建立可扩展至春节/万圣节/感恩节等未来节日特展的统一框架。
2. **链上锁仓赠礼与销毁赎回（Burn-to-Redeem Vault Gift）**：支持送礼人在铸造礼物 NFT 时，通过智能合约向该礼物内锁定原生 **BNB** 或 **任意 BSC 标准 BEP-20 代币**（包括稳定币及代币化美股如 Bstonx 等合规代币）；资产永久锁存在礼物合约中，**唯有当前合法持有人主动销毁（Burn）该礼物 NFT 时，合约才将锁仓资产释放给销毁者**。

---

## Phase 1：全站信息架构重构（常设陈列 / 主题特展）

### 1.1 顶部导航收敛（全局统一）
- 修改 `src/components/crypto-gift.tsx` 及 `src/components/zodiac-studio.tsx`：
- 顶部主导航永久固定为 **4 项**：`橱窗` | `展厅` | `创作者` | `钱包`。
- 移除顶导中孤立的 `生肖` 入口，将其纳入「展厅 → 主题特展」。

### 1.2 建立专题注册表：`src/domain/series.ts`
新增 `src/domain/series.ts`，定义可扩展的主题特展模型：
```ts
export type SeriesStatus = 'live' | 'upcoming' | 'archive';

export type GiftSeries = {
  slug: string;              // 如 'zodiac'
  code: string;              // 如 'EXHIBITION 01'
  titleCn: string;           // 如 '十二生肖 · 链上生日礼'
  titleEn: string;           // 如 'GENESIS ZODIAC'
  seasonTag: string;         // 如 '2026–2027 · 当期特展'
  summary: string;
  route: string;             // '/series/zodiac'
  coverImage: string;        // '/api/zodiac-assets/voxel-goat-preview.png'
  itemProgress: string;      // 如 '04 / 12 已铸造上线'
  status: SeriesStatus;
  featuredInVitrine?: boolean;
};
```
- 注册第 1 号当期特展：`GENESIS ZODIAC · 十二生肖`（`slug: 'zodiac'`, `status: 'live'`, `featuredInVitrine: true`）。
- 可选保留 1–2 个极克制的未来特展占位（如 `EXHIBITION 02 · 农历春节`、`EXHIBITION 03 · 季节企划`，`status: 'upcoming'`，不可点击进入空页，仅体现画廊排期感）。

### 1.3 首页展厅双空间升级（`src/components/crypto-gift.tsx` + `src/app/platform.css`）
- 保持“一屏一屏不上下滚屏”的核心交互：
  - **第一屏 · 街角橱窗**：第 `01` 位继续展示当期主打特展（实时 3D 未羊，点击进入 `/series/zodiac`），上下滑动切换其余常规作品。
  - **第二屏 · 室内展厅（The Room）**：
    - 在顶部栏 `.room-top-bar` 增加极克制的空间切换 Tab：**`常设陈列（Permanent）`** / **`主题特展（Exhibitions）`**。
    - `常设陈列`：保留现有的整屏左右翻页画廊墙（桌面 3 件/屏、平板 2 件/屏、手机 1 件/屏）。
    - `主题特展`：以同套纯中性石墨黑建筑光学壁龛呈现各期特展海报卡（含 `EXHIBITION 01` 编号、名称、进度与 `步入特展 →` 入口）。
    - 支持 URL Hash 深链：`/#gifts` 打开展厅常设，`/#series` 直接打开展厅主题特展，方便从特展页返回时直达对应位置。

### 1.4 路由统一与兼容
- 新增 `src/app/series/[slug]/page.tsx`：当 `slug === 'zodiac'` 时渲染 `ZodiacStudio`，未知 `slug` 返回 `notFound()`。
- 保留 `src/app/zodiac/page.tsx`：改为服务端重定向到 `/series/zodiac`（或透传 query 参数如 `?sign=...&sealed=1` 避免旧分享链接失效！**注意：务必保留全部 query string 透传**）。
- 在 `ZodiacStudio` 页头左侧增加清晰面包屑：`← 返回展厅 / 主题特展 01`（指向 `/#series`）。

---

## Phase 2：Burn-to-Redeem 锁仓赠礼智能合约（BSC 测试网 97）

### 2.1 合约设计：`contracts/platform/MementVaultGift.sol`
基于现有 `contracts/platform/MementTestGift.sol` 的代码风格与 OpenZeppelin 5.4.0 依赖，新建（或迭代）支持**锁仓资产与销毁赎回**的平台测试合约：

- **数据结构**：
  ```solidity
  struct VaultAsset {
      address token;   // address(0) 表示原生 BNB；非零地址表示 BEP-20 / ERC-20 代币合约
      uint256 amount;  // 实际到账并锁定的最小单位数量
      bool redeemed;   // 是否已通过销毁赎回
  }
  mapping(uint256 => VaultAsset) public vaultAssets;
  ```
- **核心铸造接口（支持三选一）**：
  1. **纯艺术品赠礼（不锁仓）**：沿用现有 `mintGift(...)`，仅支付作品售价 `price`，按 `artistBps` 计入艺术家与平台各自可提余额。
  2. **锁仓原生 BNB 赠礼**：`mintGiftWithNativeVault(..., uint256 vaultAmount)`
     - 校验 `msg.value == price + vaultAmount` 且 `vaultAmount > 0`。
     - **强校验 `burnable == true`**：如果该发行版本禁止销毁，必须 `revert` 拒绝锁仓，防止资金永久死锁！
     - `price` 进入原有艺术家/平台 50/50 分账余额；`vaultAmount` 独立记入 `vaultAssets[tokenId]`，**艺术家与平台提款函数绝对不可动用任何锁仓资金**。
  3. **锁仓任意 BEP-20 代币赠礼**（如 USDT、代币化美股 Bstonx 等）：`mintGiftWithTokenVault(..., address token, uint256 desiredAmount)`
     - 校验 `msg.value == price`、`token != address(0)`、`desiredAmount > 0`、`burnable == true`。
     - 使用 OpenZeppelin `SafeERC20` 执行 `safeTransferFrom(msg.sender, address(this), desiredAmount)`。
     - **必须采用 Balance-Before / Balance-After 差值记账**：`uint256 received = IERC20(token).balanceOf(address(this)) - beforeBalance; require(received > 0);`，将 `received` 记为 `vaultAssets[tokenId].amount`，防止 Fee-on-Transfer 代币导致账目亏空。
- **核心销毁赎回接口**：`burnAndRedeem(uint256 tokenId)`
  - 必须加 `nonReentrant`（OpenZeppelin `ReentrancyGuard`）。
  - 校验 `burnable == true` 且 `ownerOf(tokenId) == msg.sender`。
  - **严格遵循 CEI（Checks-Effects-Interactions）**：
    1. 读取 `VaultAsset memory asset = vaultAssets[tokenId]`；
    2. 先标记 `vaultAssets[tokenId].redeemed = true` 并记录赎回者/时间戳，然后执行 `_burn(tokenId)`；
    3. 最后释放资产：若 `asset.amount > 0`，`asset.token == address(0)` 时用 `(bool ok,) = payable(msg.sender).call{value: asset.amount}(""); require(ok);` 转出 BNB；否则用 `IERC20(asset.token).safeTransfer(msg.sender, asset.amount)` 转出代币。
  - 触发事件：`event GiftRedeemed(uint256 indexed tokenId, address indexed redeemer, address indexed token, uint256 amount);`。
  - 销毁后不恢复发行上限额度，历史只读记录永久可查。

### 2.2 RWA / 代币化美股（如 Bstonx）工程边界说明
- 在合约注释、文档与前端提示中明确说明：部分代币化美股（RWA BEP-20）存在发行方 KYC 白名单或转账暂停机制。若目标代币限制智能合约地址持仓/转账，该代币在 `safeTransferFrom` 或赎回时会被代币合约本身拒绝。
- 本阶段在本地隔离链与 BSC 测试网使用 **tBNB** 及 **标准模拟 ERC-20 测试代币**完成全流程验证。

### 2.3 合约编译与隔离链测试
- 新增编译与测试脚本（参考 `scripts/testnet-compile.mjs` 和 `scripts/testnet-contract-test.mjs`），覆盖以下全部安全边界：
  1. 锁仓原生 BNB 铸造 → 售价正确 50/50 分账，艺术家/平台提款不触碰锁仓 BNB；
  2. 锁仓标准 BEP-20 代币（及模拟带转账税代币 Balance-Diff 记账）铸造与赎回；
  3. 非持有人调用 `burnAndRedeem` 必须失败；
  4. `burnable == false` 的发行版本尝试锁仓铸造必须 `revert`；
  5. 持有人销毁后收到全额锁仓资产，再次调用 `burnAndRedeem` 必须失败；
  6. 恶意收款合约重入攻击 `burnAndRedeem` 必须被 `ReentrancyGuard` 拦截；
  7. 若作品允许转让（`transferable == true`），转让后仅新持有人有权销毁赎回。

---

## Phase 3：前端锁仓封入与销毁取出仪式感交互

保持现有 **纯中性石墨黑建筑画廊（`#121315`）+ 极简终端线条** 风格，拒绝任何廉价 Web3 金融仪表盘感。

### 3.1 送礼柜台新增「封入链上资产（选填）」
- 适用范围：常规作品柜台页 `/gifts/[id]`（`src/components/gift-checkout.tsx`）与十二生肖特展封缄弹窗（`src/components/zodiac-studio.tsx`），以及测试网真实钱包购买页 `/wallet`（`src/components/wallet-login.tsx`）。
- 交互设计：
  - 默认收起为一栏极克制的折叠入口：`+ 在礼盒内封入链上资产（BNB / 任意 BSC 代币 · 选填）`。
  - 展开后可选：
    - 资产类型：`原生 BNB` / `自定义 BSC 代币（输入 0x 合约地址，自动读取并校验 symbol 与 decimals，支持代币化美股等 BEP-20）`；
    - 锁仓数量：清晰展示「资产将锁定于礼盒智能合约内，仅当收礼人主动销毁此礼物时方可取出」。
  - **策略联动**：若当前作品的发行规则为“不允许销毁”，界面明确提示「该作品为永久不可销毁版本，不支持封入锁仓资产」并禁用锁仓选项。
  - **演示/测试网边界**：演示订单流程中清晰标明“演示模拟锁仓 · 未实际扣款或上链”；真实钱包页 `/wallet` 对接测试网合约调用（先 ERC-20 `approve` 再 `mintGiftWithTokenVault`，或直接 `mintGiftWithNativeVault`）。

### 3.2 收礼页新增「内封资产印记」与「郑重销毁取出」
- 适用范围：通用收礼页 `src/components/platform-receive.tsx` 与生肖收礼状态 `src/components/zodiac-studio.tsx`。
- 视觉呈现：
  - 当礼物包含锁仓资产时，在信笺与美术馆典藏证书之间，呈现一枚极克制的深色建筑铭牌：**`VAULTED ASSET · 内封资产`**（展示币种、数量、代币合约缩写与状态：`已锁定 · 销毁礼物即可取出`）。
  - 铭牌底部提供极克制的文字按钮：**`销毁此礼物并取出内封资产 →`**。
  - 点击后弹出郑重二次确认框：明确告知「销毁后，艺术品 NFT 将永久熄灭并标记为已销毁，不可恢复；内封资产将立即释放至您的钱包」，采用**长按 1.5 秒确认销毁**（测试网真实交易由持有人钱包签名调用 `burnAndRedeem`，演示模式仅做本地状态演示并清晰标注“演示销毁”）。
  - 销毁完成后，页面保留原赠送祝福、原作品灰阶纪念态与链上销毁/赎回记录链接，状态更新为 **`已销毁 · 内封资产已取出`**。

---

## 交付与验收清单（必须全部通过）

完成每个 Phase 后，在仓库根目录执行以下命令并汇报准确结果（注意 Node 需使用 22/24 环境）：

```sh
npm run typecheck
npm test
npm run test:nft
node --test scripts/testnet-contract-test.mjs
# 新增的锁仓合约测试脚本
node --test scripts/vault-gift-contract-test.mjs
npm run build
```

并在完成后更新：
- `docs/STATUS.md`（记录本次里程碑与确切验证边界）
- `docs/FILE_MAP.md`（补充新增文件说明）
