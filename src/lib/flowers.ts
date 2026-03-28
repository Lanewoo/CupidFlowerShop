import { promises as fs } from "fs";
import path from "path";
import type { Flower, FlowerCatalog } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "flowers.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "flowers");

export const defaultCatalog: FlowerCatalog = {
  updatedAt: new Date().toISOString(),
  flowers: [
    {
      id: "seed-1",
      image:
        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80",
      names: {
        zh: "晨曦玫瑰",
        en: "Dawn Roses",
        hu: "Hajnal rózsák",
      },
      priceHint: {
        zh: "¥168 起",
        en: "From $24",
        hu: "6680 Ft-tól",
      },
    },
    {
      id: "seed-2",
      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80",
      names: {
        zh: "春日郁金香",
        en: "Spring Tulips",
        hu: "Tavaszi tulipánok",
      },
      priceHint: {
        zh: "¥128 起",
        en: "From $18",
        hu: "5080 Ft-tól",
      },
    },
    {
      id: "seed-3",
      image:
        "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=900&q=80",
      names: {
        zh: "森林系绿植花礼",
        en: "Woodland bouquet",
        hu: "Erdei csokor",
      },
      priceHint: {
        zh: "¥198 起",
        en: "From $27",
        hu: "7880 Ft-tól",
      },
    },
  ],
};

function normalizeCatalog(raw: unknown): FlowerCatalog {
  if (!raw || typeof raw !== "object") return { ...defaultCatalog };
  const obj = raw as Record<string, unknown>;
  const flowers = Array.isArray(obj.flowers) ? obj.flowers : [];
  const parsed: Flower[] = flowers
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const f = item as Record<string, unknown>;
      const names = (f.names || {}) as Record<string, string>;
      const priceHint = (f.priceHint || {}) as Record<string, string>;
      const id =
        typeof f.id === "string" && f.id.length > 0 ? f.id : `item-${index}`;
      const image = typeof f.image === "string" ? f.image : "";
      return {
        id,
        image,
        names: {
          zh: names.zh ?? "",
          en: names.en ?? "",
          hu: names.hu ?? "",
        },
        priceHint: {
          zh: priceHint.zh ?? "",
          en: priceHint.en ?? "",
          hu: priceHint.hu ?? "",
        },
      };
    })
    .filter(Boolean) as Flower[];

  return {
    updatedAt:
      typeof obj.updatedAt === "string"
        ? obj.updatedAt
        : new Date().toISOString(),
    flowers: parsed.length ? parsed : defaultCatalog.flowers,
  };
}

export async function readFlowerCatalog(): Promise<FlowerCatalog> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalizeCatalog(JSON.parse(raw));
  } catch {
    return { ...defaultCatalog };
  }
}

export async function writeFlowerCatalog(catalog: FlowerCatalog): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const payload: FlowerCatalog = {
    ...catalog,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export function ensureUploadsDir(): string {
  return UPLOADS_DIR;
}
