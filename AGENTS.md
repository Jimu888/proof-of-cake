# Project instructions

- Read README.md, docs/AI_HANDOFF.md, docs/PLATFORM_V1.md and docs/STATUS.md before work. Use docs/FILE_MAP.md to locate files. PRODUCT.md and ARCHITECTURE.md also preserve historical design context.
- This is a new independent project. Never import files from the parent website without explicit selection.
- All product decisions and progress belong in this repository. Update docs/STATUS.md when completing a milestone.
- Default to Chinese documentation. Keep source identifiers in English.
- Platform demo orders and sample sales must remain clearly identified. The birthday mainnet gift has a separate historical release. Platform chain interaction currently targets BSC testnet 97. Never present a demo gift as paid, minted, delivered, or a verified identity.
- Never request, store or commit private keys, seed phrases, credentials, user wallet data, or private birthday messages.
- Browser-provided names and addresses are not proof of wallet control. Live login requires a verified server challenge.
- Testnet integration is authorized and implemented. New production payments or chain writes require explicit authorization for the production operation. Archiving or uploading source does not authorize a new chain transaction.
- Do not call the product fully decentralized: curated supply and the web application are platform-operated.
- Use one modular Next.js application initially. Do not add microservices or multiple chains speculatively.
- Tests should protect boundaries: validation, authorization, idempotency, payment/chain state transitions.
- Run npm run typecheck, npm test and npm run build before handoff. Report exact verification limits.

- Platform identity and artwork aesthetics are separate. Cartoon, ink, pixel, colorful and monochrome art are all allowed contents. Do not derive the entire site theme from one artwork, recolor artwork to fit the shell, or assume single-artwork browsing is mandatory. The user authorized a black-and-gold interactive frontend based on two new references on 2026-11-01. Keep platform wallet/chain features within the documented demo and BSC testnet scope. The independently issued birthday gift retains its own mainnet records.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
