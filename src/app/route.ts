export function GET() {
  return Response.json({ project: 'Proof of Cake', stage: 'foundation', notice: '接口骨架已就绪，前端页面将在下一阶段实现。当前不连接钱包、不收款、不铸造 NFT。', endpoints: ['/api/health', '/api/catalog', '/api/demo/gifts'] });
}
