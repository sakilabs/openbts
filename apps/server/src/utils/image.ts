import libheif from "libheif-js";

const HEIC_MIMES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

export function isHeic(mimetype: string): boolean {
  return HEIC_MIMES.has(mimetype.toLowerCase());
}

export async function decodeHeicToRaw(buffer: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(buffer);
  const image = images[0];
  if (!image) throw new Error("No image found in HEIC file");

  const width = image.get_width();
  const height = image.get_height();

  const rgba = await new Promise<Uint8ClampedArray>((resolve, reject) => {
    image.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (result) => {
      if (!result) return reject(new Error("Failed to decode HEIC image"));
      resolve(result.data);
    });
  });

  return { data: Buffer.from(rgba.buffer), width, height };
}
