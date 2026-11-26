import { isContactRecipient } from '../domain/gift-recipient';
import { useLanguage } from '../lib/i18n';

export default function GiftClaimBinding({ recipient }: { recipient: string }) {
  const { t } = useLanguage();
  if (!isContactRecipient(recipient)) return null;
  return <p className="gift-claim-binding">{t(
    `For ${recipient} · Identity verification is required when claiming assets.`,
    `指定收礼身份 ${recipient} · 领取礼金时需验证该身份。`,
  )}</p>;
}
