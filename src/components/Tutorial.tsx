import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin } from 'lucide-react';
import { emptyProject } from '../../shared/model';
import { Modal } from './Modal';
import { TellAgent } from './TellAgent';

const lessons = [
  [
    'Plan a page',
    'Start with what belongs on each screen. Ideas can wait in the pool, then move onto a planned frame before you draw. Placed means pinned, not implemented.',
  ],
  [
    'Pin an intention',
    'A pin describes one part of the screen. Navigation pins lead somewhere; content and local-action pins stay here. Pins added before a drawing wait for you to place them when the drawing arrives.',
  ],
  [
    'Tie the yarn',
    'Yarn names a path and its conditions. A pin can have several branches. Red is the main path, gold a branch, blue a detour, and olive a way back. Threads filters one category without hiding the rest of the board.',
  ],
  [
    'Review the flow',
    'Review finds structural gaps. An intentional ending needs a reason; accepting it records a decision, not proof. Your agent separately checks the rendered layout against the full build checklist.',
  ],
  [
    'Walk the flow',
    'Test flow follows your yarn. You choose written conditions; nothing evaluates them. Authored Back is app navigation. Rewind test is a separate testing aid, even after a reset or a Back action.',
  ],
  [
    'Work with your agent',
    'Tell the agent copies a short prompt with the exact task brief. Paste it into your agent and type your request underneath. The agent reads your board and rules, writes back, and verifies the result before calling it done.',
  ],
];
export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0),
    [assigned, setAssigned] = useState(false),
    [pinned, setPinned] = useState(false),
    [branch, setBranch] = useState(''),
    [reason, setReason] = useState(''),
    [accepted, setAccepted] = useState(false),
    [visits, setVisits] = useState(['Home']);
  const stub = useMemo(() => emptyProject('Sketchcoded', 'sketchcoded'), []);
  return (
    <Modal title="Make your first connection" onClose={onClose} className="tutorial-modal">
      <p className="field-help">
        Six short steps. The practice controls here do not change your boards.
      </p>
      <nav className="tutorial-steps" aria-label="Tutorial steps">
        {lessons.map(([title], i) => (
          <button
            key={title}
            aria-label={`Step ${i + 1}: ${title}`}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <section className="tutorial-lesson" aria-live="polite">
        <h3>{lessons[step][0]}</h3>
        <p>{lessons[step][1]}</p>
        <div className="tutorial-practice">
          {step === 0 && (
            <>
              <span className="eyebrow">{assigned ? 'P1 · Home' : 'Idea pool'}</span>
              <strong>I1 · Start a conversation</strong>
              <button className="button" onClick={() => setAssigned(!assigned)}>
                {assigned ? 'Return idea to the pool' : 'Assign idea to Home'}
              </button>
              <p>
                {assigned
                  ? 'The idea has a home. A drawing can come later.'
                  : 'An unassigned idea stays in the pool.'}
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <span className="eyebrow">P1 · Planned frame</span>
              <button className="button" onClick={() => setPinned(!pinned)}>
                <MapPin size={18} />
                {pinned ? 'P1 pin 1 · Start a conversation' : 'Place the idea as a provisional pin'}
              </button>
              <p>
                {pinned
                  ? 'Its words are preserved. Its position will wait for your drawing.'
                  : 'No drawing is needed to start tying the flow.'}
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <strong>P1 pin 1 → {branch || 'Choose a branch'}</strong>
              <div className="tutorial-choices">
                <button
                  className="button"
                  aria-pressed={branch === 'Conversation'}
                  onClick={() => setBranch('Conversation')}
                >
                  Red · Open conversation
                </button>
                <button
                  className="button"
                  aria-pressed={branch === 'Blocked notice'}
                  onClick={() => setBranch('Blocked notice')}
                >
                  Gold · If this person is blocked
                </button>
              </div>
              <p>
                {branch
                  ? `You selected “${branch}”. The condition remains written intent.`
                  : 'Try either branch. A real board can author both from the same pin.'}
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <strong>This page has no way onward.</strong>
              <label>
                Why is this an intentional ending?
                <input
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setAccepted(false);
                  }}
                  placeholder="For example: the completed receipt ends this flow"
                />
              </label>
              <button
                className="button"
                disabled={!reason.trim()}
                onClick={() => setAccepted(true)}
              >
                {accepted ? (
                  <>
                    <Check size={18} />
                    Practice decision recorded
                  </>
                ) : (
                  'Accept this practice finding'
                )}
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <strong>{visits.at(-1)}</strong>
              <div className="tutorial-choices">
                <button
                  className="button"
                  onClick={() =>
                    setVisits([...visits, visits.at(-1) === 'Home' ? 'Conversation' : 'Home'])
                  }
                >
                  Follow the next authored path
                </button>
                <button
                  className="button"
                  disabled={visits.length < 2}
                  onClick={() => setVisits(visits.slice(0, -1))}
                >
                  Rewind test
                </button>
              </div>
              <p>{visits.join(' → ')}</p>
            </>
          )}
          {step === 5 && (
            <>
              <strong>Keep the app running while your agent works.</strong>
              <p>
                Pause editing for the final write. Your board refreshes when saved; a conflict
                preserves your work for recovery. The agent must check both the board and any pages
                it leaves to the AI, then check the finished site when it builds one.
              </p>
              <TellAgent
                project={stub}
                context={{ view: 'boards' }}
                label="Copy a real new-board prompt"
              />
            </>
          )}
        </div>
      </section>
      <div className="tutorial-actions">
        <button className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft size={16} />
          Previous
        </button>
        <span>{step + 1} of 6</span>
        <button
          className="button primary"
          onClick={() => (step === 5 ? onClose() : setStep(step + 1))}
        >
          {step === 5 ? 'Finish tutorial' : 'Next'}
          <ArrowRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
