import { useEffect, useRef, useState } from "react";
import frame1 from "../assets/frames/mold-v-amarela.png";
import frame2 from "../assets/frames/mold-v-azul.png";
import frame3 from "../assets/frames/mold-v-laranja.png";
import "./PhotoBooth.css";

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToJpegBlob(canvas, quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar JPEG"));
      },
      "image/jpeg",
      quality
    );
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function getInitialSaveCounter() {
  try {
    const raw = window.localStorage.getItem("photoBoothSaveCounter");
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1) return Math.floor(parsed);
  } catch {
    return 1;
  }
  return 1;
}

export default function PhotoBooth() {
  const [photo, setPhoto] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState("frame-1");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [step, setStep] = useState("captura");
  const [status, setStatus] = useState("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const activePhotoUrlRef = useRef(null);
  const previewViewportRef = useRef(null);
  const saveSequenceRef = useRef(getInitialSaveCounter());
  const pointersRef = useRef(new Map());
  const pinchRef = useRef({ active: false, startDistance: 0, startScale: 1 });
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const frameItems = [
    { id: "frame-1", label: "Moldura 1", src: frame1, windowBox: { x: 28, y: 28, w: 244, h: 344, r: 18 } },
    { id: "frame-2", label: "Moldura 2", src: frame2, windowBox: { x: 34, y: 34, w: 232, h: 332, r: 16 } },
    { id: "frame-3", label: "Moldura 3", src: frame3, windowBox: { x: 24, y: 24, w: 252, h: 352, r: 20 } },
  ];
  const activeFrame =
    frameItems.find((frame) => frame.id === selectedFrame) || frameItems[0];
  const selectedFrameIndex = Math.max(
    0,
    frameItems.findIndex((frame) => frame.id === activeFrame.id)
  );

  useEffect(() => {
    return () => {
      if (activePhotoUrlRef.current) {
        URL.revokeObjectURL(activePhotoUrlRef.current);
        activePhotoUrlRef.current = null;
      }
    };
  }, []);

  function openCameraCapture() {
    fileInputRef.current?.click();
  }

  function handleRetakePhoto() {
    setStep("captura");
    setStatus(photo ? "editing" : "idle");
    openCameraCapture();
  }

  async function detectOrientation(fileUrl) {
    try {
      const img = await loadImageElement(fileUrl);
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      return w > h ? "landscape" : "portrait";
    } catch {
      return "portrait";
    }
  }

  async function onPhotoCaptureChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    if (activePhotoUrlRef.current) {
      URL.revokeObjectURL(activePhotoUrlRef.current);
      activePhotoUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    const orientation = await detectOrientation(previewUrl);
    activePhotoUrlRef.current = previewUrl;
    setPhoto({ file, previewUrl, orientation });
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(orientation === "landscape" ? 90 : 0);
    setSelectedFrame(frameItems[0].id);
    setStep("moldura");
    setStatus("editing");
  }

  function handleZoom(delta) {
    setScale((prev) => Math.min(3, Math.max(0.8, Number((prev + delta).toFixed(2)))));
  }

  function onPhotoPointerDown(e) {
    if (!photo) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      pinchRef.current = {
        active: true,
        startDistance: Math.hypot(dx, dy) || 1,
        startScale: scale,
      };
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      setIsDragging(false);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPhotoPointerMove(e) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (!pinchRef.current.active) {
        pinchRef.current = {
          active: true,
          startDistance: distance,
          startScale: scale,
        };
      } else {
        const nextScale = pinchRef.current.startScale * (distance / pinchRef.current.startDistance);
        setScale(Math.min(3, Math.max(0.8, Number(nextScale.toFixed(2)))));
      }
      return;
    }

    if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.round(dragRef.current.originX + dx),
      y: Math.round(dragRef.current.originY + dy),
    });
  }

  function onPhotoPointerEnd(e) {
    pointersRef.current.delete(e.pointerId);
    if (dragRef.current.pointerId === e.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      setIsDragging(false);
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current.active = false;
    }
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function rotatePhoto() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function selectFrameByOffset(offset) {
    const nextIndex = (selectedFrameIndex + offset + frameItems.length) % frameItems.length;
    setSelectedFrame(frameItems[nextIndex].id);
  }

  async function buildFinalJpegForOutput() {
    if (!photo) return null;

    const viewportW = previewViewportRef.current?.clientWidth || 300;
    const viewportH = previewViewportRef.current?.clientHeight || 450;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setIsDragging(false);

    let canvas = null;

    try {
      const [photoImg, frameImg] = await Promise.all([
        loadImageElement(photo.previewUrl),
        loadImageElement(activeFrame.src),
      ]);

      const fw = frameImg.naturalWidth || frameImg.width || 300;
      const fh = frameImg.naturalHeight || frameImg.height || 400;
      const outH = 1600;
      const outW = Math.max(1, Math.round((fw / fh) * outH));

      canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponivel");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);

      const wb = activeFrame.windowBox || { x: 24, y: 24, w: 252, h: 352, r: 20 };
      const clipX = Math.round((wb.x / 300) * outW);
      const clipY = Math.round((wb.y / 400) * outH);
      const clipW = Math.round((wb.w / 300) * outW);
      const clipH = Math.round((wb.h / 400) * outH);
      const clipR = Math.round((wb.r / 300) * outW);

      ctx.save();
      roundRectPath(ctx, clipX, clipY, clipW, clipH, clipR);
      ctx.clip();

      const iw = photoImg.naturalWidth || photoImg.width;
      const ih = photoImg.naturalHeight || photoImg.height;
      const rotationTurns = Math.abs(((rotation % 360) + 360) % 360);
      const rotates90 = rotationTurns === 90 || rotationTurns === 270;
      const effectiveW = rotates90 ? ih : iw;
      const effectiveH = rotates90 ? iw : ih;
      const baseCover = Math.max(clipW / effectiveW, clipH / effectiveH);

      const drawW = iw * baseCover;
      const drawH = ih * baseCover;
      const tx = (position.x / Math.max(1, viewportW)) * clipW;
      const ty = (position.y / Math.max(1, viewportH)) * clipH;
      const centerX = clipX + clipW / 2 + tx;
      const centerY = clipY + clipH / 2 + ty;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      ctx.drawImage(frameImg, 0, 0, outW, outH);

      const blob = await canvasToJpegBlob(canvas, 0.9);
      return blob;
    } catch (err) {
      throw err;
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  async function handleSendToHeitor() {
    if (!photo || status === "exporting") return;
    setStatus("exporting");
    try {
      const blob = await buildFinalJpegForOutput();
      if (!blob) return;

      if (!navigator.share) {
        alert("Compartilhamento não disponível neste aparelho.");
        return;
      }

      const file = new File([blob], "foto-com-moldura.jpg", { type: "image/jpeg" });
      const shareData = {
        title: "Foto para Heitor",
        text: "Foto com moldura do aniversario do Heitor",
        files: [file],
      };

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        alert("Compartilhamento de imagem não disponível neste aparelho.");
        return;
      }
      await navigator.share(shareData);
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("PhotoBooth share error:", err);
        alert("Falha ao enviar para Heitor.");
      }
    } finally {
      setStatus("editing");
    }
  }

  async function handleSavePhoto() {
    if (!photo || status === "exporting") return;
    setStatus("exporting");
    try {
      const blob = await buildFinalJpegForOutput();
      if (!blob) return;
      const fileName = `foto_${saveSequenceRef.current}.jpg`;

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "Imagem JPEG",
              accept: { "image/jpeg": [".jpg", ".jpeg"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
      saveSequenceRef.current += 1;
      try {
        window.localStorage.setItem("photoBoothSaveCounter", String(saveSequenceRef.current));
      } catch {
        // no-op
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("PhotoBooth save error:", err);
        alert("Falha ao salvar a foto.");
      }
    } finally {
      setStatus("editing");
    }
  }

  return (
    <div className="albumPage photoBoothPage" data-status={status}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoCaptureChange}
        className="photoBooth__fileInput"
      />

      <main className="albumMain">
        <div
          className={`container photoBooth__containerRoot${
            step === "moldura" && photo ? " photoBooth__containerRoot--editing" : " photoBooth__containerRoot--capture"
          }`}
        >
          <div className="photoBooth__topCopy">
            <h1 className="page-title albumPageTitle">Álbum de Fotos</h1>
            <p className="superHeitorSubtitle photoBooth__headline">
              Tire uma foto, guarde pra você e mande para Heitor
            </p>
          </div>

          {step !== "moldura" || !photo ? (
            <div className="photoBooth__idleCenter">
              <button
                type="button"
                className="btn btnPrimary bigAdd photoBooth__captureBtn"
                onClick={openCameraCapture}
              >
                Tirar uma foto
              </button>
            </div>
          ) : null}

          {step === "moldura" && photo && (
            <div className="photoBooth__stageMain">
              <div className="photoBooth__stageWrap">
                <button
                  type="button"
                  className="superHeitorArrow photoBooth__frameArrow photoBooth__frameArrow--left"
                  onClick={() => selectFrameByOffset(-1)}
                  aria-label="Moldura anterior"
                >
                  ❮
                </button>

                <div
                  className={`photoBooth__photoViewport photoBooth__singlePreview${
                    isDragging ? " isDragging" : ""
                  }`}
                  ref={previewViewportRef}
                  onPointerDown={onPhotoPointerDown}
                  onPointerMove={onPhotoPointerMove}
                  onPointerUp={onPhotoPointerEnd}
                  onPointerCancel={onPhotoPointerEnd}
                >
                  <img
                    className="photoBooth__editingPhotoImage"
                    src={photo.previewUrl}
                    alt="Foto capturada"
                    draggable={false}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                    }}
                  />

                  <div className="photoBooth__frameOverlay" aria-hidden="true">
                    <img className="photoBooth__frameOverlayImage" src={activeFrame.src} alt="" />
                  </div>
                </div>

                <button
                  type="button"
                  className="superHeitorArrow photoBooth__frameArrow photoBooth__frameArrow--right"
                  onClick={() => selectFrameByOffset(1)}
                  aria-label="Próxima moldura"
                >
                  ❯
                </button>
              </div>
            </div>
          )}
        </div>

        {step === "moldura" && photo ? (
          <div className="bottomBar photoBooth__editingBar">
            <div className="collageActions">
              <button
                type="button"
                className="btn btnSecondary"
                onClick={handleRetakePhoto}
                disabled={status === "exporting"}
              >
                Nova foto
              </button>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={handleSavePhoto}
                disabled={!photo || status === "exporting"}
              >
                Salvar
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={handleSendToHeitor}
                disabled={!photo || status === "exporting"}
              >
                Enviar para Heitor
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
