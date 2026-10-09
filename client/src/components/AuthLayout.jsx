// Shared split layout: diagonal blue panel with the brand on the left, form on the right.
export default function AuthLayout({ heading, blurb, children }) {
  return (
    <main className="auth">
      <section className="auth__brand">
        <h1 className="display">
          Campus
          <br />
          Hustle
        </h1>
        <p>{blurb}</p>
      </section>
      <section className="auth__panel">
        <div className="auth__card">
          <h2>{heading}</h2>
          {children}
        </div>
      </section>
    </main>
  );
}
