import { AutoTextarea } from './AutoTextarea';
import { useState } from 'react';
import { ArrowRight, Link2, Trash2 } from 'lucide-react';
import { colors, isHistory, type Project, type Transition, codeOf } from '../../shared/model';
import { Modal } from './Modal';
import { TellAgent } from './TellAgent';
export function EdgeEditor({
  project,
  edge,
  onSave,
  onClose,
  onDelete,
  isNew,
}: {
  project: Project;
  edge: Transition;
  onSave: (edge: Transition) => void;
  onClose: () => void;
  onDelete: () => void;
  isNew: boolean;
}) {
  const [draft, setDraft] = useState(edge),
    set = (patch: Partial<Transition>) => setDraft((d) => ({ ...d, ...patch }));
  const source = project.screens.find(
    (s) => s.id === project.pins.find((p) => p.id === draft.pinId)?.screenId,
  );
  return (
    <Modal
      title={isNew ? 'Tie an idea together' : 'Follow this thread'}
      onClose={onClose}
      className="edge-modal"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...draft,
            summary: draft.summary.trim(),
            target: isHistory(draft) ? null : draft.target,
          });
        }}
      >
        <div className="edge-route">
          <span className="route-screen">
            {source ? `${codeOf(source)} ${source.title}` : 'Choose a source'}
          </span>
          <span className="route-yarn">
            <Link2 size={19} />
            <ArrowRight size={16} />
          </span>
          <span className="route-screen">
            {isHistory(draft)
              ? draft.navigation === 'back'
                ? 'Previous screen'
                : 'Dialog caller'
              : project.screens.find((s) => s.id === draft.target)?.title || 'Choose destination'}
          </span>
        </div>
        <div className="form-columns">
          <label>
            From interaction
            <select value={draft.pinId} onChange={(e) => set({ pinId: e.target.value })}>
              {project.pins
                .filter(
                  (p) =>
                    p.kind !== 'detail' &&
                    project.screens.find((s) => s.id === p.screenId)?.role !== 'detail',
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {project.screens.find((s) => s.id === p.screenId)?.title} /{' '}
                    {p.title || 'Untitled pin'}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Navigation
            <select
              value={draft.navigation}
              onChange={(e) => {
                const navigation = e.target.value as Transition['navigation'];
                set({
                  navigation,
                  target:
                    navigation === 'back' || navigation === 'dismiss'
                      ? null
                      : (draft.target ??
                        project.screens.find((s) => s.role !== 'detail')?.id ??
                        null),
                });
              }}
            >
              <option value="push">Open screen (keep history)</option>
              <option value="replace">Replace current screen</option>
              <option value="reset">Start fresh (clear history)</option>
              <option value="modal">Open as dialog</option>
              <option value="back">Go back in app history</option>
              <option value="dismiss">Dismiss to dialog caller</option>
            </select>
          </label>
        </div>
        {!isHistory(draft) && (
          <label>
            Destination screen
            <select
              required
              value={draft.target ?? ''}
              onChange={(e) => set({ target: e.target.value })}
            >
              <option value="" disabled>
                Choose a screen
              </option>
              {project.screens
                .filter((s) => s.role !== 'detail')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Short version <span className="required">REQUIRED</span>
          <input
            autoFocus
            required
            maxLength={300}
            value={draft.summary}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder="e.g. This person is blocked"
          />
        </label>
        <p className="field-help">
          The label on your yarn, and the option you’ll choose in the demo.
        </p>
        <label>
          When does this happen?
          <AutoTextarea
            rows={2}
            value={draft.condition}
            onChange={(e) => set({ condition: e.target.value })}
            placeholder="When the selected conversation is blocked…"
          />
        </label>
        <label>
          The details
          <AutoTextarea
            rows={4}
            value={draft.logic}
            onChange={(e) => set({ logic: e.target.value })}
            placeholder="Describe the behavior, exceptions, loading and error states, and anything the implementation should know."
          />
        </label>
        <label>
          What data or information is needed?
          <AutoTextarea
            value={draft.context}
            onChange={(e) => set({ context: e.target.value })}
            placeholder="e.g. The selected person, their conversation ID, and which screen to return to"
          />
        </label>
        <div className="edge-options">
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.fallback}
              onChange={(e) => set({ fallback: e.target.checked })}
            />
            <span>
              Fallback branch<small>Use when no other condition matches</small>
            </span>
          </label>
          <fieldset className="color-picker">
            <legend>Yarn color</legend>
            {Object.entries(colors).map(([name, color]) => (
              <button
                type="button"
                className={draft.color === name ? 'chosen' : ''}
                key={name}
                style={{ background: color }}
                aria-label={`${name} yarn`}
                aria-pressed={draft.color === name}
                onClick={() => set({ color: name as Transition['color'] })}
              />
            ))}
          </fieldset>
        </div>
        <div className="modal-actions">
          {!isNew && (
            <button type="button" className="text-button delete-action" onClick={onDelete}>
              <Trash2 size={15} /> Remove yarn
            </button>
          )}
          <TellAgent
            project={project}
            context={{
              view: 'connection-editor',
              transition: isNew ? undefined : draft.id,
              pin: draft.pinId,
              screen: source?.id,
            }}
          />
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {isNew ? 'Tie the yarn' : 'Save connection'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
