import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { title: "List in a minute", text: "Add a name, price, description and photo. Edit or remove your listing any time." },
  { title: "Browse and search", text: "Search by keyword and filter by category, condition and price to find what you need." },
  { title: "Know the seller", text: "Every item shows who is selling it, so you deal with real people on your campus." },
  { title: "Real-time chat", text: "Message the owner right from the item page and get replies instantly." },
  { title: "You stay in control", text: "Only the owner of a listing can change or delete it." },
  { title: "Made for campus", text: "Sign up with your college email and trade only within your campus community." },
];

const STEPS = [
  { n: "01", title: "Sign up", text: "Create an account with your campus email." },
  { n: "02", title: "List or find", text: "Post what you no longer need, or search for what you do." },
  { n: "03", title: "Chat and meet", text: "Agree on the details in chat and meet on campus." },
];

// Public home page: explains what Campus Hustle is. Visible to everyone.
export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="hero__text">
          <p className="hero__kicker">The campus marketplace</p>
          <h1 className="display hero__title">Campus<br />Hustle</h1>
          <p className="hero__lead">
            A student-focused platform to buy, sell and communicate about items within the campus community.
          </p>
          <div className="hero__cta">
            {user ? (
              <>
                <Link to="/browse" className="btn btn--lg">Browse items</Link>
                <Link to="/listings/new" className="btn btn--lg btn--accent">Sell an item</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn--lg">Create an account</Link>
                <Link to="/login" className="btn btn--lg btn--outline">Log in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Our aim</h2>
        <p className="section__lead">
          To provide a trusted, campus-only marketplace where students can list unwanted or needed items and
          connect directly with interested buyers, so useful things find a new owner on campus instead of going to waste.
        </p>
      </section>

      <section className="section section--tint">
        <h2 className="section__title">What you can do</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature">
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="steps__n display">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!user && (
        <section className="cta">
          <h2 className="display">Ready to hustle?</h2>
          <Link to="/register" className="btn btn--lg btn--accent">Join Campus Hustle</Link>
        </section>
      )}

      <footer className="footer">Campus Hustle · Built by Sameer and Shaunak</footer>
    </>
  );
}
