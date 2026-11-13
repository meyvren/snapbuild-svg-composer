import { ASSET_LIBRARY, type AssetId } from "../../types/types";

export type MatchMode = "meaning" | "objects";

const ALIASES: Record<AssetId, readonly string[]> = {
  book: ["книга", "книги", "книгу", "книг", "книгой", "учебник", "учебники", "book", "books"],
  phone: ["телефон", "телефоны", "телефона", "телефоном", "смартфон", "смартфона", "смартфоны", "мобильный телефон", "phone", "smartphone"],
  puzzle: ["пазл", "пазлы", "пазлов", "головоломка", "головоломку", "головоломки", "puzzle", "puzzles"],
  coin: ["монета", "монеты", "монету", "монет", "монетой", "coin", "coins"],
  headphones: ["наушники", "наушников", "наушниками", "гарнитура", "гарнитуру", "headphones", "headset"],
  lamp: ["лампа", "лампы", "лампу", "лампой", "настольная лампа", "настольную лампу", "светильник", "lamp", "desk lamp"],
  folder: ["папка", "папки", "папку", "папкой", "папка для документов", "folder"],
  pen: ["ручка", "ручки", "ручку", "ручкой", "шариковая ручка", "pen", "pens"],
  wallet: ["кошелек", "кошельки", "кошелька", "кошельком", "бумажник", "wallet"],
  plant: ["растение", "растения", "растением", "комнатное растение", "цветок", "цветы", "plant", "plants"],
};

// A trailing * matches word beginnings. Keep short or ambiguous terms exact.
const CONCEPTS: Record<AssetId, readonly string[]> = {
  book: ["учеб*", "учеба", "учит*", "читат*", "библиотек*", "урок*", "learn*", "read*", "school"],
  phone: ["технолог*", "мобильн*", "связан*", "звон*", "онлайн", "интернет", "mobile", "digital", "call"],
  puzzle: ["сложн*", "логик*", "реша*", "решен*", "разраб*", "код*", "problem*", "solution*", "coding"],
  coin: ["накоп*", "эконом*", "инвест*", "капитал*", "доход*", "бюджет*", "money", "invest*", "profit", "savings"],
  headphones: ["подкаст*", "музык*", "слуша*", "аудио*", "звуч*", "podcast*", "music", "sound", "listen*"],
  lamp: ["свет*", "освещ*", "вдохнов*", "творч*", "креатив*", "придум*", "creat*", "inspir*", "light", "ideas"],
  folder: ["документ*", "архив*", "упорядоч*", "порядок", "процесс*", "files", "organize", "documents", "archive"],
  pen: ["пиш*", "запис*", "замет*", "писат*", "конспект*", "write", "writing", "notes"],
  wallet: ["трат*", "расход*", "покуп*", "бюджет*", "деньг*", "денеж*", "spend*", "budget", "payment*"],
  plant: ["вырос*", "выраст*", "расти", "растем", "рост*", "эколог*", "зелень", "природ*", "устойчив*", "grow*", "nature", "eco*"],
};

const PHRASES: { words: string; assets: AssetId[] }[] = [
  { words: "вырастить идею", assets: ["plant", "lamp", "book"] },
  { words: "собрать по кусочкам", assets: ["puzzle", "folder"] },
  { words: "держать руку на пульсе", assets: ["phone", "headphones"] },
  { words: "финансовая подушка", assets: ["wallet", "coin"] },
  { words: "открыть новую главу", assets: ["book", "pen"] },
  { words: "разложить по полочкам", assets: ["folder", "puzzle"] },
];

const tokenize = (text: string) => text.toLowerCase().replaceAll("ё", "е").match(/[\p{L}\p{N}]+/gu) ?? [];

const NAMES = new Map<string, AssetId>();
for (const { id, name } of ASSET_LIBRARY) {
  for (const alias of [id, name, ...ALIASES[id]]) NAMES.set(tokenize(alias).join(" "), id);
}
const MAX_ALIAS_WORDS = Math.max(...Array.from(NAMES.keys(), (name) => name.split(" ").length));
const CONNECTORS = new Set(["и", "and"]);

function scanNames(words: string[]) {
  const ids: AssetId[] = [];
  const unknown: string[] = [];
  let index = 0;

  while (index < words.length) {
    let length = Math.min(MAX_ALIAS_WORDS, words.length - index);
    let id: AssetId | undefined;
    while (length > 0) {
      id = NAMES.get(words.slice(index, index + length).join(" "));
      if (id) break;
      length--;
    }
    if (id) ids.push(id);
    else if (!CONNECTORS.has(words[index])) unknown.push(words[index]);
    index += Math.max(1, length);
  }
  return { ids, unknown: [...new Set(unknown)] };
}

const matches = (word: string, term: string) =>
  term.endsWith("*") ? word.startsWith(term.slice(0, -1)) : word === term;

export function matchInput(input: string, mode: MatchMode) {
  const words = tokenize(input);
  const names = scanNames(words);
  if (mode === "objects") return names;

  const phrase = ` ${words.join(" ")} `;
  const uniqueWords = [...new Set(words)];
  const ids = ASSET_LIBRARY.map(({ id, tags }, index) => {
    const exact = names.ids.includes(id) ? 9 : 0;
    const themes = uniqueWords.reduce((score, word) => {
      if (CONCEPTS[id].some((term) => matches(word, term))) return score + 3;
      if (tags.some((tag) => {
        const normalized = tokenize(tag)[0];
        return normalized !== undefined && (word === normalized || (normalized.length > 5 && word.startsWith(normalized.slice(0, -2))));
      })) return score + 2;
      return score;
    }, 0);
    const metaphors = PHRASES.reduce((score, entry) => {
      const role = entry.assets.indexOf(id);
      return role >= 0 && phrase.includes(` ${entry.words} `) ? score + 12 - role * 2 : score;
    }, 0);
    return { id, score: exact + themes + metaphors, index };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map(({ id }) => id);

  return { ids, unknown: [] };
}
