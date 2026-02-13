import { useState } from "react";
import superHeitor1 from "../assets/super-heitor/super-heitor-1.jpeg";
import superHeitor2 from "../assets/super-heitor/super-heitor-2.jpeg";
import superHeitor3 from "../assets/super-heitor/super-heitor-3.jpeg";
import superHeitor4 from "../assets/super-heitor/super-heitor-4.jpeg";
import superHeitor5 from "../assets/super-heitor/super-heitor-5.jpeg";
import superHeitor6 from "../assets/super-heitor/super-heitor-6.jpeg";

const superHeitorSlides = [
  superHeitor1,
  superHeitor2,
  superHeitor3,
  superHeitor4,
  superHeitor5,
  superHeitor6,
];

export default function SuperHeitor() {
  const [activeSlide, setActiveSlide] = useState(0);

  const showPrevSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? superHeitorSlides.length - 1 : current - 1,
    );
  };

  const showNextSlide = () => {
    setActiveSlide((current) =>
      current === superHeitorSlides.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div className="superHeitorPage">
      <section className="sectionCard superHeitorSection">
        <h2 className="page-title">Super Heitor</h2>
        <div className="superHeitorCarousel">
          <button
            className="superHeitorArrow"
            type="button"
            aria-label="Imagem anterior"
            onClick={showPrevSlide}
          >
            ❮
          </button>

          <div className="superHeitorFrame">
            <img
              key={activeSlide}
              className="superHeitorImage"
              src={superHeitorSlides[activeSlide]}
              alt={`Super Heitor ${activeSlide + 1}`}
            />
          </div>

          <button
            className="superHeitorArrow"
            type="button"
            aria-label="Proxima imagem"
            onClick={showNextSlide}
          >
            ❯
          </button>
        </div>
      </section>
    </div>
  );
}
