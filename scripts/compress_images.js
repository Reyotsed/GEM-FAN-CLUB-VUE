import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOMEPAGE_DIR = path.resolve(__dirname, '../public/img/homepage');
const BACKUP_DIR = path.resolve(__dirname, '../public/img/homepage/originals');
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;

async function compressImages() {
    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = fs.readdirSync(HOMEPAGE_DIR).filter(f =>
        /\.(jpe?g|png)$/i.test(f) && !fs.statSync(path.join(HOMEPAGE_DIR, f)).isDirectory()
    );

    console.log(`Found ${files.length} images to process...\n`);

    for (const file of files) {
        const inputPath = path.join(HOMEPAGE_DIR, file);
        const backupPath = path.join(BACKUP_DIR, file);
        const baseName = path.parse(file).name;
        const webpOutputPath = path.join(HOMEPAGE_DIR, `${baseName}.webp`);

        const originalSize = fs.statSync(inputPath).size;

        // Backup original file
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(inputPath, backupPath);
            console.log(`  ✓ Backed up original: ${file}`);
        }

        // Get image metadata
        const metadata = await sharp(inputPath).metadata();
        const needsResize = metadata.width > MAX_WIDTH;

        // Compress JPEG (overwrite original)
        let pipeline = sharp(inputPath);
        if (needsResize) {
            pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
        }
        const jpegBuffer = await pipeline
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();

        fs.writeFileSync(inputPath, jpegBuffer);
        const compressedSize = jpegBuffer.length;

        // Generate WebP version
        let webpPipeline = sharp(inputPath);
        if (needsResize) {
            webpPipeline = webpPipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
        }
        await webpPipeline
            .webp({ quality: WEBP_QUALITY })
            .toFile(webpOutputPath);

        const webpSize = fs.statSync(webpOutputPath).size;

        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        const webpSavings = ((1 - webpSize / originalSize) * 100).toFixed(1);

        console.log(`\n📷 ${file}:`);
        console.log(`   Original:   ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Compressed: ${(compressedSize / 1024).toFixed(0)} KB (saved ${savings}%)`);
        console.log(`   WebP:       ${(webpSize / 1024).toFixed(0)} KB (saved ${webpSavings}%)`);
    }

    console.log('\n✅ All images compressed! Originals backed up to /public/img/homepage/originals/');
}

compressImages().catch(console.error);
