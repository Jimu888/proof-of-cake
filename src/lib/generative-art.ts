import { normalizeGiftRecipient } from '../domain/gift-recipient';
import { previewAddress } from '../domain/gifting-modes';
import { getBytes, sha256, toUtf8Bytes } from 'ethers';

export const sampleSender = '0x71c7656ec7ab88b098defb751b7401b5f6d83a90';
export const sampleRecipient = '0x9b2e018f540a62b8c19e56bc4a40eaab0080e4c1';

export function artHash(...inputs: string[]) {
  return sha256(toUtf8Bytes(JSON.stringify(inputs.map(input => input.trim().toLowerCase()))));
}

export function bondPreviewHash(sender: string, recipient: string, orderId = '') {
  return artHash('algorithmic-bond-preview-v1', sender, recipient, orderId);
}

export function artBytes(...inputs: string[]) {
  return getBytes(artHash(...inputs));
}

export function shortArtValue(value: string) {
  return value.length > 15 ? value.slice(0, 7) + '…' + value.slice(-4) : value;
}

export function isHexWalletAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function formatCardIdentity(value: string) {
  const trimmed = value.trim();
  return isHexWalletAddress(trimmed) ? trimmed.slice(0, 6) + '…' + trimmed.slice(-4) : trimmed;
}

/** A rendering input only. Never use this value as a recipient or wallet identity. */
export function recipientVisualSeed(value: string) {
  const recipient = normalizeGiftRecipient(value);
  if (recipient) return previewAddress(recipient) ?? sha256(toUtf8Bytes('mement-recipient-v1:' + recipient)).slice(0, 42);
}
