import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerContent">
        <span className="footerText">Nos vemos la!</span>
        <div className="footerIcons" aria-hidden="true">
          <span className="footerIcon">☎</span>
          <span className="footerIcon">✉</span>
          <span className="footerIcon">💬</span>
        </div>
      </div>
      <Link className="footerLink" to="/">
        Voltar ao inicio
      </Link>
    </footer>
  );
}
