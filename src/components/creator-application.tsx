'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import RoomHeader from './room-header';
import { useLanguage } from '../lib/i18n';

const media = [
  ['image', 'Images / illustration / photography', '图片 / 插画 / 摄影'],
  ['video', 'Animation / video', '动画 / 视频'],
  ['model', '3D artwork', '三维作品'],
  ['mixed', 'Mixed media', '跨媒介创作'],
  ['other', 'Other', '其他'],
] as const;

const applicationErrors = new Map([
  ['请提供作品链接或上传附件。', 'Add a portfolio link or upload an attachment.'],
  ['请完整填写申请，并遵守各项字数限制。', 'Complete the required fields and check the character limits.'],
  ['作品链接需要是完整的 http 或 https 链接。', 'Enter full portfolio links starting with http or https.'],
  ['附件总量过大。', 'The attachments exceed the total upload limit.'],
  ['最多上传 3 个附件。', 'Upload up to 3 attachments.'],
  ['每个附件须小于或等于 8 MB。', 'Each attachment must be 8 MB or smaller.'],
  ['附件格式与文件内容不匹配。支持常见图片、PDF、DOC 和 DOCX。', 'Each attachment must match its file format. Common images, PDF, DOC, and DOCX are accepted.'],
  ['申请列表暂满，请稍后再试。', 'The review queue is full. Try again later.'],
]);

export default function CreatorApplicationForm() {
  const { t, locale } = useLanguage();
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
      if (!response.ok) {
        setError(applicationErrors.has(data.error) ? data.error : 'service');
        return;
      }
      setApplicationId(data.id);
      requestAnimationFrame(() => result.current?.focus());
    } catch { setError('network'); }
    finally { setPending(false); }
  }
  return <div className="platform-page room-page creator-application-page" lang={locale}>
    <RoomHeader creatorStudio/>
    <main className="creator-application-layout">
      <section className="creator-application-intro"><p className="eyebrow">{t('FOR THE ONES WHO CREATE', '为创作者而设')}</p><h1>{t('Make art someone can give.', '让你的创作，成为某个人的礼物。')}</h1><p>{t('Share an image, an animation, a film, or a small world to step into. We look for work with a point of view.', '图片、动画、影像，或一个可以走近的小世界。我们期待有个人表达的作品。')}</p><div className="creator-application-process"><p><span>01</span> {t('Share your work and ideas.', '分享作品与创作想法')}</p><p><span>02</span> {t('Our team reviews your application and gets in touch.', '团队人工审核并联系你')}</p><p><span>03</span> {t('Agree on the edition and collaboration together.', '共同确认作品发行与合作方式')}</p></div></section>
      <section className="creator-application-panel">
        {applicationId ? <div className="creator-application-result"><p className="eyebrow">{t('APPLICATION SAVED', '申请已保存')}</p><h2 tabIndex={-1} ref={result}>{t('Thank you for sharing your work.', '谢谢你分享你的创作。')}</h2><p>{t('Your application was saved in the demo review queue.', '申请已保存到演示审核列表。')}</p><p className="checkout-note">{t('Application ID', '申请编号')}<br/>{applicationId}</p><Link className="room-button" href="/#gifts">{t('Back to Room ↗', '回到精选作品 ↗')}</Link></div> : <>
          <h2>{t('Creator application', '创作者申请')}</h2>
          <form className="checkout-form" onSubmit={submit}>
            <fieldset disabled={pending}>
              <label htmlFor="creator-name">{t('Name / artist name', '称呼 / 创作署名')}</label><input id="creator-name" name="name" maxLength={80} required autoComplete="nickname" placeholder={t('What should we call you?', '我们该怎么称呼你')}/>
              <label htmlFor="creator-contact">{t('Contact', '联系方式')}</label><input id="creator-contact" name="contact" maxLength={200} required autoComplete="off" placeholder={t('Email, Telegram, or another way to reach you', '邮箱、Telegram，或可联系到你的账号')}/>
              {Array.from({ length: linkCount }, (_, index) => <div key={index}>
                <label htmlFor={'creator-link-' + index}>{t('Portfolio link', '作品链接')}{index ? ' ' + (index + 1) : ''}</label>
                <input id={'creator-link-' + index} name="links" type="url" maxLength={500} placeholder="https://"/>
              </div>)}
              {linkCount < 10 && <button type="button" className="text-link" onClick={() => setLinkCount(count => count + 1)}>{t('+ Add a portfolio link', '＋ 添加作品链接')}</button>}
              <label htmlFor="creator-files">{t('Upload work samples or an introduction', '上传作品或自我介绍')}</label>
              <input id="creator-files" name="attachments" aria-describedby="creator-file-note" multiple type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.pdf,.doc,.docx"/>
              <p className="checkout-note" id="creator-file-note">{t('Add at least one link or attachment. You can upload up to 3 files, 8 MB each. Common image formats, PDF, and Word are accepted.', '作品链接或附件至少提供一项。最多 3 个附件，每个 8 MB，支持常见图片、PDF 和 Word。')}</p>
              <div className="ritual-field">
                <span className="ritual-field-label" id="creator-medium">{t('Primary medium', '主要创作形式')}</span>
                <div className="room-dot-options" role="group" aria-labelledby="creator-medium">
                  {media.map(([value, en, zh]) => <label key={value}>
                    <input type="radio" name="medium" value={value} required/>
                    <span>{t(en, zh)}</span>
                  </label>)}
                </div>
              </div>
              <label htmlFor="creator-proposal">{t('What would you like to share?', '你想带来怎样的作品？')}</label><textarea id="creator-proposal" name="proposal" maxLength={1200} rows={5} required placeholder={t('Tell us about your work and how it could become a gift.', '聊聊你的创作，以及它如何成为一份值得赠送的礼物。')}/>
            </fieldset>
            <p className="checkout-note">{t('We use your work samples and contact details for review. Collaboration and edition terms are agreed separately.', '作品资料与联系方式仅用于人工审核。提交申请后，合作与发行需另行确认。')}</p>
            <button className="room-button room-button-primary" type="submit" disabled={pending}>{pending ? t('Saving application…', '正在保存申请…') : t('Submit application', '提交申请')} <span>↗</span></button>
            {error && <p className="error" role="alert">{error === 'network'
              ? t('Could not reach the application service. Try again.', '无法连接申请服务，请重试。')
              : error === 'service'
                ? t('Could not save your application. Try again later.', '暂时无法保存申请，请稍后重试。')
                : t(applicationErrors.get(error) ?? '', error)}</p>}
          </form>
        </>}
      </section>
    </main>
  </div>;
}
