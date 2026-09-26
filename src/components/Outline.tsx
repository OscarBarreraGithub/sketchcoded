import { TellAgent } from './TellAgent';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Flag,
  Focus,
  Layers,
  MapPin,
  Pencil,
  Search,
} from 'lucide-react';
import {
  isHistory,
  isLeftToAi,
  isPlanned,
  pinUrl,
  type Project,
  type Screen,
} from '../../shared/model';

export function Outline({
  project,
  onScreen,
  onPin,
  onEdge,
  onBoard,
}: {
  project: Project;
  onScreen: (id: string) => void;
  onPin: (screenId: string, pinId: string) => void;
  onEdge: (id: string) => void;
  onBoard: (id: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [expanded, setExpanded] = useState<string[]>([]),
    [highlight, setHighlight] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLDetailsElement>());
  const jump = (id: string) => {
    setQuery('');
    setExpanded((prev) => [...new Set([...prev, id])]);
    setHighlight(id);
    requestAnimationFrame(() =>
      refs.current.get(id)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'center',
      }),
    );
  };
  const matches = (s: Screen) =>
    [
      s.title,
      s.purpose,
      ...project.pins
        .filter((pin) => pin.screenId === s.id)
        .flatMap((pin) => [
          pin.title,
          pin.description,
          ...project.transitions
            .filter((t) => t.pinId === pin.id)
            .flatMap((t) => [
              t.summary,
              t.condition,
              project.screens.find((s) => s.id === t.target)?.title ?? '',
            ]),
        ]),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase());
  const groups = [
    {
      title: 'Start here',
      subtitle: 'The ways into your app',
      screens: project.screens.filter((s) => s.entry && s.role !== 'detail'),
    },
    {
      title: 'App screens',
      subtitle: 'Each screen appears once. Follow a destination to find it here.',
      screens: project.screens.filter((s) => !s.entry && s.role !== 'detail'),
    },
    {
      title: 'Detail sketches',
      subtitle: 'Closer looks and supporting references, outside the app navigation',
      screens: project.screens.filter((s) => s.role === 'detail'),
    },
  ];
  const toggleAll = () =>
    setExpanded(expanded.length === project.screens.length ? [] : project.screens.map((s) => s.id));
  return (
    <section className="outline-view" aria-label="App outline">
      <div className="outline-intro">
        <div>
          <span className="eyebrow">THE APP AT A GLANCE</span>
          <h2>Every screen. A clear next step.</h2>
          <p>
            Open a screen to see its pins and paths. Destinations link to the same screen below, so
            loops stay simple.
          </p>
        </div>
        <div className="outline-actions">
          <TellAgent project={project} context={{ view: 'outline' }} className="button" />
          <button className="button" onClick={toggleAll}>
            {expanded.length === project.screens.length && project.screens.length
              ? 'Collapse screens'
              : 'Expand screens'}
          </button>
        </div>
      </div>
      <label className="outline-search">
        <Search size={18} />
        <input
          aria-label="Search app outline"
          placeholder="Find a screen, pin, or path…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {groups.map((group) => {
        const screens = group.screens.filter(matches);
        if (!screens.length) return null;
        return (
          <section key={group.title} className="outline-group">
            <div className="outline-group-heading">
              <h3>
                {group.title}
                <span>{screens.length}</span>
              </h3>
              <p>{group.subtitle}</p>
            </div>
            {screens.map((s) => {
              const pins = project.pins.filter((pin) => pin.screenId === s.id),
                incoming = project.transitions.filter((t) => t.target === s.id && !isHistory(t));
              return (
                <details
                  className={`outline-screen ${highlight === s.id ? 'highlighted' : ''}`}
                  key={s.id}
                  ref={(el) => {
                    if (el) refs.current.set(s.id, el);
                    else refs.current.delete(s.id);
                  }}
                  open={expanded.includes(s.id)}
                  onToggle={(e) => {
                    const open = e.currentTarget.open;
                    setExpanded((prev) =>
                      open ? [...new Set([...prev, s.id])] : prev.filter((id) => id !== s.id),
                    );
                  }}
                >
                  <summary>
                    <ChevronDown className="disclosure-arrow" size={18} />
                    {s.entry ? (
                      <Flag size={18} />
                    ) : s.role === 'detail' ? (
                      <Focus size={18} />
                    ) : (
                      <Layers size={18} />
                    )}
                    <strong>{s.title || 'Untitled screen'}</strong>
                    {isLeftToAi(s) ? (
                      <span className="outline-count left-to-ai">left to the AI</span>
                    ) : (
                      isPlanned(s) && <span className="outline-count planned">no drawing yet</span>
                    )}
                    {s.mobileAssetId && <span className="outline-count">web + mobile</span>}
                    <span className="outline-count">
                      {pins.length} {pins.length === 1 ? 'pin' : 'pins'}
                    </span>
                  </summary>
                  <div className="outline-screen-content">
                    <div className="outline-screen-info">
                      <p>{s.purpose || 'Add a description to explain this screen.'}</p>
                      <div>
                        <button className="button small" onClick={() => onScreen(s.id)}>
                          <Pencil size={16} /> Edit screen
                        </button>
                        <button className="button small" onClick={() => onBoard(s.id)}>
                          <Focus size={16} /> Show on board
                        </button>
                        <TellAgent project={project} context={{ view: 'outline', screen: s.id }} />
                      </div>
                    </div>
                    {project.ideas.some((idea) => idea.screenId === s.id && !idea.pinId) && (
                      <p className="outline-arrivals">
                        Ideas waiting for the drawing:{' '}
                        {project.ideas
                          .filter((idea) => idea.screenId === s.id && !idea.pinId)
                          .map((idea) => idea.title)
                          .join(', ')}
                      </p>
                    )}
                    {incoming.length > 0 && (
                      <p className="outline-arrivals">
                        Reached from{' '}
                        {[
                          ...new Set(
                            incoming.map(
                              (t) =>
                                project.screens.find(
                                  (s) =>
                                    s.id ===
                                    project.pins.find((pin) => pin.id === t.pinId)?.screenId,
                                )?.title ?? 'Unknown screen',
                            ),
                          ),
                        ].join(', ')}
                      </p>
                    )}
                    {!pins.length && (
                      <p className="outline-empty-pin">
                        No pins yet. Open the sketch to add an interaction or a detail reference.
                      </p>
                    )}
                    {pins.map((pin, i) => {
                      const branches = project.transitions.filter((t) => t.pinId === pin.id);
                      return (
                        <details
                          className="outline-pin"
                          key={pin.id}
                          open={query ? true : undefined}
                        >
                          <summary>
                            <ChevronDown className="disclosure-arrow" size={16} />
                            <span
                              className={`outline-pin-number ${pin.kind === 'detail' ? 'reference' : ''}`}
                            >
                              {pin.kind === 'detail' ? <Focus size={14} /> : i + 1}
                            </span>
                            <strong>{pin.title || 'Untitled pin'}</strong>
                            <span className="outline-count">
                              {pin.kind === 'detail'
                                ? 'Detail reference'
                                : pin.kind === 'link'
                                  ? 'Link out'
                                  : `${branches.length} ${branches.length === 1 ? 'path' : 'paths'}`}
                            </span>
                          </summary>
                          <div className="outline-pin-content">
                            <div className="outline-pin-description">
                              <p>{pin.description || 'This pin needs a description.'}</p>
                              <button className="button small" onClick={() => onPin(s.id, pin.id)}>
                                <MapPin size={15} /> Edit pin
                              </button>
                            </div>
                            {pin.kind === 'link' ? (
                              <div className="outline-route reference">
                                <span>
                                  <ExternalLink size={17} /> Opens{' '}
                                  {pinUrl(pin) ?? 'a web address (not written yet)'} · leaves the
                                  app
                                </span>
                              </div>
                            ) : pin.kind === 'detail' ? (
                              pin.detailTarget ? (
                                <div className="outline-route reference">
                                  <span>
                                    <Focus size={17} /> A closer look · stays on this app screen
                                  </span>
                                  <button onClick={() => jump(pin.detailTarget!)}>
                                    {project.screens.find((s) => s.id === pin.detailTarget)
                                      ?.title ?? 'Missing detail'}
                                    <ArrowRight size={17} />
                                  </button>
                                </div>
                              ) : (
                                <p className="outline-empty-pin">
                                  Choose a detail sketch in the pin editor.
                                </p>
                              )
                            ) : branches.length ? (
                              branches.map((t) => (
                                <div className="outline-route" key={t.id}>
                                  <button className="outline-branch" onClick={() => onEdge(t.id)}>
                                    <strong>{t.summary || 'Unnamed path'}</strong>
                                    <small>
                                      {t.condition || 'Always available'}
                                      {t.fallback ? ' · fallback' : ''}
                                    </small>
                                  </button>
                                  {t.target ? (
                                    <button
                                      className="outline-destination"
                                      onClick={() => jump(t.target!)}
                                    >
                                      {t.target === s.id
                                        ? 'Back to this screen'
                                        : (project.screens.find((target) => target.id === t.target)
                                            ?.title ?? 'Missing screen')}
                                      <ArrowRight size={17} />
                                    </button>
                                  ) : (
                                    <span className="outline-history">
                                      ↶{' '}
                                      {t.navigation === 'back'
                                        ? 'Previous screen'
                                        : 'Dialog caller'}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="outline-empty-pin">This interaction has no path yet.</p>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </section>
        );
      })}
      {!project.screens.some(matches) && (
        <div className="outline-empty">
          <Layers size={32} />
          <h3>{query ? 'No matching screens.' : 'Your app starts with a sketch.'}</h3>
          <p>
            {query
              ? 'Try a screen title or a word from an interaction.'
              : 'Add a sketch from the library, then give its pins a purpose.'}
          </p>
        </div>
      )}
    </section>
  );
}
