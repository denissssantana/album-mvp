import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

const ALBUM_KEY = "album_mvp_step_v4_stack";
const MAX_PHOTOS = 6;

function loadState() {
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    if (!raw) return { photos: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.photos)) return { photos: [] };
    return { photos: parsed.photos };
  } catch {
    return { photos: [] };
  }
}

function safeSavePhotos(nextPhotos) {
  try {
    localStorage.setItem(ALBUM_KEY, JSON.stringify({ photos: nextPhotos }));
    return true;
  } catch (e) {
    console.error("LocalStorage save failed:", e);
    return false;
  }
}

function safeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function detectOrientationSafe(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width >= img.height ? "landscape" : "portrait");
    img.onerror = () => resolve("portrait");
    img.src = dataUrl;
  });
}

async function readFileAsDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadImage(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

async function compressImageDataUrl(
  dataUrl,
  { maxSide = 1280, quality = 0.78, mime = "image/jpeg" } = {}
) {
  const img = await loadImage(dataUrl);

  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;

  let w = w0;
  let h = h0;

  const biggest = Math.max(w0, h0);
  if (biggest > maxSide) {
    const scale = maxSide / biggest;
    w = Math.round(w0 * scale);
    h = Math.round(h0 * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL(mime, quality);
}

// ===== PDF helpers =====
const FRAME_COLORS = [
  [11, 94, 215],
  [255, 159, 67],
  [46, 204, 113],
  [155, 89, 182],
  [231, 76, 60],
  [52, 152, 219],
];

function fitRect(imgW, imgH, boxW, boxH) {
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;

  let w, h;
  if (imgRatio > boxRatio) {
    w = boxW;
    h = w / imgRatio;
  } else {
    h = boxH;
    w = h * imgRatio;
  }

  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}

async function makeFramedCardDataUrl(originalDataUrl, rgb) {
  const img = await loadImage(originalDataUrl);

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const border = Math.max(14, Math.round(Math.min(w, h) * 0.02));
  const padding = Math.max(18, Math.round(Math.min(w, h) * 0.03));

  const cardW = w + padding * 2;
  const cardH = h + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cardW, cardH);

  ctx.drawImage(img, padding, padding, w, h);

  ctx.lineWidth = border;
  ctx.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  ctx.strokeRect(padding, padding, w, h);

  return canvas.toDataURL("image/png");
}

async function rotateDataUrl(dataUrl, angleDeg) {
  const img = await loadImage(dataUrl);

  const angle = (angleDeg * Math.PI) / 180;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  const newW = Math.ceil(w * cos + h * sin);
  const newH = Math.ceil(w * sin + h * cos);

  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, newW, newH);

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2);

  return canvas.toDataURL("image/png");
}

function buildPdfBlobFromCards(cardDataUrls) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const BLUE = [11, 94, 215];
  const headerBarH = 14;
  const footerBarH = 12;
  const margin = 10;

  const cols = 2;
  const rows = 3;
  const gutter = 6;

  function paintHeaderFooter() {
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, headerBarH, "F");
    doc.rect(0, pageH - footerBarH, pageW, footerBarH, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Meu álbum com Heitor", pageW / 2, 9.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Festinha do Heitor", pageW / 2, pageH - 4, { align: "center" });
  }

  paintHeaderFooter();

  const gridTop = headerBarH + margin;
  const gridBottom = pageH - footerBarH - margin;

  const usableW = pageW - margin * 2;
  const usableH = gridBottom - gridTop;

  const cellW = (usableW - gutter * (cols - 1)) / cols;
  const cellH = (usableH - gutter * (rows - 1)) / rows;

  cardDataUrls.forEach((cardUrl, i) => {
    const pageIndex = Math.floor(i / (cols * rows));
    const indexInPage = i % (cols * rows);

    if (pageIndex > 0 && indexInPage === 0) {
      doc.addPage();
      paintHeaderFooter();
    }

    const r = Math.floor(indexInPage / cols);
    const c = indexInPage % cols;

    const x0 = margin + c * (cellW + gutter);
    const y0 = gridTop + r * (cellH + gutter);

    const pad = 2.5;
    const boxW = cellW - pad * 2;
    const boxH = cellH - pad * 2;

    const props = doc.getImageProperties(cardUrl);
    const placed = fitRect(props.width, props.height, boxW, boxH);

    const drawX = x0 + pad + placed.x;
    const drawY = y0 + pad + placed.y;

    doc.addImage(cardUrl, "PNG", drawX, drawY, placed.w, placed.h);
  });

  return doc.output("blob");
}

// ===== App =====
export default function App() {
  const [photos, setPhotos] = useState(() => loadState().photos);

  const fileInputAddRef = useRef(null);
  const fileInputSwapRef = useRef(null);
  const [swapId, setSwapId] = useState(null);

  const [view, setView] = useState("album"); // "album" | "pdf"
  const [pdfUrl, setPdfUrl] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const count = photos.length;
  const isLimitReached = count >= MAX_PHOTOS;
  const addBtnText = count === 0 ? "Adicionar uma foto" : "Adicionar próxima foto";

  function persist(nextPhotos) {
    const ok = safeSavePhotos(nextPhotos);
    if (!ok) {
      alert(
        "Seu celular ficou sem espaço para salvar as fotos (limite do navegador). " +
          "Dica: apague o álbum (Limpar meu álbum)."
      );
      return false;
    }
    setPhotos(nextPhotos);
    return true;
  }

  function clearAlbum() {
    if (!confirm("Apagar TODAS as suas fotos?")) return;
    persist([]);
  }

  function addNextPhoto() {
    if (isLimitReached) return;
    fileInputAddRef.current?.click();
  }

  async function onAddFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      if (!file.type.startsWith("image/")) {
        alert("Escolha uma imagem.");
        return;
      }

      if (photos.length + 1 > MAX_PHOTOS) {
        alert(`Limite de ${MAX_PHOTOS} fotos atingido.`);
        return;
      }

      const rawDataUrl = await readFileAsDataUrl(file);
      const dataUrl = await compressImageDataUrl(rawDataUrl, {
        maxSide: 1280,
        quality: 0.78,
        mime: "image/jpeg",
      });

      const type = await detectOrientationSafe(dataUrl);

      const nextPhotos = [
        ...photos,
        { id: safeId(), dataUrl, type, createdAt: Date.now() },
      ];

      persist(nextPhotos);
    } catch (err) {
      console.error("onAddFileChange error:", err);
      alert("Falha ao adicionar foto no celular. Vamos ajustar.");
    }
  }

  function askRemovePhoto(id) {
    if (!confirm("Remover esta foto?")) return;
    persist(photos.filter((p) => p.id !== id));
  }

  function askSwapPhoto(id) {
    setSwapId(id);
    fileInputSwapRef.current?.click();
  }

  async function onSwapFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !swapId) return;

    try {
      if (!file.type.startsWith("image/")) {
        alert("Escolha uma imagem.");
        setSwapId(null);
        return;
      }

      const rawDataUrl = await readFileAsDataUrl(file);
      const dataUrl = await compressImageDataUrl(rawDataUrl, {
        maxSide: 1280,
        quality: 0.78,
        mime: "image/jpeg",
      });

      const type = await detectOrientationSafe(dataUrl);

      const next = photos.map((p) =>
        p.id === swapId ? { ...p, dataUrl, type, createdAt: Date.now() } : p
      );

      setSwapId(null);
      persist(next);
    } catch (err) {
      console.error("onSwapFileChange error:", err);
      alert("Falha ao trocar foto no celular. Vamos ajustar.");
      setSwapId(null);
    }
  }

  async function openPdfView() {
    if (photos.length === 0) {
      alert("Adicione pelo menos 1 foto.");
      return;
    }

    try {
      const angle = 15;
      const cards = [];

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const rgb = FRAME_COLORS[i % FRAME_COLORS.length];

        const card = await makeFramedCardDataUrl(p.dataUrl, rgb);

        const col = i % 2;
        const ang = col === 0 ? -angle : angle;

        const rotatedCard = await rotateDataUrl(card, ang);
        cards.push(rotatedCard);
      }

      const blob = buildPdfBlobFromCards(cards);
      const url = URL.createObjectURL(blob);

      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setView("pdf");

      // ✅ MOBILE: abre no viewer nativo do Chrome/Android
      if (isMobile) {
        window.open(url, "_blank");
      }
    } catch (e) {
      console.error("PDF error:", e);
      alert("Falha ao gerar o PDF. Vamos ajustar.");
    }
  }

  function backToAlbum() {
    setView("album");
  }

  function downloadPdfAndReturn() {
    if (!pdfUrl) return;

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "meu-album-com-heitor.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setView("album");
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Aniversário do HEITOR</h1>
          <p>
            Suas fotos: <b>{count}</b> / {MAX_PHOTOS}
          </p>
        </div>

        <button className="btn btnGhost" onClick={clearAlbum}>
          Limpar meu álbum
        </button>
      </header>

      <input
        ref={fileInputAddRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={onAddFileChange}
      />

      <input
        ref={fileInputSwapRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={onSwapFileChange}
      />

      <main className="main">
        <div className="container">
          {view === "album" ? (
            <>
              <div className="hint">Minhas fotos ({count})</div>

              {photos.length === 0 ? (
                <div className="card">
                  <div className="cardTop">Seu álbum está vazio</div>
                  <div className="previewArea portrait">
                    <div className="placeholder">
                      Clique no botão abaixo para tirar/enviar sua primeira foto
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid">
                  {photos.map((p, idx) => (
                    <div className="card" key={p.id}>
                      <div className="cardTop">
                        Foto {idx + 1} •{" "}
                        {p.type === "portrait" ? "Vertical" : "Horizontal"}
                      </div>

                      <div className={`previewArea ${p.type}`}>
                        <img
                          className="previewImg framedImg"
                          style={{
                            "--frame": `rgb(${FRAME_COLORS[idx % 6].join(",")})`,
                          }}
                          src={p.dataUrl}
                          alt={`Foto ${idx + 1}`}
                        />
                      </div>

                      <div className="photoBar">
                        <button
                          className="btn btnSecondary"
                          onClick={() => askSwapPhoto(p.id)}
                        >
                          Trocar foto
                        </button>
                        <button
                          className="btn btnSecondary"
                          onClick={() => askRemovePhoto(p.id)}
                        >
                          Remover foto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="pdfWrap">
              {/* ✅ Desktop: preview no iframe / Mobile: texto simples (pq abre em nova aba) */}
              {!isMobile ? (
                pdfUrl ? (
                  <iframe className="pdfFrame" title="PDF do álbum" src={pdfUrl} />
                ) : (
                  <div className="card">
                    <div className="cardTop">Gerando PDF…</div>
                    <div className="placeholder">Aguarde…</div>
                  </div>
                )
              ) : (
                <div className="card">
                  <div className="cardTop">PDF pronto ✅</div>
                  <div className="placeholder">
                    O PDF foi aberto em outra aba do Chrome.
                    <br />
                    Se não abriu, toque em <b>Baixar</b>.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {view === "album" ? (
          <div className="bottomBar">
            {isLimitReached ? (
              <button className="btn btnPrimary bigAdd" onClick={openPdfView}>
                Visualizar álbum completo
              </button>
            ) : (
              <button className="btn btnPrimary bigAdd" onClick={addNextPhoto}>
                {addBtnText}
              </button>
            )}
          </div>
        ) : (
          <div className="bottomBar">
            <div className="pdfActions">
              <button className="btn btnSecondary" onClick={backToAlbum}>
                Voltar
              </button>
              <button className="btn btnPrimary" onClick={downloadPdfAndReturn}>
                Baixar
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">Desenvolvido por Denis Santana</footer>
    </div>
  );
}
