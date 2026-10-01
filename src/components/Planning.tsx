import { TellAgent } from './TellAgent';
import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  Flag,
  Focus,
  Layers,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Type,
} from 'lucide-react';
import {
  assignIdea,
  ideaStatus,
  codeOf,
  isLeftToAi,
  isPlanned,
  newIdea,
  type Idea,
  type Project,
  type Screen,
} from '../../shared/model';
import { planningOutline } from '../../shared/planning';
import type { Update } from '../useProject';
import { AutoTextarea } from './AutoTextarea';
import { Confirm } from './Modal';

/** The planning stage: every functionality idea, where it belongs, and whether it is drawn yet. */
export function Planning({
  project,
  update,
  onScreen,
  onPin,
  onPlace,
  onBoard,
  onPlanScreen,
}: {
  project: Project;
  update: Update;
  onScreen: (id: string) => void;
  onPin: (screenId: string, pinId: string) => void;
  onPlace: (ideaId: string) => void;
  onBoard: (id: string) => void;
  onPlanScreen: (title: string, purpose: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [title, setTitle] = useState(''),
    [detail, setDetail] = useState(''),
    [target, setTarget] = useState(''),
    [leads, setLeads] = useState(''),
    [editing, setEditing] = useState<string | null>(null),
    [removing, setRemoving] = useState<Idea | null>(null),
    [moving, setMoving] = useState<{ idea: Idea; to: string | null } | null>(null),
    [asText, setAsText] = useState(false),
    [copied, setCopied] = useState(false),
    [frameTitle, setFrameTitle] = useState(''),
    [framePurpose, setFramePurpose] = useState('');
  const outline = useMemo(() => planningOutline(project), [project]);
  const matches = (idea: Idea) =>
    `${idea.title} ${idea.detail}`.toLowerCase().includes(query.toLowerCase());
  const pool = project.ideas.filter((idea) => ideaStatus(idea) === 'pool' && matches(idea));
  const counts = {
    waiting: project.ideas.filter((idea) => ideaStatus(idea) === 'assigned').length,
    placed: project.ideas.filter((idea) => ideaStatus(idea) === 'placed').length,
  };
  const screenTitle = (id: string | null) =>
    project.screens.find((s) => s.id === id)?.title || 'Untitled screen';
  const addIdea = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update((p) => ({
      ...p,
      ideas: [
        ...p.ideas,
        newIdea({ title, detail, screenId: target || null, leadsTo: leads || null }),
      ],
    }));
    setTitle('');
    setDetail('');
  };
  const patch = (id: string, changes: Partial<Idea>) =>
    update((p) => ({ ...p, ideas: p.ideas.map((i) => (i.id === id ? { ...i, ...changes } : i)) }), {
      group: `idea:${id}`,
    });
  const move = (idea: Idea, to: string | null) => {
    if (idea.pinId) setMoving({ idea, to });
    else update((p) => assignIdea(p, idea.id, to));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(outline);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setAsText(true);
    }
  };
  const screenOptions = (blank: string) => (
    <>
      <option value="">{blank}</option>
      {project.screens.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title || 'Untitled screen'}
        </option>
      ))}
    </>
  );
  const card = (idea: Idea) => {
    const status = ideaStatus(idea),
      pin = project.pins.find((pin) => pin.id === idea.pinId),
      pinIndex = pin ? project.pins.filter((v) => v.screenId === pin.screenId).indexOf(pin) + 1 : 0,
      screen = project.screens.find((s) => s.id === idea.screenId),
      isEditing = editing === idea.id;
    return (
      <article className={`idea-card ${status}`} key={idea.id} data-idea={idea.id}>
        <div className="idea-heading">
          <b className="item-code">{codeOf(idea)}</b>
          <span className={`idea-status ${status}`}>
            {status === 'placed' ? (
              <>
                <Check size={13} /> Pinned as pin {pinIndex || '?'}
              </>
            ) : status === 'assigned' ? (
              <>
                <MapPin size={13} /> Waiting for the drawing
              </>
            ) : (
              <>
                <Layers size={13} /> Not on a screen yet
              </>
            )}
          </span>
          <small>{idea.author}</small>
        </div>
        {isEditing ? (
          <>
            <label>
              Idea
              <input
                value={idea.title}
                maxLength={200}
                onChange={(e) => patch(idea.id, { title: e.target.value })}
              />
            </label>
            <label>
              Details
              <AutoTextarea
                rows={2}
                value={idea.detail}
                onChange={(e) => patch(idea.id, { detail: e.target.value })}
              />
            </label>
          </>
        ) : (
          <>
            <h4>{idea.title || 'Untitled idea'}</h4>
            {idea.detail && <p>{idea.detail}</p>}
          </>
        )}
        <div className="idea-controls">
          <TellAgent
            project={project}
            context={{ view: 'plan', screen: idea.screenId ?? undefined, idea: idea.id }}
          />
          <label>
            Belongs on
            <select
              aria-label={`Screen for ${idea.title}`}
              value={idea.screenId ?? ''}
              onChange={(e) => move(idea, e.target.value || null)}
            >
              {screenOptions('Not decided yet')}
            </select>
          </label>
          <label>
            Leads to
            <select
              aria-label={`Destination for ${idea.title}`}
              value={idea.leadsTo ?? ''}
              onChange={(e) => patch(idea.id, { leadsTo: e.target.value || null })}
            >
              {screenOptions('Nowhere in particular')}
            </select>
          </label>
        </div>
        <div className="idea-actions">
          {status === 'placed' && screen && pin ? (
            <button className="button small" onClick={() => onPin(screen.id, pin.id)}>
              <MapPin size={14} /> Open the pin
            </button>
          ) : status === 'assigned' && screen ? (
            isPlanned(screen) ? (
              <button className="button small" onClick={() => onScreen(screen.id)}>
                <Pencil size={14} /> Open the frame to place it
              </button>
            ) : (
              <button className="button small primary" onClick={() => onPlace(idea.id)}>
                <MapPin size={14} /> Place on the drawing
              </button>
            )
          ) : null}
          <button
            className="text-button"
            onClick={() => setEditing(isEditing ? null : idea.id)}
            aria-pressed={isEditing}
          >
            <Pencil size={13} /> {isEditing ? 'Done' : 'Edit'}
          </button>
          <button className="text-button delete-action" onClick={() => setRemoving(idea)}>
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </article>
    );
  };
  const folder = (screen: Screen) => {
    const ideas = project.ideas.filter((idea) => idea.screenId === screen.id && matches(idea));
    if (query && !ideas.length) return null;
    const waiting = ideas.filter((idea) => !idea.pinId),
      placed = ideas.filter((idea) => idea.pinId);
    return (
      <section className="planning-folder" key={screen.id} data-screen={screen.id}>
        <div className="folder-heading">
          <span className="folder-icon">
            {screen.entry ? <Flag size={18} /> : <Layers size={18} />}
          </span>
          <div>
            <h3>
              <b className="item-code">{codeOf(screen)}</b> {screen.title || 'Untitled screen'}
            </h3>
            <p>
              {[
                screen.entry ? 'Entry' : null,
                screen.role === 'detail'
                  ? 'Detail sketch'
                  : screen.role === 'auth'
                    ? 'Login / onboarding'
                    : screen.role === 'modal'
                      ? 'Dialog'
                      : screen.role === 'terminal'
                        ? 'Ending'
                        : null,
                isLeftToAi(screen) ? 'Left to the AI' : isPlanned(screen) ? 'No drawing yet' : null,
                screen.mobileAssetId ? 'Web + mobile' : null,
                `${waiting.length} waiting`,
                `${placed.length} pinned`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="folder-actions">
            <button className="button small" onClick={() => onScreen(screen.id)}>
              <Pencil size={14} /> {isPlanned(screen) ? 'Add drawing' : 'Edit screen'}
            </button>
            <button className="button small" onClick={() => onBoard(screen.id)}>
              <Focus size={14} /> Show on board
            </button>
            <TellAgent project={project} context={{ view: 'plan', screen: screen.id }} />
          </div>
        </div>
        {!ideas.length && (
          <p className="folder-empty">
            No ideas here yet. Add one above and choose this screen, or move one from the pool.
          </p>
        )}
        <div className="idea-list">{[...waiting, ...placed].map(card)}</div>
      </section>
    );
  };
  return (
    <section className="planning-view" aria-label="Planning">
      <div className="planning-intro">
        <div>
          <span className="eyebrow">THE PLANNING STAGE</span>
          <h2>Every idea, waiting for its place.</h2>
          <p>
            Write down what the app should do, decide which screen each idea belongs on, then place
            it as a pin once the drawing exists. Placed ideas stay here, greyed out, so nothing
            lands on two pages.
          </p>
        </div>
        <div className="planning-summary">
          <span>
            <ListChecks size={15} /> {project.ideas.length} ideas
          </span>
          <span>
            <MapPin size={15} /> {counts.waiting} waiting
          </span>
          <span>
            <Check size={15} /> {counts.placed} pinned
          </span>
          <div>
            <TellAgent project={project} context={{ view: 'plan' }} />
            <button className="button small" onClick={() => void copy()}>
              <ClipboardCopy size={15} /> {copied ? 'Copied' : 'Copy as text'}
            </button>
            <button
              className="button small"
              onClick={() => setAsText(!asText)}
              aria-pressed={asText}
            >
              <Type size={15} /> {asText ? 'Show as cards' : 'Show as text'}
            </button>
          </div>
        </div>
      </div>
      <form className="idea-form" onSubmit={addIdea}>
        <label className="idea-form-title">
          New idea
          <input
            value={title}
            maxLength={200}
            placeholder="e.g. Play the demo from the home page"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="idea-form-detail">
          Details
          <AutoTextarea
            rows={2}
            value={detail}
            placeholder="What it does, why it matters, anything the drawing should include…"
            onChange={(e) => setDetail(e.target.value)}
          />
        </label>
        <label>
          Belongs on
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {screenOptions('Not decided yet')}
          </select>
        </label>
        <label>
          Leads to
          <select value={leads} onChange={(e) => setLeads(e.target.value)}>
            {screenOptions('Nowhere in particular')}
          </select>
        </label>
        <button className="button primary" type="submit" disabled={!title.trim()}>
          <Plus size={16} /> Add idea
        </button>
      </form>
      {asText ? (
        <pre className="planning-text" aria-label="Planning outline">
          {outline}
        </pre>
      ) : (
        <>
          <label className="outline-search">
            <Search size={18} />
            <input
              aria-label="Search ideas"
              placeholder="Find an idea…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <section className="planning-folder pool" data-screen="">
            <div className="folder-heading">
              <span className="folder-icon">
                <Layers size={18} />
              </span>
              <div>
                <h3>Not on a screen yet</h3>
                <p>{pool.length} ideas waiting for a home</p>
              </div>
            </div>
            {!pool.length && (
              <p className="folder-empty">
                {query
                  ? 'No unassigned ideas match.'
                  : 'Every idea has a screen. Add a new one above whenever it comes to you.'}
              </p>
            )}
            <div className="idea-list">{pool.map(card)}</div>
          </section>
          {project.screens.map(folder)}
          <form
            className="plan-frame-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!frameTitle.trim()) return;
              onPlanScreen(frameTitle.trim(), framePurpose.trim());
              setFrameTitle('');
              setFramePurpose('');
            }}
          >
            <div>
              <span className="eyebrow">BEFORE THE DRAWING</span>
              <h3>Plan a screen you haven’t drawn yet.</h3>
              <p>
                It appears on the board as an empty frame with its ideas listed. Drop a sketch onto
                it when the drawing is ready.
              </p>
            </div>
            <label>
              Frame title
              <input
                value={frameTitle}
                maxLength={200}
                placeholder="e.g. Home"
                onChange={(e) => setFrameTitle(e.target.value)}
              />
            </label>
            <label>
              What is this frame for?
              <AutoTextarea
                rows={2}
                value={framePurpose}
                placeholder="Its purpose, in a sentence or two."
                onChange={(e) => setFramePurpose(e.target.value)}
              />
            </label>
            <button className="button" type="submit" disabled={!frameTitle.trim()}>
              <Plus size={16} /> Add planned frame <ArrowRight size={15} />
            </button>
            {project.screens.some((s) => s.mobileAssetId) && (
              <p className="field-help">
                <Smartphone size={13} /> Screens with a mobile drawing show both layouts in their
                editor.
              </p>
            )}
          </form>
        </>
      )}
      {removing && (
        <Confirm
          title="Remove this idea from the plan?"
          detail={
            removing.pinId
              ? 'Its pin stays on the drawing. Only the planning note is removed. You can undo this.'
              : 'You can undo this on the board.'
          }
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            update((p) => ({ ...p, ideas: p.ideas.filter((i) => i.id !== removing.id) }))
          }
        />
      )}
      {moving && (
        <Confirm
          title={`Move “${moving.idea.title}” to ${moving.to ? screenTitle(moving.to) : 'the pool'}?`}
          detail={`It is already pinned on ${screenTitle(moving.idea.screenId)}. That pin and its yarns will be removed so the idea can be placed again. You can undo this.`}
          onClose={() => setMoving(null)}
          onConfirm={() => update((p) => assignIdea(p, moving.idea.id, moving.to))}
        />
      )}
    </section>
  );
}
