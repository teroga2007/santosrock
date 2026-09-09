/** Original vector scenery inspired by the annual theme, not the draft poster. */
export default function CosmicBackdrop() {
  return <svg className="cosmic-backdrop" viewBox="0 0 1440 850" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="sr-moon"><stop stopColor="#F8FFFE" /><stop offset="1" stopColor="#DDF9BC" /></radialGradient>
      <linearGradient id="sr-beam" x1="720" y1="190" x2="720" y2="780" gradientUnits="userSpaceOnUse"><stop stopColor="#68C19A" stopOpacity=".23" /><stop offset="1" stopColor="#12A39A" stopOpacity="0" /></linearGradient>
      <linearGradient id="sr-hull"><stop stopColor="#02262E" /><stop offset=".5" stopColor="#3B8B75" /><stop offset="1" stopColor="#02262E" /></linearGradient>
    </defs>
    <g className="cosmic-stars" fill="#DDF9BC">{Array.from({ length: 48 }, (_, i) => <circle key={i} cx={(i * 193 + 31) % 1440} cy={(i * 137 + 29) % 750} r={i % 5 === 0 ? 2 : 1} opacity={.25 + (i % 4) * .16} />)}</g>
    <g opacity=".65"><circle cx="1290" cy="115" r="71" fill="url(#sr-moon)" /><circle cx="1264" cy="93" r="16" fill="#68C19A" opacity=".2" /><circle cx="1318" cy="141" r="24" fill="#3B8B75" opacity=".14" /><circle cx="1311" cy="77" r="9" fill="#3B8B75" opacity=".16" /></g>
    <g className="cosmic-craft"><path d="M671 206 481 790H1020L776 206Z" fill="url(#sr-beam)" /><path d="M668 178C680 119 753 119 771 178" fill="#12A39A" fillOpacity=".22" stroke="#68C19A" /><ellipse cx="720" cy="186" rx="110" ry="24" fill="url(#sr-hull)" stroke="#68C19A" strokeOpacity=".65" /><path d="M611 186Q720 255 829 186" fill="#02262E" stroke="#3B8B75" /><ellipse cx="720" cy="210" rx="40" ry="5" fill="#DDF9BC" opacity=".7" />{[650,685,720,755,790].map(x => <ellipse key={x} cx={x} cy={x === 720 ? 184 : 187} rx="6" ry="2.5" fill="#FCF106" />)}</g>
    <g stroke="#0C403B" strokeWidth="2" opacity=".5"><ellipse cx="720" cy="740" rx="510" ry="72" /><ellipse cx="720" cy="740" rx="620" ry="96" /></g>
    <path d="M0 850V590L38 380 53 603 80 499 70 710 105 643 99 850M1440 850V438L1406 248 1391 523 1355 399 1371 660 1323 554 1343 850" fill="#061917" opacity=".8" />
  </svg>
}
