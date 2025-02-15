import { makeAutoObservable } from "mobx";
import React from "react";

type OwnedCard = {
  duplicates?: number;
};

export class Store {
  ownedCards = new Map<string, OwnedCard>();
  shiftKey = false;

  constructor() {
    makeAutoObservable(this);
  }
}

export const StoreContext = React.createContext<Store | null>(null);

export function useStore<T>(f: (store: Store) => T) {
    return f(React.useContext(StoreContext)!);
  }
  