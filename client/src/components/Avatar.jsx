import { useState } from "react";

// Profile picture, or the person's initial when there is none (or it fails to load).
export default function Avatar({ user, size = 32 }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) };

  if (user?.avatar && !broken) {
    return <img className="avatar" src={user.avatar} alt="" style={style} onError={() => setBroken(true)} />;
  }
  return (
    <span className="avatar avatar--empty" style={style} aria-hidden="true">
      {user?.name?.[0] ?? "?"}
    </span>
  );
}