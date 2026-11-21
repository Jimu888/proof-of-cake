import type { Metadata } from 'next';
import './globals.css';
import './platform.css';
export const metadata: Metadata = { title: 'Mement · A gift beyond the moment', description: '为重要的人，挑选一份值得珍藏的数字艺术礼物。交互演示。' };
export default function Layout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="zh-CN"><body>{children}</body></html>; }
