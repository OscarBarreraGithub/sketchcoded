import { useEffect, useState } from 'react';
import { Bot, Check, ClipboardCopy, ExternalLink, TriangleAlert } from 'lucide-react';
import {
  agentPrompt,
  briefUrl,
  checklistUrl,
  defaultTask,
  describeSubject,
  skillsIndexUrl,
  views,
  type AgentContext,
} from '../../shared/agent';
import type { Project } from '../../shared/model';
import { Modal } from './Modal';

/**
 * Rule (2026-09-26): every view can hand its task to the agent. One button copies a generated
 * prompt (view, exact subject, where the instructions are, the task) and shows what was handed
 * over in plain words, with the raw prompt in a small terminal for checking or manual copying.
 */
export function TellAgent({
  project,
  context,
  label = 'Tell the agent',
  title,
  className = 'button small',
  onStart,
  icon = true,
  openSignal,
  hideButton = false,
}: {
  project: Project;
  context: AgentContext;
  /** Button text; empty for an icon-only button (then `title` names it). */
  label?: string;
  title?: string;
  className?: string;
  /** Called when the dialog opens, for menus that should close. */
  onStart?: () => void;
  icon?: boolean;
  /** Opens the dialog whenever this number changes (for a trigger that lives somewhere else). */
  openSignal?: number;
  /** Render no button of its own; used with `openSignal`. */
  hideButton?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [task, setTask] = useState(''),
    [copied, setCopied] = useState<'yes' | 'no' | 'pending' | 'stale'>('pending'),
    [flash, setFlash] = useState(false);
  const base = window.location.origin;
  const subject = describeSubject(project, context),
    view = views[context.view],
    prompt = agentPrompt(project, context, base, task);
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied('yes');
      setFlash(true);
    } catch {
      setCopied('no');
    }
  };
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 1800);
    return () => clearTimeout(t);
  }, [flash]);
  const start = () => {
    onStart?.();
    const fresh = defaultTask(project, context).replace('<base>', base);
    setTask(fresh);
    setCopied('pending');
    setOpen(true);
    void copy(agentPrompt(project, context, base, fresh));
  };
  useEffect(() => {
    if (openSignal) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);
  const code = subject.text.match(/^(F\d+(?: pin \d+)?|I\d+|S\d+)\b/)?.[1];
  const rest = code ? subject.text.slice(code.length).trim() : subject.text;
  return (
    <>
      {!hideButton && (
        <button
          type="button"
          className={`${className} tell-agent`}
          aria-label={title ?? label}
          title={title}
          onClick={start}
        >
          {icon && <Bot size={15} />}
          {label ? ` ${label}` : null}
        </button>
      )}
      {open && (
        <Modal
          title="Hand this to your agent"
          onClose={() => setOpen(false)}
          className="agent-modal"
        >
          <div className={`agent-copied ${copied}`} role="status">
            <span className="agent-copied-mark" aria-hidden="true">
              {copied === 'no' ? <TriangleAlert size={26} /> : <Check size={30} strokeWidth={3} />}
            </span>
            <div>
              <strong>
                {copied === 'yes'
                  ? 'Copied to your clipboard'
                  : copied === 'stale'
                    ? 'You changed the task. Copy again to update your clipboard.'
                    : copied === 'no'
                      ? 'Your browser did not allow copying'
                      : 'Copying…'}
              </strong>
              <span>
                {copied === 'no'
                  ? 'Select the prompt below and copy it yourself.'
                  : 'Paste it into your agent. It will read this board, this task and your rules from the app running here, then get to work.'}
              </span>
            </div>
          </div>
          <dl className="agent-summary">
            <div>
              <dt>Working on</dt>
              <dd>
                {code && <b className="item-code">{code}</b>} {rest}
              </dd>
            </div>
            <div>
              <dt>In</dt>
              <dd>
                {view.label} · board “{project.name}”
              </dd>
            </div>
            <div>
              <dt>The agent reads</dt>
              <dd className="agent-links">
                <a href={briefUrl(project, context, base)} target="_blank" rel="noreferrer">
                  the brief for this task <ExternalLink size={12} />
                </a>
                <a href={skillsIndexUrl(base)} target="_blank" rel="noreferrer">
                  {view.skills.length} skills <ExternalLink size={12} />
                </a>
                <a href={checklistUrl(base)} target="_blank" rel="noreferrer">
                  your rules <ExternalLink size={12} />
                </a>
              </dd>
            </div>
            <div className="agent-task">
              <dt>
                <label htmlFor="agent-task">Task</label>
              </dt>
              <dd>
                <textarea
                  id="agent-task"
                  rows={3}
                  value={task}
                  onChange={(e) => {
                    setTask(e.target.value);
                    setCopied('stale');
                  }}
                />
              </dd>
            </div>
          </dl>
          <div className="agent-terminal">
            <div className="agent-terminal-bar" aria-hidden="true">
              <span />
              <span />
              <span />
              <em>prompt · {prompt.split('\n').length} lines · what your agent receives</em>
            </div>
            <textarea
              className="agent-terminal-text"
              aria-label="Prompt for your agent"
              value={prompt}
              readOnly
              spellCheck={false}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="modal-actions">
            <a
              className="button"
              href={briefUrl(project, context, base)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} /> Open the brief
            </a>
            <button
              type="button"
              className={`button primary ${flash ? 'agent-flash' : ''}`}
              onClick={() => void copy(prompt)}
            >
              {flash ? <Check size={15} /> : <ClipboardCopy size={15} />}{' '}
              {flash ? 'Copied' : copied === 'stale' ? 'Copy the new prompt' : 'Copy again'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
