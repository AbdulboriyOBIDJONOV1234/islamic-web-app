export default function Kaaba3D() {
  return (
    <div aria-hidden="true">
      <div className="kaaba-scene">
        <div className="kaaba-wrap">
          <div className="kaaba-cube">
            <div className="k-face k-front"><div className="k-band" /><div className="k-door" /></div>
            <div className="k-face k-back"><div className="k-band" /></div>
            <div className="k-face k-left"><div className="k-band" /></div>
            <div className="k-face k-right"><div className="k-band" /></div>
            <div className="k-face k-top" />
            <div className="k-face k-bottom" />
          </div>
        </div>
      </div>
      <div className="kaaba-glow" />
    </div>
  );
}
