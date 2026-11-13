
    
  
// Исходники: snapbuild-svg-library.zip (экспорт из Figma).
// Теги добавлены для демонстрационного текстового подбора, их можно изменять.
export const ASSET_LIBRARY = [
  { id: "book", name: "Книга", tags: ["обучение", "знания", "книга", "чтение", "образование"], dimensions: { S: { width: 723, height: 489 }, L: { width: 1446, height: 977 } } },
  { id: "phone", name: "Телефон", tags: ["телефон", "связь", "технологии", "мобильный", "приложение"], dimensions: { S: { width: 399, height: 231 }, L: { width: 797, height: 462 } } },
  { id: "puzzle", name: "Пазлы", tags: ["головоломка", "задача", "идея", "решение", "логика", "разработка"], dimensions: { S: { width: 273, height: 157 }, L: { width: 545, height: 314 } } },
  { id: "coin", name: "Монета", tags: ["финансы", "деньги", "оплата", "прибыль"], dimensions: { S: { width: 153, height: 101 }, L: { width: 287, height: 189 } } },
  { id: "headphones", name: "Наушники", tags: ["музыка", "аудио", "звук", "разговор", "обучение"], dimensions: { S: { width: 445, height: 346 }, L: { width: 889, height: 692 } } },
  { id: "lamp", name: "Лампа", tags: ["свет", "работа", "идея", "офис"], dimensions: { S: { width: 473, height: 565 }, L: { width: 946, height: 1129 } } },
  { id: "folder", name: "Папка", tags: ["документы", "файлы", "работа", "организация"], dimensions: { S: { width: 621, height: 330 }, L: { width: 1241, height: 659 } } },
  { id: "pen", name: "Ручка", tags: ["письмо", "заметки", "учеба", "образование"], dimensions: { S: { width: 255, height: 143 }, L: { width: 509, height: 286 } } },
  { id: "wallet", name: "Кошелёк", tags: ["деньги", "финансы", "платежи"], dimensions: { S: { width: 316, height: 199 }, L: { width: 631, height: 397 } } },
  { id: "plant", name: "Растение", tags: ["рост", "природа", "развитие", "экология"], dimensions: { S: { width: 324, height: 409 }, L: { width: 591, height: 748 } } },
] as const;

export type AssetId = (typeof ASSET_LIBRARY)[number]["id"];
export type AssetSize = "S" | "L";
export type AssetVariant = "main" | "background";
export type PaletteId = "lavender" | "peach" | "mint";

export const assetUrl = (id: AssetId, size: AssetSize, variant: AssetVariant = "main") =>
  `/assets/${size}/${variant}/${id}.svg`;

// Эти восемь цветов соответствуют порядку в palettes.json; меняем все роли по индексам.
export const PALETTES = {
  lavender: ["#D7CDF5", "#F9ECB0", "#AA9BF0", "#F9A3AA", "#7864D7", "#FFE3E1", "#181817", "#FFFFFF"],
  peach: ["#FDD7B9", "#F9ECB0", "#FAC896", "#80DADA", "#D27532", "#BEEBEB", "#181817", "#FFFFFF"],
  mint: ["#BEEBEB", "#FFD4F2", "#80DADA", "#6D7BFC", "#5ABEBE", "#B6C6FE", "#181817", "#FFFFFF"],
} as const satisfies Record<PaletteId, readonly string[]>;

// Для ручного маппинга используем базовую палитру lavender.
// Для фонов применяются только цвета с индексами 0 и 4 (и исходные детали).

