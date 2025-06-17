import sharp from "sharp";
import fs from "fs";

/**
 * Adds a text watermark (company name) to an image file.
 * @param imagePath - The path to the original image file
 * @param companyName - The text to be used as the watermark
 * @returns The path to the watermarked image (overwrites original)
 */
export async function addWatermark(
  imagePath: string,
  companyName: string
): Promise<string> {
  try {
    const watermarkText = `${companyName}`;

    // Load the image using sharp
    const image = sharp(imagePath);
    // Retrieve metadata such as width and height
    const metadata = await image.metadata();

    // Determine font size relative to image width (at least 24px)
    const fontSize = Math.max(Math.floor(metadata.width! / 10), 24); 

    // Create SVG markup for the watermark text with drop shadow filter
    // Positioned near the bottom-right corner of the image
    const svg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text x="${metadata.width! - 20}" y="${metadata.height! - 80}"
              font-family="Arial, sans-serif"
              font-size="${fontSize}"
              font-weight="bold"
              fill="black"
              text-anchor="end"
              filter="url(#shadow)">
          ${watermarkText}
        </text>
      </svg>
    `;

    // Convert SVG string to a Buffer for sharp composite input
    const watermarkBuffer = Buffer.from(svg);

    // Generate a temporary filename for the watermarked image
    const watermarkedImagePath = imagePath.replace(/(\.[^.]+)$/, "_watermarked$1");

    // Composite the watermark SVG over the original image at top-left (0,0)
    await image
      .composite([
        {
          input: watermarkBuffer,
          top: 0,
          left: 0, // Positioning controlled inside SVG
        },
      ])
      // Write the output image to a new file, preserving the original format
      .toFile(watermarkedImagePath);

    // Delete the original file
    fs.unlinkSync(imagePath);
    // Rename the new watermarked file to the original filename (overwrite)
    fs.renameSync(watermarkedImagePath, imagePath);

    // Return the original image path (now contains the watermark)
    return imagePath;
  } catch (error) {
    // Log and rethrow errors to allow handling upstream
    console.error("Watermarking error:", error);
    throw error;
  }
}
