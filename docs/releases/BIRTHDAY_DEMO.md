# 第一份三维生日礼物 · 提前演示版

2026-11-02。用户提供 birthday.glb，要求放进收礼展示页，作为准备赠予朋友的提前演示版本。

## 页面

- `/receive` 和 `/receive/birthday`：独立生日收礼体验，打开礼盒 → 三维作品 → 赠言。没有设计研究入口、价格、示例钱包、模拟到账或收藏假按钮。
- `/receive/demo`：保留旧的选品赠礼预览流程，前端定制流程仍到此页面；不会让旧会话草稿覆盖生日礼物。
- 本地项目仍通过 `npm run dev -- --port 3190` 运行。

## 模型与呈现

原文件 `/Users/jimu/Downloads/birthday/web-viewer/dist/assets/birthday.glb` 被用户明确指定。18,859,516 字节，未改动地复制到 public/birthday/birthday.glb；SHA-256 与简化技术信息见 asset-info.json。

使用 GLTFLoader 和本地 Draco 解码器，资源没有 CDN 依赖。保留来源展示器的镜头、光照/材质修正与左右 ±15° 限制，关闭缩放和俯仰，避免破坏原作品已设定的观看方式。不是 360° 环绕模型。无动画片段，不虚构骨骼或场景动画。

手机适配视场，设备像素比限 1.6，阴影图 1024。相机改变、视口改变或载入时渲染，不保持无意义的永久渲染循环。卸载时释放控制器、模型、贴图、阴影与环境资源。

加载进度、重试、WebGL 不支持、静态预览、键盘左右键、角度滑杆、复位、全屏（含不支持原生全屏时的页面内展开）均有对应处理。静态 poster 为该模型在浏览器内的截图，不是假模型占位。

## 文案

当前作品名与祝福是通用临时文案，发送人按用户本轮明确要求改为公开署名 jimu.ai。用户的个性化文字尚待回复，未从原查看器导入收礼人的名字，也未把私人赠言写入仓库。

个性化配置使用不提交的 `.env.local`：

```text
NEXT_PUBLIC_BIRTHDAY_TITLE=作品名称
NEXT_PUBLIC_BIRTHDAY_RECIPIENT=收礼称呼
NEXT_PUBLIC_BIRTHDAY_SENDER=发送人署名
NEXT_PUBLIC_BIRTHDAY_MESSAGE="生日祝福第一行\n第二行"
```

这些是预期呈现在网页里的内容，不是密钥。修改后重新启动开发服务、重新构建独立包。私人内容只进入用户指定的本地配置和交付包，不提交仓库。

## 独立交付包

`npm run build:birthday` 生成 `delivery/birthday-demo/`，包含 HTML、样式、JS、模型、解码器、字体与素材。这个目录不依赖 Next 服务、API、数据库或钱包；可部署至支持静态文件的托管服务。也支持托管在子路径下。生成物 delivery 已忽略，避免把私人文案提交仓库。

通过 HTTP/HTTPS 访问；双击 file:// 并不是支持的运行方式，因为模型与模块需要正常网页加载。`127.0.0.1` 仅本机可用，尚未创建互联网访问链接。发布范围与承载服务需由用户确定。robots/noindex 只影响搜索收录，不提供密码保护。

第三方代码许可保留在生成目录 LICENSES.txt 和解码器源文件；不把第三方建模/材质授权声明为已核验，模型作为用户提供原作接入。

## 验证边界

Chromium 软件渲染用于桌面 1440 与手机尺寸390；加载 GLB/本地解码、实际拖动改变渲染、复位、赠言弹窗、键盘关闭、全屏与静态包检查记录在 design-demos/birthday-release/。320/768 宽度下检查无溢出、键盘旋转的15度上限与复位；模拟模型载入失败后重试、关闭 WebGL 后的静态预览均通过。真实 Safari/iPhone/Android GPU 与公网弱网尚需上线后用设备验证。

Next 生产构建、类型与现有业务测试需通过。本版不执行 NFT 铸造、支付、链上赠送或身份验证，不能当作已上链的 NFT 礼物。

## 本地评审约束（用户最新确认）

先只在本地完善效果。用户预期最终提供持有链接即可访问的版本，但明确要求等待后续部署指令；当前不发布网站、不上传交付文件或推送本轮改动。之后可讨论用户自己的 Cloudflare 或 GitHub 部署。

再次核验当前模型与指定原文件的 SHA-256 完全一致：一个场景、一个合并网格、55 个材质、10 张内嵌贴图，无动画片段。完整加载导出文件；观看仍遵循原相机左右 ±15°。来源网页另加的天空、云雾等并非 GLB 内容，本版使用自己的页面背景，未声称迁移完整 Blender 工程。

## 完整交付包与连续开箱（本地更新）

用户提供 birthday-web-handoff.zip。核验包内 GLB 与此前文件完全相同；增加原查看器的暮光渐变、太阳、34 个星点、三个程序云精灵与星光开关。灯光、材质修正、源镜头与场景配置迁移进现有原生 Three.js 组件，不以 iframe 或弹窗承载主要作品。包中的素材来源许可保存在 public/birthday/licenses。

收礼页使用同一块全屏舞台：作品提前载入，礼盒层覆盖在上方；点击后开始展开，等动画与模型载入均完成，再将礼盒层淡出、场景层渐显，标题与控制稍后出现。Canvas 在开盒前后是同一元素，不重新加载或重建；舞台高度不变。加载失败或 WebGL 不支持也会结束等待并展示重试/静态图。减少动态偏好下缩短过渡，星光默认不闪烁，可主动开启。

旋转范围不是 GLB 限制。它来自 `src/components/birthday-view-config.ts` 中交付包的 yawLimitDegrees（当前15）；组件支持 yawLimit 参数，统一应用到控制器、键盘和滑杆。当前不擅自改成360°；改角度需检查作品从额外方向的效果。俯仰、距离仍采用原作设置。

本轮仍只更新本地，没有部署或 Git 推送。独立导出同步更新。检查记录在 design-demos/birthday-seamless：桌面1440、手机390及静态包，通过 Canvas 持续存在、舞台无跳高、无主作品弹窗、无查看器边框、完整环境、拖动复位与星光开关检查。

## 最新修订：同一场景的原生纸盒与星光

根据用户对割裂和生硬的反馈，生日体验统一到作品暮光配色。开场不再使用黑金图片；改为与作品共用镜头和灯光的原生纸盒。盒盖抬起后，作品从盒内位置展开，包装消隐，保留同一背景，不再用整屏模糊做衔接。原 GLB 与查看角度不变。

旧星光动画会将亮度降至 .12；新效果保留静态基线，只增亮、轻微放大并配合光晕，禁用旧CSS动画以避免叠加覆盖，实测开着时有变化且采样不低于静态亮度。细节和检查见 design-demos/birthday-unified/。仍只本地，不推送或发布。

## 2026-11-03 最新：内嵌天空与极简收礼

换用重打包的 birthday-complete.glb（模型已有太阳与34颗星星），移除网页额外太阳和星点，原生星星默认闪烁。取消 Logo、品牌抬头、页尾、所有查看工具栏和赠言弹窗。礼盒与周围是透明可点击区域；开场只写“有一个小世界，想送给你。”，提示“轻点礼盒，打开看看”。打开后只有暂定标题、画面里的临时祝福及信末 jimu.ai、轻拖提示。页面标题栏也不带品牌名。

常规体验没有可见按钮；加载错误时保留必要重试。不支持 WebGL 时先给纸盒降级，随后展示静态作品。正式祝福待用户提供。最新记录见 design-demos/birthday-minimal/。继续只本地，不上传。


### 2026-11-03 · Local birthday motion refinement

- Kept the complete sun/stars GLB, with star-centered animated glow visible from the sealed parcel screen.
- Enabled restrained vertical orbit (±4°), alongside the existing ±15° horizontal range.
- Removed the opening slogan, transition caption and upper-left artwork title. Added the recipient salutation above the letter, with the sender signature only below it.
- Centered the drag hint; added parcel hover/bobbing, a subtle pointer glow, click ripple and staggered letter entrance, with reduced-motion support.
- Three local reveal options: default paper unfolding, `?reveal=dissolve`, and `?reveal=push`. No extra product controls added.
- Browser QA covers desktop/mobile, animated star pixels before opening, pitch limits, layout and alternate reveals. Evidence: `design-demos/birthday-motion/qa-report.json`.
- Local only. No upload, deployment, commit or push performed.
