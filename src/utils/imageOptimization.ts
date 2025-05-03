import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface OptimizeImageOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export async function optimizeImage({
  inputPath,
  outputPath,
  width,
  quality = 80,
  format = 'webp'
}: OptimizeImageOptions) {
  try {
    // Ensure the output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Create a Sharp instance
    let sharpInstance = sharp(inputPath);

    // Resize if width is specified
    if (width) {
      sharpInstance = sharpInstance.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Convert to specified format with quality
    switch (format) {
      case 'webp':
        await sharpInstance.webp({ quality }).toFile(outputPath);
        break;
      case 'jpeg':
        await sharpInstance.jpeg({ quality }).toFile(outputPath);
        break;
      case 'png':
        await sharpInstance.png({ quality }).toFile(outputPath);
        break;
    }

    return outputPath;
  } catch (error) {
    console.error(`Error optimizing image ${inputPath}:`, error);
    throw error;
  }
}

export async function generateResponsiveImages(
  inputPath: string,
  outputDir: string,
  baseName: string
) {
  const sizes = [320, 640, 960, 1280];
  const formats = ['webp', 'jpeg'] as const;
  const results: { [key: string]: string } = {};

  for (const format of formats) {
    for (const size of sizes) {
      const outputPath = path.join(
        outputDir,
        `${baseName}-${size}.${format}`
      );
      await optimizeImage({
        inputPath,
        outputPath,
        width: size,
        format
      });
      results[`${size}-${format}`] = outputPath;
    }
  }

  return results;
} 