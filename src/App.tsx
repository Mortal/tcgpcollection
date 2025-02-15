import React from "react";
import styles from "./App.module.css";
import * as DT from "./data-types";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { useLoadData } from "./useLoadData";
import { DataContext } from "./DataContext";
import { StoreProvider } from "./StoreProvider";
import { useStore } from "./store";

const pokemonTypeToCssClass: Record<string, string> = {
  Dragon: styles.Dragon,
  Metal: styles.Metal,
  Darkness: styles.Darkness,
  Fighting: styles.Fighting,
  Psychic: styles.Psychic,
  Lightning: styles.Lightning,
  Water: styles.Water,
  Fire: styles.Fire,
  Grass: styles.Grass,
  Colorless: styles.Colorless,
  Unspecified: styles.Unspecified,
};

const trainerTypeToCssClass = {
  supporter: styles.supporter,
  item: styles.item,
  fossil: styles.fossil,
  pokemontool: styles.pokemontool,
};

function App() {
  const cards = useLoadData<DT.Card>("cards", "/cards.json");
  const expansions = useLoadData<DT.Expansion>(
    "expansions",
    "/expansions.json"
  );
  const packCards = useLoadData<DT.PackCard>("packCards", "/pack-cards.json");
  const packs = useLoadData<DT.Pack>("packs", "/packs.json");
  const rarities = useLoadData<DT.Rarity>("rarities", "/rarities.json");
  const types = useLoadData<DT.Type>("types", "/types.json");
  const expansionData = React.useMemo(
    () =>
      [...expansions.values()]
        .sort(
          (a, b) =>
            +(!!b.packs && b.packs.length > 0) -
              +(!!a.packs && a.packs.length > 0) ||
            (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "")
        )
        .map((expansion) => ({
          expansion,
          cards: (expansion.cards ?? [])
            .map((c) => cards.get(c))
            .filter((c): c is DT.Card => c != null),
          packCards: [...packCards.values()].filter(
            ({ pack }) => pack != null && expansion.packs?.includes(pack)
          ),
          // Only keep packs with logo, in order to remove weird "1 rare card guaranteed" packs
          packs: [...packs.values()].filter(
            (pack) => expansion.packs?.includes(pack.id) && pack.logo
          ),
        })),
    [expansions, cards, packs, packCards]
  );

  return (
    <DataContext.Provider value={{ rarities, types }}>
      <StoreProvider>
        <WhichPackToOpen packs={packs} packCards={packCards} />
        <App2 expansionData={expansionData} />
      </StoreProvider>
    </DataContext.Provider>
  );
}

function App2({
  expansionData,
}: {
  expansionData: {
    expansion: DT.Expansion;
    cards: DT.Card[];
    packCards: DT.PackCard[];
    // Only keep packs with logo, in order to remove weird "1 rare card guaranteed" packs
    packs: DT.Pack[];
  }[];
}) {
  const [mode, setMode] = React.useState<"expansions" | "my-cards">(
    "expansions"
  );
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
        <label>
          <input
            type="radio"
            checked={mode === "expansions"}
            onClick={() => setMode("expansions")}
          />
          {" Expansions"}
        </label>
        <label>
          <input
            type="radio"
            checked={mode === "my-cards"}
            onClick={() => setMode("my-cards")}
          />
          {" My cards"}
        </label>
      </div>
      {mode === "expansions" &&
        expansionData.map((data) => (
          <Expansion key={data.expansion.id} data={data} />
        ))}
      {mode === "my-cards" && <MyCards expansionData={expansionData} />}
    </>
  );
}

type ShiftClickItemHelper<T> = {
  isShiftHovered: () => boolean;
  isHovered: () => boolean;
  onFocus: (e: FocusEvent | React.FocusEvent) => void;
  onMouseEnter: (e: MouseEvent | React.MouseEvent) => void;
  onMouseMove: (e: MouseEvent | React.MouseEvent) => void;
  onMouseLeave: (e: MouseEvent | React.MouseEvent) => void;
  onClick: (e: MouseEvent | React.MouseEvent) => T[];
};

class ShiftClickHelper<T> {
  lastClick = -1;
  currentHover = -1;
  currentShiftHover = -1;
  showHover = new Set<number>();

  constructor() {
    makeAutoObservable(this, { setCurrentShiftHover: action });
  }

  setCurrentShiftHover(index: number) {
    if (this.currentShiftHover === index) return;
    if (this.currentShiftHover !== -1) this.showHover.clear();
    if (index !== -1 && this.lastClick !== -1 && this.lastClick !== index) {
      const min = Math.min(index, this.lastClick);
      const max = Math.max(index, this.lastClick);
      for (let i = min; i <= max; i++) {
        this.showHover.add(i);
      }
    }
    this.currentShiftHover = index;
  }

  itemHelper(items: T[], index: number): ShiftClickItemHelper<T> {
    return {
      isShiftHovered: () => this.showHover.has(index),
      isHovered: () => this.currentHover === index,
      onFocus: action((e) => {
        if (e.defaultPrevented) return;
        this.setCurrentShiftHover(index);
        this.currentHover = index;
      }),
      onMouseEnter: action((e: MouseEvent | React.MouseEvent) => {
        if (e.defaultPrevented) return;
        this.setCurrentShiftHover(index);
        this.currentHover = index;
      }),
      onMouseMove: action((e: MouseEvent | React.MouseEvent) => {
        if (e.defaultPrevented) return;
        this.setCurrentShiftHover(index);
      }),
      onMouseLeave: action((e: MouseEvent | React.MouseEvent) => {
        if (e.defaultPrevented) return;
        if (this.currentShiftHover === index) this.setCurrentShiftHover(-1);
        this.currentHover = -1;
      }),
      onClick: action((e: MouseEvent | React.MouseEvent) => {
        if (e.defaultPrevented) return [items[index]];
        if (e.shiftKey && this.showHover.has(index)) {
          this.lastClick = index;
          return [...this.showHover].map((i) => items[i]);
        }
        this.lastClick = index;
        this.showHover.clear();
        return [items[index]];
      }),
    };
  }
}

const WhichPackToOpen = observer(function WhichPackToOpen({
  packs,
  packCards,
}: {
  packs: Map<string, DT.Pack>;
  packCards: Map<string, DT.PackCard>;
}) {
  const ownedCards = useStore((s) => s.ownedCards);
  let ownedPct: Record<string, number> = {};
  let nonownedPct: Record<string, number> = {};
  for (const pc of packCards.values()) {
    if (pc.pool !== "normal") continue;
    if (ownedCards.has(pc.card!)) {
      ownedPct[pc.pack!] =
        (ownedPct[pc.pack!] || 0) + pc.percent! * pc.slot!.length;
    } else {
      nonownedPct[pc.pack!] =
        (nonownedPct[pc.pack!] || 0) + pc.percent! * pc.slot!.length;
    }
  }
  return (
    <>
      <h2>Which pack to open next?</h2>
      {[...packs.values()]
        .filter((pack) => pack.logo)
        .map((pack) => ({
          pack,
          pct:
            (100 * nonownedPct[pack.id]) /
            (nonownedPct[pack.id] + ownedPct[pack.id]),
        }))
        .sort(({ pct: a }, { pct: b }) => b - a)
        .map(({ pct, pack }) => {
          return (
            <div key={pack.id}>
              <div>
                {`${pct}`.replace(/(\.[0-9]{4})[0-9]*/, "$1")}
                {"% - "}
                {pack.name}
              </div>
            </div>
          );
        })}
    </>
  );
});

const MyCards = observer(function MyCards({
  expansionData,
}: {
  expansionData: {
    expansion: DT.Expansion;
    cards: DT.Card[];
    packs: DT.Pack[];
    packCards: DT.PackCard[];
  }[];
}) {
  const ownedCards = useStore((s) => s.ownedCards);
  // "Old Amber" is in both A1 and A2, and the official app only lists it under A2
  // when in "My cards, sort by collector number" mode,
  // so use a Set along with double reverse() to keep the last occurrence of each card.
  const myCards = [
    ...new Set(
      expansionData
        .flatMap(({ cards }) => cards.filter((card) => ownedCards.has(card.id)))
        .reverse()
    ),
  ].reverse();
  return (
    <div className={styles.MyCards}>
      <ExportMyCards expansionData={expansionData} />
      <div className={styles.cards}>
        {myCards.map((card) => (
          <MyCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
});

const ExportMyCards = observer(function ExportMyCards({
  expansionData,
}: {
  expansionData: {
    expansion: DT.Expansion;
    cards: DT.Card[];
    packs: DT.Pack[];
    packCards: DT.PackCard[];
  }[];
}) {
  const { rarities, types } = React.useContext(DataContext)!;
  const ownedCards = useStore((s) => s.ownedCards);
  const rows = [
    ["id", "name", "rarity", "type", "owned", "duplicates"],
    ...expansionData.flatMap(({ cards }) =>
      cards.map((card) => [
        card.id,
        card.name,
        rarities.get(card.rarity!)?.name ?? "",
        (card.cardType === "pokemon"
          ? types.get(card.pokemonType!)?.name
          : card.trainerType) ?? "",
        ownedCards.has(card.id) ? 1 : "",
        ownedCards.get(card.id)?.duplicates ?? "",
      ])
    ),
  ];
  const data = rows.map((r) => r.join(",") + "\r\n").join("");
  return (
    <a
      href={`data:text/csv,${window.encodeURIComponent(data)}`}
      download="pokemoncollection.csv"
    >
      Export my cards
    </a>
  );
});

const Expansion = observer(function Expansion({
  data: { expansion, cards, packs, packCards },
}: {
  data: {
    expansion: DT.Expansion;
    cards: DT.Card[];
    packs: DT.Pack[];
    packCards: DT.PackCard[];
  };
}) {
  const { rarities } = React.useContext(DataContext)!;
  const ownedCards = useStore((s) => s.ownedCards);
  let ownedNormal = 0,
    ownedRare = 0;
  for (const card of cards) {
    if (!ownedCards.has(card.id)) continue;
    const rarity = rarities.get(card.rarity!)?.name ?? card.rarity!;
    const isRare = !NON_RARE_RARITY.includes(rarity);
    if (isRare) ownedRare++;
    else ownedNormal++;
  }
  const [helper] = React.useState(() => new ShiftClickHelper<DT.Card>());
  const cardToPack = Object.fromEntries(
    packCards.map((pc) => [pc.card!, pc.pack!])
  );

  return (
    <div className={styles.Expansion}>
      <h1>
        {expansion.id === "PROMO-A"
          ? "PROMO-A"
          : expansion.id === "A2"
            ? "Space-Time Smackdown"
            : expansion.name}
      </h1>
      <h2>Release date: {expansion.releaseDate?.slice(0, 10)}</h2>
      <h2>
        {expansion.id === "PROMO-A"
          ? `${ownedNormal + ownedRare}`
          : `${ownedNormal} / ${expansion.cardCount} - Rare: ${ownedRare}`}
      </h2>
      <div className={styles.cards}>
        {cards.map((card, i) => (
          <Card
            packs={packs.filter((p) => p.id === cardToPack[card.id])}
            key={card.id}
            card={card}
            shiftClickItemHelper={helper.itemHelper(cards, i)}
          />
        ))}
      </div>
    </div>
  );
});

const NON_RARE_RARITY = ["C", "U", "R", "RR"];

const MyCard = observer(function MyCard({ card }: { card: DT.Card }) {
  const { rarities, types } = React.useContext(DataContext)!;
  const rarity = rarities.get(card.rarity!)?.name ?? card.rarity!;
  return (
    <div
      className={[
        styles.MyCard,
        pokemonTypeToCssClass[types.get(card.pokemonType!)?.name ?? ""] ?? "",
        trainerTypeToCssClass[card.trainerType!] ?? "",
      ].join(" ")}
      tabIndex={-1}
    >
      <div>
        {card.setNum} {rarity}
      </div>
      <div>{card.name!.split(" - ")[0]}</div>
      <MyCardDuplicateInput card={card} />
    </div>
  );
});

const MyCardDuplicateInput = observer(function MyCardDuplicateInput({
  card,
}: {
  card: DT.Card;
}) {
  const ownedCards = useStore((s) => s.ownedCards);
  const ownedCard = ownedCards.get(card.id);
  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      <TextInput
        style={{ flex: "1 0 0", minWidth: "0" }}
        value={`${ownedCard?.duplicates ?? ""}`}
        onChange={action((s) => {
          if (s === "") {
            ownedCards.set(card.id, { ...ownedCard, duplicates: undefined });
            return;
          }
          const v = +s;
          if (Number.isNaN(v)) return;
          const duplicates = v | 0;
          if (!(0 <= duplicates && duplicates <= 1000)) return;
          ownedCards.set(card.id, { ...ownedCard, duplicates });
        })}
      />
    </div>
  );
});

const TextInput = observer(function TextInput({
  value,
  onFocus,
  onChange,
  onBlur,
  ...props
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<
  React.ComponentPropsWithoutRef<"input">,
  "value" | "onChange" | "initialValue"
>) {
  const [dirtyInput, setDirtyInput] = React.useState<string | null>(null);
  return (
    <input
      value={dirtyInput ?? value}
      onFocus={(e) => {
        onFocus?.(e);
        if (!e.defaultPrevented) setDirtyInput(value);
      }}
      onChange={(e) =>
        setDirtyInput((v) => (v == null ? null : e.target.value))
      }
      onBlur={(e) => {
        onBlur?.(e);
        if (!e.defaultPrevented) {
          if (dirtyInput != null) onChange(dirtyInput);
          setDirtyInput(null);
        }
      }}
      {...props}
    />
  );
});

const Card = observer(function Card({
  card,
  packs,
  shiftClickItemHelper: helper,
}: {
  card: DT.Card;
  packs: DT.Pack[];
  shiftClickItemHelper: ShiftClickItemHelper<DT.Card>;
}) {
  const { rarities, types } = React.useContext(DataContext)!;
  const ownedCards = useStore((s) => s.ownedCards);
  const shiftKey = useStore((s) => s.shiftKey);
  const ownedCard = ownedCards.get(card.id);
  const rarity = rarities.get(card.rarity!)?.name ?? card.rarity!;
  return (
    <a
      href="#"
      className={[
        styles.Card,
        shiftKey && helper.isShiftHovered() ? styles.hovered : "",
        ownedCard == null ? styles.notOwned : styles.owned,
        pokemonTypeToCssClass[types.get(card.pokemonType!)?.name ?? ""] ?? "",
        trainerTypeToCssClass[card.trainerType!] ?? "",
      ].join(" ")}
      tabIndex={0}
      onClick={action((e) => {
        for (const card of helper.onClick(e)) {
          if (ownedCard) ownedCards.delete(card.id);
          else if (!ownedCards.has(card.id)) ownedCards.set(card.id, {});
        }
        e.preventDefault();
      })}
      onKeyDown={(e) => {
        let i =
          e.key === "ArrowRight"
            ? 1
            : e.key === "ArrowLeft"
              ? -1
              : e.key === "ArrowUp"
                ? -5
                : e.key === "ArrowDown"
                  ? 5
                  : 0;
        let el = e.target as Element | null;
        for (; el && i > 0; i--) {
          el = el.nextElementSibling;
        }
        for (; el && i < 0; i++) {
          el = el.previousElementSibling;
        }
        if (el && el !== e.target) {
          (el as HTMLElement).focus();
          e.preventDefault();
        }
      }}
      onFocus={helper.onFocus}
      onMouseEnter={helper.onMouseEnter}
      onMouseMove={helper.onMouseMove}
      onMouseLeave={helper.onMouseLeave}
    >
      <div>
        {card.setNum} {rarity}
      </div>
      <div>{card.name!.split(" - ")[0]}</div>
      {packs.map((p) => (
        <div key={p.id} className={styles.pack}>
          ({p.name})
        </div>
      ))}
      {helper.isHovered() ? (
        <div className={styles.cardHover}>
          <div>{renderDesc(card.desc, types)}</div>
        </div>
      ) : null}
    </a>
  );
});

function renderDesc(
  desc: string | null | undefined,
  types: Map<string, DT.Type>
): React.ReactNode {
  if (desc == null) return [];
  if (!desc.includes("<")) return desc;
  const doc = new DOMParser().parseFromString(desc, "text/html");

  function visit(d: Node): (string | null | React.ReactElement)[] {
    if (d.nodeType === 3) return [d.nodeValue];
    if (d.nodeType !== 1) return [`nodetype${d.nodeType}`];
    if (!"HTML,HEAD,BODY,I,SPAN".split(",").includes(d.nodeName))
      console.log("renderDesc found unknown tag:", d.nodeName, desc);
    const children = [...d.childNodes].map((n, i) => (
      <React.Fragment key={i}>{visit(n)}</React.Fragment>
    ));
    if (d.nodeName === "I") return [<i>{children}</i>];
    if (d.nodeName === "SPAN") {
      const id = (d as Element).getAttribute("data-element-id");
      if (id != null) {
        children.splice(
          0,
          0,
          <span
            key="type"
            className={[
              styles.typeName,
              pokemonTypeToCssClass[types.get(id.replace(/\/$/, ""))?.name!] ??
                "",
            ].join(" ")}
          >
            {types.get(id.replace(/\/$/, ""))?.name ?? "?"}
          </span>
        );
      }
    }
    return children;
  }

  return visit(doc.documentElement);
}

export default App;
