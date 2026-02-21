import { useState } from "react";
import superHeitor1 from "../assets/super-heitor/super-heitor-1.png";
import superHeitor2 from "../assets/super-heitor/super-heitor-2.png";
import superHeitor3 from "../assets/super-heitor/super-heitor-3.png";
import superHeitor4 from "../assets/super-heitor/super-heitor-4.png";
import superHeitor5 from "../assets/super-heitor/super-heitor-5.png";
import superHeitor6 from "../assets/super-heitor/super-heitor-6.png";
import superHeitor7 from "../assets/super-heitor/super-heitor-7.png";
import superHeitor8 from "../assets/super-heitor/super-heitor-8.png";
import superHeitor9 from "../assets/super-heitor/super-heitor-9.png";
import superHeitor10 from "../assets/super-heitor/super-heitor-10.png";
import superHeitor11 from "../assets/super-heitor/super-heitor-11.png";

const superHeitorHeroes = [
  { id: "heitor-1", name: "HEITOR", image: superHeitor1 },
  { id: "heitor-2", name: "HEITOR", image: superHeitor2 },
  { id: "heitor-3", name: "HEITOR", image: superHeitor3 },
  { id: "heitor-4", name: "HEITOR", image: superHeitor4 },
  { id: "heitor-5", name: "HEITOR", image: superHeitor5 },
  { id: "heitor-6", name: "HEITOR", image: superHeitor6 },
  { id: "heitor-7", name: "HEITOR", image: superHeitor7 },
  { id: "heitor-8", name: "HEITOR", image: superHeitor8 },
  { id: "heitor-9", name: "HEITOR", image: superHeitor9 },
  { id: "heitor-10", name: "HEITOR", image: superHeitor10 },
  { id: "heitor-11", name: "HEITOR", image: superHeitor11 },
];

export default function SuperHeitor() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");

  const totalSlides = superHeitorHeroes.length;
  const hasSlides = totalSlides > 0;
  const getWrappedIndex = (index) => {
    if (totalSlides === 0) return 0;
    return (index + totalSlides) % totalSlides;
  };

  const showPrevSlide = () => {
    if (!hasSlides) return;
    setSlideDirection("prev");
    setActiveSlide((current) =>
      current === 0 ? superHeitorHeroes.length - 1 : current - 1,
    );
  };

  const showNextSlide = () => {
    if (!hasSlides) return;
    setSlideDirection("next");
    setActiveSlide((current) =>
      current === superHeitorHeroes.length - 1 ? 0 : current + 1,
    );
  };

  const prevSlideIndex = getWrappedIndex(activeSlide - 1);
  const nextSlideIndex = getWrappedIndex(activeSlide + 1);
  const activeHero = hasSlides ? superHeitorHeroes[activeSlide] : null;
  const prevHero = hasSlides ? superHeitorHeroes[prevSlideIndex] : null;
  const nextHero = hasSlides ? superHeitorHeroes[nextSlideIndex] : null;

  return (
    <div className="superHeitorPage">
      <section className="sectionCard superHeitorSection">
        <h2 className="page-title">Super Heitor</h2>
        <p className="superHeitorSubtitle">
          Navegue pelas várias versões de Heitor lutando contra o crime.
        </p>
        <div className="superHeitorCarousel">
          <button
            className="superHeitorArrow"
            type="button"
            aria-label="Imagem anterior"
            onClick={showPrevSlide}
            disabled={!hasSlides}
          >
            ❮
          </button>

          <div className="superHeitorCardMid">
            <div className="superHeitorFrame">
              {hasSlides ? (
                <div className={`superHeitorTrack superHeitorTrack--${slideDirection}`}>
                  <div className="superHeitorCard superHeitorCard--side superHeitorCard--prev">
                    <img
                      className="superHeitorImage superHeitorImage--side"
                      src={prevHero.image}
                      alt={`Super Heitor ${prevSlideIndex + 1}`}
                    />
                  </div>

                  <div className="superHeitorCard superHeitorCard--active">
                    <img
                      key={`${activeSlide}-${slideDirection}`}
                      className={`superHeitorImage superHeitorImage--active superHeitorImage--${slideDirection}`}
                      src={activeHero.image}
                      alt={`Super Heitor ${activeSlide + 1}`}
                    />
                  </div>

                  <div className="superHeitorCard superHeitorCard--side superHeitorCard--next">
                    <img
                      className="superHeitorImage superHeitorImage--side"
                      src={nextHero.image}
                      alt={`Super Heitor ${nextSlideIndex + 1}`}
                    />
                  </div>
                </div>
              ) : (
                <p className="superHeitorEmpty">Nenhuma imagem disponivel.</p>
              )}
            </div>
            {hasSlides ? (
              <div
                key={`${activeHero.id}-${slideDirection}`}
                className={`superHeitorNameCard superHeitorNameCard--${slideDirection}`}
              >
                <span className="superHeitorName">{activeHero.name}</span>
              </div>
            ) : null}
          </div>

          <button
            className="superHeitorArrow"
            type="button"
            aria-label="Proxima imagem"
            onClick={showNextSlide}
            disabled={!hasSlides}
          >
            ❯
          </button>
        </div>
      </section>
    </div>
  );
}
