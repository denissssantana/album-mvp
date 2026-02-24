import { Link } from "react-router-dom";
import introVideo from "../assets/video/intro.mp4";
import superHPreview from "../assets/images/super-h.png";
import memoPreview from "../assets/images/memo.png";
import contatoPreview from "../assets/images/contato.png";

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
            <div className="sectionImage superHeitorImage">
              <img
                className="superHeitorPreview"
                src={superHPreview}
                alt="Preview do Super Heitor"
              />
            </div>
            <div className="ctaContent">
              <h3>Super Heitor</h3>
              <p>Veja as várias versões do Super Heitor</p>
              <Link className="btn btnPrimary" to="/super-heitor">
                Abrir Super Heitor
              </Link>
            </div>
          </article>

          <article className="appCard">
            <div className="sectionImage superHeitorImage">
              <img
                className="appCardPreview"
                src={memoPreview}
                alt="Preview do jogo da memoria"
              />
            </div>
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

          <article className="appCard">
            <div className="sectionImage superHeitorImage">
              <img
                className="appCardPreview"
                src={contatoPreview}
                alt="Preview do contato"
              />
            </div>
            <div className="ctaContent">
              <h3>Contato</h3>
              <p>
                Se você quer um app como esse para sua festa, entre em contato
                conosco.
              </p>
              <Link className="btn btnPrimary" to="/contatos">
                Abrir Contato
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="sectionCard appsSection" id="album-de-fotos">
        <h2>ÁLBUM DE FOTOS</h2>
        <div className="appsGrid">
          <article className="appCard">
            <div
              className="sectionImage albumImage"
              role="img"
              aria-label="Preview do álbum de fotos"
            />
            <div className="ctaContent">
              <h3>Álbum de Fotos</h3>
              <p>Tire fotos com molduras em um fluxo dedicado</p>
              <Link className="btn btnPrimary" to="/album-de-fotos">
                Abrir Álbum de Fotos
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
