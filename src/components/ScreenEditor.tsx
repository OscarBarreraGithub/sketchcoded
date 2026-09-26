import { AutoTextarea } from './AutoTextarea';
import { useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
  Flag,
  Link2,
  ListChecks,
  MapPin,
  Monitor,
  Move,
  Plus,
  Smartphone,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  assetUrl,
  attachDetail,
  colorNames,
  colors,
  isPlanned,
  linkIdea,
  newIdea,
  pinColor,
  pinUrl,
  placeIdea,
  placeOnMobile,
  removePin,
  setDrawing,
  uid,
  type Layout,
  type Pin,
  type PinColor,
  type Project,
  type Screen,
} from '../../shared/model';
import type { Update } from '../useProject';
import { Modal, Confirm } from './Modal';
import { ScrollHints } from './ScrollHints';
type Placing =
  | { mode: 'new' }
  | { mode: 'idea'; ideaId: string }
  | { mode: 'mobile'; pinId: string }
  | { mode: 'move'; pinId: string }
  | null;
export function ScreenEditor({
  project,
  screenId,
  initialPin,
  initialIdea,
  update,
  onClose,
  onConnect,
  onEdge,
  onHistory,
  onDelete,
}: {
  project: Project;
  screenId: string;
  initialPin?: string;
  initialIdea?: string;
  update: Update;
  onClose: () => void;
  onConnect: (id: string) => void;
  onEdge: (id: string) => void;
  onHistory: (pinId: string) => void;
  onDelete: () => void;
}) {
  const s = project.screens.find((s) => s.id === screenId)!;
  const asset = project.assets.find((a) => a.id === s.assetId),
    mobileAsset = project.assets.find((a) => a.id === s.mobileAssetId),
    pins = project.pins.filter((pin) => pin.screenId === s.id),
    ideas = project.ideas.filter((idea) => idea.screenId === s.id);
  const startIdea = project.ideas.find((idea) => idea.id === initialIdea);
  const [selected, setSelected] = useState<string | null>(initialPin ?? null),
    [layout, setLayout] = useState<Layout>('web'),
    [placing, setPlacing] = useState<Placing>(
      startIdea && !startIdea.pinId && startIdea.screenId === s.id && asset
        ? { mode: 'idea', ideaId: startIdea.id }
        : null,
    ),
    [remove, setRemove] = useState<string | null>(null),
    [quickIdea, setQuickIdea] = useState('');
  const pin = pins.find((pin) => pin.id === selected),
    imageRef = useRef<HTMLDivElement>(null),
    inspectorRef = useRef<HTMLDivElement>(null),
    drag = useRef<string | null>(null);
  const active = layout === 'mobile' ? mobileAsset : asset;
  const linkedIdea = pin && project.ideas.find((idea) => idea.pinId === pin.id);
  const placingIdea =
    placing?.mode === 'idea' ? project.ideas.find((idea) => idea.id === placing.ideaId) : undefined;
  const placingPin =
    placing && (placing.mode === 'mobile' || placing.mode === 'move')
      ? pins.find((pin) => pin.id === placing.pinId)
      : undefined;
  const editScreen = (patch: Partial<Screen>) =>
    update(
      (p) => ({
        ...p,
        screens: p.screens.map((screen) => (screen.id === s.id ? { ...screen, ...patch } : screen)),
      }),
      { group: `screen:${s.id}` },
    );
  const editPin = (patch: Partial<Pin>) => {
    if (pin)
      update(
        (p) => ({ ...p, pins: p.pins.map((v) => (v.id === pin.id ? { ...v, ...patch } : v)) }),
        { group: `pin:${pin.id}` },
      );
  };
  const switchLayout = (next: Layout) => {
    setLayout(next);
    if (placing && placing.mode !== 'move' && (placing.mode === 'mobile') !== (next === 'mobile'))
      setPlacing(null);
  };
  const point = (x: number, y: number) => {
    const r = imageRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (x - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (y - r.top) / r.height)),
    };
  };
  const clickImage = (e: MouseEvent) => {
    if (!placing || !active) return;
    const pos = point(e.clientX, e.clientY);
    if (placing.mode === 'new' && layout === 'web') {
      const id = uid();
      update((p) => ({
        ...p,
        pins: [
          ...p.pins,
          {
            id,
            screenId: s.id,
            ...pos,
            title: '',
            description: '',
            kind: s.role === 'detail' ? 'detail' : 'interaction',
          },
        ],
      }));
      setSelected(id);
    } else if (placing.mode === 'idea' && layout === 'web') {
      const ids = { pin: uid(), transition: uid() };
      update((p) => placeIdea(p, placing.ideaId, pos, ids));
      setSelected(ids.pin);
    } else if (placing.mode === 'mobile' && layout === 'mobile') {
      update((p) => placeOnMobile(p, placing.pinId, pos));
      setSelected(placing.pinId);
    } else if (placing.mode === 'move') {
      const id = placing.pinId;
      update(
        (p) =>
          layout === 'web'
            ? { ...p, pins: p.pins.map((v) => (v.id === id ? { ...v, ...pos } : v)) }
            : placeOnMobile(p, id, pos),
        { group: `move-pin:${layout}:${id}` },
      );
      setSelected(id);
    } else return;
    setPlacing(null);
  };
  const stagePin = (v: Pin) => {
    const index = pins.indexOf(v),
      pos = layout === 'web' ? v : v.mobile!;
    const move = (e: ReactPointerEvent) => {
      if (drag.current !== v.id) return;
      const next = point(e.clientX, e.clientY);
      update(
        (p) => ({
          ...p,
          pins: p.pins.map((pin) =>
            pin.id === v.id
              ? layout === 'web'
                ? { ...pin, ...next }
                : { ...pin, mobile: next }
              : pin,
          ),
        }),
        { group: `move-pin:${layout}:${v.id}` },
      );
    };
    return (
      <button
        className={`editor-pin ${pinColor(v)} ${v.kind === 'link' ? 'link-pin' : ''} ${v.id === selected ? 'selected' : ''}`}
        key={v.id}
        style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
        aria-label={`Pin ${index + 1}: ${v.title || 'Untitled interaction'}${layout === 'mobile' ? ' (mobile)' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(v.id);
          if (placing?.mode === 'new' || placing?.mode === 'idea') setPlacing(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          drag.current = v.id;
          setSelected(v.id);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {index + 1}
      </button>
    );
  };
  const stageStyle = (a?: { width: number; height: number }) => ({
    aspectRatio: a ? `${a.width}/${a.height}` : layout === 'mobile' ? '9/16' : '4/3',
    maxWidth: a
      ? `min(100%, calc(58vh * ${a.width / a.height}))`
      : layout === 'mobile'
        ? '360px'
        : '100%',
  });
  const caption =
    placing?.mode === 'new'
      ? 'Place a pin on the part of the web drawing that does something.'
      : placing?.mode === 'idea'
        ? `Click the web drawing where “${placingIdea?.title ?? 'this idea'}” belongs.`
        : placing?.mode === 'mobile'
          ? `Click the mobile drawing where “${placingPin?.title || 'this pin'}” sits.`
          : placing?.mode === 'move'
            ? `Click the ${layout} drawing where “${placingPin?.title || 'this pin'}” should go.`
            : active
              ? 'Click a pin to describe it. Drag it to fine-tune its position.'
              : layout === 'web'
                ? 'Choose a drawing to start placing pins.'
                : 'Choose a mobile drawing to place pins on it.';
  const pinIndex = (id: string | null) => {
    const v = pins.find((pin) => pin.id === id);
    return v ? pins.indexOf(v) + 1 : 0;
  };
  const drawingOptions = (blank: string, blankDisabled = false) => (
    <>
      <option value="" disabled={blankDisabled}>
        {blank}
      </option>
      {project.assets.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </>
  );
  const legend = colorNames.filter((c) => project.colorLabels?.[c]);
  const removing = pins.find((v) => v.id === remove);
  return (
    <Modal title={s.title || 'Untitled screen'} onClose={onClose} className="screen-modal">
      <div className="screen-editor">
        <div className="screen-workspace">
          <div className="editor-toolbar">
            <button className="text-button" onClick={onClose}>
              <ArrowLeft size={15} /> Back to board
            </button>
            <div className="layout-toggle" role="group" aria-label="Drawing shown">
              <button aria-pressed={layout === 'web'} onClick={() => switchLayout('web')}>
                <Monitor size={15} /> Web
              </button>
              <button aria-pressed={layout === 'mobile'} onClick={() => switchLayout('mobile')}>
                <Smartphone size={15} /> Mobile
                {!mobileAsset && <small>none yet</small>}
              </button>
            </div>
            {placing ? (
              <button className="button small primary" onClick={() => setPlacing(null)}>
                <MapPin size={15} /> Cancel placing
              </button>
            ) : (
              <button
                className="button small"
                disabled={!asset}
                title={asset ? undefined : 'Choose a web drawing first'}
                onClick={() => {
                  switchLayout('web');
                  setPlacing({ mode: 'new' });
                  setSelected(null);
                }}
              >
                <MapPin size={15} /> Add a pin
              </button>
            )}
          </div>
          <div className={`sketch-stage layout-stage ${layout} ${placing ? 'placing' : ''}`}>
            <div className="layout-caption">
              {layout === 'web' ? <Monitor size={14} /> : <Smartphone size={14} />}
              {layout === 'web' ? 'Web layout' : 'Mobile layout'}
              {active && (
                <span>
                  {active.width} × {active.height}
                </span>
              )}
            </div>
            <div
              className={`editable-image ${active ? '' : 'empty'} ${layout === 'mobile' && active ? 'mobile-frame' : ''}`}
              ref={imageRef}
              style={stageStyle(active)}
              onClick={clickImage}
            >
              {active ? (
                <img
                  src={assetUrl(active)}
                  alt={layout === 'mobile' ? `${s.title} on mobile` : s.title}
                  draggable={false}
                />
              ) : layout === 'mobile' ? (
                <div className="frame-planned">
                  <Smartphone size={22} />
                  <strong>No mobile drawing yet.</strong>
                  <label>
                    Mobile drawing
                    <select
                      aria-label="Choose a mobile drawing"
                      value=""
                      onChange={(e) =>
                        e.target.value &&
                        update((p) => setDrawing(p, s.id, 'mobile', e.target.value))
                      }
                    >
                      {drawingOptions('Choose a sketch from the library…')}
                    </select>
                  </label>
                  <small>Pins keep their web positions; you place each one here too.</small>
                </div>
              ) : isPlanned(s) ? (
                <div className="frame-planned">
                  <MapPin size={22} />
                  <strong>Waiting for a drawing.</strong>
                  <label>
                    Web drawing
                    <select
                      aria-label="Choose a web drawing"
                      value=""
                      onChange={(e) =>
                        e.target.value && update((p) => setDrawing(p, s.id, 'web', e.target.value))
                      }
                    >
                      {drawingOptions('Choose a sketch from the library…')}
                    </select>
                  </label>
                  <small>Or drop a sketch onto this frame on the board.</small>
                  {ideas.length > 0 && (
                    <ul>
                      {ideas.map((idea) => (
                        <li key={idea.id}>{idea.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="image-missing">Image missing from this project</div>
              )}
              {active && pins.filter((v) => layout === 'web' || v.mobile).map(stagePin)}
            </div>
            {layout === 'mobile' && mobileAsset && pins.some((v) => !v.mobile) && (
              <div className="unplaced-strip">
                <span>Not on mobile yet:</span>
                {pins
                  .filter((v) => !v.mobile)
                  .map((v) => (
                    <button
                      key={v.id}
                      className="button small"
                      onClick={() => {
                        setSelected(v.id);
                        setPlacing({ mode: 'mobile', pinId: v.id });
                      }}
                    >
                      <MapPin size={13} /> {pins.indexOf(v) + 1} · {v.title || 'Untitled'}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="sketch-caption">
            <MapPin size={14} />
            {caption}
          </div>
        </div>
        <aside className="editor-inspector">
          <div className="inspector-scroll" ref={inspectorRef}>
            {pin ? (
              <>
                <button className="text-button inspector-back" onClick={() => setSelected(null)}>
                  <ArrowLeft size={14} /> Screen details
                </button>
                <div className="inspector-title">
                  <span className="pin-swatch" style={{ background: colors[pinColor(pin)] }}>
                    <MapPin size={18} />
                  </span>
                  <div>
                    <span className="eyebrow">PIN {pins.indexOf(pin) + 1}</span>
                    <h3>
                      {pin.kind === 'detail'
                        ? 'Show a closer look.'
                        : pin.kind === 'link'
                          ? 'Where does this link go?'
                          : 'What happens here?'}
                    </h3>
                  </div>
                </div>
                <label>
                  Pin purpose
                  <select
                    value={pin.kind ?? 'interaction'}
                    onChange={(e) =>
                      editPin({ kind: e.target.value as Pin['kind'], detailTarget: null })
                    }
                  >
                    <option value="interaction" disabled={s.role === 'detail'}>
                      App interaction — go somewhere or do something
                    </option>
                    <option
                      value="detail"
                      disabled={project.transitions.some((t) => t.pinId === pin.id)}
                    >
                      Detail reference — show a closer look
                    </option>
                    <option
                      value="link"
                      disabled={project.transitions.some((t) => t.pinId === pin.id)}
                    >
                      Link out — opens a web address
                    </option>
                  </select>
                </label>
                <p className="field-help">
                  {pin.kind === 'detail'
                    ? 'Attach an enlarged or supporting sketch. This explains the design without changing the app screen.'
                    : pin.kind === 'link'
                      ? 'Write the address in the description below, with any conditions. The pin is the exit: no yarn, no destination frame.'
                      : 'Describe an action, then connect the possible outcomes. To change an existing interaction to a reference or a link, remove its yarns first.'}
                </p>
                <label>
                  Pin name
                  <input
                    autoFocus
                    key={pin.id}
                    value={pin.title}
                    placeholder="e.g. Open a recent chat"
                    maxLength={200}
                    onChange={(e) => editPin({ title: e.target.value })}
                  />
                </label>
                <label>
                  The idea
                  <AutoTextarea
                    rows={5}
                    value={pin.description}
                    placeholder="Describe this part of the screen and what a click should do…"
                    onChange={(e) => editPin({ description: e.target.value })}
                  />
                </label>
                <p className="field-help">
                  {pin.kind === 'detail'
                    ? 'Describe what this closer look explains. It does not move the user to another page.'
                    : pin.kind === 'link'
                      ? 'For example: “Opens https://github.com/… in a new tab. Only shown when the repo is public.”'
                      : 'Think in intentions. The detailed rules live on each yarn.'}
                </p>
                {linkedIdea ? (
                  <p className="field-help linked-idea">
                    <ListChecks size={14} /> Planned as “{linkedIdea.title}” in the plan.
                  </p>
                ) : (
                  project.ideas.some(
                    (idea) => !idea.pinId && (!idea.screenId || idea.screenId === s.id),
                  ) && (
                    <label>
                      Planned idea
                      <select
                        value=""
                        onChange={(e) =>
                          e.target.value && update((p) => linkIdea(p, e.target.value, pin.id))
                        }
                      >
                        <option value="">Link this pin to an idea from the plan…</option>
                        {project.ideas
                          .filter(
                            (idea) => !idea.pinId && (!idea.screenId || idea.screenId === s.id),
                          )
                          .map((idea) => (
                            <option key={idea.id} value={idea.id}>
                              {idea.title}
                            </option>
                          ))}
                      </select>
                    </label>
                  )
                )}
                <div className="inspector-section">
                  <div className="section-heading">
                    <span>COLOR CODING</span>
                    <span>{project.colorLabels?.[pinColor(pin)] || pinColor(pin)}</span>
                  </div>
                  <fieldset className="color-picker">
                    <legend>Pin color</legend>
                    {colorNames.map((name) => (
                      <button
                        type="button"
                        className={pinColor(pin) === name ? 'chosen' : ''}
                        key={name}
                        style={{ background: colors[name] }}
                        aria-label={`${name} pin`}
                        aria-pressed={pinColor(pin) === name}
                        title={project.colorLabels?.[name] || name}
                        onClick={() => editPin({ color: name })}
                      />
                    ))}
                  </fieldset>
                  <label>
                    What {pinColor(pin)} means on this board
                    <input
                      value={project.colorLabels?.[pinColor(pin)] ?? ''}
                      maxLength={60}
                      placeholder="e.g. navigation, needs a decision, nice to have"
                      onChange={(e) => {
                        const color: PinColor = pinColor(pin),
                          label = e.target.value;
                        update(
                          (p) => ({ ...p, colorLabels: { ...p.colorLabels, [color]: label } }),
                          {
                            group: `color-label:${color}`,
                          },
                        );
                      }}
                    />
                  </label>
                </div>
                <div className="inspector-section">
                  <div className="section-heading">
                    <span>MOBILE LAYOUT</span>
                    <span>{!mobileAsset ? 'No drawing' : pin.mobile ? 'Placed' : 'Not yet'}</span>
                  </div>
                  {mobileAsset ? (
                    <>
                      <button
                        className="button full"
                        onClick={() => {
                          switchLayout('mobile');
                          setPlacing({ mode: 'mobile', pinId: pin.id });
                        }}
                      >
                        <Smartphone size={15} />{' '}
                        {pin.mobile ? 'Move on the mobile drawing' : 'Place on the mobile drawing'}
                      </button>
                      {pin.mobile && (
                        <button
                          className="text-button full centered"
                          onClick={() => update((p) => placeOnMobile(p, pin.id, null))}
                        >
                          Remove from mobile
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="text-button full centered"
                      onClick={() => switchLayout('mobile')}
                    >
                      <Smartphone size={14} /> Add a mobile drawing
                    </button>
                  )}
                </div>
                {pin.kind === 'link' ? (
                  <div className="inspector-section">
                    <div className="section-heading">
                      <span>LINK OUT</span>
                      <span>{pinUrl(pin) ? 'Address found' : 'No address yet'}</span>
                    </div>
                    <p className="field-help link-out">
                      <ExternalLink size={14} />
                      {pinUrl(pin) ? (
                        <span>
                          Opens{' '}
                          <a href={pinUrl(pin)!} target="_blank" rel="noreferrer">
                            {pinUrl(pin)}
                          </a>{' '}
                          in the browser. It leaves the app, so it needs no yarn.
                        </span>
                      ) : (
                        <span>
                          No web address in the description yet. Add one and this pin becomes the
                          exit.
                        </span>
                      )}
                    </p>
                  </div>
                ) : pin.kind === 'detail' ? (
                  <div className="inspector-section">
                    <label>
                      Detail sketch
                      <select
                        value={pin.detailTarget ?? ''}
                        onChange={(e) =>
                          update((p) => attachDetail(p, pin.id, e.target.value || null))
                        }
                      >
                        <option value="">Choose a sketch already on the board</option>
                        {project.screens
                          .filter((target) => target.id !== s.id)
                          .map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <p className="field-help">
                      A sketch with no app connections becomes a detail view. A screen already used
                      in your app keeps its existing role.
                    </p>
                    {pin.detailTarget && (
                      <div className="detail-thumbnail">
                        <img
                          src={assetUrl(
                            project.assets.find(
                              (a) =>
                                a.id ===
                                project.screens.find((target) => target.id === pin.detailTarget)
                                  ?.assetId,
                            ),
                          )}
                          alt={`Attached detail: ${project.screens.find((target) => target.id === pin.detailTarget)?.title}`}
                        />
                        <small>Reference only · no navigation step</small>
                      </div>
                    )}
                    <button className="button full" onClick={() => onConnect(pin.id)}>
                      <Link2 size={16} /> Choose detail on board
                    </button>
                  </div>
                ) : (
                  <div className="inspector-section">
                    <div className="section-heading">
                      <span>OUTGOING YARNS</span>
                      <span>{project.transitions.filter((t) => t.pinId === pin.id).length}</span>
                    </div>
                    {project.transitions
                      .filter((t) => t.pinId === pin.id)
                      .map((t) => (
                        <button className="connection-row" key={t.id} onClick={() => onEdge(t.id)}>
                          <span className={`thread-dot ${t.color}`} />
                          <span>
                            {t.summary || 'Unnamed connection'}
                            <small>
                              {t.target
                                ? project.screens.find((s) => s.id === t.target)?.title
                                : t.navigation === 'back'
                                  ? 'Previous screen'
                                  : 'Dialog caller'}
                            </small>
                          </span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    <button className="button full" onClick={() => onConnect(pin.id)}>
                      <Link2 size={15} /> Connect to a screen
                    </button>
                    <button className="text-button full centered" onClick={() => onHistory(pin.id)}>
                      <Undo2 size={14} /> Add Back / Dismiss action
                    </button>
                  </div>
                )}
                <div className="pin-actions">
                  <button
                    className="text-button"
                    onClick={() => {
                      setPlacing({ mode: 'move', pinId: pin.id });
                    }}
                  >
                    <Move size={14} /> Move pin
                  </button>
                  <button className="text-button delete-action" onClick={() => setRemove(pin.id)}>
                    <Trash2 size={14} /> Remove pin
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">THE BIG PICTURE</span>
                <h3>Screen details</h3>
                <label>
                  Paper title
                  <input
                    value={s.title}
                    maxLength={200}
                    onChange={(e) => editScreen({ title: e.target.value })}
                    placeholder="Give this screen a title"
                  />
                </label>
                <label>
                  What is this screen for?
                  <AutoTextarea
                    rows={4}
                    value={s.purpose}
                    onChange={(e) => editScreen({ purpose: e.target.value })}
                    placeholder="Its purpose, important states, and any data it needs…"
                  />
                </label>
                <label>
                  Screen type
                  <select
                    value={s.role}
                    onChange={(e) =>
                      editScreen({
                        role: e.target.value as Screen['role'],
                        ...(e.target.value === 'detail' ? { entry: false } : {}),
                      })
                    }
                  >
                    <option value="screen">Regular screen</option>
                    <option value="auth">Login / onboarding</option>
                    <option value="modal">Dialog / overlay</option>
                    <option value="terminal">Intentional ending</option>
                    <option
                      value="detail"
                      disabled={project.transitions.some(
                        (t) => t.target === s.id || pins.some((pin) => pin.id === t.pinId),
                      )}
                    >
                      Detail / enlarged sketch (not an app page)
                    </option>
                  </select>
                </label>
                {project.transitions.some(
                  (t) => t.target === s.id || pins.some((pin) => pin.id === t.pinId),
                ) && (
                  <p className="field-help">
                    This screen is part of your app flow. Remove its app connections before making
                    it a detail-only sketch.
                  </p>
                )}
                {s.role === 'terminal' && (
                  <p className="field-help">
                    Describe the intended ending above so the flow review understands it.
                  </p>
                )}
                <label className="check-row">
                  <input
                    type="checkbox"
                    disabled={s.role === 'detail'}
                    checked={s.entry}
                    onChange={(e) => editScreen({ entry: e.target.checked })}
                  />
                  <Flag size={15} />
                  <span>
                    Can start here<small>An entry point into your app</small>
                  </span>
                </label>
                <label>
                  Size on the board
                  <input
                    type="range"
                    min="160"
                    max="1000"
                    step="10"
                    value={project.layout[s.id]?.width ?? 300}
                    onChange={(e) =>
                      update(
                        (p) => ({
                          ...p,
                          layout: {
                            ...p.layout,
                            [s.id]: { ...p.layout[s.id], width: Number(e.target.value) },
                          },
                        }),
                        { group: `size:${s.id}` },
                      )
                    }
                  />
                </label>
                <div className="inspector-section">
                  <div className="section-heading">
                    <span>PINS</span>
                    <span>{pins.length}</span>
                  </div>
                  {pins.map((v, i) => (
                    <div className="pin-list-row" key={v.id}>
                      <button className="pin-row" onClick={() => setSelected(v.id)}>
                        <span style={{ background: colors[pinColor(v)], color: '#fffef8' }}>
                          {i + 1}
                        </span>
                        {v.title || 'Untitled interaction'}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${v.title || `pin ${i + 1}`}`}
                        title="Click, then click the new spot on the drawing"
                        onClick={() => {
                          setSelected(v.id);
                          setPlacing({ mode: 'move', pinId: v.id });
                        }}
                      >
                        <Move size={14} />
                      </button>
                      <button
                        className="icon-button delete-action"
                        aria-label={`Delete ${v.title || `pin ${i + 1}`}`}
                        onClick={() => setRemove(v.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="button full"
                    disabled={!asset}
                    onClick={() => {
                      switchLayout('web');
                      setSelected(null);
                      setPlacing({ mode: 'new' });
                    }}
                  >
                    <Plus size={15} /> Add a pin
                  </button>
                  {legend.length > 0 && (
                    <div className="color-legend">
                      {legend.map((c) => (
                        <span key={c}>
                          <i style={{ background: colors[c] }} /> {project.colorLabels![c]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="inspector-section">
                  <div className="section-heading">
                    <span>LAYOUTS</span>
                    <span>{mobileAsset ? 'Web + mobile' : asset ? 'Web' : 'None yet'}</span>
                  </div>
                  <label>
                    Web drawing
                    <select
                      value={s.assetId ?? ''}
                      onChange={(e) =>
                        update((p) => setDrawing(p, s.id, 'web', e.target.value || null))
                      }
                    >
                      {drawingOptions(
                        pins.length ? 'Pins are anchored to this drawing' : 'No drawing yet',
                        pins.length > 0,
                      )}
                    </select>
                  </label>
                  <label>
                    Mobile drawing
                    <select
                      value={s.mobileAssetId ?? ''}
                      onChange={(e) =>
                        update((p) => setDrawing(p, s.id, 'mobile', e.target.value || null))
                      }
                    >
                      {drawingOptions('None yet')}
                    </select>
                  </label>
                  <p className="field-help">
                    Both drawings show the same screen. Switch between them above the drawing. Pins
                    are placed on the web drawing first, then positioned on the mobile drawing.
                  </p>
                </div>
                <div className="inspector-section">
                  <div className="section-heading">
                    <span>PLANNED IDEAS</span>
                    <span>{ideas.length}</span>
                  </div>
                  {ideas.map((idea) => (
                    <div className={`idea-row ${idea.pinId ? 'placed' : ''}`} key={idea.id}>
                      <span>{idea.title}</span>
                      {idea.pinId ? (
                        <button className="text-button" onClick={() => setSelected(idea.pinId)}>
                          <Check size={13} /> Pin {pinIndex(idea.pinId)}
                        </button>
                      ) : (
                        <button
                          className="button small"
                          disabled={!asset}
                          title={asset ? undefined : 'Choose a drawing first'}
                          onClick={() => {
                            switchLayout('web');
                            setSelected(null);
                            setPlacing({ mode: 'idea', ideaId: idea.id });
                          }}
                        >
                          <MapPin size={13} /> Place
                        </button>
                      )}
                    </div>
                  ))}
                  <form
                    className="quick-idea"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quickIdea.trim()) return;
                      update((p) => ({
                        ...p,
                        ideas: [...p.ideas, newIdea({ title: quickIdea, screenId: s.id })],
                      }));
                      setQuickIdea('');
                    }}
                  >
                    <input
                      aria-label="Add an idea for this screen"
                      placeholder="Add an idea for this screen…"
                      maxLength={200}
                      value={quickIdea}
                      onChange={(e) => setQuickIdea(e.target.value)}
                    />
                    <button
                      className="button small"
                      type="submit"
                      disabled={!quickIdea.trim()}
                      aria-label="Add idea"
                    >
                      <Plus size={15} />
                    </button>
                  </form>
                </div>
                <button className="text-button delete-action" onClick={onDelete}>
                  <Trash2 size={14} /> Remove screen
                </button>
              </>
            )}
          </div>
          <ScrollHints target={inspectorRef} label="More settings" />
        </aside>
      </div>
      {removing && (
        <Confirm
          title={`Remove pin ${pinIndex(removing.id)}, “${removing.title || 'Untitled'}”?`}
          detail="Its outgoing yarns will be removed too. You can undo this on the board."
          onClose={() => setRemove(null)}
          onConfirm={() => {
            update((p) => removePin(p, removing.id));
            if (selected === removing.id) setSelected(null);
          }}
        />
      )}
    </Modal>
  );
}
