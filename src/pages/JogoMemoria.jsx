import { useEffect, useRef, useState } from "react";
import hero1 from "../assets/memory/hero1.jpeg";
import hero2 from "../assets/memory/hero2.jpeg";
import hero3 from "../assets/memory/hero3.jpeg";
import hero4 from "../assets/memory/hero4.jpeg";
import hero5 from "../assets/memory/hero5.jpeg";
import hero6 from "../assets/memory/hero6.jpeg";
import backImage from "../assets/memory/verso.jpeg";
import "./jogoMemoria.css";

const HEROES = [
  { id: "hero1", label: "Heroi 1", image: hero1 },
  { id: "hero2", label: "Heroi 2", image: hero2 },
  { id: "hero3", label: "Heroi 3", image: hero3 },
  { id: "hero4", label: "Heroi 4", image: hero4 },
  { id: "hero5", label: "Heroi 5", image: hero5 },
  { id: "hero6", label: "Heroi 6", image: hero6 },
];

const FLIP_BACK_DELAY = 700;
const MATCH_DELAY = 420;
const REMOVE_DELAY = 780;

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildDeck() {
  const pairs = HEROES.flatMap((hero) => [
    {
      id: `${hero.id}-a`,
      pairId: hero.id,
      label: hero.label,
      image: hero.image,
      state: "down",
    },
    {
      id: `${hero.id}-b`,
      pairId: hero.id,
      label: hero.label,
      image: hero.image,
      state: "down",
    },
  ]);
  return shuffle(pairs);
}

export default function JogoMemoria() {
  const [cards, setCards] = useState(() => buildDeck());
  const [openCards, setOpenCards] = useState([]);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(true);
  const timersRef = useRef([]);
  const cardsRef = useRef(cards);
  const openCardsRef = useRef(openCards);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    openCardsRef.current = openCards;
  }, [openCards]);

  useEffect(() => {
    startGame();
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  function resetTimers() {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }

  function startGame() {
    resetTimers();
    setStarted(true);
    setOpenCards([]);
    openCardsRef.current = [];
    setLocked(false);
    setCards(buildDeck());
  }

  function handleCardClick(cardId) {
    if (!started || locked) return;
    if (openCardsRef.current.length >= 2) return;

    const current = cardsRef.current.find((card) => card.id === cardId);
    if (!current || current.state !== "down") return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, state: "up" } : card
      )
    );

    setOpenCards((prev) => {
      if (prev.includes(cardId)) return prev;
      const next = [...prev, cardId];
      openCardsRef.current = next;
      if (next.length === 2) {
        evaluatePair(next);
      }
      return next;
    });
  }

  function evaluatePair([firstId, secondId]) {
    setLocked(true);
    const first = cardsRef.current.find((card) => card.id === firstId);
    const second = cardsRef.current.find((card) => card.id === secondId);

    if (!first || !second) {
      setOpenCards([]);
      openCardsRef.current = [];
      setLocked(false);
      return;
    }

    if (first.pairId === second.pairId) {
      const matchTimer = setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.pairId === first.pairId ? { ...card, state: "matched" } : card
          )
        );
      }, MATCH_DELAY);

      const removeTimer = setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.pairId === first.pairId ? { ...card, state: "removed" } : card
          )
        );
        setOpenCards([]);
        openCardsRef.current = [];
        setLocked(false);
      }, REMOVE_DELAY);

      timersRef.current.push(matchTimer, removeTimer);
      return;
    }

    const flipBackTimer = setTimeout(() => {
      setCards((prev) =>
        prev.map((card) =>
          card.id === firstId || card.id === secondId
            ? { ...card, state: "down" }
            : card
        )
      );
      setOpenCards([]);
      openCardsRef.current = [];
      setLocked(false);
    }, FLIP_BACK_DELAY);

    timersRef.current.push(flipBackTimer);
  }

  const isComplete =
    started && cards.length > 0 && cards.every((card) => card.state === "removed");

  return (
    <div className="memory-page">
      <div className="memory-header">
        <h1 className="page-title">Jogo da Memoria</h1>
        <p className="memory-sub">
          Toque nas cartas e encontre as imagens iguais.
        </p>
      </div>

      <div className="memory-board">
        <div className={`memory-grid ${locked ? "is-locked" : ""}`}>
          {cards.map((card) => {
            const isFlipped = card.state === "up" || card.state === "matched";
            const isRemoved = card.state === "removed";
            return (
              <button
                key={card.id}
                type="button"
                className={`card${isFlipped ? " is-flipped" : ""}${
                  isRemoved ? " is-removed" : ""
                }`}
                onClick={() => handleCardClick(card.id)}
                aria-label={`Carta ${card.label}`}
                aria-pressed={isFlipped}
                disabled={locked || isRemoved}
              >
                <span className="card-inner">
                  <span className="card-face card-back">
                    <img
                      className="card-img"
                      src={backImage}
                      alt="Verso da carta"
                    />
                  </span>
                  <span className="card-face card-front">
                    <img className="card-img" src={card.image} alt={card.label} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div
          className={`memory-celebration${isComplete ? " is-visible" : ""}`}
          aria-live="polite"
        >
          <div className="memory-celebration-card">
            🎉 Parabéns! Missão concluída, herói! 🦸‍♂️
          </div>
        </div>
      </div>

      <div className="memory-controls">
        <button className="btn btnPrimary" onClick={startGame} type="button">
          Reiniciar jogo
        </button>
      </div>
    </div>
  );
}
