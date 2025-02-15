type Ref<_T> = string;

export type Card = {
  id: string;
  slug?: string | null;
  name?: string | null;
  desc?: string | null;
  rating?: ("1" | "2" | "3" | "4" | "5") | null;
  icon?: Ref<"Image"> | null;
  rarity?: Ref<"Rarity">;
  obtain?: string | null;
  expansion?: Ref<"Expansion">;
  setNum?: number | null;
  cardType?: ("pokemon" | "trainer") | null;
  packs?: Ref<"Pack">[] | null;
  packRates?: Ref<"PackCard">[] | null;
  trainerType?: ("supporter" | "item" | "fossil" | "pokemontool") | null;
  stage?: number | null;
  relatedCards?: Card;
  hp?: number | null;
  pokemonType?: Ref<"Type">;
  weaknessType?: Ref<"Type">;
  retreatCost?: number | null;
  isEX?: boolean | null;
  moves?: Ref<"Move">[] | null;
  movesInfo?: {
    move?: Ref<"Move">;
    damage?: number | null;
    cost?: {
      type?: Ref<"Type">;
      amount?: number | null;
      id?: string | null;
    }[] |
    null;
    id?: string | null;
  }[] |
  null;
  abilities?: Ref<"Ability">;
  illustrators?: Ref<"Illustrator">[] | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};

export type Rarity = {
  id: string;
  name?: string | null;
  icon?: Ref<"Image"> | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};

export type PackCard = {
  id: string;
  card?: Ref<"Card">;
  pack?: Ref<"Pack">;
  pool?: ("normal" | "rare") | null;
  slot?: ("12345" | "123" | "4" | "5") | null;
  percent?: number | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};

export type Pack = {
  id: string;
  name?: string | null;
  slug?: string | null;
  icon?: Ref<"Image"> | null;
  logo?: Ref<"Image"> | null;
  expansion?: Ref<"Expansion">;
  cards?: Ref<"PackCard">[] | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};

export type Expansion = {
  id: string;
  releaseDate?: string | null;
  name?: string | null;
  slug?: string | null;
  icon?: Ref<"Image"> | null;
  logo?: Ref<"Image"> | null;
  isPromo?: boolean | null;
  packs?: Ref<"Pack">[] | null;
  cards?: Ref<"Card">[] | null;
  cardCount?: string | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};

export type Type = {
  id: string;
  name?: string | null;
  icon?: Ref<"Image"> | null;
  checksum: string;
  updatedAt: string;
  createdAt: string;
};