import Link from 'next/link';
import StudioForm from './form';
export const metadata = { title: '创作者工作台 · Mement', robots: { index: false, follow: false } };
export default function Studio() {
  return <main className="ops ops-studio"><Link href="/">Mement</Link><h1>提交作品</h1><p>使用运营提供的上传凭证提交图片与发行设置。</p><StudioForm/></main>;
}
