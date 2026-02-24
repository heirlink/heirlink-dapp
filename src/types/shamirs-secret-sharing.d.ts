declare module "shamirs-secret-sharing" {
  export class Buffer extends Uint8Array {
    static from(
      input: string | ArrayBuffer | Uint8Array,
      encoding?: string,
    ): Buffer;
    toString(encoding?: string): string;
  }

  export function split(
    secret: string | Buffer | Uint8Array,
    options: { shares: number; threshold: number },
  ): Buffer[];

  export function combine(shares: Buffer[]): Buffer;

  const sss: {
    Buffer: typeof Buffer;
    split: typeof split;
    combine: typeof combine;
  };
  export default sss;
}
