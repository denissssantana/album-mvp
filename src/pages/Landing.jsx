import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landingPage">
      <section className="hero">
        <div className="heroContent">
          <span className="heroKicker">Celebração especial</span>
          <h1>1 Aninho do Heitor</h1>
          <p className="heroText">
            Um espaço simples e carinhoso para guardar memórias, brincar e
            compartilhar fotos com a família.
          </p>
          <div className="heroActions">
            <Link className="btn btnPrimary" to="/album">
              Abrir álbum
            </Link>
            <Link className="btn btnSecondary" to="/jogo">
              Jogo da memória
            </Link>
          </div>
        </div>
      </section>

      <section className="sectionCard infoSection">
        <div
          className="sectionImage infoImage"
          role="img"
          aria-label="Ilustração de momentos em família"
        />
        <h2>Momentos que ficam</h2>
        <p>
          Organize as fotos do aniversário em um álbum virtual leve, pensado
          para celulares e fácil de usar.
        </p>
      </section>

      <section className="sectionCard ctaSection">
        <div
          className="sectionImage gameImage"
          role="img"
          aria-label="Ilustração do jogo da memória"
        />
        <div className="ctaContent">
          <h2>Jogo da Memória</h2>
          <p>Uma brincadeira rápida para animar a festa. Em breve!</p>
          <Link className="btn btnPrimary" to="/jogo">
            Iniciar
          </Link>
        </div>
      </section>

      <section className="sectionCard ctaSection">
        <div
          className="sectionImage albumImage"
          role="img"
          aria-label="Ilustração do álbum de fotos"
        />
        <div className="ctaContent">
          <h2>Álbum de Fotos</h2>
          <p>Adicione fotos, gere o collage e compartilhe com quem você ama.</p>
          <Link className="btn btnPrimary" to="/album">
            Iniciar
          </Link>
        </div>
      </section>
    </div>
  );
}
