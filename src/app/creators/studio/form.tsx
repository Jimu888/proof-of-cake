'use client';
import { useActionState, useEffect, useState } from 'react';
import { useLanguage } from '../../../lib/i18n';
import { submitArtwork } from './actions';

const submissionErrors = new Map([
  ['请上传 20 MB 以内的图片。', 'Upload an image up to 20 MB.'],
  ['请使用可正常打开的静态 JPG、PNG 或 WebP，像素总数不超过 2400 万。', 'Upload a valid static JPG, PNG, or WebP with at most 24 megapixels.'],
  ['请填写名称和作品简介。', 'Enter a title and description.'],
  ['请输入 1 至 10000 之间的版数。', 'Enter an edition size from 1 to 10,000.'],
  ['请输入大于零的 BNB 价格，最多 18 位小数。', 'Enter a positive BNB price with up to 18 decimal places.'],
  ['请确认作品授权。', 'Confirm that you hold the publication rights.'],
  ['上传凭证无效。', 'The upload pass is invalid.'],
  ['上传凭证无效或已更换。', 'The upload pass is invalid or has been replaced.'],
  ['提交标识无效。', 'Refresh the page and submit again.'],
]);

export default function StudioForm() {
  const { t } = useLanguage();
  const [result, action, pending] = useActionState(submitArtwork, { message: '', ok: false });
  const [key, setKey] = useState('');
  const [preview, setPreview] = useState<File>();
  const [url, setUrl] = useState('');
  useEffect(() => setKey(crypto.randomUUID()), []);
  useEffect(() => {
    if (!preview) { setUrl(''); return; }
    const next = URL.createObjectURL(preview);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [preview]);
  if (result.ok) return <p role="status">{t(result.message.replace('已提交审核', 'Submitted for review'), result.message)}</p>;
  return <form className="checkout-form studio-form" action={action}>
    <input name="requestKey" type="hidden" value={key}/>
    <label>{t('Upload pass', '上传凭证')}<input name="token" type="password" autoComplete="off" required/></label>
    <label>{t('Artwork title', '作品名称')}<input name="title" required maxLength={80}/></label>
    <label>{t('Description', '作品简介')}<textarea name="description" rows={5} required maxLength={1200}/></label>
    <div className="vault-form-pair"><label>{t('Proposed price (BNB)', '建议售价（BNB）')}<input name="price" inputMode="decimal" required/></label><label>{t('Edition size', '发行版数')}<input name="edition" type="number" min="1" max="10000" required/></label></div>
    <label>{t('Artwork image', '作品图片')}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => setPreview(event.target.files?.[0])}/></label>
    {url && <img className="studio-preview" src={url} alt={t('Artwork upload preview', '作品上传预览')}/>}
    <label>{t('Cover image', '独立封面')}<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
    <p className="checkout-note">{t('Static JPG, PNG, or WebP. Up to 20 MB and 24 megapixels per file.', '静态 JPG、PNG 或 WebP，每张最多 20 MB、2400 万像素。')}</p>
    <label className="studio-check"><input name="transferable" type="checkbox"/>{t('Allow transfers', '允许转让')}</label>
    <label className="studio-check"><input name="holderCanBurn" type="checkbox" defaultChecked/>{t('Allow holders to burn', '允许持有人销毁')}</label>
    <label className="studio-check"><input name="rights" type="checkbox" required/>{t('I hold the rights to publish this artwork', '我拥有作品发行授权')}</label>
    <button className="room-button room-button-primary" disabled={pending || !key}>{pending ? t('Submitting…', '正在提交…') : t('Submit for review', '提交审核')}</button>
    {result.message && <p role="alert">{t(submissionErrors.get(result.message) ?? 'Could not save the artwork. Try again.', result.message)}</p>}
  </form>;
}
