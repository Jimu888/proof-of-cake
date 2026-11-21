'use client';

import { useRef, useState, type ReactNode } from 'react';

export default function CreatorDetail({ name, children }: { name: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  return <>
    <button ref={trigger} onClick={() => {
      setOpened(true);
      dialog.current?.showModal();
    }} aria-label={'查看资料 · ' + name}>查看资料</button>
    <dialog ref={dialog} aria-label={name + '的申请资料'} className="ops-detail" onClose={() => {
      setOpened(false);
      trigger.current?.focus();
    }}>
      {opened && <>
        <header><h2>{name}</h2><button onClick={() => dialog.current?.close()}>关闭</button></header>
        {children}
      </>}
    </dialog>
  </>;
}
