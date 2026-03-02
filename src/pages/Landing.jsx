import { Link } from "react-router-dom";
import introVideo from "../assets/video/intro.mp4";
import superHPreview from "../assets/images/super-h.png";
import memoPreview from "../assets/images/memo.png";
import cameraPreview from "../assets/images/camera.png";
import contatoPreview from "../assets/images/contato.png";

export default function Landing() {
  return (
    <div className="landingPage">
      <section className="hero" id="topo">
        <div className="heroIntroContent">
          <div className="heroTitleBand">
            <h2 className="heroAppTitle">App do Heitor</h2>
          </div>
          <div className="heroMediaBand">
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
          </div>
          <div className="heroWelcomeBand">
            <h1 className="heroWelcome">Seja bem-vindo à festa do Heitor!</h1>
          </div>
        </div>
      </section>

      <section className="sectionCard appsSection" id="aplicacoes">
        <div className="appsGrid">
          <article className="appCard" id="super-heitor">
            <div className="ctaContent">
              <h3>Super Heitor</h3>
            </div>
            <div className="sectionImage superHeitorImage">
              <img
                className="superHeitorPreview"
                src={superHPreview}
                alt="Preview do Super Heitor"
              />
            </div>
            <div className="ctaContent">
              <p>Veja as várias versões do Super Heitor</p>
              <Link className="btn btnPrimary" to="/super-heitor">
                Acessar Galeria Super Heitor
              </Link>
            </div>
          </article>

          <article className="appCard" id="jogo-da-memoria">
            <div className="ctaContent">
              <h3>Jogo da Memória</h3>
            </div>
            <div className="sectionImage superHeitorImage">
              <img
                className="appCardPreview"
                src={memoPreview}
                alt="Preview do jogo da memoria"
              />
            </div>
            <div className="ctaContent">
              <p>Exercite sua memória com o tema dos Heróis</p>
              <Link className="btn btnPrimary" to="/jogo">
                Iniciar Jogo da Memória
              </Link>
            </div>
          </article>

          <article className="appCard" id="album-virtual">
            <div className="ctaContent">
              <h3>Álbum Virtual</h3>
            </div>
            <div
              className="sectionImage albumImage"
              role="img"
              aria-label="Preview do album de fotos"
            >
              <img
                className="appCardPreview albumCardPreview"
                src={cameraPreview}
                alt=""
                aria-hidden="true"
              />
            </div>
            <div className="ctaContent">
              <p>Guarde e compartilhe os momentos especiais da festa.</p>
              <Link className="btn btnPrimary" to="/album-de-fotos">
                Abrir Álbum Virtual
              </Link>
            </div>
          </article>

          <article className="appCard" id="contatos">
            <div className="ctaContent">
              <h3>Contato</h3>
            </div>
            <div className="sectionImage superHeitorImage">
              <img
                className="appCardPreview"
                src={contatoPreview}
                alt="Preview do contato"
              />
            </div>
            <div className="ctaContent">
              <p>
                Se você quer um app como esse para sua festa, entre em contato
                conosco.
              </p>
              <Link className="btn btnPrimary" to="/contatos">
                Acessar Contatos
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
