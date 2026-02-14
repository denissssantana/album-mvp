import { Link } from "react-router-dom";
import introVideo from "../assets/video/intro.mp4";

export default function Landing() {
  return (
    <div className="landingPage">
      <section className="hero" id="topo">
        <div className="heroIntroContent">
          <div className="heroMediaFrame" aria-hidden="true">
            <video
              className="heroVideo"
              autoPlay
              muted
              playsInline
              preload="auto"
            >
              <source src={introVideo} type="video/mp4" />
            </video>
          </div>
          <h1 className="heroWelcome">Seja bem-vindo à festa do Heitor!</h1>
        </div>
      </section>

      <section className="sectionCard appsSection" id="aplicacoes">
        <h2>App do Heitor</h2>
        <div className="appsGrid">
          <article className="appCard">
            <div
              className="sectionImage superHeitorImage"
              role="img"
              aria-label="Preview do Super Heitor"
            />
            <div className="ctaContent">
              <h3>Super Heitor</h3>
              <p>Veja as várias versões do Super Heitor</p>
              <Link className="btn btnPrimary" to="/super-heitor">
                Abrir Super Heitor
              </Link>
            </div>
          </article>

          <article className="appCard">
            <div
              className="sectionImage gameImage"
              role="img"
              aria-label="Preview do jogo da memoria"
            />
            <div className="ctaContent">
              <h3>Jogo da Memória</h3>
              <p>Ative a brincadeira com o tema de herois.</p>
              <Link className="btn btnPrimary" to="/jogo">
                Iniciar Jogo da Memória
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
              <h3>Álbum Virtual</h3>
              <p>Relembre os momentos especiais da festa</p>
              <Link className="btn btnPrimary" to="/album">
                Abrir Álbum Virtual
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
