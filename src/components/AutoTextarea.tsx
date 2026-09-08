import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
/** One document scrolls; fields grow to show their text instead of creating nested scrollbars. */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    const scrollContainer = el.closest('.modal-content, .review-scroll');
    const scrollTop = scrollContainer?.scrollTop;
    el.style.height = '0px';
    el.style.height = `${Math.max(128, el.scrollHeight + 2)}px`;
    if (scrollContainer && scrollTop !== undefined) scrollContainer.scrollTop = scrollTop;
  };
  useLayoutEffect(resize, [props.value]);
  useLayoutEffect(() => {
    let width = -1;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== width) {
        width = entry.contentRect.width;
        resize();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <textarea {...props} ref={ref} rows={4} className={`auto-textarea ${props.className ?? ''}`} />
  );
}
