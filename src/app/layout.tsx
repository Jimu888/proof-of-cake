import type { Metadata } from 'next';
import { LanguageProvider } from '../lib/i18n';
import './globals.css';
import './platform.css';
export const metadata: Metadata = { title: 'Mement · A gift beyond the moment', description: '为重要的人，挑选一份值得珍藏的数字艺术礼物。' };
export default function Layout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="zh-CN"><body><LanguageProvider>{children}</LanguageProvider></body></html>; }
