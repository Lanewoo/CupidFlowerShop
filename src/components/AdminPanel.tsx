"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { Flower, FlowerCatalog } from "@/lib/types";

/** randomUUID() is only available in secure contexts (HTTPS / localhost); HTTP IP deploys need a fallback. */
function newFlowerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      /* non-secure context */
    }
  }
  return `flower-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function emptyFlower(): Flower {
  return {
    id: newFlowerId(),
    image: "",
    names: { zh: "", en: "", hu: "" },
    priceHint: { zh: "", en: "", hu: "" },
  };
}

export function AdminPanel() {
  const t = useTranslations("Admin");
  const [catalog, setCatalog] = useState<FlowerCatalog | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "idle",
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/flowers");
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as FlowerCatalog;
        if (!cancelled) {
          setCatalog(data);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setCatalog(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFlower = (id: string, patch: Partial<Flower>) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        flowers: prev.flowers.map((f) =>
          f.id === id ? { ...f, ...patch } : f,
        ),
      };
    });
  };

  const updateName = (
    id: string,
    lang: keyof Flower["names"],
    value: string,
  ) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        flowers: prev.flowers.map((f) =>
          f.id === id ? { ...f, names: { ...f.names, [lang]: value } } : f,
        ),
      };
    });
  };

  const updatePrice = (
    id: string,
    lang: keyof Flower["priceHint"],
    value: string,
  ) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        flowers: prev.flowers.map((f) =>
          f.id === id
            ? { ...f, priceHint: { ...f.priceHint, [lang]: value } }
            : f,
        ),
      };
    });
  };

  const removeFlower = (id: string) => {
    setCatalog((prev) =>
      prev
        ? { ...prev, flowers: prev.flowers.filter((f) => f.id !== id) }
        : prev,
    );
  };

  const addFlower = () => {
    setCatalog((prev) =>
      prev
        ? { ...prev, flowers: [...prev.flowers, emptyFlower()] }
        : { updatedAt: new Date().toISOString(), flowers: [emptyFlower()] },
    );
  };

  const uploadImage = async (id: string, file: File) => {
    setUploadingId(id);
    setStatus("idle");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("upload");
      const data = (await res.json()) as { url: string };
      updateFlower(id, { image: data.url });
    } catch {
      setStatus("error");
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    if (!catalog) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/flowers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(catalog),
      });
      if (!res.ok) throw new Error("save");
      const saved = (await res.json()) as FlowerCatalog;
      setCatalog(saved);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  if (status === "loading" && !catalog) {
    return (
      <p className="rounded-xl border border-rose-200/80 bg-white/85 px-4 py-6 text-rose-900/70">
        …
      </p>
    );
  }

  if (!catalog && status === "error") {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
        {t("loadError")}
      </p>
    );
  }

  if (!catalog) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {catalog.flowers.map((flower) => (
          <div
            key={flower.id}
            className="grid gap-6 rounded-2xl border border-rose-200/80 bg-white/95 p-4 shadow-md shadow-rose-600/8 sm:grid-cols-[minmax(0,200px)_1fr] sm:p-6"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                {t("imageLabel")}
              </p>
              <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-xl bg-rose-50">
                {flower.image ? (
                  <Image
                    src={flower.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={
                      flower.image.startsWith("http") ||
                      flower.image.startsWith("/uploads/")
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-rose-300">
                    —
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(flower.id, file);
                    e.target.value = "";
                  }}
                />
                {uploadingId === flower.id ? t("uploading") : t("upload")}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["nameZh", "zh", "names"],
                  ["nameEn", "en", "names"],
                  ["nameHu", "hu", "names"],
                  ["priceZh", "zh", "prices"],
                  ["priceEn", "en", "prices"],
                  ["priceHu", "hu", "prices"],
                ] as const
              ).map(([key, lang, kind]) => (
                <label key={key} className="block text-sm text-rose-900">
                  <span className="font-medium">{t(key)}</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-rose-300/80 bg-white px-3 py-2 text-rose-950 outline-none ring-rose-400/40 focus:ring-2 focus:ring-rose-500"
                    value={
                      kind === "names"
                        ? flower.names[lang]
                        : flower.priceHint[lang]
                    }
                    onChange={(e) =>
                      kind === "names"
                        ? updateName(flower.id, lang, e.target.value)
                        : updatePrice(flower.id, lang, e.target.value)
                    }
                  />
                </label>
              ))}
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeFlower(flower.id)}
                  className="text-sm text-rose-600 underline-offset-2 hover:underline"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addFlower}
          className="rounded-full border border-rose-300/90 bg-white px-5 py-2.5 text-sm font-medium text-rose-800 shadow-md shadow-rose-600/10 transition hover:bg-rose-50"
        >
          {t("addFlower")}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving"}
          className="rounded-full bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-700/30 transition hover:bg-rose-800 disabled:opacity-60"
        >
          {status === "saving" ? t("saving") : t("save")}
        </button>
        {status === "saved" && (
          <span className="text-sm font-medium text-rose-700">{t("saved")}</span>
        )}
        {status === "error" && (
          <span className="text-sm font-medium text-rose-600">{t("error")}</span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-rose-900/55">{t("help")}</p>
    </div>
  );
}
