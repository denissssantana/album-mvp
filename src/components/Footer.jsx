import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <span className="footerText">Aniversário do Heitor</span>
      <Link className="footerLink" to="/">
        Voltar ao inicio
      </Link>
    </footer>
  );
}
