import { encodePacked, keccak256, type Hex } from "viem";
import { MerkleTree } from "merkletreejs";
import keccak256Lib from "keccak256";

/**
 * Строит leaf для Merkle tree (совместимо с контрактом):
 * keccak256(abi.encodePacked(heirId, sharesBps_))
 * Типы как в контракте: uint256, uint16[].
 * sharesBps — доли в basis points (10000 = 100%).
 */
export function buildLeaf(heirId: bigint, sharesBps: number[]): Hex {
  return keccak256(encodePacked(["uint256", "uint16[]"], [heirId, sharesBps]));
}

export type HeirLeaf = {
  heirId: number;
  sharesBps: number[];
  leaf: string;
  proof: string[];
};

export type MerkleOutput = {
  root: string;
  heirs: HeirLeaf[];
};

/**
 * Генерирует Merkle tree и proofs для каждого наследника
 */
export function buildMerkleTree(
  heirs: { heirId: number; sharesBps: number[] }[],
): MerkleOutput {
  const heirOutputs: HeirLeaf[] = [];
  const leaves: Buffer[] = [];

  for (const heir of heirs) {
    if (Number.isNaN(heir.heirId) || !Number.isInteger(heir.heirId)) {
      throw new Error(
        `Invalid heirId: ${heir.heirId}. heirId must be an integer.`,
      );
    }
    const leaf = buildLeaf(BigInt(heir.heirId), heir.sharesBps);
    leaves.push(Buffer.from(hexToBytes(leaf)));
    heirOutputs.push({
      heirId: heir.heirId,
      sharesBps: heir.sharesBps,
      leaf,
      proof: [],
    });
  }

  const tree = new MerkleTree(leaves, keccak256Lib, {
    sortPairs: true,
    hashLeaves: false,
  });
  const root = "0x" + tree.getRoot().toString("hex");

  for (let i = 0; i < heirOutputs.length; i++) {
    heirOutputs[i].proof = tree.getHexProof(leaves[i]);
  }

  return { root, heirs: heirOutputs };
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const MERKLE_OPTIONS = { sortPairs: true, hashLeaves: false } as const;

/**
 * Проверяет Merkle proof: лист входит в дерево с данным корнем.
 * proof и leaf — из файла наследника (heir_*.json), root — из merkleTree.json.
 */
export function verifyMerkleProof(
  proof: string[],
  leaf: string,
  root: string,
): boolean {
  const leafBuf = Buffer.from(
    hexToBytes(leaf.startsWith("0x") ? leaf : "0x" + leaf),
  );
  const rootBuf = Buffer.from(
    hexToBytes(root.startsWith("0x") ? root : "0x" + root),
  );
  const proofBuf = proof.map((p) =>
    Buffer.from(hexToBytes(p.startsWith("0x") ? p : "0x" + p)),
  );
  return MerkleTree.verify(
    proofBuf,
    leafBuf,
    rootBuf,
    keccak256Lib,
    MERKLE_OPTIONS,
  );
}
