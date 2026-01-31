import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-hero">
        <p className="kicker">Mini Elementor</p>
        <h1>JSON-first drag & drop page builder.</h1>
        <p className="lead">
          Build pages with Section → Row → Column → Component, persist to JSON, and render
          server-side.
        </p>
        <div className="landing-actions">
          <Link className="btn" href="/editor">
            Open Editor
          </Link>
          <Link className="btn btn-ghost" href="/page/home">
            View Example Page
          </Link>
        </div>
      </header>
      <section className="landing-grid">
        <div>
          <h3>Editor</h3>
          <p>Drag, drop, and edit component props with undo/redo history.</p>
        </div>
        <div>
          <h3>Renderer</h3>
          <p>Pure JSON → UI rendering for predictable output.</p>
        </div>
        <div>
          <h3>API</h3>
          <p>Save/load pages via a tiny JSON API route.</p>
        </div>
      </section>
    </main>
  );
}
