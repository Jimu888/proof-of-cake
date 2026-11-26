'use client';

import { useEffect, useRef, useState } from 'react';
import { formatEther, parseEther } from 'ethers';
import { normalizeGiftRecipient } from '../domain/gift-recipient';
import type { Artwork } from '../domain/catalog';
import { useLanguage } from '../lib/i18n';
import { previewLink } from '../lib/vault-preview-link';
import { parseVaultDraft, type VaultDraft } from '../domain/vault-gift';
import { artHash } from '../lib/generative-art';
import { parseReservePlan, type ReservePlan } from '../domain/reserve-plan';
import { GiftingOptions } from './gifting-options';
import type { PaperTone } from '../lib/gift-copy';
import InfoTip from './info-tip';
import { Countdown, dateInputValue, useClock } from './vault-preview-controls';

import type { GroupNote as Note } from '../lib/zodiac-share';

export function GroupLetter({ recipient, notes }: { recipient: string; notes: Note[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return <>
    <div className="vault-inline"><button type="button" className="vault-hold-button" aria-expanded={open} onClick={() => setOpen(!open)}>
      {open ? t('Fold the letter', '折起长信') : t('Unfold the combined letter', '展开多人长信')}
    </button><InfoTip en="Unfold one letter with every contributor’s signature and well-wish." zh="展开同一封长信，阅览每位出资人的祝福和署名。" /></div>
    {open && <article className="group-folded-letter"><h2>{t('To', '致')} {recipient}</h2>
      {notes.map((note, index) => <section key={index}><p>{note.message}</p><footer>— {note.name}</footer></section>)}
    </article>}
  </>;
}
export type GroupInvitation = { recipient: string; seats: number; amount: string; deadline: number; host: Note; vault?: VaultDraft; paper?: PaperTone; senderAddress?: string; reserve?: ReservePlan; room?: string };

function groupVaultAmount(value: string) {
  if (value === '') return 0n;
  if (!/^\d{1,32}(?:\.\d{1,18})?$/.test(value)) return;
  return parseEther(value);
}

export function parseGroupInvitation(raw: unknown): GroupInvitation | undefined {
  const draft = raw as Partial<GroupInvitation> | null;
  if (!draft || typeof draft.recipient !== 'string' || !draft.recipient.trim() || draft.recipient.length > 100 ||
    typeof draft.seats !== 'number' || !Number.isInteger(draft.seats) || draft.seats < 2 || draft.seats > 8 ||
    typeof draft.amount !== 'string' || groupVaultAmount(draft.amount) === undefined ||
    typeof draft.deadline !== 'number' || !Number.isSafeInteger(draft.deadline) || draft.deadline <= 0 || draft.deadline > 253402300799 ||
    typeof draft.host?.name !== 'string' || !draft.host.name.trim() || draft.host.name.length > 36 ||
    typeof draft.host?.message !== 'string' || !draft.host.message.trim() || draft.host.message.length > 180) return;
  let vault: VaultDraft | undefined;
  let reserve: ReservePlan | undefined;
  try { vault = parseVaultDraft(draft.vault, 0); reserve = parseReservePlan(draft.reserve); } catch { return; }
  const paper = draft.paper === 'rice' || draft.paper === 'slate' ? draft.paper : 'graphite';
  const senderAddress = normalizeGiftRecipient(draft.senderAddress);
  if (draft.senderAddress !== undefined && !senderAddress) return;
  if (draft.room !== undefined && (typeof draft.room !== 'string' || !/^[a-f0-9]{48}$/.test(draft.room))) return;
  return { recipient: draft.recipient, seats: draft.seats, amount: draft.amount, deadline: draft.deadline,
    host: { name: draft.host.name, message: draft.host.message }, vault, paper, senderAddress, reserve, room: draft.room };
}

export default function GroupGift({ artwork, invitation, invitationPath, draft, onReady, onBack }: {
  artwork: Artwork; invitation?: GroupInvitation; invitationPath?: string;
  draft: { recipient: string; host: Note; vault?: VaultDraft; paper: PaperTone; senderAddress?: string; reserve?: ReservePlan };
  onReady: (notes: Note[]) => void;
  onBack: () => void;
}) {
  const { t, locale } = useLanguage();
  const price = BigInt(artwork.priceAtomic);
  const [seats, setSeats] = useState(4);
  const [shareInput, setShareInput] = useState(() => formatEther(price / 4n || 1n));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [joined, setJoined] = useState(false);
  const guestRequest = useRef<string>(null);
  const [deadlineField, setDeadlineField] = useState<string>();
  const [firstNow] = useState(() => Math.floor(Date.now() / 1000));
  const now = useClock(true);
  const [group, setGroup] = useState(invitation);
  const [notes, setNotes] = useState<Note[]>(invitation ? [invitation.host] : []);
  const [friend, setFriend] = useState<Note>({ name: '', message: '' });
  const [copied, setCopied] = useState<boolean>();
  const count = group?.seats ?? seats;
  const amount = group?.amount ?? shareInput;
  const legacyTotal = group && !group.room ? price + (groupVaultAmount(group.amount) ?? 0n) : undefined;
  const share = legacyTotal === undefined ? groupVaultAmount(amount) ?? 0n : legacyTotal / BigInt(count);
  const target = legacyTotal ?? share * BigInt(count);
  const complete = notes.length === count;
  const deadline = group?.deadline ?? (deadlineField === undefined ? firstNow + 7 * 86400 : Math.floor(new Date(deadlineField).getTime() / 1000));
  const expired = !complete && now !== undefined && now >= deadline;
  const valid = now !== undefined && deadline > now && deadline <= now + 31 * 86400 && share > 0n;
  const href = group ? previewLink(invitationPath ?? '/gifts/' + encodeURIComponent(artwork.id), 'group', group) : '';
  const joinedAmount = complete ? target : share * BigInt(notes.length);
  const shareText = formatEther(share);

  useEffect(() => {
    if (!group?.room || complete || expired) return;
    const controller = new AbortController();
    async function sync() {
      try {
        const result = await fetch('/api/gather?room=' + group!.room, { signal: controller.signal, cache: 'no-store' });
        if (!result.ok) throw new Error();
        const { guests } = await result.json() as { guests: Note[] };
        if (!controller.signal.aborted) {
          setNotes(current => current.length > guests.length + 1 ? current : [group!.host, ...guests]);
        }
      } catch { if (!controller.signal.aborted) setError(true); }
    }
    void sync();
    const interval = setInterval(sync, 2500);
    return () => { controller.abort(); clearInterval(interval); };
  }, [group, complete, expired]);

  async function submit(input: object) {
    const result = await fetch('/api/gather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!result.ok) throw new Error();
    return result.json();
  }

  async function launch() {
    if (!valid || busy) return;
    setBusy(true);
    setError(false);
    try {
      const { room } = await submit({ seats, deadline });
      setGroup({ ...draft, seats, amount, deadline, room });
      setNotes([draft.host]);
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  async function join() {
    if (!group || complete || busy || (invitation && joined) || group.deadline <= Math.floor(Date.now() / 1000)) return;
    const note = { name: friend.name.trim() || t(`Friend ${notes.length}`, `好友 ${notes.length}`),
      message: friend.message.trim() || t('For all the small things worth celebrating.', '为那些值得庆祝的小事。') };
    setBusy(true);
    setError(false);
    try {
      if (group.room) {
        if (invitation && !guestRequest.current) {
          try { guestRequest.current = sessionStorage.getItem('gathering:' + group.room); } catch {}
        }
        const id = guestRequest.current ??= crypto.randomUUID();
        if (invitation) { try { sessionStorage.setItem('gathering:' + group.room, id); } catch {} }
        const { guests } = await submit({ room: group.room, id, note }) as { guests: Note[] };
        setNotes([group.host, ...guests]);
        if (!invitation) guestRequest.current = null;
      } else setNotes(current => [...current, note]);
      setJoined(true);
      setFriend({ name: '', message: '' });
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  return <div className="group-gift vault-form checkout-form">
    <p className="ritual-eyebrow">{t('Co-Gift gathering preview', 'CO-GIFT · 合赠集结预览')}</p>
    {!group ? <>
      <p className="group-gift-recipient">{t('Gathering for', '合礼致')} <strong>{draft.recipient}</strong></p>
      <GiftingOptions label={t('Number of shares', '合买份数')} options={[2, 3, 4, 5, 6, 7, 8]} value={seats}
        layout="ritual-chips" display={String} onChange={setSeats}/>
      <p role="status">{t('Total', '合买目标')} {formatEther(target)} BNB · {t('Per share', '每份')} {shareText} BNB</p>
      <label>{t('Per-person contribution · BNB', '每人 AA 金额 · BNB')}<input className="ritual-amount" inputMode="decimal" maxLength={51} value={shareInput} onChange={event => setShareInput(event.target.value.trim())}/></label>
      <div className="vault-inline"><label>{t('Deadline · local time', '截止时间 · 本地时间')}
        <input type="datetime-local" value={deadlineField ?? (now === undefined ? '' : dateInputValue(firstNow + 7 * 86400))}
          onChange={event => setDeadlineField(event.target.value)}/>
      </label><InfoTip en="If the group misses the deadline, each contributor can reclaim their full contribution." zh="截止时若未凑齐，每位出资人均可全额取回各自出资。" /></div>

    </> : <>
      <p className="group-gift-recipient">{t('Gathering for', '合礼致')} <strong>{group.recipient}</strong> · {shareText} BNB / {t('person', '人')}</p>
      <div className="group-gift-meter" role="progressbar" aria-label={t('Group shares filled', '合买集结进度')} aria-valuemin={0} aria-valuemax={count} aria-valuenow={notes.length}>
        {Array.from({ length: count }, (_, index) => <i key={index} data-filled={index < notes.length}/>)}
      </div>
      <p role="status">{t(`${notes.length} / ${count} joined`, `${notes.length} / ${count} 已加入`)} · {formatEther(joinedAmount)} / {formatEther(target)} BNB</p>
      {!complete && <div className="vault-inline"><span>{t('Deadline', '截止时间')} · {new Date(deadline * 1000).toLocaleString(locale)}</span>
        <InfoTip en="Unfinished groups close at the deadline. In the contract, contributors then claim their own refunds." zh="未凑齐的合买将在截止时关闭。合约中各出资人随后可领取自己的退款。" /></div>}
      {!complete && !expired && <Countdown target={deadline} now={now}/>}
      {expired && <p role="status">{t('Deadline passed. The contract would let each contributor reclaim their share.', '已过截止时间。合约将允许每位出资人取回自己的份额。')}</p>}
      <ol className="group-notes" aria-label={t('Contributor notes', '出资人祝福')}>{notes.map((note, index) => <li key={index}>
        <strong>{note.name}</strong><code title={t('Gathering wallet label', '合赠钱包标记')}>{artHash((group.room ?? group.recipient) + ':' + index).slice(0, 8)}…{artHash((group.room ?? group.recipient) + ':' + index).slice(-4)}</code><p>{note.message}</p>
      </li>)}</ol>
      {!complete && !expired && <>
        <label>{t('Invitation link', '参团链接')}<input value={href} readOnly onFocus={event => event.currentTarget.select()}/></label>
        <div className="vault-inline"><button type="button" className="boutique-link" onClick={() => {
          void Promise.resolve().then(() => navigator.clipboard.writeText(href)).then(() => setCopied(true)).catch(() => setCopied(false));
        }}>{t('Copy group invitation', '复制合买邀请')}</button>
          <InfoTip en="The link opens the shared gathering and its original plan." zh="打开链接即可查看合赠计划和集结进度。" /></div>
        {copied !== undefined && <p role="status">{copied ? t('Invitation copied.', '邀请已复制。') : t('Select the link above to copy it.', '可选择上方链接手动复制。')}</p>}
        {(!invitation || !joined) && <>
          <label>{t('Friend’s signature · optional', '好友署名 · 选填')}
            <input value={friend.name} maxLength={36} onChange={event => setFriend({ ...friend, name: event.target.value })}/>
          </label>
          <label>{t('Friend’s note · optional', '好友祝福 · 选填')}
            <textarea rows={2} value={friend.message} maxLength={180} onChange={event => setFriend({ ...friend, message: event.target.value })}/>
          </label>
        </>}
      </>}
      {complete && <GroupLetter recipient={group.recipient} notes={notes}/>}
    </>}
    {error && <p role="alert">{t('The gathering could not be updated. Try again.', '暂时无法更新集结进度，请重试。')}</p>}
    {(!invitation || (!complete && !expired && !joined)) && <div className="ritual-action-footer">
      {!invitation && <button type="button" className="counter-back-step" onClick={onBack}>{t('← Edit your note', '← 返回修改留言')}</button>}
      {!group ? <button type="button" className="ritual-cta" disabled={!valid || busy} onClick={() => void launch()}>{t('Start gathering', '发起合赠')} →</button> :
        complete ? <button type="button" className="ritual-cta" onClick={() => onReady(notes)}>{t('Continue to sealing', '前往封缄')} →</button> :
        !expired && <button type="button" className="ritual-cta" disabled={busy} onClick={() => void join()}>
          {invitation ? t('Join and leave a wish', '加入合赠并留祝福') : t('Add a friend’s wish', '添加好友祝福')} →
        </button>}
    </div>}
  </div>;
}
