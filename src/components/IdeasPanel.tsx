import { useState, type FormEvent } from 'react';
import { ArrowRight, Bot, ChevronDown, ListChecks, MapPin, Send } from 'lucide-react';
import { ideaStatus, isPlanned, newIdea, type Project } from '../../shared/model';
import type { Update } from '../useProject';
/** What is still left to do, beside the library, plus a place to tell the agent new ideas. */
export function IdeasPanel({
  project,
  update,
  onOpenPlan,
  onPlace,
  onScreen,
}: {
  project: Project;
  update: Update;
  onOpenPlan: () => void;
  onPlace: (ideaId: string) => void;
  onScreen: (screenId: string) => void;
}) {
  const [open, setOpen] = useState(true),
    [draft, setDraft] = useState(''),
    [log, setLog] = useState<string[]>([]);
  const waiting = project.ideas.filter((idea) => ideaStatus(idea) === 'assigned'),
    pool = project.ideas.filter((idea) => ideaStatus(idea) === 'pool'),
    placed = project.ideas.filter((idea) => ideaStatus(idea) === 'placed').length;
  const groups = project.screens
    .map((screen) => ({ screen, ideas: waiting.filter((idea) => idea.screenId === screen.id) }))
    .filter((group) => group.ideas.length);
  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    update((p) => ({
      ...p,
      ideas: [
        ...p.ideas,
        newIdea({ title: text.slice(0, 200), detail: text.length > 200 ? text : '' }, 'You'),
      ],
    }));
    setLog((entries) => [...entries.slice(-3), text]);
    setDraft('');
  };
  return (
    <section className="ideas-panel" aria-label="Ideas">
      <button className="ideas-heading" onClick={() => setOpen(!open)} aria-expanded={open}>
        <ListChecks size={16} />
        <strong>Ideas</strong>
        <span className="ideas-counts">
          {waiting.length + pool.length} to do · {placed} pinned
        </span>
        <ChevronDown className="disclosure-arrow" size={16} />
      </button>
      {open && (
        <>
          <div className="ideas-scroll">
            {pool.length > 0 && (
              <details className="ideas-group" open>
                <summary>
                  <ChevronDown className="disclosure-arrow" size={14} />
                  Not on a screen yet <span>{pool.length}</span>
                </summary>
                {pool.map((idea) => (
                  <button
                    className="ideas-row"
                    key={idea.id}
                    onClick={onOpenPlan}
                    title="Choose a screen for it in the plan"
                  >
                    <span>{idea.title}</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
              </details>
            )}
            {groups.map(({ screen, ideas }) => (
              <details className="ideas-group" key={screen.id} open>
                <summary>
                  <ChevronDown className="disclosure-arrow" size={14} />
                  {screen.title || 'Untitled screen'} <span>{ideas.length}</span>
                </summary>
                {ideas.map((idea) => (
                  <button
                    className="ideas-row"
                    key={idea.id}
                    onClick={() => (isPlanned(screen) ? onScreen(screen.id) : onPlace(idea.id))}
                    title={isPlanned(screen) ? 'Needs a drawing first' : 'Place it on the drawing'}
                  >
                    <MapPin size={13} />
                    <span>{idea.title}</span>
                  </button>
                ))}
              </details>
            ))}
            {!waiting.length && !pool.length && (
              <p className="ideas-done">
                {project.ideas.length
                  ? 'Everything planned is pinned. Add the next idea below.'
                  : 'No ideas yet. Tell the agent one below, or open the plan.'}
              </p>
            )}
          </div>
          <button className="text-button ideas-open-plan" onClick={onOpenPlan}>
            Open the plan <ArrowRight size={14} />
          </button>
          <form className="agent-box" onSubmit={send}>
            <div className="agent-heading">
              <Bot size={15} /> Agent <small>no model connected yet</small>
            </div>
            {log.length > 0 && (
              <ul className="agent-log">
                {log.map((entry, i) => (
                  <li key={`${i}-${entry}`}>
                    <span>{entry}</span>
                    <small>Saved to the plan as an idea.</small>
                  </li>
                ))}
              </ul>
            )}
            <div className="agent-input">
              <input
                aria-label="Tell the agent an idea"
                placeholder="Add an idea or a note…"
                maxLength={2000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                className="icon-button"
                type="submit"
                aria-label="Send to the plan"
                disabled={!draft.trim()}
              >
                <Send size={15} />
              </button>
            </div>
            <p className="agent-note">
              What you type is saved as an idea in the plan. A future agent reads the plan from the
              export.
            </p>
          </form>
        </>
      )}
    </section>
  );
}
