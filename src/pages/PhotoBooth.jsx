import { useEffect, useRef, useState } from "react";
import frame1 from "../assets/frames/mold-v-amarela.png";
import frame2 from "../assets/frames/mold-v-azul.png";
import frame3 from "../assets/frames/mold-v-laranja.png";
import "./PhotoBooth.css";

const FRAME_ART_SIZE = { w: 720, h: 1280 };
const FRAME_PHOTO_MASK = { x: 168, y: 334, w: 368, h: 500, r: 0 };
const INITIAL_PHOTO_SCALE = 0.94;

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToJpegBlob(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar imagem"));
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

function getNormalizedRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function getPhotoDrawMetrics(photoMeta, rotation, targetW, targetH) {
  const iw = photoMeta?.width || 0;
  const ih = photoMeta?.height || 0;
  if (!iw || !ih || !targetW || !targetH) return { drawW: targetW, drawH: targetH };

  const normalizedRotation = getNormalizedRotation(rotation);
  const rotates90 = normalizedRotation === 90 || normalizedRotation === 270;
  const effectiveW = rotates90 ? ih : iw;
  const effectiveH = rotates90 ? iw : ih;
  const baseCover = Math.max(targetW / effectiveW, targetH / effectiveH);

  return {
    drawW: iw * baseCover,
    drawH: ih * baseCover,
  };
}

function getOpaqueBoundsFromImage(img) {
  const width = img.naturalWidth || img.width || 0;
  const height = img.naturalHeight || img.height || 0;
  if (!width || !height) {
    return { x: 0, y: 0, w: FRAME_ART_SIZE.w, h: FRAME_ART_SIZE.h };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, w: width, h: height };

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, w: width, h: height };
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
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

async function resizeCapturedPhoto(file, { maxHeight = 1280, quality = 0.85 } = {}) {
  const sourceUrl = URL.createObjectURL(file);
  let canvas = null;

  try {
    const img = await loadImageElement(sourceUrl);
    const sourceW = img.naturalWidth || img.width || 0;
    const sourceH = img.naturalHeight || img.height || 0;
    if (!sourceW || !sourceH) {
      throw new Error("Falha ao ler dimensoes da foto");
    }

    const ratio = Math.min(1, maxHeight / sourceH);
    const targetW = Math.max(1, Math.round(sourceW * ratio));
    const targetH = Math.max(1, Math.round(sourceH * ratio));

    canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponivel");

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToJpegBlob(canvas, quality);
    const previewUrl = URL.createObjectURL(blob);
    return { blob, previewUrl };
  } finally {
    URL.revokeObjectURL(sourceUrl);
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
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
  const [previewMaskSize, setPreviewMaskSize] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef(null);
  const activePhotoUrlRef = useRef(null);
  const previewViewportRef = useRef(null);
  const saveSequenceRef = useRef(getInitialSaveCounter());
  const frameMetricsCacheRef = useRef(new Map());
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
    { id: "frame-1", label: "Moldura 1", src: frame1, frameBox: FRAME_ART_SIZE, photoBox: FRAME_PHOTO_MASK },
    { id: "frame-2", label: "Moldura 2", src: frame2, frameBox: FRAME_ART_SIZE, photoBox: FRAME_PHOTO_MASK },
    { id: "frame-3", label: "Moldura 3", src: frame3, frameBox: FRAME_ART_SIZE, photoBox: FRAME_PHOTO_MASK },
  ];
  const activeFrame =
    frameItems.find((frame) => frame.id === selectedFrame) || frameItems[0];
  const selectedFrameIndex = Math.max(
    0,
    frameItems.findIndex((frame) => frame.id === activeFrame.id)
  );
  const [frameMetricsById, setFrameMetricsById] = useState({});

  useEffect(() => {
    return () => {
      if (activePhotoUrlRef.current) {
        URL.revokeObjectURL(activePhotoUrlRef.current);
        activePhotoUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;

    const syncSize = () => {
      setPreviewMaskSize({
        width: el.clientWidth || 0,
        height: el.clientHeight || 0,
      });
    };

    syncSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        syncSize();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, [step, photo, selectedFrame]);

  useEffect(() => {
    let cancelled = false;

    if (step === "captura") {
      return;
    }

    async function ensureFrameMetrics(frame) {
      if (!frame) return;
      if (frameMetricsCacheRef.current.has(frame.id)) return;
      try {
        const frameImg = await loadImageElement(frame.src);
        if (cancelled) return;
        const frameBox = {
          w: frameImg.naturalWidth || frameImg.width || frame.frameBox?.w || FRAME_ART_SIZE.w,
          h: frameImg.naturalHeight || frameImg.height || frame.frameBox?.h || FRAME_ART_SIZE.h,
        };
        const outerBox = getOpaqueBoundsFromImage(frameImg);
        const metrics = { frameBox, outerBox };
        frameMetricsCacheRef.current.set(frame.id, metrics);
        setFrameMetricsById((prev) => (prev[frame.id] ? prev : { ...prev, [frame.id]: metrics }));
      } catch {
        const safeFrameBox = frame.frameBox || FRAME_ART_SIZE;
        const metrics = {
          frameBox: safeFrameBox,
          outerBox: { x: 0, y: 0, w: safeFrameBox.w, h: safeFrameBox.h },
        };
        frameMetricsCacheRef.current.set(frame.id, metrics);
        setFrameMetricsById((prev) => (prev[frame.id] ? prev : { ...prev, [frame.id]: metrics }));
      }
    }

    ensureFrameMetrics(activeFrame);

    return () => {
      cancelled = true;
    };
  }, [activeFrame.id, activeFrame.src, step]);

  function openCameraCapture() {
    fileInputRef.current?.click();
  }

  function handleRetakePhoto() {
    setStep("captura");
    setStatus(photo ? "editing" : "idle");
    openCameraCapture();
  }

  async function detectPhotoMeta(fileUrl) {
    try {
      const img = await loadImageElement(fileUrl);
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      return {
        width: w,
        height: h,
        orientation: w > h ? "landscape" : "portrait",
      };
    } catch {
      return {
        width: 0,
        height: 0,
        orientation: "portrait",
      };
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

    let processedFile = file;
    let previewUrl = null;

    try {
      // Downscale camera captures before preview/editing to avoid keeping multi-MP images in memory.
      const resized = await resizeCapturedPhoto(file, { maxHeight: 1280, quality: 0.85 });
      processedFile = resized.blob;
      previewUrl = resized.previewUrl;
    } catch (err) {
      console.warn("PhotoBooth resize fallback:", err);
      previewUrl = URL.createObjectURL(file);
    }

    const meta = await detectPhotoMeta(previewUrl);
    activePhotoUrlRef.current = previewUrl;
    setPhoto({
      file: processedFile,
      previewUrl,
      orientation: meta.orientation,
      width: meta.width,
      height: meta.height,
    });
    setScale(INITIAL_PHOTO_SCALE);
    setPosition({ x: 0, y: 0 });
    setRotation(meta.orientation === "landscape" ? 90 : 0);
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
    const viewportH = previewViewportRef.current?.clientHeight || 400;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setIsDragging(false);

    let canvas = null;

    try {
      const [photoImg, frameImg] = await Promise.all([
        loadImageElement(photo.previewUrl),
        loadImageElement(activeFrame.src),
      ]);

      const frameBox = {
        w: frameImg.naturalWidth || frameImg.width || activeFrame.frameBox?.w || FRAME_ART_SIZE.w,
        h: frameImg.naturalHeight || frameImg.height || activeFrame.frameBox?.h || FRAME_ART_SIZE.h,
      };
      const cachedMetrics = frameMetricsCacheRef.current.get(activeFrame.id);
      const outerBox = cachedMetrics?.outerBox || getOpaqueBoundsFromImage(frameImg);
      if (!cachedMetrics) {
        const metrics = { frameBox, outerBox };
        frameMetricsCacheRef.current.set(activeFrame.id, metrics);
        setFrameMetricsById((prev) => ({ ...prev, [activeFrame.id]: metrics }));
      }

      const outW = outerBox.w;
      const outH = outerBox.h;

      canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponivel");

      ctx.clearRect(0, 0, outW, outH);

      const pb = activeFrame.photoBox || FRAME_PHOTO_MASK;
      const clipX = Math.round(pb.x - outerBox.x);
      const clipY = Math.round(pb.y - outerBox.y);
      const clipW = Math.round(pb.w);
      const clipH = Math.round(pb.h);
      const clipR = Math.round(pb.r);

      ctx.save();
      if (clipR > 0) {
        roundRectPath(ctx, clipX, clipY, clipW, clipH, clipR);
        ctx.clip();
      } else {
        ctx.beginPath();
        ctx.rect(clipX, clipY, clipW, clipH);
        ctx.clip();
      }

      const { drawW, drawH } = getPhotoDrawMetrics(
        {
          width: photo.width || photoImg.naturalWidth || photoImg.width,
          height: photo.height || photoImg.naturalHeight || photoImg.height,
        },
        rotation,
        clipW,
        clipH
      );
      const tx = (position.x / Math.max(1, viewportW)) * clipW;
      const ty = (position.y / Math.max(1, viewportH)) * clipH;
      const centerX = clipX + clipW / 2 + tx;
      const centerY = clipY + clipH / 2 + ty;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      ctx.drawImage(frameImg, outerBox.x, outerBox.y, outerBox.w, outerBox.h, 0, 0, outW, outH);

      const blob = await canvasToJpegBlob(canvas);
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

  const frameMetrics = frameMetricsById[activeFrame.id];
  const frameBase = frameMetrics?.frameBox || activeFrame.frameBox || FRAME_ART_SIZE;
  const outerBox = frameMetrics?.outerBox || { x: 0, y: 0, w: frameBase.w, h: frameBase.h };
  const photoBox = activeFrame.photoBox || FRAME_PHOTO_MASK;
  const framePreviewStyle = {
    "--photo-mask-left": `${((photoBox.x - outerBox.x) / outerBox.w) * 100}%`,
    "--photo-mask-top": `${((photoBox.y - outerBox.y) / outerBox.h) * 100}%`,
    "--photo-mask-width": `${(photoBox.w / outerBox.w) * 100}%`,
    "--photo-mask-height": `${(photoBox.h / outerBox.h) * 100}%`,
    "--photo-mask-radius": `${(photoBox.r / outerBox.w) * 100}%`,
  };
  const frameOverlayImageStyle = {
    width: `${(frameBase.w / outerBox.w) * 100}%`,
    height: `${(frameBase.h / outerBox.h) * 100}%`,
    left: `${-(outerBox.x / outerBox.w) * 100}%`,
    top: `${-(outerBox.y / outerBox.h) * 100}%`,
  };
  const previewDraw = getPhotoDrawMetrics(
    photo,
    rotation,
    previewMaskSize.width || 1,
    previewMaskSize.height || 1
  );
  const photoPreviewStyle = {
    width: `${Math.max(1, Math.round(previewDraw.drawW))}px`,
    height: `${Math.max(1, Math.round(previewDraw.drawH))}px`,
    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
  };

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
                  style={framePreviewStyle}
                >
                  <div
                    className={`photo-mask${isDragging ? " isDragging" : ""}`}
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
                      style={photoPreviewStyle}
                    />
                  </div>

                  <div className="photoBooth__frameOverlay" aria-hidden="true">
                    <img
                      className="photoBooth__frameOverlayImage"
                      src={activeFrame.src}
                      alt=""
                      style={frameOverlayImageStyle}
                    />
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
