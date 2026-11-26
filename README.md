# MEMENT — Onchain Digital Art Gifting on BNB Chain

> **Give art. Seal a promise. Keep the moment.**
>
> **Not another NFT marketplace — curated digital gifts backed by real crypto.**

🌐 **Live Web App:** https://proof-of-cake.vercel.app  
📦 **GitHub Repo:** https://github.com/Jimu888/proof-of-cake  
👤 **Builder:** Jimu (Solo Builder + AI-Native Workflow) · X: [@0xijimumu](https://x.com/0xijimumu) · Telegram: [@jimu1921](https://t.me/jimu1921)

---

## Executive Summary (30-Second Judge & AI Overview)

Across industries, remote work and online friendships create deep trust across borders — yet digital gifting is still broken:
1. **Cold Crypto Transfers** — A raw transaction hash carries zero ceremony and is forgotten in seconds.
2. **Speculative NFT Hype** — Empty JPEGs rely on hype rather than real value, rarely worth keeping.
3. **No Everyday Presence** — Physical gifts sit on your desk; digital gifts vanish inside a wallet.

**Mement** turns curated digital art into non-transferable (**Soulbound**) onchain gifts backed by real crypto reserves locked in **non-custodial smart contracts on BNB Chain** — paired with a **native macOS desktop widget** that brings the gift out of the browser and onto the recipient's everyday screen.

### Core Design Pillars

- **Multi-Format Curated Art (Anti-Speculation)** — 3D, generative, illustration, anime, and ink works minted as Soulbound digital gifts built to be cherished, open to curated independent artists.
- **Keep or Claim — Intentional Design** — Backed by real crypto, not empty hype. Like a digital piggy bank, recipients keep the gift intact to cherish the art and its growing value — or **burn the Soulbound NFT only when they truly need the 100% reserve inside** (0% platform fee on gift reserves; burned gifts remain preserved as monochrome archival keepsakes).
- **Zero Platform Custody** — All gift reserves and two-party vaults lock directly in open Solidity smart contracts on BNB Chain. No platform liquidity pool, no admin withdrawal keys.
- **Living Desktop Keepsake** — Compiled native **Swift macOS desktop widget** (60fps frosted-glass floating card with live anniversary/unlock countdown) brings digital gifts into daily life.

### Three High-Frequency Gifting Scenarios

| Scenario | How It Works | Smart Mechanics |
| --- | --- | --- |
| **01 · Gift Someone** *(Personal)* | Seal curated art, a personal letter, and optional locked crypto for birthdays, holidays, or thank-yous. | Send via `.ai` domains, email, `@handle`, or `0x` wallet; optional wallet-signature **Private Note**; login-free unboxing via shareable QR invitation. |
| **02 · Shared Promise** *(Two-Party)* | Couples, close friends, or co-builders lock one shared onchain commitment. | Flexible solo or split funding locked to a custom anniversary date (e.g., Valentine's Day), activated on partner co-sign. |
| **03 · To Future Me** *(Future Capsule)* | Lock crypto and a letter to your future self — unbreakable early. | Unlock by fixed date (**Time Capsule**) or objective onchain market target (**Price Milestone** via **Atlas Oracle**, e.g., BNB $1,000 / max 2Y). |

---

## Live BSC Testnet (Chain 97) Deployments & Verification

> **Scope notice:** Platform chain writes currently target **BSC Testnet 97** (`tBNB`). Demo showcase orders and portable preview links are clearly labeled as demo previews and never represent mainnet payment or verified off-chain identity. Curated supply and the web application are platform-operated, while onchain gift reserves are non-custodial in smart contracts.

| Contract / Oracle Feed | Network | Address |
| --- | --- | --- |
| **MementVaultGift** *(Soulbound NFT + Native Vault + Burn-to-Claim + Atlas Milestone)* | BSC Testnet (97) | [`0xCd918f5eB2070dc82FD0933b3D66073338f334F8`](https://testnet.bscscan.com/address/0xCd918f5eB2070dc82FD0933b3D66073338f334F8) |
| **MementLoveVault** *(Two-Party Shared Promise Vault)* | BSC Testnet (97) | [`0x4601DD2C53d10A7561C795C3b3DaD3669b6270EF`](https://testnet.bscscan.com/address/0x4601DD2C53d10A7561C795C3b3DaD3669b6270EF) |
| **Atlas Oracle · BTC/USD** *(Onchain Milestone Push Feed)* | BSC Testnet (97) | [`0xE20536BC715AAc6560394E33DEb66Ed205aEEc33`](https://testnet.bscscan.com/address/0xE20536BC715AAc6560394E33DEb66Ed205aEEc33) |
| **Atlas Oracle · BNB/USD** *(Live Reference Push Feed)* | BSC Mainnet (56) | [`0x9C0517F5b4C8657c7F18d68d2d79E2B3b1cd6438`](https://bscscan.com/address/0x9C0517F5b4C8657c7F18d68d2d79E2B3b1cd6438) |
| **Atlas Oracle · ETH/USD** *(Live Reference Push Feed)* | BSC Mainnet (56) | [`0x7942b8dd9F552c57Eb94D16Ea8215AeF6cAC948f`](https://bscscan.com/address/0x7942b8dd9F552c57Eb94D16Ea8215AeF6cAC948f) |

### Ecosystem Integrations

| Partner / Tech | Integration |
| --- | --- |
| **BNB Smart Chain** | Live Soulbound gift minting, burn-to-claim reserve release, and two-party shared promise co-sign on **BSC Testnet 97**, designed as a low-fee consumer gateway connected to Binance CEX retail users. |
| **Atlas Oracle** | Onchain price-milestone verification for BTC/USD, ETH/USD, BNB/USD, and USDT/USD via Atlas Push single-feed adapters, with labeled PancakeSwap BSC reference fallback when a feed is unconfigured. [Docs](https://docs.atlasoracle.io) · [Feeds](https://atlasoracle.io/feeds) |
| **Native macOS Widget** | Standalone Swift frosted-glass desktop companion in `desktop-widget/` (`DesktopWidget.swift`) that renders live gift artwork and countdowns directly on the desktop. |

---

## Architecture

| Layer | Directory | Description |
| --- | --- | --- |
| **Web Application** | `src/app` | Next.js 16 App Router, gifting & receive flows, market/oracle API, creator studio, wallet verification |
| **Interactive Art & UI** | `src/components` | React 19, Three.js 3D Zodiac studio, generative & ink artwork vitrines, EN/ZH bilingual UX |
| **Domain & Security** | `src/domain`, `src/server` | Validation, idempotency, server-signed wallet challenge auth, SQLite order store |
| **Smart Contracts** | `contracts/`, `src/lib` | Solidity 0.8.30 non-custodial vaults (`MementVaultGift`, `MementLoveVault`), Atlas Oracle adapter, BSC client |
| **Desktop Keepsake** | `desktop-widget/` | Native macOS Swift frosted-glass desktop widget |

---

## Run Locally & Verify

Requires Node.js 22.13+ (repository pins Node.js 24).

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. To seed sample creator listings, run `npx tsx scripts/seed-showcase.ts`.

### Verification Suite (38 Automated Tests)

```sh
npm run typecheck
npm test                          # 29 app & API unit tests
node --test scripts/vault-gift-contract-test.mjs scripts/love-vault-contract-test.mjs  # 9 Solidity contract tests
npm run build
```

---

## Business Model & Roadmap

- **Monetization:** Curated gift edition sales (platform editions + future artist revenue share), **0% fee on enclosed gift reserves**, and future B2B custom gifting for Web3 projects, DAOs & events.
- **Organic Growth:** Shareable QR invitation cards + seasonal drops around global & crypto-native festivals (Christmas, New Year, Valentine's Day, Birthdays, Bitcoin Pizza Day, etc.).
- **Roadmap:**
  - **Dec 2026:** Christmas Holiday Pilot (*First Snow* seasonal drop) + smart-contract security audit.
  - **Q1 2027:** BNB Chain Mainnet launch, open Creator Studio for curated artists, BEP-20 / stablecoin reserves.
  - **Q2–Q3 2027:** Native iOS WidgetKit app, Bitcoin Pizza Day drop & B2B custom gifting.

---

## 中文简介

**Mement** 是部署在 BNB Chain 上的策展级数字艺术礼赠平台，覆盖「送给 TA」「共同约定」「写给未来的自己」三大场景。平台将 3D、生成艺术、插画、动漫、水墨等多元数字礼物铸造为不可转让的 Soulbound NFT，并将礼金直接锁仓在零托管智能合约中（礼金 0 手续费），收礼人可选择长久珍藏艺术与增值潜力，或仅在真正需要用钱时亲手销毁 NFT 提取 100% 礼金；配合原生 macOS 桌面小组件，让数字礼物走出浏览器、入驻日常桌面。

> **独立创作者**：Jimu（一人携手 AI 完成全栈开发、智能合约、数字礼物创作与原生桌面组件）· X: `@0xijimumu` · Telegram: `@jimu1921`

[接手说明](docs/AI_HANDOFF.md) · [文件索引](docs/FILE_MAP.md) · [平台规则](docs/PLATFORM_V1.md) · [当前进度](docs/STATUS.md) · [测试网演示](docs/releases/PLATFORM_DEMO.md) · [生日个例](docs/releases/BIRTHDAY_DEMO.md) · [生日发行记录](docs/releases/BIRTHDAY_NFT_PLAN.md)
