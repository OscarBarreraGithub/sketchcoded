import { DetailView } from './DetailView';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  MapPin,
  Monitor,
  Play,
  RotateCcw,
  Smartphone,
  Undo2,
} from 'lucide-react';
import {
  assetUrl,
  isPlanned,
  pinColor,
  pinUrl,
  type Layout,
  type Pin,
  type Project,
  type Transition,
} from '../../shared/model';
import { follow, startPreview, type PreviewState } from '../../shared/navigation';
import { Modal } from './Modal';
export function Preview({ project, onClose }: { project: Project; onClose: () => void }) {
  const appScreens = project.screens.filter((s) => s.role !== 'detail');
  const initial = appScreens.find((s) => s.entry)?.id ?? appScreens[0]?.id;
  const hasMobile = project.screens.some((s) => s.mobileAssetId);
  const [start, setStart] = useState(initial),
    [state, setState] = useState(() => startPreview(initial)),
    [rewinds, setRewinds] = useState<PreviewState[]>([]),
    [choice, setChoice] = useState<string | null>(null),
    [notice, setNotice] = useState(''),
    [showPins, setShowPins] = useState(true),
    [layout, setLayout] = useState<Layout>('web'),
    [detail, setDetail] = useState<string | null>(null);
  const current = state.stack.at(-1)!,
    screen = project.screens.find((s) => s.id === current.screenId),
    webAsset = project.assets.find((a) => a.id === screen?.assetId),
    mobileAsset = project.assets.find((a) => a.id === screen?.mobileAssetId),
    showingMobile = layout === 'mobile' && !!mobileAsset,
    asset = showingMobile ? mobileAsset : webAsset,
    pins = project.pins.filter((p) => p.screenId === screen?.id),
    ideas = project.ideas.filter((idea) => idea.screenId === screen?.id && !idea.pinId),
    pin = project.pins.find((p) => p.id === choice);
  const transitions = project.transitions.filter((t) => t.pinId === choice);
  const take = (t: Transition) => {
    if (t.target && project.screens.find((s) => s.id === t.target)?.role === 'detail') {
      setNotice(
        'This path points to a detail sketch. Use a detail pin or change the sketch type in the editor.',
      );
      return;
    }
    if (t.target && !project.screens.some((s) => s.id === t.target)) {
      setNotice('This destination is missing. Return to the board to reconnect it.');
      return;
    }
    const result = follow(state, t);
    if (result.error) {
      setNotice(result.error);
      setChoice(null);
      return;
    }
    setRewinds((prev) => [...prev, state]);
    setState(result.state);
    setChoice(null);
    setNotice('');
  };
  const tryPin = (p: Pin) => {
    if (p.kind === 'link') {
      setChoice(null);
      const url = pinUrl(p);
      setNotice(
        url
          ? `This pin opens ${url} in the browser. The test stays on this screen.`
          : 'This pin links out, but its address is not written in the description yet.',
      );
      return;
    }
    if (p.kind === 'detail') {
      setChoice(null);
      if (p.detailTarget) setDetail(p.detailTarget);
      else setNotice('This detail pin needs an attached sketch. Choose one in the pin editor.');
      return;
    }
    const options = project.transitions.filter((t) => t.pinId === p.id);
    setNotice('');
    if (options.length === 1) take(options[0]);
    else setChoice(p.id);
  };
  const reset = (id = start) => {
    setStart(id);
    setState(startPreview(id));
    setRewinds([]);
    setChoice(null);
    setNotice('');
  };
  const last = project.transitions.find((t) => t.id === state.trail.at(-1));
  const unplaced = showingMobile ? pins.filter((p) => !p.mobile) : [];
  return (
    <Modal title="Take your idea for a walk." onClose={onClose} className="preview-modal">
      <div className="preview-toolbar">
        <label className="preview-start">
          <Flag size={15} />
          <select
            aria-label="Preview starting screen"
            value={start}
            onChange={(e) => reset(e.target.value)}
          >
            {appScreens.map((s) => (
              <option value={s.id} key={s.id}>
                {s.entry ? '↳ ' : ''}
                {s.title}
                {!s.entry ? ' (test entry)' : ''}
              </option>
            ))}
          </select>
        </label>
        {hasMobile && (
          <div className="layout-toggle" role="group" aria-label="Preview layout">
            <button aria-pressed={layout === 'web'} onClick={() => setLayout('web')}>
              <Monitor size={15} /> Web
            </button>
            <button aria-pressed={layout === 'mobile'} onClick={() => setLayout('mobile')}>
              <Smartphone size={15} /> Mobile
            </button>
          </div>
        )}
        <div>
          <button className="text-button" onClick={() => setShowPins(!showPins)}>
            <MapPin size={15} />
            {showPins ? 'Hide pins' : 'Show pins'}
          </button>
          <button className="text-button" onClick={() => reset()}>
            <RotateCcw size={15} /> Restart
          </button>
        </div>
      </div>
      <div className="preview-body">
        <div className="preview-stage">
          <div className="preview-screen-title">
            <span className="live-indicator" /> {screen?.title || 'Missing screen'}
            {current.kind === 'modal' && <span className="badge">DIALOG</span>}
            {showingMobile && <span className="badge">MOBILE</span>}
          </div>
          <div
            className={`preview-image ${showingMobile ? 'mobile-frame' : ''}`}
            style={{
              aspectRatio: asset ? `${asset.width}/${asset.height}` : '4/3',
              maxWidth: asset ? `min(100%, calc(58vh * ${asset.width / asset.height}))` : '100%',
            }}
          >
            {asset ? (
              <img
                src={assetUrl(asset)}
                alt={`Preview: ${screen?.title}${showingMobile ? ' (mobile)' : ''}`}
                draggable={false}
              />
            ) : screen && isPlanned(screen) ? (
              <div className="preview-planned">
                <strong>{screen.title} has no drawing yet.</strong>
                {ideas.length ? (
                  <>
                    <span>Planned for this screen:</span>
                    <ul>
                      {ideas.map((idea) => (
                        <li key={idea.id}>{idea.title}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span>Add a drawing and some pins to try it here.</span>
                )}
              </div>
            ) : (
              <p>This screen’s image is missing.</p>
            )}
            {asset &&
              pins
                .filter((p) => !showingMobile || p.mobile)
                .map((p) => {
                  const pos = showingMobile ? p.mobile! : p,
                    i = pins.indexOf(p);
                  return (
                    <button
                      key={p.id}
                      className={`preview-pin ${pinColor(p)} ${p.kind === 'link' ? 'link-pin' : ''} ${showPins ? '' : 'invisible-pin'}`}
                      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                      aria-label={`Try ${p.title || `interaction ${i + 1}`}`}
                      title={p.title}
                      onClick={() => tryPin(p)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
          </div>
          {layout === 'mobile' && !mobileAsset && screen && !isPlanned(screen) && (
            <p className="preview-hint">
              <Smartphone size={14} /> No mobile drawing for this screen yet, so the web layout is
              shown.
            </p>
          )}
          {unplaced.length > 0 && (
            <div className="preview-unplaced">
              <span>Not placed on the mobile drawing yet:</span>
              {unplaced.map((p) => (
                <button
                  key={p.id}
                  className="button small"
                  aria-label={`Try ${p.title || `interaction ${pins.indexOf(p) + 1}`}`}
                  onClick={() => tryPin(p)}
                >
                  {pins.indexOf(p) + 1} · {p.title || 'Untitled'}
                </button>
              ))}
            </div>
          )}
          <p className="preview-hint">
            <MapPin size={14} /> Click a pin to try a path or open a closer look.
          </p>
          {notice && (
            <div className="preview-notice" role="status">
              {notice}
            </div>
          )}
        </div>
        <aside className="preview-sidebar">
          {choice ? (
            <>
              <span className="eyebrow">CHOOSE THE SCENARIO</span>
              <h3>{pin?.title || 'This interaction'}</h3>
              <p>{pin?.description}</p>
              {transitions.length ? (
                transitions.map((t) => (
                  <button className="branch-choice" key={t.id} onClick={() => take(t)}>
                    <span>
                      {t.summary || 'Unnamed branch'}
                      <ArrowRight size={16} />
                    </span>
                    <small>{t.condition || 'No condition specified.'}</small>
                    <em>
                      {t.target
                        ? project.screens.find((s) => s.id === t.target)?.title
                        : t.navigation === 'back'
                          ? 'Previous screen'
                          : 'Dialog caller'}
                      {t.fallback ? ' · fallback' : ''}
                    </em>
                  </button>
                ))
              ) : (
                <div className="preview-notice">
                  This pin has no yarn yet. Return to the board and connect it to a screen or add a
                  history action.
                </div>
              )}
              <button className="text-button" onClick={() => setChoice(null)}>
                <ArrowLeft size={14} /> Back to the sketch
              </button>
              <div className="preview-prose-note">
                You’re choosing a scenario. Conditions written in words are not automatically
                evaluated.
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">PLAYING YOUR SKETCHES</span>
              <h3>Follow your curiosity.</h3>
              <p>
                Try the little pins on your sketch. At a fork in the flow, you get to choose what
                happens.
              </p>
              <div className="preview-route">
                <span>
                  <Flag size={14} />
                  {project.screens.find((s) => s.id === start)?.title}
                </span>
                {state.trail.map((id, i) => {
                  const t = project.transitions.find((t) => t.id === id);
                  return (
                    <div key={`${id}-${i}`}>
                      <span className="route-line" />
                      <small>{t?.summary || 'Removed connection'}</small>
                    </div>
                  );
                })}
              </div>
              {last && (
                <div className="last-branch">
                  <span className="eyebrow">LAST CONNECTION</span>
                  <strong>{last.summary}</strong>
                  {last.condition && <p>{last.condition}</p>}
                  {last.context && <small>Data or information: {last.context}</small>}
                </div>
              )}
              {screen?.role === 'terminal' && (
                <div className="preview-prose-note">
                  <strong>An intentional ending.</strong>
                  <br />
                  {screen.purpose}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
      <div className="preview-footer">
        <button
          className="button small"
          disabled={!rewinds.length}
          onClick={() => {
            const prev = rewinds.at(-1)!;
            setState(prev);
            setRewinds((r) => r.slice(0, -1));
            setChoice(null);
            setNotice('');
          }}
        >
          <Undo2 size={15} /> Rewind test
        </button>
        <span>Rewind is a testing control. App back navigation must be drawn on the board.</span>
        <span className="preview-step">
          <Play size={13} /> {state.trail.length} steps
        </span>
      </div>
      {detail && (
        <DetailView
          project={project}
          targetId={detail}
          sourceTitle={screen?.title ?? 'this screen'}
          onClose={() => setDetail(null)}
        />
      )}
    </Modal>
  );
}
