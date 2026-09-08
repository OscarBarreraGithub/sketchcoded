import { useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Flag, Link2, MapPin, Plus, Trash2, Undo2 } from 'lucide-react';
import { assetUrl, removePin, uid, type Pin, type Project, type Screen } from '../../shared/model';
import type { Update } from '../useProject';
import { Modal, Confirm } from './Modal';
export function ScreenEditor({
  project,
  screenId,
  initialPin,
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
  update: Update;
  onClose: () => void;
  onConnect: (id: string) => void;
  onEdge: (id: string) => void;
  onHistory: (pinId: string) => void;
  onDelete: () => void;
}) {
  const s = project.screens.find((s) => s.id === screenId)!;
  const asset = project.assets.find((a) => a.id === s.assetId),
    pins = project.pins.filter((pin) => pin.screenId === s.id);
  const [selected, setSelected] = useState<string | null>(initialPin ?? null),
    [placing, setPlacing] = useState(false),
    [remove, setRemove] = useState(false);
  const pin = pins.find((pin) => pin.id === selected),
    imageRef = useRef<HTMLDivElement>(null),
    drag = useRef<string | null>(null);
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
  const point = (x: number, y: number) => {
    const r = imageRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (x - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (y - r.top) / r.height)),
    };
  };
  return (
    <Modal title={s.title || 'Untitled screen'} onClose={onClose} className="screen-modal">
      <div className="screen-editor">
        <div className="screen-workspace">
          <div className="editor-toolbar">
            <button className="text-button" onClick={onClose}>
              <ArrowLeft size={15} /> Back to board
            </button>
            <button
              className={`button small ${placing ? 'primary' : ''}`}
              onClick={() => {
                setPlacing(!placing);
                setSelected(null);
              }}
            >
              <MapPin size={15} />
              {placing ? 'Click the sketch to place' : 'Add an interaction pin'}
            </button>
          </div>
          <div className={`sketch-stage ${placing ? 'placing' : ''}`}>
            <div
              className="editable-image"
              ref={imageRef}
              style={{
                aspectRatio: asset ? `${asset.width}/${asset.height}` : '1',
                maxWidth: asset ? `min(100%, calc(58vh * ${asset.width / asset.height}))` : '100%',
              }}
              onClick={(e) => {
                if (!placing) return;
                const pos = point(e.clientX, e.clientY),
                  id = uid();
                update((p) => ({
                  ...p,
                  pins: [...p.pins, { id, screenId: s.id, ...pos, title: '', description: '' }],
                }));
                setSelected(id);
                setPlacing(false);
              }}
            >
              {asset ? (
                <img src={assetUrl(asset)} alt={s.title} draggable={false} />
              ) : (
                <div className="image-missing">Image missing from this project</div>
              )}
              {pins.map((v, i) => (
                <button
                  className={`editor-pin ${v.id === selected ? 'selected' : ''}`}
                  key={v.id}
                  style={{ left: `${v.x * 100}%`, top: `${v.y * 100}%` }}
                  aria-label={`Pin ${i + 1}: ${v.title || 'Untitled interaction'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(v.id);
                    setPlacing(false);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    drag.current = v.id;
                    setSelected(v.id);
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (drag.current !== v.id) return;
                    const pos = point(e.clientX, e.clientY);
                    update(
                      (p) => ({
                        ...p,
                        pins: p.pins.map((pin) => (pin.id === v.id ? { ...pin, ...pos } : pin)),
                      }),
                      { group: `move-pin:${v.id}` },
                    );
                  }}
                  onPointerUp={() => {
                    drag.current = null;
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="sketch-caption">
            <MapPin size={14} />
            {placing
              ? 'Place a pin on the part of the sketch that does something.'
              : 'Click a pin to describe it. Drag it to fine-tune its position.'}
            <span>
              {asset?.width} × {asset?.height}
            </span>
          </div>
        </div>
        <aside className="editor-inspector">
          {pin ? (
            <>
              <button className="text-button inspector-back" onClick={() => setSelected(null)}>
                <ArrowLeft size={14} /> Screen details
              </button>
              <div className="inspector-title">
                <span className="pin-swatch">
                  <MapPin size={18} />
                </span>
                <div>
                  <span className="eyebrow">INTERACTION {pins.indexOf(pin) + 1}</span>
                  <h3>What happens here?</h3>
                </div>
              </div>
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
                <textarea
                  rows={5}
                  value={pin.description}
                  placeholder="Describe this part of the screen and what a click should do…"
                  onChange={(e) => editPin({ description: e.target.value })}
                />
              </label>
              <p className="field-help">
                Think in intentions. The detailed rules live on each yarn.
              </p>
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
              <button className="text-button delete-action" onClick={() => setRemove(true)}>
                <Trash2 size={14} /> Remove pin
              </button>
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
                <textarea
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
                  onChange={(e) => editScreen({ role: e.target.value as Screen['role'] })}
                >
                  <option value="screen">Regular screen</option>
                  <option value="auth">Login / onboarding</option>
                  <option value="modal">Dialog / overlay</option>
                  <option value="terminal">Intentional ending</option>
                </select>
              </label>
              {s.role === 'terminal' && (
                <p className="field-help">
                  Describe the intended ending above so the flow review understands it.
                </p>
              )}
              <label className="check-row">
                <input
                  type="checkbox"
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
                  max="700"
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
                  <span>INTERACTIONS</span>
                  <span>{pins.length}</span>
                </div>
                {pins.map((p, i) => (
                  <button className="pin-row" key={p.id} onClick={() => setSelected(p.id)}>
                    <span>{i + 1}</span>
                    {p.title || 'Untitled interaction'}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
                <button className="button full" onClick={() => setPlacing(true)}>
                  <Plus size={15} /> Add a pin
                </button>
              </div>
              <button className="text-button delete-action" onClick={onDelete}>
                <Trash2 size={14} /> Remove screen
              </button>
            </>
          )}
        </aside>
      </div>
      {remove && pin && (
        <Confirm
          title="Remove this pin?"
          detail="Its outgoing yarns will be removed too. You can undo this on the board."
          onClose={() => setRemove(false)}
          onConfirm={() => {
            update((p) => removePin(p, pin.id));
            setSelected(null);
          }}
        />
      )}
    </Modal>
  );
}
