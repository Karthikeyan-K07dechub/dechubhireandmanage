import { useEffect, useRef, useState } from 'react';
import { submitShortlistDecisions, type CompanyTalentRequestItem } from '../../api/talentRequests.api';
import { resolveImageUrl } from '../../utils/imageUrl';
import './shortlist-review.css';

export default function ShortlistReview({ request, onUpdate, onOpenProfile }: {
  request: CompanyTalentRequestItem;
  onUpdate: (request: CompanyTalentRequestItem) => void;
  onOpenProfile: (id: string) => void;
}) {
  const [choices, setChoices] = useState<Record<string, 'accepted' | 'rejected'>>({});
  const reasonDialog=useRef<HTMLDialogElement>(null);
  const [rejecting,setRejecting]=useState(''),[reason,setReason]=useState(''),[reasons,setReasons]=useState<Record<string,string>>({});
  useEffect(()=>{if(rejecting)reasonDialog.current?.showModal();else reasonDialog.current?.close();},[rejecting]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const profiles = request.shortlistedTalentProfiles ?? [];
  const editable = request.status === 'shortlisted_sent';
  useEffect(() => { setChoices({});setReasons({});setRejecting(''); setError(''); }, [request._id, request.shortlistSentAt]);
  const saved = Object.fromEntries((request.clientDecisions ?? []).map(item => [item.workerId, item.decision]));
  const complete = profiles.length > 0 && profiles.every(profile => choices[profile.workerId]&&(choices[profile.workerId]!=='rejected'||!!reasons[profile.workerId]?.trim()));
  const submit = async () => {
    if (!complete || !request.shortlistSentAt) return;
    setSending(true); setError('');
    try {
      const updated = await submitShortlistDecisions(request._id, { shortlistSentAt: request.shortlistSentAt, decisions: profiles.map(profile => ({ workerId: profile.workerId, decision: choices[profile.workerId],reason:choices[profile.workerId]==='rejected'?reasons[profile.workerId]:undefined })) });
      onUpdate(updated);
    } catch (reason) { setError((reason as Error).message || 'Unable to submit selections. Please try again.'); }
    finally { setSending(false); }
  };
  if (!profiles.length) return null;
  return <section data-update-resource={'request:'+request._id} className="sr-review" aria-label={`Shortlisted candidates for ${request.projectName || request.projectType}`}>
    <h3>{editable ? 'Review shortlisted workers' : 'Your candidate decisions'}</h3>
    <p>{editable ? 'Accept or reject each candidate, then submit your choices to Dechub. You can accept more than one worker.' : request.clientSelectionSubmittedAt ? 'Worker list updated. Dechub will review your decisions and prepare the project contract for the accepted team.' : 'Shortlisted candidate profiles for this request.'}</p>
    <div className="sr-profiles">{profiles.map(profile => {
      const choice = editable ? choices[profile.workerId] : saved[profile.workerId];
      return <article key={profile.workerId} className={`sr-profile ${choice || ''}`}>
        <div className="sr-profile-info">
          {profile.profilePhotoUrl ? <img src={resolveImageUrl(profile.profilePhotoUrl)} alt="" className="sr-avatar" /> : <span className="sr-avatar sr-initials">{profile.workerName.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('')}</span>}
          <div><h4>{profile.workerName}</h4><p>{profile.workerRole}</p><small>{profile.location} · {profile.availabilityLabel}</small>{profile.rate != null && <p>{profile.currency} {profile.rate.toLocaleString()}</p>}{Boolean(profile.skills?.length) && <p className="sr-skills">{profile.skills?.join(' · ')}</p>}</div>
        </div>
        <div className="sr-actions">
          <button type="button" className="sr-button" onClick={() => onOpenProfile(profile.workerId)}>View profile</button>
          {editable ? <><button type="button" className={`sr-button ${choice === 'accepted' ? 'accept' : ''}`} aria-pressed={choice === 'accepted'} disabled={sending} onClick={() => setChoices(current => ({ ...current, [profile.workerId]: 'accepted' }))}>Accept</button><button type="button" className={`sr-button ${choice === 'rejected' ? 'reject' : ''}`} aria-pressed={choice === 'rejected'} disabled={sending} onClick={() => {setReason(reasons[profile.workerId]||'');setRejecting(profile.workerId);}}>Reject</button></> : choice && <strong className={`sr-decision ${choice}`}>{choice === 'accepted' ? 'Accepted' : 'Rejected'}</strong>}
        </div>
        {choice==='rejected'&&<p className="sr-rejection-reason"><strong>Reason:</strong> {editable?reasons[profile.workerId]:request.clientDecisions?.find(d=>d.workerId===profile.workerId)?.reason||'No reason recorded.'}</p>}
      </article>;
    })}</div>
    {error && <p role="alert" className="sr-error">{error}</p>}
    {editable && <div className="sr-submit"><span>{profiles.filter(profile => choices[profile.workerId]).length}/{profiles.length} candidates reviewed</span><button type="button" className="sr-button sr-primary" disabled={sending || !complete || !request.shortlistSentAt} onClick={() => void submit()}>{sending ? 'Submitting...' : 'Submit selections'}</button></div>}
    <dialog ref={reasonDialog} className="sr-reject-dialog" onCancel={()=>setRejecting('')} aria-labelledby="sr-reject-title"><header><h3 id="sr-reject-title">Reason for rejection</h3><button type="button" className="sr-button" aria-label="Close rejection form" onClick={()=>setRejecting('')}>&times;</button></header><p>{profiles.find(p=>p.workerId===rejecting)?.workerName}</p><form onSubmit={e=>{e.preventDefault();if(!reason.trim())return;setReasons(current=>({...current,[rejecting]:reason.trim()}));setChoices(current=>({...current,[rejecting]:'rejected'}));setRejecting('');}}><label htmlFor="sr-rejection-reason">Why are you rejecting this talent? *</label><textarea id="sr-rejection-reason" autoFocus required maxLength={2000} rows={5} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain why this talent is not the right fit"/><small>{reason.length}/2000. Your reason is sent with Submit selections.</small><footer><button type="button" className="sr-button" onClick={()=>setRejecting('')}>Cancel</button><button className="sr-button sr-primary" type="submit" disabled={!reason.trim()}>Submit</button></footer></form></dialog>
  </section>;
}
