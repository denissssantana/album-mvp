import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoHeitor from "../assets/images/1aninho-meio.jpeg";

const navItems = [
  { to: { pathname: "/", hash: "#topo" }, hash: "#topo", label: "Início" },
  {
    to: { pathname: "/", hash: "#super-heitor" },
    hash: "#super-heitor",
    label: "Super Heitor",
  },
  {
    to: { pathname: "/", hash: "#jogo-da-memoria" },
    hash: "#jogo-da-memoria",
    label: "Jogo da Memória",
  },
  {
    to: { pathname: "/", hash: "#album-virtual" },
    hash: "#album-virtual",
    label: "Álbum Virtual",
  },
  {
    to: { pathname: "/", hash: "#contatos" },
    hash: "#contatos",
    label: "Contatos",
  },
];

const scrollToMenuTarget = (hash) => {
  if (!hash || hash === "#topo") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const target = document.querySelector(hash);
  if (!target) return;

  const headerHeight =
    document.querySelector(".siteHeader")?.getBoundingClientRect().height ?? 0;
  const targetTop =
    target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
};

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const isItemActive = (item) => {
    if (location.pathname !== "/") return false;
    if (item.hash === "#topo") return !location.hash || location.hash === "#topo";
    return location.hash === item.hash;
  };

  return (
    <header className="siteHeader">
      <div className="brand">
        <img className="brandMark" src={logoHeitor} alt="Logo do Heitor" />
        <div className="brandText">
          <span className="brandTitle">1 Aninho do Heitor</span>
        </div>
      </div>

      <button
        className="menuButton"
        type="button"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="menuLine" />
        <span className="menuLine" />
        <span className="menuLine" />
      </button>

      <nav id="site-nav" className={`siteNav ${menuOpen ? "isOpen" : ""}`}>
        {navItems.map((item) => (
          <Link
            key={item.hash}
            to={item.to}
            className={`navLink${isItemActive(item) ? " active" : ""}`}
            onClick={(event) => {
              setMenuOpen(false);

              if (
                location.pathname === item.to.pathname &&
                location.hash === item.hash
              ) {
                event.preventDefault();
                scrollToMenuTarget(item.hash);
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
