import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Album from "./pages/Album";
import JogoMemoria from "./pages/JogoMemoria";
import SuperHeitor from "./pages/SuperHeitor";
import Contatos from "./pages/Contatos";
import "./App.css";

const PhotoBooth = React.lazy(() => import("./pages/PhotoBooth"));

export default function App() {
  return (
    <BrowserRouter>
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
