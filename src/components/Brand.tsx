import { Pencil } from 'lucide-react';
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <Pencil size={23} />
      </span>
      <span>
        sketchcoded<span className="brand-period">.</span>
      </span>
    </div>
  );
}
