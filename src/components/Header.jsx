import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/super-heitor", label: "Super Heitor" },
  { to: "/jogo", label: "Jogo da Memória" },
  { to: "/album", label: "Álbum Virtual" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="siteHeader">
      <div className="brand">
        <span className="brandMark" aria-hidden="true" />
        <div className="brandText">
          <span className="brandTitle">1 Aninho do Heitor</span>
          <span className="brandSubtitle">Álbum virtual</span>
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
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `navLink${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
