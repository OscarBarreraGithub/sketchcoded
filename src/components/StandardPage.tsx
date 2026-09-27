import { useRef } from 'react';
import { ArrowRight, ExternalLink, Undo2 } from 'lucide-react';
import { standardPage, type PageAction, type PageSpec } from '../../shared/standard-page';
import type { Project, Screen } from '../../shared/model';
import { ScrollHints } from './ScrollHints';

/**
 * A frame left to the AI, built out: the conventional page Sketchcoded makes from the plan, as a
 * real page you can scroll and click. Every button is one of the frame's pins, so clicking it
 * follows the yarn the board already holds. There is nothing behind it: only the redirects work.
 */
export function StandardPage({
  project,
  screen,
  onPin,
  showPins,
  narrow = false,
}: {
  project: Project;
  screen: Screen;
  onPin: (pinId: string) => void;
  /** Number each working part, the way pins are numbered on a drawing. */
  showPins: boolean;
  narrow?: boolean;
}) {
  const page: PageSpec = standardPage(project, screen);
  const scroll = useRef<HTMLDivElement>(null);
  const order = project.pins.filter((v) => v.screenId === screen.id).map((v) => v.id);
  const Action = ({ a, className }: { a: PageAction; className: string }) => (
    <button
      type="button"
      className={`std-action ${className} ${a.kind}`}
      onClick={() => onPin(a.pinId)}
      title={a.note || undefined}
    >
      {showPins && order.indexOf(a.pinId) >= 0 && (
        <span className="std-mark" aria-hidden="true">
          {order.indexOf(a.pinId) + 1}
        </span>
      )}
      <span className="std-label">{a.label}</span>
      {a.kind === 'link' ? (
        <ExternalLink size={13} />
      ) : a.kind === 'back' ? (
        <Undo2 size={13} />
      ) : (
        <ArrowRight size={13} />
      )}
    </button>
  );
  return (
    <div className={`std-page shape-${page.shape} ${narrow ? 'narrow' : ''}`}>
      <div className="std-scroll" ref={scroll}>
        {page.shape === 'page' && (
          <header className="std-top">
            <span className="std-product">{page.product}</span>
            {page.nav.length > 0 && (
              <nav aria-label="Page navigation">
                {page.nav.map((a) => (
                  <Action key={a.pinId} a={a} className="std-nav" />
                ))}
              </nav>
            )}
          </header>
        )}
        <div className="std-body">
          <section className="std-hero">
            <h1>{page.title}</h1>
            {page.lede && <p>{page.lede}</p>}
            {page.primary && <Action a={page.primary} className="std-primary" />}
          </section>
          {page.blocks.length > 0 && (
            <div className="std-blocks">
              {page.blocks.map((b) =>
                b.block === 'field' ? (
                  <label className="std-field" key={b.id}>
                    <span>{b.label}</span>
                    <input
                      type={b.type}
                      placeholder={b.hint ? b.hint.slice(0, 60) : ''}
                      aria-label={b.label}
                    />
                  </label>
                ) : (
                  <article className={`std-${b.block}`} key={b.id}>
                    <h2>{b.title}</h2>
                    {b.body && <p>{b.body}</p>}
                    {b.action && <Action a={b.action} className="std-secondary" />}
                  </article>
                ),
              )}
            </div>
          )}
          {page.footer.length > 0 && (
            <footer className="std-foot">
              {page.footer.map((a) => (
                <Action key={a.pinId} a={a} className="std-foot-action" />
              ))}
            </footer>
          )}
          <p className="std-note">
            Built from the plan, because this frame is left to the AI. Only the paths work.
          </p>
        </div>
      </div>
      <ScrollHints
        target={scroll}
        text={{
          above: 'Scroll up for the top of the page',
          below: 'Scroll down for the rest of the page',
        }}
      />
    </div>
  );
}
