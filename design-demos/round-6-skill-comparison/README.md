# 六种设计 Skill：首页方法对比

共同任务与范围见 BRIEF.md；技能盘点和使用边界见 SKILL-INVENTORY.md。

| 方法 | 提案 | 本轮可观察的差异 |
| --- | --- | --- |
| Frontend Design | [私人献辞](01-frontend-design.png) | 献辞放在两件不同作品之间，字标和操作克制 |
| UI/UX Pro Max | [清晰选礼](02-ui-ux-pro-max.png) | 阅读路径、主操作与作品浏览更常规且直接 |
| Taste Skill | [错落展陈](03-taste-skill.png) | 按抽取的 three-prints 逻辑使用深森林色、不等尺寸展陈 |
| Hallmark | [Atelier 沙龙](04-hallmark.png) | 居中字标、轻衬线与较低声量的艺术沙龙 |
| Impeccable | [选礼礼宾](05-impeccable.png) | “为谁挑选”的身份线进入首页，强调一对一服务 |
| 花叔 Design | [生辰画册](06-huashu-design.png) | 中央竖排献辞与两侧作品，画册式编排 |

每个方法一张图；同一尺寸、产品事实、羊图内容参考和整体目标。图片由同一个原生 ImageGen 生成。Skill 是设计指导，不是六个独立绘图模型。一次输出不代表能力排名，生成模型也可能偏离指令。

实际读取了各自 SKILL.md。具备命令工具的 Skill 已运行相应的检索/方向/主题命令，记录在盘点文档与 direction 文件；没有声称每个 Skill 的所有代码、交互、部署或审核流程都完成。当前没有新前端实现。

## 检查与修订

Hallmark 和 Impeccable 初稿将羊图水墨扩展为平台背景，违背平台/作品分离要求，因此只针对外部背景进行了 ImageGen 修订。初稿保留在 drafts/，修订提示词在 revision-prompts.json。

图中文字、类型、概念像素作品及任何自动出现的宣称均为待确认占位，不能当作已确认版数、作品事实或实际控件。生成图中的参考作品并非原文件逐像素粘贴；实现时应使用授权原图。

最终提示词见 prompts.json；各图的 .png.json 记录来源与 approved=false。当前只有图片，不运行前端构建或假称键盘、响应式、性能检查通过。
