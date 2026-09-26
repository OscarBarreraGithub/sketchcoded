import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDownRight,
  ExternalLink,
  Flag,
  Focus,
  Home,
  Minus,
  Plus,
  Redo2,
  Smartphone,
  Undo2,
  X,
  MoveUpRight,
} from 'lucide-react';
import {
  assetUrl,
  colors,
  isHistory,
  codeOf,
  isLeftToAi,
  isPlanned,
  pinColor,
  screenSize,
  type Asset,
  type Project,
  type Screen,
} from '../../shared/model';
import type { Update } from '../useProject';
import { clampView, fitView, frameRects } from '../boardView';
import { TellAgent } from './TellAgent';
export function Board({
  project,
  update,
  onScreen,
  onEdge,
  onAdd,
  onAttachDrawing,
  onConnect,
  connecting,
  onCancelConnect,
  undo,
  redo,
  canUndo,
  canRedo,
  fitSignal,
  focusRequest,
  onFocusHandled,
}: {
  project: Project;
  update: Update;
  onScreen: (id: string, pin?: string) => void;
  onEdge: (id: string) => void;
  onAdd: (a: Asset, pos: { x: number; y: number }) => void;
  onAttachDrawing: (screenId: string, a: Asset) => void;
  onConnect: (pinId: string, target: string) => void;
  connecting: string | null;
  onCancelConnect: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  fitSignal: number;
  focusRequest: { id: string; nonce: number } | null;
  onFocusHandled: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [view, setView] = useState(project.viewport),
    viewRef = useRef(view),
    [moving, setMoving] = useState<{ id: string; x: number; y: number } | null>(null),
    [resizing, setResizing] = useState<{ id: string; width: number } | null>(null),
    [space, setSpace] = useState(false);
  viewRef.current = view;
  const drag = useRef<{
    type: 'pan' | 'screen' | 'resize';
    id?: string;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
  } | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;
  // Rule (2026-09-26): the board never pans out of sight of its content. Every view change, from a
  // drag, the wheel, the zoom controls or a window resize, is clamped so part of a frame stays on
  // the board.
  const clamp = (next: typeof view) =>
    ref.current
      ? clampView(next, frameRects(projectRef.current), {
          width: ref.current.clientWidth,
          height: ref.current.clientHeight,
        })
      : next;
  const commitView = (raw: typeof view) => {
    const next = clamp(raw);
    viewRef.current = next;
    setView(next);
    update((p) => ({ ...p, viewport: next }), { history: false, quiet: true });
  };
  // Automatic clamps only move the view on screen; the next pan or zoom by the user persists it.
  // Writing here would race an agent's write with a stale revision the moment the board opens.
  const keepContentInView = () => {
    const next = clamp(viewRef.current);
    if (Math.abs(next.x - viewRef.current.x) > 0.5 || Math.abs(next.y - viewRef.current.y) > 0.5) {
      viewRef.current = next;
      setView(next);
    }
  };
  const keepRef = useRef(keepContentInView);
  keepRef.current = keepContentInView;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    keepRef.current();
    const sizes = new ResizeObserver(() => keepRef.current());
    sizes.observe(el);
    return () => sizes.disconnect();
  }, []);
  useEffect(() => {
    keepRef.current();
  }, [project.screens, project.layout, project.assets]);
  const fit = () => {
    if (!ref.current) return;
    commitView(
      fitView(frameRects(projectRef.current), {
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      }),
    );
  };
  const lastFit = useRef(fitSignal);
  useEffect(() => {
    if (lastFit.current !== fitSignal) {
      lastFit.current = fitSignal;
      fit();
    }
  }, [fitSignal]);
  useEffect(() => {
    if (!focusRequest || !ref.current) return;
    const p = projectRef.current,
      s = p.screens.find((s) => s.id === focusRequest.id);
    if (!s) return;
    const pos = p.layout[s.id],
      size = screenSize(p, s),
      w = ref.current.clientWidth,
      h = ref.current.clientHeight;
    if (!pos) return;
    const z = Math.max(0.15, Math.min(1.2, (w - 100) / size.width, (h - 150) / size.height));
    commitView({
      x: w / 2 - (pos.x + size.width / 2) * z,
      y: (h - 60) / 2 - (pos.y + size.height / 2) * z,
      zoom: z,
    });
    onFocusHandled();
  }, [focusRequest]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest('input,textarea,select,dialog') || e.target.isContentEditable)
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpace(true);
      }
      if (e.key === 'Escape') onCancelConnect();
      if (e.key.toLowerCase() === 'f') fit();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpace(false);
    };
    const blur = () => setSpace(false);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  });
  const zoom = (factor: number, point?: { x: number; y: number }) => {
    const old = viewRef.current,
      rect = ref.current!.getBoundingClientRect(),
      anchor = point ?? { x: rect.width / 2, y: rect.height / 2 };
    const z = Math.max(0.15, Math.min(3, old.zoom * factor));
    commitView({
      zoom: z,
      x: anchor.x - ((anchor.x - old.x) * z) / old.zoom,
      y: anchor.y - ((anchor.y - old.y) * z) / old.zoom,
    });
  };
  useEffect(() => {
    const el = ref.current!;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('.board-controls')) return;
      e.preventDefault();
      if (!e.shiftKey) {
        const r = el.getBoundingClientRect();
        zoom(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.03 : 0.002)), {
          x: e.clientX - r.left,
          y: e.clientY - r.top,
        });
      } else {
        const old = viewRef.current;
        commitView({ ...old, x: old.x - e.deltaX, y: old.y - e.deltaY });
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  const position = (s: Screen) => {
    const base = project.layout[s.id] ?? { x: 0, y: 0, width: 300 };
    if (moving?.id === s.id) return { ...base, x: moving.x, y: moving.y };
    if (resizing?.id === s.id) return { ...base, width: resizing.width };
    return base;
  };
  // Drag a frame's corner to resize it; the slider in the editor does the same.
  const startResize = (e: ReactPointerEvent, s: Screen) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current = {
      type: 'resize',
      id: s.id,
      clientX: e.clientX,
      clientY: e.clientY,
      startX: position(s).width,
      startY: 0,
      dx: 0,
      dy: 0,
    };
    ref.current!.setPointerCapture(e.pointerId);
  };
  const start = (e: ReactPointerEvent, type: 'pan' | 'screen', s?: Screen) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    if (type === 'screen' && connecting && s) {
      onConnect(connecting, s.id);
      return;
    }
    const actual = space || e.button === 1 ? 'pan' : type;
    const pos = actual === 'pan' ? view : position(s!);
    drag.current = {
      type: actual,
      id: s?.id,
      clientX: e.clientX,
      clientY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      dx: 0,
      dy: 0,
    };
    ref.current!.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.dx = e.clientX - d.clientX;
    d.dy = e.clientY - d.clientY;
    if (d.type === 'pan') {
      setView(clamp({ ...viewRef.current, x: d.startX + d.dx, y: d.startY + d.dy }));
    } else if (d.type === 'resize')
      setResizing({
        id: d.id!,
        width: Math.max(160, Math.min(1000, Math.round((d.startX + d.dx / view.zoom) / 10) * 10)),
      });
    else setMoving({ id: d.id!, x: d.startX + d.dx / view.zoom, y: d.startY + d.dy / view.zoom });
  };
  const finish = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.type === 'pan') commitView(viewRef.current);
    else if (d.type === 'resize') {
      const width = resizing?.width;
      if (width && width !== project.layout[d.id!]?.width)
        update((p) => ({ ...p, layout: { ...p.layout, [d.id!]: { ...p.layout[d.id!], width } } }), {
          group: `size:${d.id}`,
        });
      setResizing(null);
    } else if (Math.hypot(d.dx, d.dy) < 4) onScreen(d.id!);
    else
      update((p) => ({
        ...p,
        layout: {
          ...p.layout,
          [d.id!]: {
            ...p.layout[d.id!],
            x: d.startX + d.dx / view.zoom,
            y: d.startY + d.dy / view.zoom,
          },
        },
      }));
    setMoving(null);
  };
  const points = (pinId: string, targetId: string, edgeId: string) => {
    const pin = project.pins.find((pin) => pin.id === pinId),
      source = project.screens.find((s) => s.id === pin?.screenId),
      target = project.screens.find((s) => s.id === targetId);
    if (!pin || !source || !target) return null;
    const a = position(source),
      b = position(target),
      asset = project.assets.find((a) => a.id === source.assetId);
    const imageHeight = asset ? ((a.width - 24) * asset.height) / asset.width : 200;
    const x1 = a.x + 12 + pin.x * (a.width - 24),
      y1 = a.y + 30 + pin.y * imageHeight;
    const x2 = b.x + b.width * 0.5,
      y2 = b.y + 8;
    const parallelIndex = project.transitions
      .filter((t) => t.pinId === pinId && t.target === targetId && !isHistory(t))
      .findIndex((t) => t.id === edgeId);
    const bend = Math.max(50, Math.abs(x2 - x1) * 0.22) + Math.max(0, parallelIndex) * 52,
      cy1 = y1 + bend,
      cy2 = y2 + bend;
    return {
      d: `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.3} ${cy1}, ${x2 - (x2 - x1) * 0.2} ${cy2}, ${x2} ${y2}`,
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2 + bend * 0.75,
    };
  };
  return (
    <main
      ref={ref}
      className={`board ${space ? 'hand-mode' : ''} ${connecting ? 'connecting' : ''} ${view.zoom < 0.4 ? 'zoomed-out' : ''}`}
      style={{ '--board-zoom': view.zoom } as CSSProperties}
      aria-label="Design board"
      onPointerDown={(e) => {
        if (
          !(e.target as HTMLElement).closest(
            'button,input,.screen-card,.yarn-hit,.yarn-label,.board-controls',
          )
        )
          start(e, 'pan');
      }}
      onPointerMove={onMove}
      onPointerUp={finish}
      onPointerCancel={() => {
        drag.current = null;
        setMoving(null);
        setResizing(null);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/drawcode-asset')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        const a = project.assets.find(
          (a) => a.id === e.dataTransfer.getData('application/drawcode-asset'),
        );
        if (a) {
          e.preventDefault();
          const frame = (e.target as HTMLElement).closest<HTMLElement>('.screen-card')?.dataset
              .screen,
            planned = project.screens.find((s) => s.id === frame && isPlanned(s));
          if (planned) {
            onAttachDrawing(planned.id, a);
            return;
          }
          const rect = ref.current!.getBoundingClientRect();
          onAdd(a, {
            x: (e.clientX - rect.left - view.x) / view.zoom - 150,
            y: (e.clientY - rect.top - view.y) / view.zoom - 70,
          });
        }
      }}
    >
      <div className="board-grain" />
      {connecting && (
        <div className="connection-banner">
          <span className="mini-pin" />{' '}
          {project.pins.find((pin) => pin.id === connecting)?.kind === 'detail'
            ? 'Choose a sketch for this closer look'
            : 'Choose a screen to tie this yarn to'}{' '}
          <button className="icon-button" onClick={onCancelConnect} aria-label="Cancel connection">
            <X size={16} />
          </button>
        </div>
      )}
      <div
        className="board-world"
        style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.zoom})` }}
      >
        {project.screens.map((s, index) => {
          const a = project.assets.find((a) => a.id === s.assetId),
            mobile = project.assets.find((a) => a.id === s.mobileAssetId),
            ideas = project.ideas.filter((idea) => idea.screenId === s.id && !idea.pinId),
            pos = position(s),
            pins = project.pins.filter((pin) => pin.screenId === s.id);
          return (
            <article
              key={s.id}
              data-screen={s.id}
              className={`screen-card ${moving?.id === s.id ? 'moving' : ''} ${isPlanned(s) ? 'planned' : ''}`}
              style={
                {
                  left: pos.x,
                  top: pos.y,
                  width: pos.width,
                  '--tilt': `${[-1.3, 0.8, -0.6, 1.5][index % 4]}deg`,
                } as CSSProperties
              }
              onPointerDown={(e) => start(e, 'screen', s)}
              aria-label={`Screen: ${s.title}`}
            >
              <div className="card-paper">
                <span className={`tack tack-${index % 3}`} />
                {s.entry && (
                  <span className="home-marker" title="The app starts here">
                    <Home size={13} />
                  </span>
                )}
                {isLeftToAi(s) && (
                  <span className="post-it" title="A standard page, generated from the plan">
                    Leave it up to the AI
                  </span>
                )}
                <div className="card-image">
                  {a ? (
                    <img src={assetUrl(a)} alt={s.title} draggable={false} />
                  ) : isLeftToAi(s) ? (
                    <div className="frame-planned left-to-ai">
                      <span className="eyebrow">LEFT TO THE AI</span>
                      <strong>
                        {ideas.length
                          ? `A standard page with ${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}`
                          : 'A standard page'}
                      </strong>
                      <small>No drawing needed · open to see the ideas</small>
                    </div>
                  ) : isPlanned(s) ? (
                    <div className="frame-planned">
                      <span className="eyebrow">WAITING FOR A DRAWING</span>
                      <strong>
                        {ideas.length
                          ? `${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'} planned`
                          : 'Nothing planned yet'}
                      </strong>
                      <small>Drop a sketch here · open to see the ideas</small>
                    </div>
                  ) : (
                    <div className="image-missing">Image missing</div>
                  )}
                  {mobile && (
                    <img
                      className="mobile-thumb"
                      src={assetUrl(mobile)}
                      alt={`${s.title} on mobile`}
                      draggable={false}
                    />
                  )}
                  {pins.map((pin, i) => (
                    <button
                      className={`board-pin ${pinColor(pin)} ${pin.kind === 'detail' ? 'reference-pin' : ''} ${pin.kind === 'link' ? 'link-pin' : ''} ${connecting === pin.id ? 'selected' : ''}`}
                      key={pin.id}
                      style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                      title={`${pin.title} — ${pin.kind === 'detail' ? 'choose a detail sketch' : pin.kind === 'link' ? 'links out; click to edit' : 'click to connect'}`}
                      aria-label={
                        pin.kind === 'link' ? `Edit link ${pin.title}` : `Connect ${pin.title}`
                      }
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pin.kind === 'link') onScreen(s.id, pin.id);
                        else onConnect(pin.id, '');
                      }}
                    >
                      <span>
                        {pin.kind === 'detail' ? (
                          <Focus size={14} />
                        ) : pin.kind === 'link' ? (
                          <ExternalLink size={13} />
                        ) : (
                          i + 1
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="card-footer">
                  <span>
                    <b className="item-code">{codeOf(s)}</b> ·{' '}
                    {s.role === 'detail'
                      ? 'DETAIL REFERENCE'
                      : s.role === 'auth'
                        ? 'AUTHENTICATION'
                        : s.role === 'modal'
                          ? 'DIALOG'
                          : s.role === 'terminal'
                            ? 'ENDING'
                            : 'SCREEN'}
                    {mobile && (
                      <i className="layout-flag" title="Has a mobile layout">
                        <Smartphone size={11} />
                      </i>
                    )}
                  </span>
                  <span className="card-agent" onPointerDown={(e) => e.stopPropagation()}>
                    <TellAgent
                      project={project}
                      context={{ view: 'screen-editor', screen: s.id }}
                      label=""
                      title={`Tell the agent about ${s.title}`}
                      className="icon-button"
                    />
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${s.title}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => (connecting ? onConnect(connecting, s.id) : onScreen(s.id))}
                  >
                    <MoveUpRight size={14} />
                  </button>
                </div>
                <button
                  className="resize-handle"
                  aria-label={`Resize ${s.title}`}
                  title="Drag to resize"
                  onPointerDown={(e) => startResize(e, s)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                className="paper-title"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => (connecting ? onConnect(connecting, s.id) : onScreen(s.id))}
              >
                {s.title}
                {s.entry && <Flag size={14} />}
              </button>
            </article>
          );
        })}
        <svg className="yarn-hit-layer" aria-hidden="true" width="1" height="1">
          {project.transitions
            .filter((t) => !isHistory(t) && t.target)
            .map((t) => {
              const p = points(t.pinId, t.target!, t.id);
              return p ? (
                <path key={t.id} d={p.d} className="yarn-hit" onClick={() => onEdge(t.id)} />
              ) : null;
            })}
          {project.pins
            .filter((pin) => pin.kind === 'detail' && pin.detailTarget)
            .map((pin) => {
              const p = points(pin.id, pin.detailTarget!, pin.id);
              return p ? (
                <path
                  key={pin.id}
                  d={p.d}
                  className="yarn-hit"
                  onClick={() => onScreen(pin.screenId, pin.id)}
                />
              ) : null;
            })}
        </svg>
        <svg className="yarn-layer" aria-hidden="true" width="1" height="1">
          <defs>
            {Object.entries(colors).map(([name, color]) => (
              <marker
                key={name}
                id={`arrow-${name}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>
          {project.pins
            .filter((pin) => pin.kind === 'detail' && pin.detailTarget)
            .map((pin) => {
              const p = points(pin.id, pin.detailTarget!, pin.id);
              return p ? (
                <g key={pin.id}>
                  <path d={p.d} className="detail-thread" />
                </g>
              ) : null;
            })}
          {project.transitions
            .filter((t) => !isHistory(t) && t.target)
            .map((t) => {
              const p = points(t.pinId, t.target!, t.id);
              return p ? (
                <g key={t.id}>
                  <path d={p.d} className="yarn-shadow" />
                  <path
                    d={p.d}
                    className="yarn"
                    stroke={colors[t.color]}
                    markerEnd={`url(#arrow-${t.color})`}
                  />
                  <path d={p.d} className="yarn-strand" />
                </g>
              ) : null;
            })}
        </svg>
        {project.transitions
          .filter((t) => !isHistory(t) && t.target)
          .map((t) => {
            const p = points(t.pinId, t.target!, t.id);
            return p ? (
              <button
                key={t.id}
                className="yarn-label-button"
                style={{ left: p.x, top: p.y }}
                aria-label={`Edit connection: ${t.summary}`}
                onClick={() => onEdge(t.id)}
              >
                {t.summary || 'Add a condition'}
              </button>
            ) : null;
          })}
        {project.screens.map((s) => {
          const history = project.transitions.filter(
              (t) =>
                isHistory(t) && project.pins.find((pin) => pin.id === t.pinId)?.screenId === s.id,
            ),
            pos = position(s),
            size = screenSize(project, s);
          return history.map((t, i) => (
            <button
              key={t.id}
              className="history-tag"
              style={{ left: pos.x + 15, top: pos.y + size.height + 12 + i * 31 }}
              onClick={() => onEdge(t.id)}
            >
              ↶ {t.summary || t.navigation}
            </button>
          ));
        })}
      </div>
      {!project.screens.length && (
        <div className="board-empty">
          <div className="empty-stack">
            <span />
            <span />
            <Plus size={30} />
          </div>
          <h2>What are you imagining?</h2>
          <p>
            Bring a sketch onto the board.
            <br />
            Give it a name. See where it takes you.
          </p>
          <span className="handwritten">
            start with a sketch <ArrowDownRight size={24} />
          </span>
        </div>
      )}
      <div className="board-controls">
        <div className="control-group">
          <button className="icon-button" onClick={undo} disabled={!canUndo} aria-label="Undo">
            <Undo2 size={17} />
          </button>
          <button className="icon-button" onClick={redo} disabled={!canRedo} aria-label="Redo">
            <Redo2 size={17} />
          </button>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <button className="icon-button" onClick={() => zoom(1 / 1.2)} aria-label="Zoom out">
            <Minus size={17} />
          </button>
          <input
            className="zoom-slider"
            type="range"
            aria-label="Board zoom"
            min="15"
            max="300"
            value={Math.round(view.zoom * 100)}
            onChange={(e) => zoom(Number(e.target.value) / 100 / viewRef.current.zoom)}
          />
          <button className="zoom-value" title="Reset to 100%" onClick={() => zoom(1 / view.zoom)}>
            {Math.round(view.zoom * 100)}%
          </button>
          <button className="icon-button" onClick={() => zoom(1.2)} aria-label="Zoom in">
            <Plus size={17} />
          </button>
          <button className="icon-button" onClick={fit} aria-label="Fit board">
            <Focus size={18} />
          </button>
        </div>
      </div>
      <div className="board-help">
        <span>Drag to arrange</span>
        <i /> <span>Drag blank space to pan</span>
        <i /> <span>Scroll to zoom · Shift + scroll to pan</span>
      </div>
      <div className="board-legend">
        <span className="legend-line" /> A thread of an idea
        {view.zoom < 0.4 && <span className="legend-note">Zoom in for pins and labels</span>}
      </div>
    </main>
  );
}
