import { action, autorun } from "mobx";
import { Store, StoreContext } from "./store";
import React from "react";

const LOCALSTORAGE_KEY = "tcgp";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(() => {
    const store = new Store();
    try {
      const { ownedCards } = JSON.parse(
        localStorage.getItem(LOCALSTORAGE_KEY)!
      );
      for (const [k, v] of ownedCards) store.ownedCards.set(k, v);
    } catch {}
    return store;
  });
  React.useEffect(() => {
    const handleKeydown = action((ev: KeyboardEvent) => {
      if (ev.key === "Shift") store.shiftKey = true;
    });
    const handleKeyup = action((ev: KeyboardEvent) => {
      if (ev.key === "Shift") store.shiftKey = false;
    });
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  });
  React.useEffect(() =>
    autorun(() => {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({ ownedCards: [...store.ownedCards] })
      );
    })
  );
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
