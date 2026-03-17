export default function SceneCompanions() {
  return (
    <aside className="scene-companions" aria-hidden="true">
      <div className="scene-object satellite">
        <span />
      </div>
      <div className="scene-object drone">
        <span />
      </div>
      <div className="scene-object beacon">
        <span />
      </div>

      <div className="ai-guide">
        <div className="guide-halo" />
        <div className="guide-head">
          <div className="guide-eyes">
            <span />
            <span />
          </div>
        </div>
        <div className="guide-body">
          <strong>Astra Guide</strong>
          <small>Live mission companion</small>
        </div>
      </div>
    </aside>
  );
}
