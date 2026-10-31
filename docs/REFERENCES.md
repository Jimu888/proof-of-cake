# 官方参考与资料管理

以下为 2026-10-31 查阅的入口。外部规则可能更新；实现接入时重新核对。未将整篇第三方内容复制进仓库。

| 来源 | 用途 | 当前证据边界 |
| --- | --- | --- |
| [Binance Agent ID FAQ](https://web3.binance.com/en/dev-docs/products/agentic-wallet/ai-pro#came-from-the-agent-id-campaign) | 领取、命名、绑定和转账解析 | 不证明第三方网站可直接登录 |
| [SPACE ID Agent ID](https://docs.space.id/agent-id) | 正反向身份解析及链上注册表 | 未完成本项目集成与实测 |
| [Next.js 官方文档](https://nextjs.org/docs) | App Router 与服务端接口 | 依赖锁定在 package-lock.json |
| [SIWE 规范](https://eips.ethereum.org/EIPS/eip-4361) | 候选钱包登录流程 | 需确认目标钱包的签名能力 |
| [ERC-721](https://eips.ethereum.org/EIPS/eip-721) | NFT 基础接口 | 未写赠礼合约 |
| [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192) | 候选不可转让标记 | 未确定最终设计 |
| [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/) | 后续合约实现参考 | 未选定版本或部署 |

## 素材目录规则

- assets/originals：经确认可放入私有仓库的小型原创导出文件。
- assets/README.md：每份素材的作者、授权、用途与源文件位置。
- research：脱敏访谈、调研摘要和来源链接。
- 不提交私人钱包数据、生日名单、通信内容或凭据。
- 大型文件先记录索引，确定 Git LFS / 私有存储后上传；不因为“所有资料入库”而提交密钥或敏感数据。
