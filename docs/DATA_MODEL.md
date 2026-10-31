# 数据模型草案（未建库）

| 实体 | 主要字段 | 约束 |
| --- | --- | --- |
| User | id, chain_id, wallet_address, created_at | chain + normalized address 唯一；不要求实名 |
| Identity | user_id, provider, handle, resolved_address, checked_at | 来源与查询时间；不能用客户端昵称证明身份 |
| SessionChallenge | nonce_hash, domain, chain_id, address, expires_at, used_at | 一次性、短有效期；绑定站点和会话 |
| Artist | id, display_name, agreement_ref | 上架前确认授权 |
| Artwork | id, artist_id, title, media_cid, metadata_cid, edition_limit, status | 平台控制；素材版本不可偷偷替换 |
| Offer | artwork_id, chain_id, currency, amount_atomic, valid_until | 金额使用最小整数单位，禁止浮点金额 |
| Order | id, sender_user_id, recipient_handle, recipient_address, chain_id, offer_snapshot, blessing_id, idempotency_key, status | sender + key 唯一；接收地址下单时锁定 |
| ChainTransaction | id, order_id, tx_hash, chain_id, block_number, block_hash, status | chain + hash 唯一；允许失败后的新尝试 |
| Gift | id, order_id, artwork_id, recipient_address, sender_address, chain_id, contract_address, token_id, delivered_at | order_id 唯一；chain + contract + token_id 唯一 |
| ChainEvent | chain_id, tx_hash, log_index, block_hash, canonical | chain + hash + log_index 唯一；处理重组 |
| DisplayPreference | user_id, gift_id, hidden | 仅地址持有人可以修改；链记录仍存在 |
| Notification | id, gift_id, channel, recipient_ref, state, attempt_count | 礼物 + 渠道 + 目标唯一，重试不重复发送 |
| OutboxJob | id, kind, dedupe_key, payload, attempts, next_run_at | 业务写入与任务入队同一数据库事务 |

收礼地址不必对应已注册 User。不要使用域名作为数据库主键，也不要仅靠域名确定历史赠送对象。用户更换资料不改变历史订单地址快照。

当前 DemoGift 只包含作品编号、输入名字、祝福编号和 demo_created 状态，不包含付款、合约或已验证身份。临时记录重启即丢失，不是以上生产模型的实现。
