declare module "libheif-js" {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      imageData: { data: Uint8ClampedArray; width: number; height: number },
      callback: (result: { data: Uint8ClampedArray } | null) => void,
    ): void;
  }

  class HeifDecoder {
    decode(buffer: Buffer | Uint8Array): HeifImage[];
  }

  export { HeifDecoder };
}
