# Mement 首页街角橱窗排版精修指令（v4 · 紧凑居中四角海报构图）

> **目标**：将首页 `/` 街角橱窗（`.boutique-vitrine`）从“左下角堆字 + 最右侧索引”改为 **「居中收束的当代艺术展四角海报构图」**——四角文字围绕在中央壁龛附近，**绝不贴到浏览器屏幕最四边**，在任何宽屏（1440px / 1920px / 2560px）下都保持紧凑、平衡、建筑摄影级的高级感。
> **仅调整首页 `.boutique-vitrine` 的 HTML 结构与 CSS 排版**，保留当前已调好的四面内凹壁龛质感、3D 未羊灯光、上下滑动切换逻辑及所有其他页面。

---

## 1. 引入居中收束画幅容器（核心关键）

在 `src/components/crypto-gift.tsx` 的 `.boutique-vitrine` 内，用一个居中画幅容器 `.vitrine-poster` 包裹中央壁龛与四角信息：

```tsx
<div className="vitrine-poster">
  {/* 左上角：当期橱窗索引（可点击切换 01 / 02 / 03） */}
  <div className="vp-corner vp-tl">
    <div className="vp-index-row" aria-label="切换橱窗展品">
      {/* 渲染 01 / 02 / 03 按钮，当前项高亮并带极细底线 */}
    </div>
    <span className="vp-meta">当期橱窗 · VITRINE</span>
  </div>

  {/* 右上角：期数 / 主题标签 */}
  <div className="vp-corner vp-tr">
    <span className="vp-mono">{isZodiacVitrine ? 'GENESIS ZODIAC' : 'PERMANENT COLLECTION'}</span>
    <span className="vp-meta">{isZodiacVitrine ? '2027 丁未' : vitrineWork?.artist}</span>
  </div>

  {/* 正中央：四面内凹深嵌建筑壁龛（保持现有 3D 未羊 / 作品结构不变） */}
  <div className="vp-center">
    {/* 现有的 Link.boutique-niche.vitrine-niche */}
  </div>

  {/* 左下角：克制衬线标题与单行副标 */}
  <div className="vp-corner vp-bl">
    <h1>{isZodiacVitrine ? '十二生肖 · 链上生日礼物' : vitrineWork?.title}</h1>
    <p className="vp-sub">{isZodiacVitrine ? '未羊 · 实时 3D 藏品' : vitrineWork?.name}</p>
  </div>

  {/* 右下角：行动入口 */}
  <div className="vp-corner vp-br">
    {/* 主按钮（探索十二生肖 → / 细看此作 ↗） + 次入口（步入展厅 ↗） */}
  </div>
</div>
```

> 同时移除原来挂在屏幕最右边缘的 `.vitrine-index` 垂直条（编号切换已优雅融入左上角 `.vp-tl`）。

---

## 2. 精确 CSS 布局参数（`src/app/platform.css`）

- **`.vitrine-poster`**（收束在中央，绝不贴浏览器最外边）：
  - `position: relative; z-index: 2;`
  - `width: min(1020px, 88vw);`（关键！最大宽度锁死在 `1020px`，1920px 宽屏下四角依然紧贴壁龛周围，绝不飘散！）
  - `height: min(72svh, 620px);`
  - `display: grid; grid-template-columns: 1fr auto 1fr; grid-template-rows: auto 1fr auto; align-items: center; gap: 0 clamp(24px, 3.6vw, 56px);`
- **网格定位（零重叠、绝对均衡）**：
  - `.vp-center`：`grid-column: 2; grid-row: 1 / 4; display: flex; align-items: center; justify-content: center;`
  - `.vitrine-niche`：`width: min(410px, 34vw); height: min(64svh, 550px);`
  - `.vp-tl`：`grid-column: 1; grid-row: 1; align-self: start; justify-self: start; padding-top: 8px;`
  - `.vp-tr`：`grid-column: 3; grid-row: 1; align-self: start; justify-self: end; text-align: right; padding-top: 8px;`
  - `.vp-bl`：`grid-column: 1; grid-row: 3; align-self: end; justify-self: start; padding-bottom: 8px;`
  - `.vp-br`：`grid-column: 3; grid-row: 3; align-self: end; justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; padding-bottom: 8px;`
- **字号克制（绝不压过中央壁龛）**：
  - `.vp-bl h1`：`font-family: var(--font-serif); font-weight: 400; font-size: clamp(20px, 1.8vw, 26px); line-height: 1.4; margin: 0 0 6px;`（克制精致，单行或自然双行，不再做 44px 巨大粗字压迫画面！）
  - `.vp-mono` / `.vp-meta` / `.vp-sub`：`font-size: 11px; letter-spacing: 0.14em; color: var(--ink-secondary);`
  - `.vp-index-row`：横向排列 `01` `02` `03`，间距 `14px`，当前项 `#f2f2ef` + 1px 底线，其余 `#6c7078`。
- **底部上下滑动微提示**：保持在 `.boutique-vitrine` 最底部正中（极细 `1px × 14px` 竖线 + `上下滑动切换橱窗`）。

---

## 3. 移动端适配（`@media (max-width: 860px)`）

- `.vitrine-poster` 改为紧凑纵向 Flex/Grid 布局（`width: 100%; height: auto;`）：
  - 顶部一行左右并排：`.vp-tl`（左）+ `.vp-tr`（右）；
  - 中间：`.vp-center`（壁龛居中 `max-height: 44svh`）；
  - 底部：`.vp-bl`（标题居中或左对齐）+ `.vp-br`（按钮横向并排）。

---

## 4. 验证要求

```sh
npm run typecheck
npm test
npm run build
```
确保首页桌面端与移动端均无重叠、无横向溢出、上下滑动切换橱窗丝滑。
