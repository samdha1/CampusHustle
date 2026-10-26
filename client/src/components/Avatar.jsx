// Profile picture, or the person's initial when there is none.
export default function Avatar({ user, size = 32 }) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  if (user?.avatar) return <img className="avatar" src={user.avatar} alt="" style={style} />;
  return (
    <span className="avatar avatar--empty" style={style} aria-hidden="true">
      {user?.name?.[0] ?? "?"}
    </span>
  );
}
