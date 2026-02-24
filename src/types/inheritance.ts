export type HeirForm = {
  heirId: string;
  name: string;
  shares: string[];
};

export type TokenInfo = {
  name: string | null;
  symbol: string | null;
  balance: string | null;
};

export type MerkleResultHeir = {
  heirId: number;
  name?: string;
  sharesBps: number[];
  leaf: string;
  proof: string[];
};

export type MerkleResult = {
  root: string;
  heirs: MerkleResultHeir[];
  tokens?: string[];
};

/** Режим генерации дерева: раскрыть доли (полные доли по токенам) / скрыть доли (будущий режим) */
export type TreeMode = "expand_shares" | "collapse_shares";
