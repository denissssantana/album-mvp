import contatoHero from "../assets/images/logo-heitor.png";

export default function Contatos() {
  return (
    <div className="landingPage contatosPage">
      <section className="appCard contatosCard">
        <div className="ctaContent contatosContent">
          <h2 className="page-title contatosTitle">CONTATO</h2>
          <img
            className="contatosHero"
            src={contatoHero}
            alt="Heroi do Heitor"
          />
          <p>
            Se você quer um app como esse para sua festa, entre em contato conosco
            e deixe seu evento ainda mais especial.
          </p>
          <div className="contatosList">
            <a
              className="contatosItem"
              href="tel:+5581999999999"
              aria-label="Telefone (81) 99999-9999"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                ☎
              </span>
              <span className="contatosItemText">
                <span className="contatosItemLabel">Telefone</span>
                <span className="contatosItemValue">(81) 99999-9999</span>
              </span>
            </a>
            <a
              className="contatosItem"
              href="https://wa.me/5581999999999"
              aria-label="WhatsApp (81) 99999-9999"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                💬
              </span>
              <span className="contatosItemText">
                <span className="contatosItemLabel">WhatsApp</span>
                <span className="contatosItemValue">(81) 99999-9999</span>
              </span>
            </a>
            <a
              className="contatosItem"
              href="mailto:contato@appdoheitor.com"
              aria-label="Email contato@appdoheitor.com"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                ✉
              </span>
              <span className="contatosItemText">
                <span className="contatosItemLabel">Email</span>
                <span className="contatosItemValue">contato@appdoheitor.com</span>
              </span>
            </a>
            <a
              className="contatosItem"
              href="https://www.appdoheitor.com"
              aria-label="Site www.appdoheitor.com"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                🌐
              </span>
              <span className="contatosItemText">
                <span className="contatosItemLabel">Site</span>
                <span className="contatosItemValue">www.appdoheitor.com</span>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
