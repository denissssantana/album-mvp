import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Album from "./pages/Album";
import JogoMemoria from "./pages/JogoMemoria";
import SuperHeitor from "./pages/SuperHeitor";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="appShell">
        <Header />
        <main className="appMain">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/super-heitor" element={<SuperHeitor />} />
            <Route path="/album" element={<Album />} />
            <Route path="/jogo" element={<JogoMemoria />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
