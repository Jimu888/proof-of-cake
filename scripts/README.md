# 维护脚本

每个脚本用途见 [逐文件说明](../docs/FILE_MAP.md) 的 scripts 部分，运行环境见 [AI 接手说明](../docs/AI_HANDOFF.md)。

常用入口为 `npm run build:birthday` 静态生日导出，`npx tsx scripts/seed-showcase.ts` 初始化演示数据，`npm run creators -- list` 本机申请审核。合约编译和参数准备脚本将产物放入被忽略的 `delivery/`。部署参数由钱包确认后发送。

浏览器 Python 脚本保留各历史阶段的视觉检查，执行前核对端口、路径和 Playwright 环境。
