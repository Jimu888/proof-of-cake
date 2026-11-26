# Mement

Mement turns curated digital art into a gift for someone you care about, a promise you share, or your future self. Seal a message or a reserve and open it together when the moment arrives.

## Try the gifting flow

- **Gift Someone** — Choose artwork from the 3D and generative art Vitrine, add a public message, and share an unboxing link.
- **Shared Promise** — Create a keepsake for two named participants with a shared opening date and preview terms.
- **To Future Me** — Set a Time Capsule date or a Price Milestone with a maximum waiting period.
- **Login-free unboxing** — Open the artwork and letter directly. Gift links can name an intended recipient. Wallet sign-in verifies address control with a server challenge. Demo links preview identity binding and reserve rules without verifying email, social, or `.ai` identity or moving funds.

## Live BSC Testnet (Chain 97) Deployments

| Contract / Oracle Feed | Network | Address |
| --- | --- | --- |
| **MementVaultGift** (Soulbound NFT + Native Vault + Atlas Milestone) | BSC Testnet (97) | [`0xCd918f5eB2070dc82FD0933b3D66073338f334F8`](https://testnet.bscscan.com/address/0xCd918f5eB2070dc82FD0933b3D66073338f334F8) |
| **MementLoveVault** (Two-Party Shared Promise + 30-Day Cooldown) | BSC Testnet (97) | [`0x4601DD2C53d10A7561C795C3b3DaD3669b6270EF`](https://testnet.bscscan.com/address/0x4601DD2C53d10A7561C795C3b3DaD3669b6270EF) |
| **Atlas Oracle · BTC/USD** (Onchain Milestone Push Feed) | BSC Testnet (97) | [`0xE20536BC715AAc6560394E33DEb66Ed205aEEc33`](https://testnet.bscscan.com/address/0xE20536BC715AAc6560394E33DEb66Ed205aEEc33) |
| **Atlas Oracle · BNB/USD** (Live Reference Push Feed) | BSC Mainnet (56) | [`0x9C0517F5b4C8657c7F18d68d2d79E2B3b1cd6438`](https://bscscan.com/address/0x9C0517F5b4C8657c7F18d68d2d79E2B3b1cd6438) |
| **Atlas Oracle · ETH/USD** (Live Reference Push Feed) | BSC Mainnet (56) | [`0x7942b8dd9F552c57Eb94D16Ea8215AeF6cAC948f`](https://bscscan.com/address/0x7942b8dd9F552c57Eb94D16Ea8215AeF6cAC948f) |

## Sponsor integrations

| Sponsor | Integration |
| --- | --- |
| **BNB Smart Chain** | Platform chain writes target **BSC Testnet 97** and use tBNB. The full `/wallet` panel handles testnet gifting and transaction verification. The standalone `/receive` birthday gift has a separate historical mainnet release. |
| **Atlas Oracle** | The BSC registry covers BTC/USD, ETH/USD, BNB/USD, and USDT/USD. The market route reads configured Atlas Push single-feed adapters on BSC and labels live PancakeSwap BSC reference quotes when an Atlas feed is unavailable. These prices drive the demo milestone preview. [Developer docs](https://docs.atlasoracle.io) · [Feed explorer](https://atlasoracle.io/feeds) |
| **Cloudflare** | Bounded public snapshots let built-in and Zodiac demo gifts open when the local SQLite order is missing on a fresh instance. The route prefers stored orders and validates fallback snapshots before display. The fallback is a portable demo rendering path. The full application still requires a compatible Node runtime and persistence for order creation and creator uploads. |

Set `ATLAS_ORACLE_FEED_BTC`, `ATLAS_ORACLE_FEED_ETH`, `ATLAS_ORACLE_FEED_BNB`, or `ATLAS_ORACLE_FEED_USDT` to the corresponding Atlas Push single-feed adapter address. Optionally set `ATLAS_ORACLE_BSC_RPC` to a BSC mainnet read endpoint. The receipt shows the pair and labels a PancakeSwap fallback. The app uses no default Atlas contract addresses.

Portable links include public gift text and display data in the URL. A snapshot is editable and grants no wallet session, payment record, or claim authority. Links above the 1,400-character limit and uploaded works depend on stored orders.

## Architecture

| Layer | Code |
| --- | --- |
| Application | `src/app` — Next.js App Router, market API, demo gift routes, creator studio, operations |
| Experience | `src/components` — React, Three.js and generative artwork, EN/ZH gifting and receive flows |
| Domain | `src/domain` — Validation, order snapshots, artwork policies and reserve rules |
| Server | `src/server` — SQLite orders, server wallet challenges and testnet transaction verification |
| Integrations | `src/lib`, `contracts` — Atlas adapter registry, portable gift codec, testnet ABIs and Solidity contracts |

## Run locally

Use Node.js 22.13+ with built-in SQLite. The repository pins Node.js 24.

```sh
npm ci
npm run dev
```

Open [the local Vitrine](http://127.0.0.1:3000). For sample creator listings and clearly labeled demo sales, run `npx tsx scripts/seed-showcase.ts`. Data defaults to `delivery/platform-demo/`. For remote wallet sign-in, set `MEMENT_ORIGIN` to the public HTTPS origin.

## Verify

```sh
npm run typecheck
npm test
npm run test:nft
node --test scripts/{testnet,vault-gift,group-gift,love-vault}-contract-test.mjs
npm run build
```

Contract tests run on isolated local chains.

## 中文摘要

Mement 是精选数字艺术赠礼平台，支持「赠予他人」「双人约定」「致未来的自己」。用户可挑选三维或生成艺术，封入公开祝福，体验时间胶囊或币价里程碑。收礼人无需登录即可启封。钱包身份仅由服务端校验签名确认，收礼身份绑定和礼金条件在演示中仅供预览。

平台链上操作限于 BSC 测试网 97。币价可配置 Atlas Oracle，未取得 Atlas 报价时使用标明来源的 PancakeSwap BSC 参考价。Cloudflare 等无状态实例可凭有效的公开快照恢复内置作品和生肖赠礼预览。独立生日作品保留历史主网发行记录。

[接手说明](docs/AI_HANDOFF.md) · [文件索引](docs/FILE_MAP.md) · [平台规则](docs/PLATFORM_V1.md) · [当前进度](docs/STATUS.md) · [测试网演示](docs/releases/PLATFORM_DEMO.md) · [生日个例](docs/releases/BIRTHDAY_DEMO.md) · [生日发行记录](docs/releases/BIRTHDAY_NFT_PLAN.md)
