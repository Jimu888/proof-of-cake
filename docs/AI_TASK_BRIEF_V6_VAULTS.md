# Mement 可编程情感金库（Programmable Gift Vaults）开发任务单（v6）

> **用途**：供本地 Codex Worker 在 `/Users/jimu/几木JIMU-web/proof-of-cake` 内执行开发。
> **核心定位**：延续全站已定稿的 **Palette 2（深蓝灰 `#131c24 / #263844` + 冷灰 `#A0A1A3` + 亮橙 `#F2743A` 约 3% 精准点缀）+ 一体式玻璃展柜美学 + EN/中文双语（默认 `EN`）**。
> **优先级**：**前端交互设计、仪式感与情绪价值优先级最高**，同时交付真实、安全、通过本地隔离链单测的 BSC 智能合约。
> **硬性禁止**：
> - **严禁启动 Playwright、Chromium、WebKit 或任何浏览器进程**（避免 macOS 弹窗崩溃）。
> - 严禁破坏 `/receive` 生日 3D 个例、`/ops/*` 后台及现有 16 项业务测试。
> - 严禁推送 GitHub、部署 Cloudflare 或执行任何主网交易；所有演示模式必须清晰标明为演示预览（Demo）。

---

## 一、全站统一微提示系统：`<InfoTip>`（极简、克制、少字清晰）

新建 `src/components/info-tip.tsx`（并写入 `src/app/platform.css` 样式）：
- **外观**：一枚极克制的 `16px × 16px` 圆形细线按钮（`i`），平时为冷灰 `#A0A1A3` 低调存在，绝不破坏画廊留白；悬停（桌面 hover/focus）或轻点（移动端 tap）时，浮出一张深蓝灰磨砂玻璃卡片（`background: rgba(20, 30, 38, 0.94); backdrop-filter: blur(16px); border: 1px solid rgba(160,161,163,0.28); border-left: 2px solid #F2743A;`）。
- **内容纪律**：每条提示严格用 **1–2 句极简文字**讲清「这是什么」和「点击后会发生什么」，支持 `EN / 中文` 双语，按 `Esc` 或点击外部自动关闭，自动防视口左右溢出。
- **必须覆盖的节点**：时间锁开关、随礼心意金、DCA 定投预告、多人 AA 合买模式、合买截止与退款保护、爱情基金双签结婚奖励、爱情基金分手条款与冷静期防死锁、销毁取币按钮。

---

## 二、功能 1：时间锁礼盒 + 「新年时间胶囊」主题特展（`EXHIBITION 02`）

### 2.1 智能合约扩展（BSC 测试网 97）
- 在 `contracts/platform/MementVaultGift.sol`（及对应编译产物与测试脚本）的 `VaultAsset` 中增加 `uint64 unlockTime`（`0` 表示随时可销毁取币；`> 0` 表示必须满足 `block.timestamp >= unlockTime` 才能执行 `burnAndRedeem`）。
- 补全本地隔离链测试：未到 `unlockTime` 时调用 `burnAndRedeem` 必须 `revert`；时间推进超过 `unlockTime` 后持有人可正常销毁并全额取出锁仓资产。

### 2.2 前端：新年时间胶囊特展 `/series/new-year` + 常规柜台时间锁
1. **注册特展（`src/domain/series.ts`）**：将 `EXHIBITION 02 · NEW YEAR CAPSULE / 新年时间胶囊` 设为 `status: 'live'`，路由 `/series/new-year`，在「展厅 → 主题特展」中以同款深蓝灰冷灰玻璃展柜呈现。
2. **专属特展页 `/series/new-year`（`src/app/series/[slug]/page.tsx` + `src/components/new-year-capsule.tsx`）**：
   - 左侧：深蓝灰磨砂玻璃胶囊展柜，展示极简建筑光环与**目标开启日期的实时倒计时**（如 `2027.01.01 00:00`）。
   - 右侧：高仪式感创建流——① 选择「寄给未来的自己 / 寄给重要的人」；② 选定开启日期（快捷选项：2027 元旦 / 2027 农历春节 / 一年后 / 自定义日期，旁带 `<InfoTip>`）；③ 存入定期心意金（BNB / USDT 演示模拟，同时嵌入下文「DCA 定投 · Coming Soon」预览切换）；④ 挑选 3 种实体信纸写信给未来的自己；⑤ **长按 2 秒封缄入盒动画** → 生成带二维码的胶囊邀请函与独立开启预览！
   - **未到期开启态演示**：打开胶囊链接后，若未到开启时间，呈现极静谧的**「时间封印态」**（精准日/时/分/秒倒计时 + 锁定的取币按钮 + 温柔文案“有些答案，交给时间来打开”），角落提供极低调的演示开关「演示：快进至开启时刻」供现场 Demo 立即体验到期解锁。
3. **常规柜台同步**：在 `src/components/vault-fields.tsx`（送礼柜台的「随礼封存心意金」）增加可选的**开启时间锁（随时可取 / 指定未来日期）**与 `<InfoTip>`，收礼页 `vault-plaque.tsx` 同步支持时间锁倒计时展示。

---

## 三、功能 2：爱情基金（`EXHIBITION 03 · LOVE VAULT` · 双人约定多签）

### 3.1 智能合约：`contracts/platform/MementLoveVault.sol`
- 支持两位参与者（`partnerA`、`partnerB`）共同向同一编号基金存入原生 BNB（或预留标准 ERC-20），创建时写入不可篡改的**分手条款**（枚举：`SPLIT_PROPORTIONAL` 按各自出资比例退回、`ALL_TO_A`、`ALL_TO_B`、`DONATE` 给指定地址）以及冷静期时长 `cooldownSeconds`。
- 合约支持独立的平台随礼金池（`platformBonusPool`，与用户本金账本严格隔离）。
- **结婚解锁（`approveMarriage`）**：严格要求 `partnerA` 与 `partnerB` **两个钱包均签名同意**，达成 2-of-2 后立即释放全部本金 + 若随礼金池充足则额外发放约定比例/定额的平台随礼礼金（CEI + `ReentrancyGuard`）。
- **分手止损防死锁**：
  - 双方均调用 `approveBreakup`（2-of-2）→ 立即按初始分手条款分配本金（不发平台随礼礼金）；
  - 若仅一方调用 `requestBreakup()` → 启动冷静期计时；冷静期满且双方未达成结婚共识，任一方可调用 `finalizeBreakupAfterCooldown()` 按初始条款自动释放资金，彻底杜绝单方失联/赌气导致的资金永久死锁！
- 编写完整隔离链测试 `scripts/love-vault-contract-test.mjs` 覆盖：双人出资、2-of-2 结婚领本金+随礼礼金、单方无法骗领结婚礼金、2-of-2 立即分手分配、单方分手冷静期内拦截、冷静期满自动按约定解约、防重入。

### 3.2 前端：爱情基金特展 `/series/love-vault`
- 在 `src/domain/series.ts` 注册 `EXHIBITION 03 · LOVE VAULT / 爱情双签基金`（`status: 'live'`，路由 `/series/love-vault`）。
- 视觉语言：严格保持深蓝灰 + 冷灰 + 亮橙高定画廊风（**绝不用俗气粉红爱心**），左侧展柜内呈现**双钱包交叠的极简建筑光环契约徽记**（实时显示双方已存入金额、平台随礼预估与双签状态）。
- 右侧契约流（每一步均配极简 `<InfoTip>`）：
  1. 填写 Partner A & Partner B 称呼/钱包地址与各自存入金额；
  2. 明确展示「结婚礼遇」：双钱包共同签署结婚即可取出本金 + 平台随礼礼金；
  3. 坦诚庄重的「若有一天分开（Broken）」归属选择（按出资比例各自退回 / 全归 Partner A / 全归 Partner B / 捐赠指定地址），旁带 `<InfoTip>` 说明冷静期防死锁机制；
  4. **长按 2 秒缔结双人契约** → 进入**交互式契约档案演示态**，允许用户现场分别点击「模拟 Partner A 签名」与「模拟 Partner B 签名」，直观体验 **「双签修成正果（本金 + 平台随礼释放）」** 或 **「单方发起分手 → 演示快进冷静期 → 按契约自动分配」** 的完整闭环！

---

## 四、功能 3：多人 AA 合买送朋友（Group Co-Gifting ·「合礼」）

### 4.1 智能合约：`contracts/platform/MementGroupGift.sol`
- `createGroupGift(recipient, targetPrice, targetVault, deadline)` 创建合买单；
- `contribute(groupId)` 支持多位好友分别出资累加，凑满 `targetPrice + targetVault` 自动结算并触发铸造/锁定事件；
- 超过 `deadline` 未凑齐时，支持每位出资人调用 `refund(groupId)` 全额无损退回本金（CEI + `ReentrancyGuard`）。
- 编写隔离链测试 `scripts/group-gift-contract-test.mjs` 覆盖：多人出资凑齐成团、超额退还/拒收、超时未凑齐各自全额退款、防止重复退款。

### 4.2 前端：送礼柜台「独自赠礼 / 多人 AA 合买」切换 + 合买进度展厅
- 在 `src/components/gift-checkout.tsx`（`/gifts/[id]`）顶部增加极简切换：`独自赠礼 (Solo)` | `多人 AA 合买 (Group AA)`（旁带 `<InfoTip>`）。
- 选择 `多人 AA 合买` 时：
  - 设定收礼人、合买份数（如 2–8 人，自动算出每人 AA 金额）、可选共同封存心意金、截止日期与发起人的第一段祝福；
  - 长按 2 秒发起合买后，展示高定风格的**「合买集结面板」**：
    - 极简建筑进度条（如 `1 / 4 已加入 · 0.02 / 0.08 BNB`）；
    - 已加入好友的署名与祝福卡片墙；
    - 一键复制合买邀请链接，以及一个供现场 Demo 使用的按钮 **「模拟好友加入 AA 并留祝福」**；
    - 当最后一份凑齐时，触发优雅的「合礼集结完成 · 封缄成盒」动效，并可一键预览**汇总了所有好友署名与祝福的实体多人折叠长信**！

---

## 五、功能 4：DCA 定时定投礼盒（Coming Soon 精致预览）

- 在 `src/components/vault-fields.tsx` 与 `src/components/new-year-capsule.tsx` 的存入方式中，并列展示极简选项：`一次性封存 (Lump Sum)` | `DCA 定时定投 (Coming Soon)`（旁带 `<InfoTip>`）。
- 切到 `DCA 定时定投` 时，展示精致的定投计划预览器（默认示例 `500 USDT`，可选买入目标 `BNB / BTCB / 代币化美股`、定投期数如 `10 周 · 每周 50 USDT`），下方清晰标注「链上自动定投功能即将上线（Coming Soon · 演示预览）」，不误导为已执行真实交易。

---

## 六、验证与收尾要求

1. **严禁启动 Playwright 或任何浏览器二进制**。
2. 在 Node 22/24 环境下跑完以下全部验证并确保通过：
   ```sh
   npm run typecheck
   node --import tsx --test tests/*.test.ts
   npm run test:nft
   node --test scripts/testnet-contract-test.mjs
   node --test scripts/love-vault-contract-test.mjs
   node --test scripts/group-gift-contract-test.mjs
   npm run build
   ```
   （如 `next build` 首次因 16.4.3 安全提示退出 1，再执行一次 `npm run build` 验证通过。）
3. 同步更新 `docs/STATUS.md` 与 `docs/FILE_MAP.md`。
