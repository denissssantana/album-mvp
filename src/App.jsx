import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Album from "./pages/Album";
import JogoMemoria from "./pages/JogoMemoria";
import SuperHeitor from "./pages/SuperHeitor";
import Contatos from "./pages/Contatos";
import "./App.css";

const PhotoBooth = React.lazy(() => import("./pages/PhotoBooth"));

function ScrollToLandingHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return undefined;

    const scrollToTarget = () => {
      if (!location.hash || location.hash === "#topo") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const target = document.querySelector(location.hash);
      if (!target) return;

      const headerHeight =
        document.querySelector(".siteHeader")?.getBoundingClientRect().height ?? 0;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    };

    const timeoutId = window.setTimeout(scrollToTarget, 0);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.hash]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToLandingHash />
      <div className="appShell">
        <Header />
        <main className="appMain">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/super-heitor" element={<SuperHeitor />} />
              <Route path="/album" element={<Album />} />
              <Route path="/album-de-fotos" element={<PhotoBooth />} />
              <Route path="/jogo" element={<JogoMemoria />} />
              <Route path="/contatos" element={<Contatos />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
