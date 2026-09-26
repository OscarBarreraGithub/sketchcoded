import { useState } from 'react';
import { Bot, ClipboardCopy, ExternalLink } from 'lucide-react';
import { agentPrompt, briefUrl, type AgentContext } from '../../shared/agent';
import type { Project } from '../../shared/model';
import { Modal } from './Modal';

/**
 * Rule (2026-09-26): every view can hand its task to the agent. One button copies a generated
 * prompt (view, exact subject, where the instructions are, the task) and shows it for manual
 * copying and editing. The prompt points the agent at the running app's local API.
 */
export function TellAgent({
  project,
  context,
  label = 'Tell the agent',
  className = 'button small',
}: {
  project: Project;
  context: AgentContext;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(''),
    [copied, setCopied] = useState<'yes' | 'no' | 'pending'>('pending');
  const base = window.location.origin;
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied('yes');
    } catch {
      setCopied('no');
    }
  };
  const start = () => {
    const prompt = agentPrompt(project, context, base);
    setText(prompt);
    setCopied('pending');
    setOpen(true);
    void copy(prompt);
  };
  return (
    <>
      <button type="button" className={`${className} tell-agent`} onClick={start}>
        <Bot size={15} /> {label}
      </button>
      {open && (
        <Modal
          title="Hand this to your agent"
          onClose={() => setOpen(false)}
          className="agent-modal"
        >
          <p className="agent-status" role="status">
            {copied === 'yes'
              ? 'Copied to your clipboard. Paste it into your agent. Edit the task line first if you want something else.'
              : copied === 'no'
                ? 'Your browser did not allow copying. Select the text below and copy it yourself.'
                : 'Copying…'}
          </p>
          <textarea
            aria-label="Prompt for your agent"
            value={text}
            spellCheck={false}
            onChange={(e) => setText(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="modal-actions">
            <a
              className="button"
              href={briefUrl(project, context, base)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} /> Open the brief
            </a>
            <button type="button" className="button primary" onClick={() => void copy(text)}>
              <ClipboardCopy size={15} /> Copy again
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
