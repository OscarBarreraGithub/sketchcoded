import { useState } from 'react';
import { Focus } from 'lucide-react';
import { assetUrl, type Project } from '../../shared/model';
import { Modal } from './Modal';
export function DetailView({
  project,
  targetId,
  sourceTitle,
  onClose,
}: {
  project: Project;
  targetId: string;
  sourceTitle: string;
  onClose: () => void;
}) {
  // Reference browsing has its own breadcrumbs, separate from the app's history.
  const [trail, setTrail] = useState([targetId]),
    [notice, setNotice] = useState('');
  const screen = project.screens.find((s) => s.id === trail.at(-1)),
    asset = project.assets.find((a) => a.id === screen?.assetId);
  const pins = project.pins.filter((pin) => pin.screenId === screen?.id && pin.kind === 'detail');
  const previous = project.screens.find((s) => s.id === trail.at(-2));
  return (
    <Modal
      title={screen?.title ?? 'Missing detail sketch'}
      onClose={onClose}
      className="detail-modal"
    >
      <p className="detail-context">
        <Focus size={18} /> Detail reference · you’re still on {sourceTitle}
      </p>
      {asset ? (
        <div className="detail-image">
          <img
            className="detail-full-image"
            src={assetUrl(asset)}
            alt={`Detail: ${screen?.title}`}
          />
          {pins.map((pin, i) => (
            <button
              key={pin.id}
              className="preview-pin reference-pin"
              aria-label={`View detail: ${pin.title || `Pin ${i + 1}`}`}
              style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
              onClick={() => {
                if (pin.detailTarget) {
                  setTrail((prev) => [...prev, pin.detailTarget!]);
                  setNotice('');
                } else
                  setNotice(
                    'This reference needs an attached sketch. Choose one in the pin editor.',
                  );
              }}
            >
              <Focus size={18} />
            </button>
          ))}
        </div>
      ) : (
        <p>This reference has no saved sketch. Choose a target in the pin editor.</p>
      )}
      {screen?.purpose && <p className="detail-description">{screen.purpose}</p>}
      {notice && (
        <p role="status" className="preview-notice">
          {notice}
        </p>
      )}
      <div className="modal-actions">
        {trail.length > 1 && (
          <button
            className="button"
            onClick={() => {
              setTrail((prev) => prev.slice(0, -1));
              setNotice('');
            }}
          >
            Back to {previous?.title || 'previous detail'}
          </button>
        )}
        <button className="button primary" onClick={onClose}>
          Back to {sourceTitle}
        </button>
      </div>
    </Modal>
  );
}
