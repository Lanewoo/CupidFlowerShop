export type LocaleCode = "zh" | "en" | "hu";

export type Flower = {
  id: string;
  image: string;
  names: Record<LocaleCode, string>;
  priceHint: Record<LocaleCode, string>;
};

export type FlowerCatalog = {
  updatedAt: string;
  flowers: Flower[];
};
