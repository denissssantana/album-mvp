import contatoHero from "../assets/images/logo-heitor.png";

export default function EventoEncerrado() {
  return (
    <div className="landingPage contatosPage">
      <section className="appCard contatosCard">
        <div className="ctaContent contatosContent">
          <h1 className="page-title contatosTitle">EVENTO ENCERRADO</h1>

          <img
            className="contatosHero"
            src={contatoHero}
            alt="Herói do Heitor"
          />

          <p>A festa do Heitor foi incrível e o aplicativo cumpriu sua missão!</p>

          <p>
            Se você gostou da ideia e quer um aplicativo como este para o seu
            evento, entre em contato conosco.
          </p>

          <div className="contatosList">
            <a className="contatosItem" href="tel:+5581991376899" aria-label="Telefone">
              <span className="contatosItemIcon" aria-hidden="true">
                ☎
              </span>

              <span className="contatosItemText">
                <span className="contatosItemLabel">Telefone</span>
                <span className="contatosItemValue">(81) 99137-6899</span>
              </span>
            </a>

            <a
              className="contatosItem"
              href="https://wa.me/5581991376899"
              aria-label="WhatsApp"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                💬
              </span>

              <span className="contatosItemText">
                <span className="contatosItemLabel">WhatsApp</span>
                <span className="contatosItemValue">(81) 99137-6899</span>
              </span>
            </a>

            <a
              className="contatosItem"
              href="mailto:denisss.dev@gmail.com"
              aria-label="Email"
            >
              <span className="contatosItemIcon" aria-hidden="true">
                ✉
              </span>

              <span className="contatosItemText">
                <span className="contatosItemLabel">Email</span>
                <span className="contatosItemValue">denisss.dev@gmail.com</span>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
