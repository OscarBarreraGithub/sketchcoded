import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDownRight,
  Flag,
  Focus,
  Hand,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Undo2,
  X,
  MoveUpRight,
} from 'lucide-react';
import {
  assetUrl,
  colors,
  isHistory,
  screenSize,
  type Asset,
  type Project,
  type Screen,
} from '../../shared/model';
import type { Update } from '../useProject';
export function Board({
  project,
  update,
  onScreen,
  onEdge,
  onAdd,
  onConnect,
  connecting,
  onCancelConnect,
  undo,
  redo,
  canUndo,
  canRedo,
  fitSignal,
}: {
  project: Project;
  update: Update;
  onScreen: (id: string) => void;
  onEdge: (id: string) => void;
  onAdd: (a: Asset, pos: { x: number; y: number }) => void;
  onConnect: (pinId: string, target: string) => void;
  connecting: string | null;
  onCancelConnect: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  fitSignal: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [view, setView] = useState(project.viewport),
    viewRef = useRef(view),
    [moving, setMoving] = useState<{ id: string; x: number; y: number } | null>(null),
    [hand, setHand] = useState(false),
    [space, setSpace] = useState(false);
  viewRef.current = view;
  const drag = useRef<{
    type: 'pan' | 'screen';
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
  const commitView = (next: typeof view) => {
    viewRef.current = next;
    setView(next);
    update((p) => ({ ...p, viewport: next }), { history: false });
  };
  const fit = () => {
    if (!ref.current) return;
    const p = projectRef.current;
    if (!p.screens.length) {
      commitView({ x: 70, y: 70, zoom: 0.85 });
      return;
    }
    const positions = p.screens.map((s) => {
      const pos = p.layout[s.id] ?? { x: 0, y: 0, width: 300 };
      return { ...pos, ...screenSize(p, s) };
    });
    const minX = Math.min(...positions.map((s) => s.x)),
      minY = Math.min(...positions.map((s) => s.y)) - 35;
    const maxX = Math.max(...positions.map((s) => s.x + s.width)),
      maxY = Math.max(...positions.map((s) => s.y + s.height)) + 20;
    const w = ref.current.clientWidth,
      h = ref.current.clientHeight;
    const z = Math.max(0.15, Math.min(1, (w - 110) / (maxX - minX), (h - 160) / (maxY - minY)));
    commitView({
      x: (w - (maxX - minX) * z) / 2 - minX * z,
      y: (h - 70 - (maxY - minY) * z) / 2 - minY * z,
      zoom: z,
    });
  };
  useEffect(() => {
    if (fitSignal > 0) fit();
  }, [fitSignal]);
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
      if ((e.target as HTMLElement).closest('.board-controls')) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        zoom(Math.exp(-e.deltaY * 0.008), { x: e.clientX - r.left, y: e.clientY - r.top });
      } else {
        const old = viewRef.current;
        commitView({ ...old, x: old.x - e.deltaX, y: old.y - e.deltaY });
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  const position = (s: Screen) =>
    moving?.id === s.id
      ? { ...project.layout[s.id], x: moving.x, y: moving.y }
      : (project.layout[s.id] ?? { x: 0, y: 0, width: 300 });
  const start = (e: ReactPointerEvent, type: 'pan' | 'screen', s?: Screen) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    if (type === 'screen' && connecting && s) {
      onConnect(connecting, s.id);
      return;
    }
    const actual = hand || space || e.button === 1 ? 'pan' : type;
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
      setView({ ...viewRef.current, x: d.startX + d.dx, y: d.startY + d.dy });
    } else setMoving({ id: d.id!, x: d.startX + d.dx / view.zoom, y: d.startY + d.dy / view.zoom });
  };
  const finish = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.type === 'pan') commitView(viewRef.current);
    else if (Math.hypot(d.dx, d.dy) < 4) onScreen(d.id!);
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
      className={`board ${hand || space ? 'hand-mode' : ''} ${connecting ? 'connecting' : ''}`}
      aria-label="Design board"
      onPointerDown={(e) => {
        if (
          !(e.target as HTMLElement).closest(
            'button,.screen-card,.yarn-hit,.yarn-label,.board-controls',
          )
        )
          start(e, 'pan');
      }}
      onPointerMove={onMove}
      onPointerUp={finish}
      onPointerCancel={() => {
        drag.current = null;
        setMoving(null);
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
          const rect = ref.current!.getBoundingClientRect();
          onAdd(a, {
            x: (e.clientX - rect.left - view.x) / view.zoom - 150,
            y: (e.clientY - rect.top - view.y) / view.zoom - 70,
          });
        }
      }}
    >
      <div className="board-grain" />
      <div className="board-top-note">
        <span className="tiny-star">✳</span> A little space for your next big idea.
      </div>
      {connecting && (
        <div className="connection-banner">
          <span className="mini-pin" /> Choose a screen to tie this yarn to{' '}
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
            pos = position(s),
            pins = project.pins.filter((pin) => pin.screenId === s.id);
          return (
            <article
              key={s.id}
              className={`screen-card ${moving?.id === s.id ? 'moving' : ''}`}
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
                <div className="card-image">
                  {a ? (
                    <img src={assetUrl(a)} alt={s.title} draggable={false} />
                  ) : (
                    <div className="image-missing">Image missing</div>
                  )}
                  {pins.map((pin, i) => (
                    <button
                      className={`board-pin ${connecting === pin.id ? 'selected' : ''}`}
                      key={pin.id}
                      style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                      title={`${pin.title} — click to connect`}
                      aria-label={`Connect ${pin.title}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onConnect(pin.id, '');
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="card-footer">
                  <span>
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {s.role === 'auth'
                      ? 'AUTHENTICATION'
                      : s.role === 'modal'
                        ? 'DIALOG'
                        : s.role === 'terminal'
                          ? 'ENDING'
                          : 'SCREEN'}
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
                  <path d={p.d} className="yarn-hit" onClick={() => onEdge(t.id)} />
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
          <button
            className={`icon-button ${!hand ? 'active' : ''}`}
            onClick={() => setHand(false)}
            aria-label="Select tool"
          >
            <MousePointer2 size={18} />
          </button>
          <button
            className={`icon-button ${hand ? 'active' : ''}`}
            onClick={() => setHand(true)}
            aria-label="Pan tool"
          >
            <Hand size={18} />
          </button>
        </div>
        <span className="control-divider" />
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
        <i /> <span>Space to pan</span>
        <i /> <span>⌘ / Ctrl + scroll to zoom</span>
      </div>
      <div className="board-legend">
        <span className="legend-line" /> A thread of an idea
      </div>
    </main>
  );
}
