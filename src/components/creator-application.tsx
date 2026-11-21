'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

export default function CreatorApplicationForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [linkCount, setLinkCount] = useState(1);
  const result = useRef<HTMLHeadingElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const payload = Array.from(fields, ([name, value]) => [name, value instanceof File ? [value.name, value.size, value.lastModified] : value]);
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/demo/creator-applications', {
        method: 'POST', headers: { 'Idempotency-Key': attempt.current.key }, body: fields,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '暂时无法提交，请稍后重试。');
      setApplicationId(data.id);
      requestAnimationFrame(() => result.current?.focus());
    } catch (failure) { setError(failure instanceof Error ? failure.message : '网络连接中断，请重试。'); }
    finally { setPending(false); }
  }
  return <div className="platform-page">
    <header className="platform-header"><Link className="brand" href="/">✦ Mement</Link><Link className="text-link" href="/creators/studio">创作者工作台 ↗</Link></header>
    <main className="creator-application-layout">
      <section className="creator-application-intro"><p className="eyebrow">FOR THE ONES WHO CREATE</p><h1>让你的创作，<br/>成为某个人的礼物。</h1><p>图片、动画、影像，或一个可以走近的小世界。<br/>我们期待有个人表达的作品。</p><div className="creator-application-process"><p><span>01</span> 分享作品与创作想法</p><p><span>02</span> 团队人工审核并联系你</p><p><span>03</span> 共同确认作品发行与合作方式</p></div></section>
      <section className="creator-application-panel">
        {applicationId ? <div className="creator-application-result"><p className="eyebrow">APPLICATION SAVED</p><h2 tabIndex={-1} ref={result}>谢谢你分享你的创作。</h2><p>申请已保存到本地审核列表。正式上线后，团队会通过你留下的联系方式沟通合作。</p><p className="checkout-note">申请编号<br/>{applicationId}</p><Link className="button outline" href="/">回到精选作品 ↗</Link></div> : <>
          <h2>创作者申请</h2><p className="checkout-note">当前为本地申请演示，提交后保存至本机审核列表。请使用示例信息体验。</p>
          <form className="checkout-form" onSubmit={submit}>
            <fieldset disabled={pending}>
              <label htmlFor="creator-name">称呼 / 创作署名</label><input id="creator-name" name="name" maxLength={80} required autoComplete="nickname" placeholder="我们该怎么称呼你"/>
              <label htmlFor="creator-contact">联系方式</label><input id="creator-contact" name="contact" maxLength={200} required autoComplete="off" placeholder="邮箱、Telegram，或可联系到你的账号"/>
              {Array.from({ length: linkCount }, (_, index) => <div key={index}>
                <label htmlFor={'creator-link-' + index}>作品链接{index ? ' ' + (index + 1) : ''}</label>
                <input id={'creator-link-' + index} name="links" type="url" maxLength={500} placeholder="https://"/>
              </div>)}
              {linkCount < 10 && <button type="button" className="text-link" onClick={() => setLinkCount(count => count + 1)}>＋ 添加作品链接</button>}
              <label htmlFor="creator-files">上传作品或自我介绍</label>
              <input id="creator-files" name="attachments" multiple type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.pdf,.doc,.docx"/>
              <p className="checkout-note">作品链接或附件至少提供一项。最多 3 个附件，每个 8 MB，支持常见图片、PDF 和 Word。</p>
              <label htmlFor="creator-medium">主要创作形式</label><select id="creator-medium" name="medium" defaultValue="" required><option value="" disabled>请选择</option><option value="image">图片 / 插画 / 摄影</option><option value="video">动画 / 视频</option><option value="model">三维作品</option><option value="mixed">跨媒介创作</option><option value="other">其他</option></select>
              <label htmlFor="creator-proposal">你想带来怎样的作品？</label><textarea id="creator-proposal" name="proposal" maxLength={1200} rows={5} required placeholder="聊聊你的创作，以及它如何成为一份值得赠送的礼物。"/>
            </fieldset>
            <p className="checkout-note">作品资料与联系方式仅用于人工审核。提交申请后，合作与发行需另行确认。</p>
            <button className="button primary" type="submit" disabled={pending}>{pending ? '正在保存申请…' : '提交申请'} <span>↗</span></button>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
        </>}
      </section>
    </main>
  </div>;
}
