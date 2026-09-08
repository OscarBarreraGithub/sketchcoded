import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  ShieldCheck,
  X,
} from 'lucide-react';
import { analyze, decisionFor, type Issue } from '../../shared/graph';
import type { Project } from '../../shared/model';
import type { Update } from '../useProject';
export function ReviewPanel({
  project,
  update,
  onClose,
  onLocate,
}: {
  project: Project;
  update: Update;
  onClose: () => void;
  onLocate: (issue: Issue) => void;
}) {
  const issues = useMemo(
      () => analyze(project),
      [project.assets, project.screens, project.pins, project.transitions, project.layout],
    ),
    open = issues.filter((i) => decisionFor(i, project.reviews).status !== 'accepted');
  const [filter, setFilter] = useState<'open' | 'accepted'>('open'),
    [expanded, setExpanded] = useState<string | null>(null),
    [reason, setReason] = useState('');
  const shown = issues.filter(
    (i) => (decisionFor(i, project.reviews).status === 'accepted') === (filter === 'accepted'),
  );
  const active =
    expanded === '' ? null : shown.some((i) => i.id === expanded) ? expanded : shown[0]?.id;
  const archived = project.reviews.filter((r) => !issues.some((i) => i.id === r.issueId));
  return (
    <aside className="review-panel" aria-label="Flow review">
      <div className="review-heading">
        <span className="review-icon">
          <ShieldCheck size={23} />
        </span>
        <button className="icon-button" onClick={onClose} aria-label="Close flow review">
          <X size={19} />
        </button>
        <span className="eyebrow">A SECOND LOOK</span>
        <h2>Follow every thread.</h2>
        <p>A few thoughtful checks to help your idea hold together.</p>
      </div>
      <div className="review-tabs">
        <button
          className={filter === 'open' ? 'active' : ''}
          onClick={() => {
            setFilter('open');
            setReason('');
            setExpanded(null);
          }}
        >
          To review <span>{open.length}</span>
        </button>
        <button
          className={filter === 'accepted' ? 'active' : ''}
          onClick={() => {
            setFilter('accepted');
            setReason('');
            setExpanded(null);
          }}
        >
          Accepted <span>{issues.length - open.length}</span>
        </button>
      </div>
      <div className="review-scroll">
        <div className="review-context">
          <CircleHelp size={16} />
          <p>
            These checks follow possible paths. Conditions written in words still need your
            judgment.
          </p>
        </div>
        {shown.map((issue) => {
          const decision = decisionFor(issue, project.reviews),
            isOpen = active === issue.id;
          return (
            <section
              className={`issue ${isOpen ? 'expanded' : ''} ${issue.severity}`}
              key={issue.id}
            >
              <button
                className="issue-heading"
                onClick={() => {
                  setExpanded(isOpen ? '' : issue.id);
                  setReason('');
                }}
              >
                {decision.status === 'accepted' ? <Check size={17} /> : <AlertCircle size={17} />}
                <span>
                  <small>
                    {decision.status === 'stale'
                      ? 'CHANGED · REVIEW AGAIN'
                      : issue.severity === 'error'
                        ? 'REPAIR NEEDED'
                        : issue.severity === 'review'
                          ? 'USE YOUR JUDGMENT'
                          : 'CHECK THIS PATH'}
                  </small>
                  <strong>{issue.title}</strong>
                </span>
                <ChevronDown size={15} />
              </button>
              {isOpen && (
                <div className="issue-body">
                  <p>{issue.detail}</p>
                  {decision.status === 'stale' && (
                    <div className="stale-reason">
                      Previously accepted: “{decision.review?.reason}”
                      <small>The relevant evidence has changed.</small>
                    </div>
                  )}
                  <button className="text-button" onClick={() => onLocate(issue)}>
                    Show me where <ArrowUpRight size={14} />
                  </button>
                  {decision.status === 'accepted' ? (
                    <div className="accepted-reason">
                      <CheckCheck size={16} />
                      <p>
                        {decision.review?.reason}
                        <small>
                          {decision.review?.author} ·{' '}
                          {new Date(decision.review!.acceptedAt).toLocaleDateString()}
                        </small>
                      </p>
                      <button
                        className="text-button"
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            reviews: p.reviews.filter((r) => r.issueId !== issue.id),
                          }))
                        }
                      >
                        Reopen
                      </button>
                    </div>
                  ) : (
                    issue.severity !== 'error' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!reason.trim()) return;
                          update((p) => ({
                            ...p,
                            reviews: [
                              ...p.reviews.filter((r) => r.issueId !== issue.id),
                              {
                                issueId: issue.id,
                                fingerprint: issue.fingerprint,
                                reason: reason.trim(),
                                author: 'You',
                                acceptedAt: new Date().toISOString(),
                              },
                            ],
                          }));
                          setReason('');
                          setExpanded(null);
                        }}
                      >
                        <label>
                          This is intentional because…
                          <textarea
                            required
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. After login, going back to credentials would be confusing."
                          />
                        </label>
                        <button
                          className="button small full"
                          type="submit"
                          disabled={!reason.trim()}
                        >
                          <Check size={14} /> Accept & keep the reason
                        </button>
                      </form>
                    )
                  )}
                </div>
              )}
            </section>
          );
        })}
        {!shown.length && (
          <div className="review-empty">
            <CheckCheck size={33} />
            <h3>
              {filter === 'open'
                ? project.screens.length
                  ? 'A well-connected idea.'
                  : 'An idea needs a first sketch.'
                : 'No accepted exceptions yet.'}
            </h3>
            <p>
              {filter === 'open'
                ? project.screens.length
                  ? 'No open structural concerns. Give the branches a play-through to check how they feel.'
                  : 'Add a screen to your board, then connect the interactions to review your flow.'
                : 'Accept an intentional concern with a reason and it will stay here for future review.'}
            </p>
          </div>
        )}
        {filter === 'accepted' && archived.length > 0 && (
          <details className="archived-reviews">
            <summary>{archived.length} decisions for resolved findings</summary>
            {archived.map((r, i) => (
              <p key={i}>
                {r.reason}
                <small>{r.issueId}</small>
              </p>
            ))}
          </details>
        )}
      </div>
      <div className="review-footer">
        <ShieldCheck size={14} /> Decisions travel with your project.
      </div>
    </aside>
  );
}
