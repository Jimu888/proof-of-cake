'use client';
import { useActionState } from 'react';
import { issueInvite } from './actions';
export default function Invite({ id }: { id: string }) {
  const [result, action, pending] = useActionState(issueInvite, '');
  return <form action={action}><input type="hidden" name="id" value={id}/>
    <button disabled={pending}>生成上传凭证</button>
    {result && <p role="status" className="ops-token">{result}</p>}
  </form>;
}
