import { Link } from "react-router-dom";

const infoCards = [
  { icon: "📅", title: "Data", text: "Em breve" },
  { icon: "📍", title: "Local", text: "A confirmar" },
  { icon: "🕒", title: "Horario", text: "A confirmar" },
];

export default function Landing() {
  return (
    <div className="landingPage">
      <section className="hero" id="topo">
        <div className="heroContent">
          <div className="heroVisual" role="img" aria-label="Heroi em missao" />
          <span className="heroKicker">Convite especial</span>
          <h1 className="page-title">Prepare-se para a Missao!</h1>
          <p className="heroText">
            Um convite digital com atmosfera heroica para celebrar o 1 aninho do
            Heitor.
          </p>
          <div className="heroActions">
            <a className="btn btnPrimary" href="#detalhes">
              Saiba mais
            </a>
          </div>
        </div>
      </section>

      <section className="sectionCard infoSection" id="detalhes">
        <h2>Detalhes da Festa</h2>
        <div className="infoGrid">
          {infoCards.map((item) => (
            <article className="infoItem" key={item.title}>
              <span className="infoIcon" aria-hidden="true">
                {item.icon}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionCard appsSection" id="aplicacoes">
        <h2>Galeria de Fotos</h2>
        <div className="appsGrid">
          <article className="appCard">
            <div
              className="sectionImage gameImage"
              role="img"
              aria-label="Preview do jogo da memoria"
            />
            <div className="ctaContent">
              <h3>Jogo da Memoria</h3>
              <p>Ative a brincadeira com o tema de herois.</p>
              <Link className="btn btnPrimary" to="/jogo">
                Iniciar Jogo da Memoria
              </Link>
            </div>
          </article>

          <article className="appCard">
            <div
              className="sectionImage albumImage"
              role="img"
              aria-label="Preview do album de fotos"
            />
            <div className="ctaContent">
              <h3>Album de Fotos</h3>
              <p>Relembre os momentos especiais da missao.</p>
              <Link className="btn btnPrimary" to="/album">
                Abrir Album de Fotos
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
