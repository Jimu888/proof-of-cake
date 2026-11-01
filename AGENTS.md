# Project instructions

- Read README.md, docs/PRODUCT.md, docs/ARCHITECTURE.md and docs/STATUS.md before work.
- This is a new independent project. Never import files from the parent website without explicit selection.
- All product decisions and progress belong in this repository. Update docs/STATUS.md when completing a milestone.
- Default to Chinese documentation. Keep source identifiers in English.
- Current mode is DEMO ONLY. Never present a demo gift as paid, minted, delivered, or a verified identity.
- Never request, store or commit private keys, seed phrases, credentials, user wallet data, or private birthday messages.
- Browser-provided names and addresses are not proof of wallet control. Live login requires a verified server challenge.
- No production payments or chain writes until the integration milestone is explicitly undertaken.
- Do not call the product fully decentralized: curated supply and the web application are platform-operated.
- Use one modular Next.js application initially. Do not add microservices or multiple chains speculatively.
- Tests should protect boundaries: validation, authorization, idempotency, payment/chain state transitions.
- Run npm run typecheck, npm test and npm run build before handoff. Report exact verification limits.

- Platform identity and artwork aesthetics are separate. Cartoon, ink, pixel, colorful and monochrome art are all allowed contents. Do not derive the entire site theme from one artwork, recolor artwork to fit the shell, or assume single-artwork browsing is mandatory. The user authorized a black-and-gold interactive frontend based on two new references on 2026-11-01. Keep all wallet and chain features demo-only.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
