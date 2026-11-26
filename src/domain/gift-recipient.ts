import { previewAddress } from './gifting-modes';

const aiName = /^[a-z0-9]{3,15}\.ai$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const social = /^(?:(?:x|tg):)?@[a-z0-9_.-]{2,32}$/i;

export function normalizeGiftRecipient(value: unknown) {
  if (typeof value !== 'string' || value.length > 100 || /[\u0000-\u001f\u007f-\u009f]/.test(value)) return;
  const recipient = value.trim();
  if (email.test(recipient)) {
    const at = recipient.lastIndexOf('@');
    return recipient.slice(0, at + 1) + recipient.slice(at + 1).toLowerCase();
  }
  if (aiName.test(recipient) || social.test(recipient)) return recipient.toLowerCase();
  return previewAddress(recipient);
}

export function isContactRecipient(value: string) {
  return email.test(value) || social.test(value) || aiName.test(value);
}
