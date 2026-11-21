# 合约模块

`birthday/MementBirthday.sol` 是本次独立生日礼物的本地合约候选，不是平台支付合约。采用锁定版本的 OpenZeppelin ERC-721，实现 ERC-5192；本地编译和 EVM 测试，不代表已经审计或部署。

- 部署时不需要收礼地址，确定名称、不可更改的元数据 URI，以及是否允许收礼者销毁。
- 指定发行钱包可执行一次 `mintGift(recipient)`；直接铸造给收礼人，不经送礼者钱包中转。
- 仅一枚 Token #1，铸造成功后永远不能再铸造，即使销毁。
- 永久禁止全部地址间转移与授权，无解锁、升级、元数据修改或管理员移走入口。
- 可选销毁：部署时不可逆选择；若启用，仅当前收礼者可以销毁，不影响不可转让。
- 不支持恢复、换地址、管理员找回。发行前须核对接收地址及钱包类型。

## 本地检查

```
npm run compile:nft
npm run test:nft
```

`compile:nft` 仅输出到忽略目录 `delivery/nft-build`。`test:nft` 启动进程内 Ganache，用随机临时测试账户，不连接 BSC，不保留或输出密钥。

全部发行输入准备好后可运行：

```
node scripts/birthday-nft-prepare.mjs /absolute/path/to/local-config.json
```

配置字段见 `delivery/nft-release/deployment.template.json`。设置 `BIRTHDAY_ISSUER_ADDRESS` 后，命令仅通过两个 BSC 节点核验工厂代码、执行只读模拟并估算 gas，输出未签名的工厂调用数据；不签名、不上传、不广播。完整归档和元数据必须先发布并核验。编译目标为 Paris，Solidity 0.8.30，OpenZeppelin 5.4.0；用户已要求跳过测试网；仅做本地 EVM 验证与主网只读模拟，钱包风控预览和最终交易回执仍必须核对。

生日发行流程和素材说明：`docs/releases/BIRTHDAY_NFT_PLAN.md`。


## 工厂部署与权限

采用 Arachnid deterministic deployment proxy，公开源码：
https://github.com/Arachnid/deterministic-deployment-proxy

BSC 地址：`0x4e59b44847b379578588920ca78fbf26c0b4956c`。每次准备必须核对链 ID 56 与精确运行时代码；构造参数显式指定发行钱包，不能将工厂当作发行者。工厂不是升级代理；部署后的 NFT 合约无升级入口。工厂不授予任何 NFT 转移/铸造权限。

`npm run check:nft-mainnet` 使用临时示例名称与 URI 运行 `eth_call`/`eth_estimateGas`，所有创建状态均丢弃，不部署测试合约，也不花费 BNB。它不能证明钱包风控一定允许该交易。

铸造后可使用 `scripts/birthday-nft-verify.mjs`，核对两个 BSC 节点上的回执、直接铸造事件、发行者、接收地址、Token URI、锁定与销毁策略。它只验证，不修改网页。如果 NFT 已销毁，检查会阻止误报“当前持有”。
