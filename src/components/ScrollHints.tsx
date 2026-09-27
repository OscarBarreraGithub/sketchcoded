import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
/** Rule: when content continues off screen, say so. These hints sit over a scroller's edges. */
export function useScrollHints(ref: RefObject<HTMLElement | null>) {
  const [more, setMore] = useState({ above: false, below: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const above = el.scrollTop > 4,
        below = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setMore((m) => (m.above === above && m.below === below ? m : { above, below }));
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const sizes = new ResizeObserver(check);
    sizes.observe(el);
    for (const child of el.children) sizes.observe(child);
    const changes = new MutationObserver(check);
    changes.observe(el, { childList: true, subtree: true, attributes: true });
    return () => {
      el.removeEventListener('scroll', check);
      sizes.disconnect();
      changes.disconnect();
    };
  }, [ref]);
  return more;
}
export function ScrollHints({
  target,
  label = 'More',
  text,
}: {
  target: RefObject<HTMLElement | null>;
  label?: string;
  /** Whole pill texts, when “<label> above / below” is not plain enough. */
  text?: { above: string; below: string };
}) {
  const more = useScrollHints(target);
  const above = text?.above ?? `${label} above`,
    below = text?.below ?? `${label} below`;
  const go = (direction: 1 | -1) =>
    target.current?.scrollBy({
      top: direction * target.current.clientHeight * 0.8,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  return (
    <>
      {more.above && (
        <>
          <span className="scroll-fade above" aria-hidden="true" />
          <button
            type="button"
            className="scroll-more above"
            onClick={() => go(-1)}
            aria-label={`${above}. Scroll up.`}
          >
            <ChevronUp size={14} /> {above}
          </button>
        </>
      )}
      {more.below && (
        <>
          <span className="scroll-fade below" aria-hidden="true" />
          <button
            type="button"
            className="scroll-more below"
            onClick={() => go(1)}
            aria-label={`${below}. Scroll down.`}
          >
            {below} <ChevronDown size={14} />
          </button>
        </>
      )}
    </>
  );
}
/** A scrolling region with hints, for full-height views such as Plan and App outline. */
export function ScrollArea({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={`scroll-area ${className}`}>
      <div className="scroll-area-inner" ref={ref}>
        {children}
      </div>
      <ScrollHints target={ref} label={label} />
    </div>
  );
}
