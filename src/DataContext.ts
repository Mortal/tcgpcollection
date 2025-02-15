import React from "react";
import * as DT from "./data-types";

export const DataContext = React.createContext<{
  rarities: Map<string, DT.Rarity>;
  types: Map<string, DT.Type>;
} | null>(null);
