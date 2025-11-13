/**
 * Server-side watermarking utilities
 */

import sharp from "sharp";

/**
 * Add watermark to an image buffer
 */
export async function addWatermarkToImage(
  imageBuffer: Buffer,
): Promise<Buffer> {
  // Get image metadata
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1600;
  const height = metadata.height ?? 1066;

  // Calculate watermark size based on image dimensions
  const watermarkWidth = Math.min(width, 800);
  const watermarkHeight = Math.min(height, 600);
  const fontSize = Math.max(60, Math.min(120, Math.floor(width / 10)));

  // Create watermark text SVG
  const watermarkSvg = `
    <svg width="${watermarkWidth}" height="${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="rgba(255, 255, 255, 0.25)"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(-45 ${watermarkWidth / 2} ${watermarkHeight / 2})"
        style="user-select: none;"
      >
        WATERMARK
      </text>
    </svg>
  `;

  const watermarkBuffer = Buffer.from(watermarkSvg);

  // Composite watermark onto image (centered)
  const watermarked = await image
    .composite([
      {
        input: watermarkBuffer,
        top: Math.floor((height - watermarkHeight) / 2),
        left: Math.floor((width - watermarkWidth) / 2),
        blend: "over",
      },
    ])
    .toBuffer();

  return watermarked;
}
