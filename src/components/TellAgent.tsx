import { useEffect, useRef, useState, type RefObject } from 'react';
import { Bot, Check, ChevronDown, ClipboardCopy, ExternalLink, TriangleAlert } from 'lucide-react';
import {
  agentPrompt,
  briefUrl,
  buildModeIds,
  buildModes,
  checklistUrl,
  defaultBuildMode,
  describeSubject,
  skillsIndexUrl,
  views,
  type AgentContext,
  type BuildMode,
} from '../../shared/agent';
import type { Project } from '../../shared/model';
import { Modal } from './Modal';
import { ScrollHints, useScrollHints } from './ScrollHints';

/** The terminal bar says out loud whether the prompt continues below; it mounts with the dialog. */
function TerminalStatus({ target }: { target: RefObject<HTMLTextAreaElement | null> }) {
  const more = useScrollHints(target);
  return (
    <b className={`agent-terminal-scrolls ${more.below ? 'more' : ''}`}>
      {more.below ? (
        <>
          scrolls <ChevronDown size={13} />
        </>
      ) : more.above ? (
        'end of prompt'
      ) : (
        'all of it fits'
      )}
    </b>
  );
}

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
  const terminal = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false),
    [copied, setCopied] = useState<'yes' | 'no' | 'pending'>('pending'),
    [flash, setFlash] = useState(false),
    [mode, setMode] = useState<BuildMode>(context.mode ?? defaultBuildMode);
  const base = window.location.origin;
  // A new board, or an empty one, is written at one of three levels; the dialog offers the switch.
  const levels =
    context.view === 'boards' ||
    (context.view === 'board' && !project.screens.length && !project.ideas.length);
  const ctx: AgentContext = levels ? { ...context, mode } : context;
  const subject = describeSubject(project, ctx),
    view = views[ctx.view],
    prompt = agentPrompt(project, ctx, base);
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
    setCopied('pending');
    setOpen(true);
    void copy(prompt);
  };
  const choose = (next: BuildMode) => {
    setMode(next);
    void copy(agentPrompt(project, { ...context, mode: next }, base));
  };
  useEffect(() => {
    if (openSignal) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);
  const code = subject.text.match(/^(P\d+(?: pin \d+)?|I\d+|S\d+)\b/)?.[1];
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
                  : copied === 'no'
                    ? 'Your browser did not allow copying'
                    : 'Copying…'}
              </strong>
              <span>
                {copied === 'no'
                  ? 'Select the prompt below and copy it yourself.'
                  : 'Paste it into your agent. It reads this board and your rules from here.'}
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
            {context.view !== 'boards' && (
              <div>
                <dt>In</dt>
                <dd>{`${view.label} · board “${project.name}”`}</dd>
              </div>
            )}
            <div>
              <dt>The agent reads</dt>
              <dd className="agent-links">
                <a href={briefUrl(project, ctx, base)} target="_blank" rel="noreferrer">
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
          </dl>
          {levels && (
            <div className="agent-levels">
              <div
                className="agent-level-switch"
                role="radiogroup"
                aria-label="How much the agent builds"
              >
                {buildModeIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={mode === id}
                    onClick={() => choose(id)}
                  >
                    {buildModes[id].label}
                  </button>
                ))}
              </div>
              <p className="agent-level-note">{buildModes[mode].summary}</p>
            </div>
          )}
          <div className="agent-terminal">
            <div className="agent-terminal-bar" aria-hidden="true">
              <span />
              <span />
              <span />
              <em>prompt · {prompt.split('\n').length} lines · what your agent receives</em>
              <TerminalStatus target={terminal} />
            </div>
            <textarea
              ref={terminal}
              className="agent-terminal-text"
              aria-label="Prompt for your agent"
              value={prompt}
              readOnly
              spellCheck={false}
              onFocus={(e) => e.currentTarget.select()}
            />
            <ScrollHints
              target={terminal}
              text={{
                above: 'Scroll up for the start of the prompt',
                below: 'Scroll down for the rest of the prompt',
              }}
            />
          </div>
          <div className="modal-actions">
            <a
              className="button"
              href={briefUrl(project, ctx, base)}
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
              {flash ? 'Copied' : 'Copy again'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
