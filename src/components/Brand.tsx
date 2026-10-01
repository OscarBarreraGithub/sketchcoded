/** The logo is the owner's hand-drawn alien on the brand tile (`npm run logo` builds it). */
export function Brand() {
  return (
    <div className="brand">
      <img className="brand-logo" src="/favicon.svg" alt="" width={30} height={30} />
      <span>
        sketchcoded<span className="brand-period">.</span>
      </span>
    </div>
  );
}
