import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STEPS = [
  { n: "01", title: "Join your campus", text: "Sign up with your college email." },
  { n: "02", title: "Find or pass it on", text: "Browse what's available or list something you no longer need." },
  { n: "03", title: "Meet and make the exchange", text: "Chat with the other student and meet on campus." },
];

// Public home page: explains what Campus Hustle is. Visible to everyone.
export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero" aria-labelledby="landing-title">
        <div className="hero__inner">
          <div className="hero__text">
            <p className="hero__kicker">A marketplace for your campus</p>
            <h1 className="display hero__title" id="landing-title">Find it.<br />Pass it on.</h1>
          </div>
          <div className="hero__intro">
            <p className="hero__lead">
              Buy and sell with students on your campus. Give useful things a second life, and find what you need nearby.
            </p>
            <div className="hero__cta">
              {user ? (
                <>
                  <Link to="/browse" className="btn btn--lg btn--accent">Browse items</Link>
                  <Link to="/listings/new" className="btn btn--lg btn--outline">Sell an item</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn--lg btn--accent">Create an account</Link>
                  <Link to="/login" className="btn btn--lg btn--outline">Log in</Link>
                </>
              )}
            </div>
            <p className="hero__note">Campus-only. Student-to-student. No fuss.</p>
          </div>
        </div>
      </section>

      <section className="section landing-steps" aria-labelledby="steps-title">
        <h2 className="section__title" id="steps-title">Simple from start to finish</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="steps__n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="footer">Campus Hustle · Built by Sameer and Shaunak</footer>
    </>
  );
}
