import Link from 'next/link';
import { formatEther } from 'ethers';
import { testnet } from '../../../lib/testnet';
import { isOperator } from '../../../server/operator-auth';
import { getCreatorApplicationRepository } from '../../../server/creator-application-repository';
import { getOperations } from '../../../server/operations';
import { describeArtworkPolicy } from '../../../domain/artwork-policy';
import { signOut, manage, importSale, settleDemo } from '../actions';
import Invite from '../invite';
import CreatorDetail from '../creator-detail';
import { notFound, redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mement 运营后台', robots: { index: false, follow: false } };

const sections = { creators: '创作者审核', works: '作品与定价', sales: '销售与结算' } as const;
const pageSize = 12;
export default async function SectionPage({ params, searchParams }: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{error?: string; done?: string; q?: string; state?: string; page?: string; month?: string; demo?: string}>;
}) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section)) notFound();
  if (!await isOperator()) redirect('/ops');
  const title = sections[section as keyof typeof sections];
  const query = await searchParams;
  const search = typeof query.q === 'string' ? query.q.trim().slice(0,100) : '';
  const state = typeof query.state === 'string' ? query.state : '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month ?? '') ? query.month! : '';
  const requestedPage = Math.max(1, Math.trunc(Number(query.page) || 1));
  const repository = getCreatorApplicationRepository();
  const store = getOperations();
  const creators = section === 'creators' ? repository.page(search, state, requestedPage, pageSize) : undefined;
  const works = section === 'works' ? store.worksPage(search, state, requestedPage, pageSize) : undefined;
  const sales = section === 'sales' ? store.sales(month, search) : [];
  const total = creators?.total ?? works?.total ?? sales.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = creators?.page ?? works?.page ?? Math.min(pages, requestedPage);
  const start = (page - 1) * pageSize;
  const visibleCreators = creators?.items ?? [];
  const visibleWorks = works?.items ?? [];
  const visibleSales = sales.slice(start,start+pageSize);
  const sum = (key: 'price' | 'artistAmount' | 'platformAmount') => formatEther(sales.reduce((total, sale) => total + BigInt(sale[key]), 0n));
  const pageLink = (number: number) => '/ops/' + section + '?' + new URLSearchParams({ q:search, state, month, page:String(number) });
  return <main className="ops ops-dashboard">
    <aside className="ops-sidebar">
      <Link className="ops-brand" href="/">Mement</Link>
      <nav aria-label="后台导航">{Object.entries(sections).map(([id,label]) => <Link key={id} href={'/ops/'+id} aria-current={id===section ? 'page' : undefined}>{label}</Link>)}</nav>
      <form action={signOut}><button>退出登录</button></form>
    </aside>
    <div className="ops-content"><h1>{title}</h1>
    {query.error && <p role="alert">{query.error}</p>}{query.done && <p role="status">已保存</p>}
    {section !== 'sales' && <form method="get" action={'/ops/'+section}>
      <label>{section==='creators' ? '署名或联系方式' : '作品名称或创作者'}<input name="q" defaultValue={search} maxLength={100}/></label>
      <label>状态<select name="state" defaultValue={state}><option value="">全部</option>
        {Object.entries(section==='creators' ? {pending:'待审核',approved:'已通过',rejected:'已拒绝'} : {review:'待审核',published:'已陈列',rejected:'已拒绝',archived:'已下架'}).map(([id,label]) => <option key={id} value={id}>{label}</option>)}
      </select></label><button>筛选</button>
    </form>}
    {section === 'creators' && <section id="creators"><h2>创作者 <small>{total} 份申请</small></h2>
      {total === 0 && <p>没有符合条件的申请。</p>}
      {!!total && <div className="ops-table-scroll"><table className="ops-table">
        <thead><tr><th scope="col">创作者</th><th scope="col">创作形式</th><th scope="col">提交日期</th><th scope="col">状态</th><th scope="col">操作</th></tr></thead>
        <tbody>{visibleCreators.map(creator => {
          const medium = {image:'图片',video:'动画 / 视频',model:'三维作品',mixed:'跨媒介',other:'其他'}[creator.medium];
          const status = {pending:'待审核',approved:'已通过',rejected:'已拒绝'}[creator.status];
          const links = creator.links ?? (creator.portfolio ? [creator.portfolio] : []);
          const files = repository.attachments(creator.id);
          return <tr key={creator.id}>
            <th scope="row">{creator.name}</th><td>{medium}</td><td>{creator.createdAt.slice(0,10)}</td><td>{status}</td>
            <td><CreatorDetail name={creator.name}>
              <p>{medium} · {status}</p><p>{creator.contact}</p><p className="ops-proposal">{creator.proposal}</p>
              {!!links.length && <ul>{links.map((link,index) => {
                const host = new URL(link).hostname;
                return <li key={index}><a href={link} title={link} target="_blank" rel="noreferrer">作品 {index + 1} · {host} ↗</a></li>;
              })}</ul>}
              {!!files.length && <ul className="ops-attachments">{files.map(file => {
                const url = `/ops/attachments/${creator.id}/${file.position}`;
                return <li key={file.position}>
                  {/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name) && <img src={url+'?preview=1'} alt={file.name} loading="lazy"/>}
                  <a href={url}>下载 {file.name}</a>
                </li>;
              })}</ul>}
              {creator.status === 'pending' && <form action={manage}><input type="hidden" name="id" value={creator.id}/>
                <button name="action" value="approve">通过申请</button><button name="action" value="reject-creator">拒绝申请</button></form>}
              {creator.status === 'approved' && <Invite id={creator.id}/>}
            </CreatorDetail></td>
          </tr>;
        })}</tbody>
      </table></div>}
    </section>}
    {section === 'works' && <section id="works"><h2>作品与定价 <small>{total} 件作品</small></h2>
      {total === 0 && <p>没有符合条件的作品。</p>}
      {visibleWorks.map(({ artwork, state }) => <article key={artwork.id} className="ops-work">
        <div className="ops-images"><img loading="lazy" src={artwork.cover} alt="投稿封面"/><img loading="lazy" src={artwork.image} alt="作品原始构图"/></div>
        <div><h3>{artwork.title} <small>{{review:'待审核',published:'已陈列',rejected:'已拒绝',archived:'已下架'}[state]}</small></h3>
          <p>{artwork.artist} · {artwork.editionLimit} 份 · {describeArtworkPolicy(artwork.policy)}</p><p>{artwork.description}</p>
          {(state === 'review' || state === 'published') && <>
            {!store.release(artwork.id) && <form action={manage}><input type="hidden" name="id" value={artwork.id}/>
              <label>{state === 'review' ? '建议售价 / 确认价（BNB）' : '陈列价格（BNB）'}<input name="price" defaultValue={artwork.price} required inputMode="decimal"/></label>
              <button name="action" value="publish">{state === 'review' ? '批准并发布陈列' : '保存价格'}</button></form>}
            <form action={manage}><input type="hidden" name="id" value={artwork.id}/><button name="action" value={state === 'review' ? 'reject' : 'archive'}>{state === 'review' ? '拒绝作品' : '下架'}</button></form>
          </>}
          {state === 'published' && <p><Link href={'/gifts/' + artwork.id}>查看前台 ↗</Link>{' · '}
            {artwork.showcase ? '演示作品' : store.release(artwork.id) ? '测试版已发行 · 售价 ' + artwork.price + ' tBNB' : <Link href={'/wallet?issue=' + artwork.id}>测试网发行 ↗</Link>}</p>}
          {store.history(artwork.id).map((entry, index) => <p key={index}>{entry.date.slice(0, 10)} · {entry.price} BNB</p>)}
        </div>
      </article>)}
    </section>}
    {section === 'sales' && <nav aria-label="销售数据来源">
      <Link href="/ops/sales?demo=1" aria-current={query.demo === '1' ? 'page' : undefined}>演示订单</Link>
      <Link href="/ops/sales" aria-current={query.demo !== '1' ? 'page' : undefined}>测试网订单</Link>
    </nav>}
    {section === 'sales' && query.demo === '1' && <section id="demo-sales">
      <h2>演示订单与结算</h2>
      <p>金额与结算状态用于演练。生成示例作品的收礼预览后，会新增一笔演示订单。</p>
      <div className="ops-table-scroll"><table className="ops-table">
        <thead><tr><th>作品 / 创作者</th><th>订单金额</th><th>作者分成</th><th>平台分成</th><th>状态</th></tr></thead>
        <tbody>{store.demoSales().map(sale => <tr key={sale.id}>
          <th scope="row">{sale.title}<br/><small>{sale.artist}</small></th>
          <td>{formatEther(sale.price)} BNB</td><td>{formatEther(sale.artistAmount)}</td><td>{formatEther(sale.platformAmount)}</td>
          <td>{sale.settledAt ? '已模拟结算' : <form action={settleDemo}><input type="hidden" name="id" value={sale.id}/><button>模拟结算</button></form>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>}
    {section === 'sales' && query.demo !== '1' && <section id="sales"><h2>销售与结算 <small>测试网 · 已核验订单</small></h2>
      <form action={importSale}><label>交易哈希<input name="hash" placeholder="0x…" required maxLength={66}/></label><button>核验并记账</button></form>
      <form action="/ops/sales" method="get"><label>成交月份（UTC）<input type="month" name="month" defaultValue={month}/></label><label>作品、作者或交易哈希<input name="q" defaultValue={search} maxLength={100}/></label><button>筛选</button><Link href="/ops/sales">全部</Link></form>
      <dl className="ops-totals"><div><dt>成交件数</dt><dd>{sales.length}</dd></div><div><dt>销售额</dt><dd>{sum('price')} tBNB</dd></div><div><dt>创作者分成</dt><dd>{sum('artistAmount')} tBNB</dd></div><div><dt>平台分成</dt><dd>{sum('platformAmount')} tBNB</dd></div></dl>
      <p>按已核验并记账的测试网成交统计。分成金额为购买时计入的份额。</p>
      <a href={'/ops/sales.csv' + ('?' + new URLSearchParams({month, q:search}))}>导出对账 CSV ↗</a>
      {!sales.length && <p>该范围内暂无已核验成交。</p>}
      {visibleSales.map(sale => <article key={sale.transaction}><h3>{sale.artworkTitle ?? '测试赠礼'} · NFT #{sale.tokenId}</h3><p>{sale.createdAt.slice(0, 10)} · {formatEther(sale.price)} tBNB · {sale.artistName ?? '创作者'} {sale.artistBps / 100}%</p>
        <p className="ops-token">{sale.sender} → {sale.recipient}</p><a href={testnet.explorer + '/tx/' + sale.transaction} target="_blank" rel="noreferrer">查看成交记录 ↗</a></article>)}
    </section>}
    {pages > 1 && query.demo !== '1' && <nav className="ops-pagination" aria-label="分页">
      {page > 1 && <Link href={pageLink(page-1)}>上一页</Link>}
      <span>第 {page} 页，共 {pages} 页</span>
      {page < pages && <Link href={pageLink(page+1)}>下一页</Link>}
    </nav>}
    </div>
  </main>;
}
