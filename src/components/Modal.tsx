import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ScrollHints } from './ScrollHints';
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    contentRef = useRef<HTMLDivElement>(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', cancel);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">SKETCHCODED STUDIO</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        <div className="modal-content" ref={contentRef}>
          {children}
        </div>
        <ScrollHints target={contentRef} />
      </div>
    </dialog>
  );
}
export function Confirm({
  title,
  detail,
  onConfirm,
  onClose,
}: {
  title: string;
  detail: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{detail}</p>
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          Keep it
        </button>
        <button
          className="button danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Remove
        </button>
      </div>
    </Modal>
  );
}
