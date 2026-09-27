import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, LayoutDashboard, Plus } from 'lucide-react';
import { emptyProject } from '../../shared/model';
import { Brand } from './Brand';
import { TellAgent } from './TellAgent';

export type BoardSummary = { id: string; name: string; updatedAt: string; screenCount: number };

const when = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** The front door of the app: the site's design, with your boards and a way to start one. */
export function Landing({
  boards,
  lastId,
  error,
  onOpen,
  onCreate,
}: {
  boards: BoardSummary[];
  lastId: string | null;
  error?: string;
  onOpen: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(''),
    [busy, setBusy] = useState(false);
  // The "new board" prompt is about no board in particular; a stub carries the app's name.
  const stub = useMemo(() => emptyProject('Sketchcoded', 'sketchcoded'), []);
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate(name.trim());
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="landing">
      <header className="landing-header">
        <Brand />
        <span className="landing-note">Runs on your computer. Your sketches never leave it.</span>
      </header>
      <main className="landing-main">
        {error && (
          <p className="landing-error" role="alert">
            {error}
          </p>
        )}
        <section className="landing-hero">
          <div className="landing-intro">
            <h1>Sketchcoded</h1>
            <p className="landing-tagline">
              Prompts make apps.
              <b>
                Sketching makes <u>your</u> vision.
              </b>
            </p>
            <p className="landing-lede">
              Draw the screens of the app you’re imagining. Pin them to a board, tie them together
              with yarn, and write what each part should do in plain words. Play it, check it, and
              hand your agent a plan it can build from.
            </p>
            <section className="landing-start" aria-label="Start a board">
              <h2>Start a board</h2>
              <form onSubmit={(e) => void create(e)}>
                <label>
                  Board name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What are you imagining?"
                    maxLength={200}
                  />
                </label>
                <button className="button primary" type="submit" disabled={!name.trim() || busy}>
                  <Plus size={16} /> New blank board
                </button>
              </form>
              <div className="landing-or">
                <span>or</span>
              </div>
              <TellAgent
                project={stub}
                context={{ view: 'boards' }}
                label="New board with your agent"
                className="button"
              />
              <p className="landing-hint">
                Blank: you draw first. With your agent: it reads the project you’re working in and
                writes a new board at the level you choose: just the to-do list, frames with the
                strings already tied, or a whole site of standard pages you fine-tune.
              </p>
            </section>
          </div>
          <section className="landing-boards" aria-label="Your boards">
            <div className="landing-boards-head">
              <h2>Your boards</h2>
              <span>{boards.length}</span>
            </div>
            {boards.length === 0 && <p className="landing-empty">No boards yet. Start one.</p>}
            <ul>
              {boards.map((b) => (
                <li key={b.id}>
                  <button className="landing-board" onClick={() => onOpen(b.id)}>
                    <span className="landing-board-mark" aria-hidden="true">
                      <LayoutDashboard size={18} />
                    </span>
                    <span className="landing-board-text">
                      <strong>{b.name}</strong>
                      <small>
                        {b.screenCount} {b.screenCount === 1 ? 'screen' : 'screens'} · edited{' '}
                        {when(b.updatedAt)}
                        {b.id === lastId ? ' · last opened' : ''}
                      </small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </main>
    </div>
  );
}
