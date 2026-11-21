'use client';
import { useActionState, useEffect, useState } from 'react';
import { submitArtwork } from './actions';

export default function StudioForm() {
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
  if (result.ok) return <p role="status">{result.message}</p>;
  return <form action={action}>
    <input name="requestKey" type="hidden" value={key}/>
    <label>上传凭证<input name="token" type="password" autoComplete="off" required/></label>
    <label>作品名称<input name="title" required maxLength={80}/></label>
    <label>作品简介<textarea name="description" rows={5} required maxLength={1200}/></label>
    <div className="ops-fields"><label>建议售价（BNB）<input name="price" inputMode="decimal" required/></label><label>发行版数<input name="edition" type="number" min="1" max="10000" required/></label></div>
    <label>作品图片<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => setPreview(event.target.files?.[0])}/></label>
    {url && <img className="studio-preview" src={url} alt="作品上传预览"/>}
    <label>独立封面<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
    <p>静态 JPG、PNG 或 WebP，每张最多 20 MB、2400 万像素。</p>
    <label className="ops-check"><input name="transferable" type="checkbox"/>允许转让</label>
    <label className="ops-check"><input name="holderCanBurn" type="checkbox" defaultChecked/>允许持有人销毁</label>
    <label className="ops-check"><input name="rights" type="checkbox" required/>我拥有作品发行授权</label>
    <button disabled={pending || !key}>{pending ? '正在提交…' : '提交审核'}</button>
    {result.message && <p role="alert">{result.message}</p>}
  </form>;
}
