import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      {/* The landing page is full-width; every other page uses the centered container */}
      <main className={pathname === "/" ? "" : "page"}>
        <Outlet />
      </main>
    </>
  );
}
