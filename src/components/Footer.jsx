import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const EXIT_ANIMATION_MS = 350;

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [renderBackLink, setRenderBackLink] = useState(false);
  const [showBackLink, setShowBackLink] = useState(false);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    if (!isHome) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setRenderBackLink(true);
      setShowBackLink(true);
      return;
    }

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    const initialVisible = window.scrollY > 0;
    setRenderBackLink(initialVisible);
    setShowBackLink(initialVisible);

    let lastVisible = initialVisible;
    let ticking = false;

    const applyVisibility = (nextVisible) => {
      if (nextVisible) {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        setRenderBackLink(true);
        requestAnimationFrame(() => {
          setShowBackLink(true);
        });
      } else {
        setShowBackLink(false);
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
        exitTimerRef.current = setTimeout(() => {
          setRenderBackLink(false);
        }, EXIT_ANIMATION_MS);
      }
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const nextVisible = window.scrollY > 0;
        if (nextVisible !== lastVisible) {
          lastVisible = nextVisible;
          applyVisibility(nextVisible);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [isHome]);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="siteFooter">
      {renderBackLink ? (
        <Link
          className={`footerLink${showBackLink ? " footerLink--animated" : " footerLink--hidden"}`}
          to="/"
          onClick={handleBackToTop}
          aria-hidden={!showBackLink}
          tabIndex={showBackLink ? 0 : -1}
        >
          Voltar ao inicio
        </Link>
      ) : null}
    </footer>
  );
}
