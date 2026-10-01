/** The logo is the owner's hand-drawn alien, in dark ink (`npm run logo` builds it). */
export function Brand() {
  return (
    <div className="brand">
      <img className="brand-logo" src="/brand/logo.svg" alt="" width={36} height={36} />
      <span>
        sketchcoded<span className="brand-period">.</span>
      </span>
    </div>
  );
}
