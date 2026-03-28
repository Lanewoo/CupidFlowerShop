"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Flower, FlowerCatalog } from "@/lib/types";
import { AdminFlowerPreview } from "./AdminFlowerPreview";

function randomHex(nBytes: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const a = new Uint8Array(nBytes);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

/** randomUUID() is only available in secure contexts (HTTPS / localhost); HTTP IP deploys need a fallback. */
function newFlowerId(existing: Set<string>): string {
  for (let i = 0; i < 24; i++) {
    let id = "";
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try {
        id = crypto.randomUUID();
      } catch {
        id = "";
      }
    }
    if (!id) {
      id = `flower-${Date.now()}-${randomHex(8)}`;
    }
    if (!existing.has(id)) {
      existing.add(id);
      return id;
    }
  }
  const fallback = `flower-${Date.now()}-${randomHex(8)}-${randomHex(8)}`;
  existing.add(fallback);
  return fallback;
}

function createEmptyFlower(existing: Set<string>): Flower {
  return {
    id: newFlowerId(existing),
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
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const catalogRef = useRef<FlowerCatalog | null>(null);
  const opQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
    const run = opQueueRef.current.then(() => fn());
    opQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/flowers", { credentials: "include" });
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as FlowerCatalog;
        if (!cancelled) {
          catalogRef.current = data;
          setCatalog(data);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setCatalog(null);
          catalogRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setCatalog((prev) => {
      if (prev) {
        const ids = new Set(prev.flowers.map((f) => f.id));
        return {
          ...prev,
          flowers: [...prev.flowers, createEmptyFlower(ids)],
        };
      }
      const ids = new Set<string>();
      return {
        updatedAt: new Date().toISOString(),
        flowers: [createEmptyFlower(ids)],
      };
    });
  };

  const uploadImage = async (id: string, file: File) => {
    setStatus("idle");
    setErrorDetail(null);
    try {
      await runSerialized(async () => {
        setUploadingId(id);
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: fd,
            credentials: "include",
          });
          const payload = (await res.json().catch(() => ({}))) as {
            url?: string;
            error?: string;
          };
          if (!res.ok) {
            const msg =
              typeof payload.error === "string"
                ? payload.error
                : t("uploadError");
            throw new Error(msg);
          }
          if (typeof payload.url !== "string") {
            throw new Error(t("uploadError"));
          }
          const data = { url: payload.url };

          const prev = catalogRef.current;
          if (!prev) throw new Error("no catalog");

          const next: FlowerCatalog = {
            ...prev,
            flowers: prev.flowers.map((f) =>
              f.id === id ? { ...f, image: data.url } : f,
            ),
          };
          catalogRef.current = next;
          setCatalog(next);

          const saveRes = await fetch("/api/flowers", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          if (!saveRes.ok) throw new Error("save");
          const saved = (await saveRes.json()) as FlowerCatalog;
          catalogRef.current = saved;
          setCatalog(saved);
        } finally {
          setUploadingId(null);
        }
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorDetail(e instanceof Error ? e.message : t("uploadError"));
      setUploadingId(null);
    }
  };

  const save = async () => {
    setStatus("saving");
    try {
      await runSerialized(async () => {
        const snap = catalogRef.current;
        if (!snap) throw new Error("no catalog");
        const res = await fetch("/api/flowers", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snap),
        });
        if (!res.ok) throw new Error("save");
        const saved = (await res.json()) as FlowerCatalog;
        catalogRef.current = saved;
        setCatalog(saved);
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setErrorDetail(t("error"));
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
                  <AdminFlowerPreview key={flower.image} rawSrc={flower.image} />
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
          <span className="max-w-md text-sm font-medium text-rose-600">
            {errorDetail ?? t("error")}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-rose-900/55">{t("help")}</p>
    </div>
  );
}
