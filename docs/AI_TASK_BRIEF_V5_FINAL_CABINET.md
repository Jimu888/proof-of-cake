# Mement 终极定稿换装、多媒介装裱与中英双语任务单（v5）

> **用途**：供执行编码的 AI 模型直接读取并在仓库 `/Users/jimu/几木JIMU-web/proof-of-cake` 内完成全站视觉定稿与双语升级。
> **视觉定稿参考图（已保存在仓库内）**：
> - 3D 雕塑展柜参考：`design-demos/boutique-concepts/final-cabinet-zodiac-3d.jpg`
> - 平面/动漫装裱展柜参考：`design-demos/boutique-concepts/final-cabinet-anime-2d.jpg`
> **安全与边界**：严禁破坏既有 `/receive` 生日 3D 个例、`/ops/*` 后台、BSC 测试网合约及 16 项业务测试。

---

## 一、全站定稿三色体系（Palette 2：深蓝灰 · 冷灰 · 亮橙）

将 `src/app/platform.css` 全局视觉变量统一升级为定稿三色体系：
- **深蓝灰主基调（Deep Slate Blue-Gray）**：
  - 外墙暗背景：`--bg-wall: #131c24;`（配合微弱径向建筑渐变 `#1b2833` → `#111920`）
  - 展柜面板底：`--bg-cabinet: rgba(38, 56, 68, 0.42);`（`#263844` 磨砂玻璃感）
  - 壁龛深内壁：`--bg-niche-deep: #152028;` → `#0e161d;`
- **冷灰结构与文字（Cool Architectural Gray）**：
  - 磨砂金属/玻璃边框与倒角：`--metal-gray: #A0A1A3;`（配合 `rgba(160, 161, 163, 0.22)` 细线与高光）
  - 主文字：`--ink-primary: #eef1f4;`
  - 次要文字：`--ink-secondary: #A0A1A3;`
  - 弱辅助文字：`--ink-muted: #6f7c87;`
- **亮橙精准点缀（Bright Signal Orange `#F2743A`）**：
  - `--accent-orange: #F2743A;`
  - **克制原则（只占画面 ~3%）**：仅用于 ① 顶部当前激活导航项（文字 + 小圆点 + 极细下划线）、② 展柜左上角当前激活序号 `01` 与小圆点、③ 展柜内壁左上棱角一根极细的亮橙光学灯线、④ 主行动胶囊按钮的发光边框与极淡橙色内晕。严禁大面积铺橙色！

---

## 二、首页 1:1 复刻「一体式大玻璃展柜（Unified Showcase Cabinet）」

重构 `src/components/crypto-gift.tsx` 第一屏 `.boutique-vitrine` 与对应 CSS，严格对齐参考图构图：

1. **顶部导航栏（`.boutique-header`）**：
   - 左侧：`MEMENT`（大字距追踪感）。
   - 右侧：`VITRINE`（激活时 `#F2743A` + 小圆点 + 下划线）、`ROOM`、`CREATORS`、`WALLET`，最右侧增加一枚极克制的双语切换按钮 `EN / 中文`。
2. **中央一体式磨砂玻璃展柜卡片（`.vitrine-cabinet`）**：
   - 尺寸居中锁死：`width: min(980px, 84vw); height: min(74svh, 640px);`，圆角 `6px`，外缘 `1px solid rgba(160, 161, 163, 0.28)`，面板带微弱磨砂玻璃质感（`backdrop-filter: blur(18px)`）与一层极淡的斜向玻璃反光层（`linear-gradient(118deg, rgba(255,255,255,0.04) 0%, transparent 48%, rgba(255,255,255,0.02) 100%)`）。
   - **展柜内部三段式布局**：
     - **顶栏（框内顶部）**：左侧 `01` `02` `03` 可点击索引（激活项 `#F2743A` + 下方小圆点）+ `CURRENT VITRINE`；右侧两行右对齐等宽元数据（如 `GENESIS ZODIAC` / `2027 · DINGWEI`，或 `PERMANENT COLLECTION` / `ARTIST · 08 EDS`）。
     - **中段（宽幅深嵌顶光壁龛 `.cabinet-stage`）**：
       - 横跨展柜左右内边距，带清晰的冷灰金属/磨砂内凹斜边框（上、下、左、右 4 面不同受光明度）；
       - 顶部中央一块**明亮干净的乳白漫射天窗灯箱**（纯白柔和向下打光，绝不发黄发脏）；
       - 左上内棱角一条极细的 `#F2743A` 亮橙光学折射灯线（`box-shadow` 极柔和外溢）。
     - **底栏（框内底部）**：
       - 左侧：优雅衬线主标题（如 `Genesis Zodiac` / `Summer Signal`）+ 单行克制副标（`Luminous Voxel · 01 / 03`）；
       - 右侧：次要链接 `Enter Room ↗` + **胶囊形亮橙发光边框主按钮**（`border-radius: 999px; border: 1.5px solid #F2743A; background: rgba(242, 116, 58, 0.14); box-shadow: 0 0 22px rgba(242, 116, 58, 0.28);`，文案 `Explore Zodiac →` / `View & Gift →`）。
3. **展柜正下方底部提示**：
   - 极细 `1px × 18px` 垂直微光线 + `SCROLL TO SWITCH`（中文模式为 `上下滑动切换橱窗`），上下滑动即可在 3 件精选橱窗藏品间丝滑切换。

---

## 三、多媒介「策展装裱系统（Presentation Modes）」：让每种画风都浑然天成

在 `src/domain/catalog.ts` 中为 `Artwork` 增加可选字段 `displayMode?: 'sculpture-3d' | 'framed-2d' | 'scroll-ink' | 'motion-video'`（未指定时按作品特性自动推断），并在首页展柜、展厅壁龛、详情页和收礼页统一按类别差异化装裱：

1. **`sculpture-3d`（3D 雕塑 / 十二生肖体素）— 解决 3D 融入展柜的问题**：
   - **场景光影与深蓝灰展柜无缝融合（`src/components/zodiac-stage.tsx`）**：
     - 透明 Canvas 渲染（`alpha: true`），背景直接透出深蓝灰展柜内壁，绝不出现黑块割裂；
     - 灯光精准匹配展柜环境：顶部纯白主光（模拟天窗灯箱）+ 柔和冷蓝灰轮廓背光（`#9cb7cc`）+ 左侧极克制的暖橙边缘补光（`#f2743a`, 强度 `0.38`，呼应展柜左上那条亮橙灯线）；
     - 保持克制 `UnrealBloomPass`（`threshold: 0.88`, `strength: 0.16`, `radius: 0.35`）与 `RoomEnvironment`（`environmentIntensity: 0.55`），让黑曜石与香槟金棱角分明、不发雾；
     - 在 3D 雕塑正下方加一枚柔和的**椭圆形地面接触暗影（Contact Shadow）**（或极简深石板低矮底座），消除“贴图悬空感”，让雕塑真正稳稳立在展柜光场里！
2. **`framed-2d`（平面插画 / 二次元动漫 / 写实 / 摄影）**：
   - 严格复刻参考图 `final-cabinet-anime-2d.jpg` 的装裱效果：为图片外围包裹一层**极简冷银灰金属画框（`6px` 哑光银白边框 `#cfd4d8` + 细微内槽阴影 + 柔和壁挂投影 `0 18px 40px rgba(0,0,0,0.52)`）**，居中悬挂在深蓝灰内壁上，画面色彩 100% 纯净。
3. **`scroll-ink`（东方水墨 / 宣纸 / 竖幅画作，如《今天不数羊》）**：
   - 不加金属粗框，保留宣纸自然清雅留白与轻盈纸面浮影（`1px solid rgba(255,255,255,0.12)` + 柔和悬空投影），呈现东方纸本与当代深蓝灰建筑的清冷反差。
4. **`motion-video`（动态影像 / 循环视频，预留标准组件样式）**：
   - 极窄深色无框画幅 + 右下角极小等宽呼吸点 `● MOTION`，支持静音自动循环与悬停交互。

---

## 四、中 / 英双语系统（默认英文 `EN`，一键无缝切换 `中文`）

1. **新增 `src/lib/i18n.tsx`（轻量 Context + `localStorage` 持久化）**：
   - 支持 `'en' | 'zh'`，**默认初始语言为 `'en'`**（呈现最具质感的高级英文画廊界面），读取 `localStorage.getItem('mement-lang')` 记住用户偏好。
   - 在 `src/app/layout.tsx` 中用 `<LanguageProvider>` 包裹应用。
2. **顶部导航双语切换开关**：
   - 在顶部导航最右侧增加极简切换控件：`EN / 中文`（当前选中语言高亮，切换瞬间全站文案无刷新更新）。
3. **覆盖范围**：
   - 首页一体式玻璃展柜（`VITRINE / ROOM / CREATORS / WALLET`、`CURRENT VITRINE`、`SCROLL TO SWITCH`、`Explore Zodiac →`、`Enter Room ↗`、`View & Gift →`）；
   - 展厅双空间（`Permanent Collection` / `Exhibitions`、`常设陈列` / `主题特展`）；
   - 十二生肖特展 `/series/zodiac` 与独立收礼页 `/gift/zodiac`；
   - 常规作品柜台页 `/gifts/[id]`（含“随礼封存一份心意金 / Vaulted Gift Inside”、长按 2 秒封缄、不可转让与销毁取币规则提示）与收礼页 `/gift/[token]`。
   - 作品标题、副标题与艺术家名在英文模式下优先显示 `artwork.name` / 英文副标，中文模式下显示 `artwork.title` / 中文副标。

---

## 五、全站视觉一致性与验收要求

- 将展厅内部（`The Room`）、十二生肖赏玩台（`/series/zodiac`）、送礼柜台（`/gifts/[id]`）和收礼暗房（`/gift/...`）的背景与主按钮同步对齐到 **深蓝灰 `#131c24` / `#263844` + 冷灰 `#A0A1A3` + 亮橙 `#F2743A`** 体系（保持 `/receive` 生日 3D 个例独立不动）。
- 完成后运行全部检查（Node 22/24）：
  ```sh
  npm run typecheck
  npm test
  npm run test:nft
  node --test scripts/testnet-contract-test.mjs
  npm run build
  ```
- 同步更新 `docs/STATUS.md` 与 `docs/FILE_MAP.md`。
