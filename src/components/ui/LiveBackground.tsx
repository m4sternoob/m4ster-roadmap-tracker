/**
 * LiveBackground — the app's "living" backdrop.
 *
 * Three large aurora orbs drift slowly behind the interface, tinted by the
 * active theme's accent palette. Pure CSS (transform + opacity only, so it
 * stays on the GPU), pointer-transparent, and still under
 * `prefers-reduced-motion`.
 */
export function LiveBackground() {
  return (
    <div className="live-bg" aria-hidden="true">
      <span className="live-orb live-orb-1" />
      <span className="live-orb live-orb-2" />
      <span className="live-orb live-orb-3" />
      <span className="live-vignette" />
    </div>
  );
}
