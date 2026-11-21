# 接口约定

## 已实现的本地演示接口

| 方法与路径 | 用途 |
| --- | --- |
| GET / | 精选作品首页与赠礼入口 |
| GET /api/health | 检查服务启动，不代表链上服务健康 |
| GET /api/catalog | 统一的概念作品、示例 BNB 价格、发行规则与预设祝福 |
| POST /api/demo/gifts | 校验输入并创建临时演示记录，不发生外部操作 |

```sh
curl http://127.0.0.1:3000/api/demo/gifts \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: first_demo_001' \
  -d '{"artworkId":"genesis-cake","recipientHandle":"alice.ai","blessingId":"birthday"}'
```

成功返回 201；同一请求标识重复发送同一内容返回 200 且 ID 不变；重用标识但更改内容返回 400。输入名字只校验格式，不查询其存在或所有权。演示存储单进程、上限 1000 条、有效期一小时；重启或过期后不再保证去重。禁止公开部署此无登录演示接口。

错误：400 无效输入/JSON；413 内容过长；415 请求类型错误；503 非 demo 模式。当前长度检查在读取后执行，公开部署前必须增加网关级流式大小限制与限流。

## 平台订单预览

POST /api/demo/orders 接收 artworkId、recipient、message，要求 16–100 位 Idempotency-Key。recipient 是完整 .ai 名称或 BSC 地址，只校验输入格式，不代表解析和控制权证明。无需额外勾选上链确认。旧版 publicMessageAccepted 字段兼容接收并忽略。

返回 order 显示快照、replay 与 sharePath。创建为 201，重放为 200。拒绝浏览器提交价格、分成、身份、状态或规则字段。分成只在服务端存储。SQLite 持久化与边界见 [平台演示](releases/PLATFORM_DEMO.md)。订单状态始终为 demo_preview，不进入 paid、minted 或 delivered。

GET /gift/{shareToken} 服务端读取有效演示快照，未知或过期链接显示退路。正式礼物接口和支付流程仍待实现。

## 规划接口（尚未实现）

- POST /api/auth/challenge：生成一次性登录挑战。
- POST /api/auth/verify：验证签名与挑战，创建安全会话。
- POST /api/auth/logout：撤销当前会话。
- GET /api/identities/resolve?handle=…：从可信服务获取指定链地址。
- POST /api/orders：登录后创建订单，服务器验证作品、价格和接收地址。
- POST /api/orders/:id/transactions：登记交易哈希，后台独立核验。
- GET /api/orders/:id：仅购买人查询完整订单。
- GET /api/gifts/:publicId：经批准公开的礼物信息，不暴露订单隐私。
- GET /api/me/gifts：自己的展厅与隐藏记录。
- PATCH /api/me/gifts/:id：本人设置展示偏好。

## 真实状态机（草案）

Order: created → awaiting_transaction → confirming → delivered。

awaiting_transaction 可取消/过期；失败或回滚进入 failed，重试需再次校验有效报价。超时不等于链上失败；禁止盲目重发。交易已提交但后台中断时，通过事件补扫恢复。网络重组需撤回尚未达到最终性阈值的送达状态。

演示状态仅 demo_created，永不进入 delivered。是否展示为送达，由后台核验正确链、合约、收款币种/金额、订单标识、收礼地址、作品与 NFT 事件，并达到链配置的确认要求决定。
