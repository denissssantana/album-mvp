import { useEffect, useMemo, useRef, useState } from "react";

const ALBUM_KEY = "album_mvp_step_v6_collage_4_adaptive_2x3";
const DB_NAME = "album_mvp_db";
const DB_VERSION = 1;
const STORE_NAME = "photos";
const MAX_PHOTOS = 4;
const PHOTO_RATIO = 2 / 3; // W/H (10x15)

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

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB failed"));
  });
}

async function putPhotoBlob(id, blob) {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, blob, updatedAt: Date.now() });
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      const err = tx.error || new Error("IndexedDB write failed");
      db.close();
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error || new Error("IndexedDB write aborted");
      db.close();
      reject(err);
    };
  });
}

async function getPhotoBlob(id) {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
    tx.oncomplete = () => db.close();
    tx.onabort = () => db.close();
    tx.onerror = () => db.close();
  });
}

async function deletePhotoBlob(id) {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      const err = tx.error || new Error("IndexedDB delete failed");
      db.close();
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error || new Error("IndexedDB delete aborted");
      db.close();
      reject(err);
    };
  });
}

async function clearAllBlobs() {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      const err = tx.error || new Error("IndexedDB clear failed");
      db.close();
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error || new Error("IndexedDB clear aborted");
      db.close();
      reject(err);
    };
  });
}

function supportsMime(mime) {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const dataUrl = canvas.toDataURL(mime);
    return dataUrl.startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

function isBlobUrl(url) {
  return typeof url === "string" && url.startsWith("blob:");
}

function serializePhotosForStorage(photos, includeDataUrl) {
  return photos.map((photo) => {
    const base = {
      id: photo.id,
      createdAt: photo.createdAt,
      type: photo.type,
    };
    if (includeDataUrl) {
      return { ...base, dataUrl: photo.dataUrl };
    }
    return { ...base, blobId: photo.blobId || photo.id };
  });
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

async function loadImage(dataUrl) {
  const img = new Image();
  if ("decoding" in img) img.decoding = "async";
  if ("loading" in img) img.loading = "eager";
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?)(;|$)/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const isBase64 = header.includes("base64");
  const binary = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else resolve(dataUrlToBlob(canvas.toDataURL(mime, quality)));
      }, mime, quality);
    } else {
      resolve(dataUrlToBlob(canvas.toDataURL(mime, quality)));
    }
  });
}

async function createCompressedCanvas(
  dataUrl,
  { maxSide = 1280, targetRatio } = {}
) {
  const img = await loadImage(dataUrl);

  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;

  let sx = 0;
  let sy = 0;
  let sw = w0;
  let sh = h0;

  if (typeof targetRatio === "number" && targetRatio > 0) {
    const currentRatio = w0 / h0;
    if (currentRatio > targetRatio) {
      sw = Math.round(h0 * targetRatio);
      sh = h0;
      sx = Math.round((w0 - sw) / 2);
      sy = 0;
    } else if (currentRatio < targetRatio) {
      sw = w0;
      sh = Math.round(w0 / targetRatio);
      sx = 0;
      sy = Math.round((h0 - sh) / 2);
    }
  }

  let w = sw;
  let h = sh;

  const biggest = Math.max(sw, sh);
  if (biggest > maxSide) {
    const scale = maxSide / biggest;
    w = Math.round(sw * scale);
    h = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

  return canvas;
}

async function compressImageDataUrl(
  dataUrl,
  { maxSide = 1280, quality = 0.78, mime = "image/jpeg", targetRatio } = {}
) {
  const canvas = await createCompressedCanvas(dataUrl, { maxSide, targetRatio });
  return canvas.toDataURL(mime, quality);
}

async function compressImageToBlob(
  dataUrl,
  { maxSide = 1280, quality = 0.78, mime = "image/jpeg", targetRatio } = {}
) {
  const canvas = await createCompressedCanvas(dataUrl, { maxSide, targetRatio });
  return await canvasToBlob(canvas, mime, quality);
}

/** ===== Collage JPG (photobooth) ADAPTATIVO ===== */
const FRAME_COLORS = ["#0B5ED7", "#FF9F43", "#2ECC71", "#9B59B6"];

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawImageContain(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  const scale = Math.min(w / iw, h / ih);
  const dw = Math.round(iw * scale);
  const dh = Math.round(ih * scale);
  const dx = Math.round(x + (w - dw) / 2);
  const dy = Math.round(y + (h - dh) / 2);

  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFramedSlot(ctx, img, x, y, w, h, frameColor) {
  // “cartão” com sombra
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.restore();

  // recorte
  ctx.save();
  roundRect(ctx, x, y, w, h, 28);
  ctx.clip();

  // fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);

  // imagem
  drawImageContain(ctx, img, x, y, w, h);

  ctx.restore();

  // moldura colorida
  ctx.lineWidth = 18;
  ctx.strokeStyle = frameColor;
  roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 22);
  ctx.stroke();

  // contorno preto
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#111";
  roundRect(ctx, x, y, w, h, 28);
  ctx.stroke();
}

async function buildCollageJpgDataUrl(
  photos,
  {
    title = "Um aninho de Heitor!",
    subtitle = "Meu álbum",
    width = 1200,
    height = 1800,
    quality = 0.92,
  } = {}
) {
  // ✅ Foto “comercial” 10x15 (2:3)
  const W = width;
  const H = height;

  const outerMargin = 54;
  const gap = 22;

  // Banner inferior
  const bannerH = 300;

  // Área superior de fotos
  const gridX = outerMargin;
  const gridY = outerMargin;
  const gridW = W - outerMargin * 2;
  const gridH = H - bannerH - outerMargin * 2 - 20; // respiro antes do banner

  // Carrega imagens existentes (até 4)
  const used = photos.slice(0, 4);
  const loaded = [];
  for (let i = 0; i < used.length; i++) {
    const img = await loadImage(used[i].dataUrl);
    loaded.push({ ...used[i], img });
  }

  const n = loaded.length;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Borda externa
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#111";
  roundRect(ctx, 24, 24, W - 48, H - 48, 26);
  ctx.stroke();

  // Se não tiver foto, só faz um layout “limpo” (sem slots)
  if (n > 0) {
    const slots = [];

    if (n === 1) {
      const square = Math.min(gridW, gridH);
      const x = gridX + (gridW - square) / 2;
      const y = gridY + (gridH - square) / 2;
      slots.push({ x, y, w: square, h: square });
    } else if (n === 2) {
      const square = Math.min((gridW - gap) / 2, gridH);
      const totalW = square * 2 + gap;
      const x1 = gridX + (gridW - totalW) / 2;
      const y = gridY + (gridH - square) / 2;
      slots.push({ x: x1, y, w: square, h: square });
      slots.push({ x: x1 + square + gap, y, w: square, h: square });
    } else {
      const square = Math.min((gridW - gap) / 2, (gridH - gap) / 2);
      const totalW = square * 2 + gap;
      const totalH = square * 2 + gap;
      const startX = gridX + (gridW - totalW) / 2;
      const startY = gridY + (gridH - totalH) / 2;
      const coords = [
        [startX, startY],
        [startX + square + gap, startY],
        [startX, startY + square + gap],
        [startX + square + gap, startY + square + gap],
      ];
      for (let i = 0; i < Math.min(n, 4); i += 1) {
        const [x, y] = coords[i];
        slots.push({ x, y, w: square, h: square });
      }
    }

    for (let i = 0; i < Math.min(n, slots.length); i += 1) {
      const slot = slots[i];
      const photo = loaded[i];
      drawFramedSlot(
        ctx,
        photo.img,
        slot.x,
        slot.y,
        slot.w,
        slot.h,
        FRAME_COLORS[i % FRAME_COLORS.length]
      );
    }
  }

  // Banner inferior
  const bannerY = H - bannerH - 54;
  const bannerX = 64;
  const bannerW = W - 128;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 28);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#111";
  roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 28);
  ctx.stroke();

  // Texto
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";

  ctx.font = "800 66px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(title, W / 2, bannerY + 125);

  ctx.font = "700 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillText(subtitle, W / 2, bannerY + 205);

  loaded.length = 0;

  return canvas.toDataURL("image/jpeg", quality);
}

export default function Album() {
  const [photos, setPhotos] = useState([]);

  const fileInputAddRef = useRef(null);
  const fileInputSwapRef = useRef(null);
  const [swapId, setSwapId] = useState(null);

  const [view, setView] = useState("album"); // "album" | "collage"
  const [collageUrl, setCollageUrl] = useState("");

  const lastAddedRef = useRef(null);
  const prevLenRef = useRef(photos.length);
  const prevUrlsRef = useRef(new Set());
  const warnedCompatRef = useRef(false);
  const idbReadyRef = useRef(null);
  const storageModeRef = useRef("idb");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const count = photos.length;
  const isLimitReached = count >= MAX_PHOTOS;
  const compressOptions = useMemo(() => {
    if (!isMobile) {
      return { maxSide: 1280, quality: 0.78, mime: "image/jpeg" };
    }

    const mobileMime = supportsMime("image/webp") ? "image/webp" : "image/jpeg";
    return {
      maxSide: 640,
      quality: 0.62,
      mime: mobileMime,
    };
  }, [isMobile]);

  const addBtnText = useMemo(
    () => (count === 0 ? "Adicionar uma foto" : "Adicionar próxima foto"),
    [count]
  );

  useEffect(() => {
    return () => {
      if (collageUrl?.startsWith("blob:")) URL.revokeObjectURL(collageUrl);
    };
  }, [collageUrl]);

  useEffect(() => {
    const nextUrls = new Set(photos.map((p) => p.dataUrl).filter(isBlobUrl));
    prevUrlsRef.current.forEach((url) => {
      if (!nextUrls.has(url)) URL.revokeObjectURL(url);
    });
    prevUrlsRef.current = nextUrls;
  }, [photos]);

  useEffect(() => {
    return () => {
      prevUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      prevUrlsRef.current.clear();
    };
  }, []);

  // ✅ Rola para a última foto adicionada (corrige “não renderiza / não foca”)
  useEffect(() => {
    const prev = prevLenRef.current;
    const now = photos.length;

    if (now > prev) {
      requestAnimationFrame(() => {
        lastAddedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    prevLenRef.current = now;
  }, [photos.length]);

  function notifyCompatOnce() {
    if (warnedCompatRef.current) return;
    warnedCompatRef.current = true;
    alert(
      "Seu navegador não suportou armazenamento avançado. " +
        "Vamos usar modo compatibilidade (LocalStorage)."
    );
  }

  function switchToLocalStorage() {
    storageModeRef.current = "ls";
    notifyCompatOnce();
  }

  async function ensureIdbReady() {
    if (idbReadyRef.current !== null) return idbReadyRef.current;
    try {
      const db = await openDB();
      db.close();
      idbReadyRef.current = true;
      return true;
    } catch (err) {
      console.error("IndexedDB unavailable:", err);
      idbReadyRef.current = false;
      switchToLocalStorage();
      return false;
    }
  }

  function alertStorageFull() {
    alert(
      "Seu celular ficou sem espaço para salvar as fotos (limite do navegador). " +
        "Dica: gere o JPG e depois limpe o álbum."
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = loadState().photos || [];
      if (!stored.length) {
        if (!cancelled) setPhotos([]);
        return;
      }

      const normalized = stored.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        type: p.type || "portrait",
        dataUrl: p.dataUrl,
        blobId: p.blobId || p.id,
      }));

      const idbOk = await ensureIdbReady();
      if (!idbOk) {
        storageModeRef.current = "ls";
        if (!cancelled) setPhotos(normalized.filter((p) => p.dataUrl));
        return;
      }

      const hydrated = [];
      let needsSave = false;

      for (const meta of normalized) {
        let blob = null;
        try {
          blob = await getPhotoBlob(meta.blobId);
        } catch (err) {
          console.error("IndexedDB read failed:", err);
          idbReadyRef.current = false;
          switchToLocalStorage();
          if (!cancelled) setPhotos(normalized.filter((p) => p.dataUrl));
          return;
        }

        if (!blob && meta.dataUrl) {
          try {
            blob = dataUrlToBlob(meta.dataUrl);
            await putPhotoBlob(meta.blobId, blob);
            needsSave = true;
          } catch (err) {
            console.error("IndexedDB migration failed:", err);
            switchToLocalStorage();
            if (!cancelled) setPhotos(normalized.filter((p) => p.dataUrl));
            return;
          }
        }

        if (blob) {
          if (meta.dataUrl) needsSave = true;
          const url = URL.createObjectURL(blob);
          hydrated.push({ ...meta, dataUrl: url });
        } else if (meta.dataUrl) {
          hydrated.push(meta);
        }
      }

      if (!cancelled) {
        setPhotos(hydrated);
      }

      if (needsSave) {
        safeSavePhotos(serializePhotosForStorage(hydrated, false));
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(nextPhotos) {
    const normalized = nextPhotos.map((photo) => ({
      ...photo,
      blobId: photo.blobId || photo.id,
    }));
    const includeDataUrl = storageModeRef.current === "ls";
    const ok = safeSavePhotos(serializePhotosForStorage(normalized, includeDataUrl));
    if (!ok) {
      alertStorageFull();
      return false;
    }
    setPhotos(normalized);
    return true;
  }

  async function clearAlbum() {
    if (!confirm("Apagar TODAS as suas fotos?")) return;
    if (storageModeRef.current === "idb") {
      try {
        await clearAllBlobs();
      } catch (err) {
        console.error("IndexedDB clear failed:", err);
        switchToLocalStorage();
      }
    }
    persist([]);
    setView("album");
  }

  function addNextPhoto() {
    if (isLimitReached) return;
    fileInputAddRef.current?.click();
  }

  async function onAddFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);

    try {
      if (!file.type.startsWith("image/")) {
        alert("Escolha uma imagem.");
        return;
      }

      if (photos.length + 1 > MAX_PHOTOS) {
        alert(`Limite de ${MAX_PHOTOS} fotos atingido.`);
        return;
      }

      const type = await detectOrientationSafe(fileUrl);
      const targetRatio = type === "landscape" ? 1 / PHOTO_RATIO : PHOTO_RATIO;
      const id = safeId();
      const createdAt = Date.now();

      const useIdb = storageModeRef.current === "idb" && (await ensureIdbReady());
      if (useIdb) {
        const blob = await compressImageToBlob(fileUrl, {
          ...compressOptions,
          targetRatio,
        });

        try {
          await putPhotoBlob(id, blob);
        } catch (err) {
          console.error("IndexedDB write failed:", err);
          idbReadyRef.current = false;
          switchToLocalStorage();
          if (err?.name === "QuotaExceededError") alertStorageFull();
          const dataUrl = await blobToDataUrl(blob);
          const nextPhotos = [...photos, { id, dataUrl, type, createdAt }];
          persist(nextPhotos);
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const nextPhotos = [
          ...photos,
          { id, blobId: id, dataUrl: previewUrl, type, createdAt },
        ];
        if (!persist(nextPhotos)) {
          URL.revokeObjectURL(previewUrl);
        }
      } else {
        const dataUrl = await compressImageDataUrl(fileUrl, {
          ...compressOptions,
          targetRatio,
        });
        const nextPhotos = [...photos, { id, dataUrl, type, createdAt }];
        persist(nextPhotos);
      }
    } catch (err) {
      console.error("onAddFileChange error:", err);
      alert("Falha ao adicionar foto no celular. Vamos ajustar.");
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  async function askRemovePhoto(id) {
    if (!confirm("Remover esta foto?")) return;
    if (storageModeRef.current === "idb") {
      const target = photos.find((p) => p.id === id);
      const blobId = target?.blobId || id;
      try {
        await deletePhotoBlob(blobId);
      } catch (err) {
        console.error("IndexedDB delete failed:", err);
        switchToLocalStorage();
      }
    }
    persist(photos.filter((p) => p.id !== id));
    setView("album");
  }

  function askSwapPhoto(id) {
    setSwapId(id);
    fileInputSwapRef.current?.click();
  }

  async function onSwapFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !swapId) return;

    const fileUrl = URL.createObjectURL(file);

    try {
      if (!file.type.startsWith("image/")) {
        alert("Escolha uma imagem.");
        setSwapId(null);
        return;
      }

      const type = await detectOrientationSafe(fileUrl);
      const targetRatio = type === "landscape" ? 1 / PHOTO_RATIO : PHOTO_RATIO;
      const current = photos.find((p) => p.id === swapId);
      const blobId = current?.blobId || swapId;
      const createdAt = Date.now();

      const useIdb = storageModeRef.current === "idb" && (await ensureIdbReady());
      if (useIdb) {
        const blob = await compressImageToBlob(fileUrl, {
          ...compressOptions,
          targetRatio,
        });

        try {
          await putPhotoBlob(blobId, blob);
        } catch (err) {
          console.error("IndexedDB write failed:", err);
          idbReadyRef.current = false;
          switchToLocalStorage();
          if (err?.name === "QuotaExceededError") alertStorageFull();
          const dataUrl = await blobToDataUrl(blob);
          const next = photos.map((p) =>
            p.id === swapId ? { ...p, dataUrl, type, createdAt } : p
          );
          setSwapId(null);
          persist(next);
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const next = photos.map((p) =>
          p.id === swapId ? { ...p, dataUrl: previewUrl, type, createdAt, blobId } : p
        );

        setSwapId(null);
        if (!persist(next)) {
          URL.revokeObjectURL(previewUrl);
        }
      } else {
        const dataUrl = await compressImageDataUrl(fileUrl, {
          ...compressOptions,
          targetRatio,
        });

        const next = photos.map((p) =>
          p.id === swapId ? { ...p, dataUrl, type, createdAt } : p
        );

        setSwapId(null);
        persist(next);
      }
    } catch (err) {
      console.error("onSwapFileChange error:", err);
      alert("Falha ao trocar foto no celular. Vamos ajustar.");
      setSwapId(null);
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  async function openCollageView() {
    if (photos.length === 0) {
      alert("Adicione pelo menos 1 foto.");
      return;
    }

    setView("collage");
    setCollageUrl("");

    try {
      const baseOptions = {
        title: "Um aninho de Heitor!",
        subtitle: "Meu álbum",
        width: isMobile ? 900 : 1200,
        height: isMobile ? 1350 : 1800,
        quality: isMobile ? 0.9 : 0.92,
      };

      let dataUrl = "";

      try {
        dataUrl = await buildCollageJpgDataUrl(photos, baseOptions);
      } catch (err) {
        if (!isMobile) throw err;
        dataUrl = await buildCollageJpgDataUrl(photos, {
          ...baseOptions,
          width: 720,
          height: 1080,
          quality: 0.85,
        });
      }

      if (collageUrl?.startsWith("blob:")) URL.revokeObjectURL(collageUrl);
      setCollageUrl(dataUrl);
    } catch (e) {
      console.error("Collage error:", e);
      if (isMobile) {
        alert("Seu celular está com pouca memória. Feche outras abas/apps e tente novamente.");
      } else {
        alert("Falha ao gerar o álbum em JPG. Vamos ajustar.");
      }
      setView("album");
    }
  }

  function backToAlbum() {
    setView("album");
  }

  async function downloadCollage() {
    if (!collageUrl) return;
    const a = document.createElement("a");
    a.href = collageUrl;
    a.download = "album-heitor.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="albumPage">
      <header className="albumHeader">
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

      <main className="albumMain">
        <div className="container">
          {view === "album" ? (
            <>
              <div className="hint">Minhas fotos ({count})</div>

              {photos.length === 0 ? (
                <div className="card">
                  <div className="cardTop">Seu álbum está vazio</div>
                  <div className="previewArea portrait">
                    <div className="placeholder">
                      Clique em <b>{addBtnText}</b> para tirar/enviar sua primeira foto
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid">
                  {photos.map((p, idx) => {
                    const isLast = idx === photos.length - 1;
                    return (
                      <div className="card" key={p.id} ref={isLast ? lastAddedRef : null}>
                        <div className="cardTop">
                          Foto {idx + 1} • {p.type === "portrait" ? "Vertical" : "Horizontal"}
                        </div>

                        <div className={`previewArea ${p.type}`}>
                          <img
                            className="previewImg framedImg"
                            src={p.dataUrl}
                            alt={`Foto ${idx + 1}`}
                          />
                        </div>

                        <div className="photoBar">
                          <button className="btn btnSecondary" onClick={() => askSwapPhoto(p.id)}>
                            Trocar foto
                          </button>
                          <button className="btn btnSecondary" onClick={() => askRemovePhoto(p.id)}>
                            Remover foto
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="collageWrap">
              <div className="hint">
                {isMobile
                  ? "Seu álbum foi gerado em JPG (formato 10x15). Baixe e compartilhe."
                  : "Prévia do álbum completo em JPG (formato 10x15)."}
              </div>

              {collageUrl ? (
                <div className="card">
                  <div className="cardTop">Álbum completo (JPG)</div>
                  <div className="collagePreview">
                    <img className="collageImg" src={collageUrl} alt="Álbum completo" />
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="cardTop">Gerando…</div>
                  <div className="placeholder">Aguarde…</div>
                </div>
              )}
            </div>
          )}
        </div>

        {view === "album" ? (
          <div className="bottomBar two">
            <button className="btn btnSecondary bigAdd" onClick={openCollageView}>
              Ver álbum completo (JPG)
            </button>

            <button
              className="btn btnPrimary bigAdd"
              onClick={addNextPhoto}
              disabled={isLimitReached}
              title={isLimitReached ? "Limite atingido" : ""}
            >
              {isLimitReached ? "Limite atingido" : addBtnText}
            </button>
          </div>
        ) : (
          <div className="bottomBar">
            <div className="collageActions">
              <button className="btn btnSecondary" onClick={backToAlbum}>
                Voltar
              </button>
              <button className="btn btnPrimary" onClick={downloadCollage}>
                Baixar JPG
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
