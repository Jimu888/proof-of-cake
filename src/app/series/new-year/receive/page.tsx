import type { Metadata } from 'next';
import NewYearCapsule from '../../../../components/new-year-capsule';

export const metadata: Metadata = {
  title: 'New Year Capsule · Invitation | Mement',
  robots: { index: false, follow: false },
};

export default function CapsuleReceivePage() {
  return <NewYearCapsule receive/>;
}
