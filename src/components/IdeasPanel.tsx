import { useState } from 'react';
import { ArrowRight, ChevronDown, ListChecks, MapPin } from 'lucide-react';
import { ideaStatus, isPlanned, type Project } from '../../shared/model';
/** What is still left to do, beside the library, grouped by screen. */
export function IdeasPanel({
  project,
  onOpenPlan,
  onPlace,
  onScreen,
}: {
  project: Project;
  onOpenPlan: () => void;
  onPlace: (ideaId: string) => void;
  onScreen: (screenId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const waiting = project.ideas.filter((idea) => ideaStatus(idea) === 'assigned'),
    pool = project.ideas.filter((idea) => ideaStatus(idea) === 'pool'),
    placed = project.ideas.filter((idea) => ideaStatus(idea) === 'placed').length;
  const groups = project.screens
    .map((screen) => ({ screen, ideas: waiting.filter((idea) => idea.screenId === screen.id) }))
    .filter((group) => group.ideas.length);
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
                  ? 'Everything planned is pinned. Add the next idea in the plan.'
                  : 'No ideas yet. Open the plan to add the first one.'}
              </p>
            )}
          </div>
          <button className="text-button ideas-open-plan" onClick={onOpenPlan}>
            Open the plan <ArrowRight size={14} />
          </button>
        </>
      )}
    </section>
  );
}
