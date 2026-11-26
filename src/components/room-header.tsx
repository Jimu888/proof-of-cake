'use client';

import WalletTrigger from './wallet-trigger';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitch, useLanguage } from '../lib/i18n';

export default function RoomHeader({ creatorStudio = false }: { creatorStudio?: boolean }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  return <header className="boutique-header room-page-header">
    <Link className="text-link room-page-back" href="/#gifts">{t('← Back to Room', '← 返回展厅')}</Link>
    <Link className="boutique-brand" href="/">MEMENT</Link>
    <div className="room-page-controls">
      {creatorStudio && <Link className="text-link" href="/creators/studio">{t('Creator Studio ↗', '创作者工作台 ↗')}</Link>}
      {pathname !== '/wallet' && <WalletTrigger/>}
      <LanguageSwitch/>
    </div>
  </header>;
}
