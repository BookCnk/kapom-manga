export const dynamic = "force-dynamic";

import { randomBytes } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import sharp from "sharp";

// สร้างชื่อไฟล์สั้นๆ แต่ไม่ซ้ำ (timestamp + random 6 ตัวอักษร)
function generateShortFileName(extension: string): string {
  const timestamp = Date.now().toString(36); // base36 encoding ทำให้สั้นลง
  const randomStr = randomBytes(3).toString("hex"); // 6 ตัวอักษร
  return `${timestamp}-${randomStr}.${extension}`;
}

// แยก key จาก URL
function extractKeyFromUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new HttpError(500, "S3 configuration is missing");
  }

  const protocol = useSsl ? "https" : "http";
  const fullEndpoint = port ? `${protocol}://${endpoint}:${port}` : `${protocol}://${endpoint}`;

  return new S3Client({
    region: "us-east-1",
    endpoint: fullEndpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function buildPublicUrl(bucket: string, key: string) {
  const explicitBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (explicitBaseUrl) {
    return `${explicitBaseUrl.replace(/\/$/, "")}/${bucket}/${key}`;
  }

  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  if (!endpoint) {
    throw new HttpError(500, "S3 endpoint is missing");
  }

  const protocol = useSsl ? "https" : "http";

  // In local Docker, browser cannot resolve "minio" hostname.
  const host = endpoint === "minio" ? "localhost" : endpoint;
  const withPort = port ? `${host}:${port}` : host;
  return `${protocol}://${withPort}/${bucket}/${key}`;
}

// ฟังก์ชัน optimize รูปภาพ
async function optimizeImage(pipeline: any, currentSize: number, targetSize: number, isEpisodePage: boolean): Promise<Buffer> {
  console.log(`Optimizing image: ${(currentSize / 1024 / 1024).toFixed(2)}MB → target ${(targetSize / 1024 / 1024).toFixed(2)}MB`);
  
  let jpegBuffer = await pipeline
    .jpeg({
      quality: isEpisodePage ? 88 : 90,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();

  if (jpegBuffer.length > targetSize) {
    jpegBuffer = await pipeline
      .jpeg({
        quality: isEpisodePage ? 85 : 87,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();
  }

  if (jpegBuffer.length > targetSize) {
    jpegBuffer = await pipeline
      .jpeg({
        quality: isEpisodePage ? 82 : 85,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();
  }

  return jpegBuffer;
}

// ฟังก์ชัน optimize WebP รูปภาพ
async function optimizeWebPImage(pipeline: any, currentSize: number, targetSize: number, isEpisodePage: boolean): Promise<Buffer> {
  console.log(`Optimizing WebP image: ${(currentSize / 1024 / 1024).toFixed(2)}MB → target ${(targetSize / 1024 / 1024).toFixed(2)}MB`);
  
  let webpBuffer: Buffer;
  
  // Level 1: เริ่มต้นด้วยคุณภาพสูง
  webpBuffer = await pipeline
    .webp({
      quality: isEpisodePage ? 85 : 88,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();

  console.log(`Level 1: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);

  // Level 2: ลด quality ลง
  if (webpBuffer.length > targetSize) {
    webpBuffer = await pipeline
      .webp({
        quality: isEpisodePage ? 80 : 85,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    console.log(`Level 2: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  // Level 3: ลด quality ลงอีก
  if (webpBuffer.length > targetSize) {
    webpBuffer = await pipeline
      .webp({
        quality: isEpisodePage ? 75 : 82,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    console.log(`Level 3: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  // Level 4: ลด quality + ลดขนาดรูป
  if (webpBuffer.length > targetSize) {
    const smallerPipeline = pipeline.resize({
      width: Math.min(900, isEpisodePage ? 1000 : 900),
      withoutEnlargement: true,
    });
    
    webpBuffer = await smallerPipeline
      .webp({
        quality: isEpisodePage ? 75 : 82,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    console.log(`Level 4: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  // Level 5: ลดขนาดรูปมากขึ้น + ลด quality
  if (webpBuffer.length > targetSize) {
    const smallerPipeline = pipeline.resize({
      width: Math.min(800, isEpisodePage ? 900 : 800),
      withoutEnlargement: true,
    });
    
    webpBuffer = await smallerPipeline
      .webp({
        quality: isEpisodePage ? 70 : 78,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    console.log(`Level 5: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  // Level 6: ลดขนาดรูปสูงสุด + quality ต่ำสุด
  if (webpBuffer.length > targetSize) {
    const smallerPipeline = pipeline.resize({
      width: Math.min(700, isEpisodePage ? 800 : 700),
      withoutEnlargement: true,
    });
    
    webpBuffer = await smallerPipeline
      .webp({
        quality: isEpisodePage ? 65 : 75,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    console.log(`Level 6: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  }

  console.log(`Final optimized size: ${(webpBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  return webpBuffer;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new HttpError(500, "S3 bucket name is missing");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawFolder = (formData.get("folder")?.toString() || "manga-covers").replace(/^\/+|\/+$/g, "");
    // ป้องกัน path traversal
    const folder = rawFolder.replace(/\.\./g, "").replace(/\/+/g, "/");
    const oldUrl = formData.get("oldUrl")?.toString();
    const customFilename = formData.get("filename")?.toString();

    if (!(file instanceof File)) {
      throw new HttpError(400, "file is required");
    }

    // ตรวจสอบประเภทไฟล์จาก MIME type หรือนามสกุลไฟล์ (บาง browser ไม่ส่ง MIME type)
    const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
    const fileExt = file.name?.split(".").pop()?.toLowerCase() || "";
    
    if (!allowedTypes.has(file.type) && !allowedExtensions.has(fileExt)) {
      throw new HttpError(400, "Only jpg/jpeg/png/webp are allowed");
    }

    // จำกัดขนาด: cover = 2MB, episode pages = 5MB
    const isEpisodePage = folder.includes("/episodes/");
    const maxSize = isEpisodePage ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new HttpError(400, `File size must be <= ${isEpisodePage ? "5" : "2"}MB`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // ตรวจสอบความถูกต้องของรูปภาพก่อนประมวลผล
    let imageInfo: any;
    try {
      imageInfo = await sharp(inputBuffer).metadata();
      
      // ตรวจสอบขนาดรูป
      if (!imageInfo.width || !imageInfo.height) {
        throw new HttpError(400, "Invalid image: missing dimensions");
      }
      
      // ตรวจสอบความกว้างขั้นต่ำและสูงสุด
      if (imageInfo.width < 100) {
        throw new HttpError(400, "Image too narrow: minimum width 100 pixels");
      }
      
      if (imageInfo.width > 1000) {
        throw new HttpError(400, "Image too wide: maximum width 1000 pixels");
      }
      
      // ตรวจสอบว่าเป็นรูปจริง (ไม่ใช่ไฟล์อื่นที่มีนามสกุลรูป)
      if (!imageInfo.format || !['jpeg', 'png', 'webp'].includes(imageInfo.format)) {
        throw new HttpError(400, "Invalid image format detected");
      }
      
      console.log(`Image validation passed: ${imageInfo.width}x${imageInfo.height} ${imageInfo.format}`);
      
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      // ถ้า Sharp ไม่สามารถอ่านรูปได้ = ไม่ใช่รูปภาพที่ถูกต้อง
      throw new HttpError(400, "Invalid or corrupted image file");
    }

    // แบ่งรูปเป็น 3 ส่วน ถ้าสูงเกิน 2000px
    let fileName = customFilename || generateShortFileName("jpg");
    if (customFilename) {
      const nameWithoutExt = customFilename.replace(/\.[^/.]+$/, "");
      fileName = `${nameWithoutExt}.jpg`;
    }

    // ตรวจสอบว่าต้องแบ่งรูปหรือไม่ (ถ้าสูงเกิน 2000px)
    const shouldSplit = imageInfo.height > 2000;
    let finalImages: { buffer: Buffer; fileName: string; contentType: string }[] = [];

    if (shouldSplit) {
      // แบ่งรูปเป็น 2 ส่วน
      const partHeight = Math.floor(imageInfo.height / 2);
      console.log(`Splitting image into 2 parts: ${imageInfo.width}x${imageInfo.height} → 2x${imageInfo.width}x${partHeight}`);

      for (let i = 0; i < 2; i++) {
        const startY = i * partHeight;
        const endY = i === 1 ? imageInfo.height : (i + 1) * partHeight; // ส่วนสุดท้ายเอาที่เหลือทั้งหมด

        // ตัดรูปส่วนที่ i
        const partPipeline = sharp(inputBuffer)
          .extract({
            left: 0,
            top: startY,
            width: imageInfo.width,
            height: endY - startY
          });

        // แปลงเป็น WebP พร้อม optimization เสมอ
        let webpBuffer = await partPipeline
          .webp({
            quality: isEpisodePage ? 90 : 92,
            effort: 6,
            smartSubsample: true,
          })
          .toBuffer();

        // Optimize ทุกครั้งเพื่อให้ได้ขนาดที่ดีที่สุด
        const maxFileSize = 2 * 1024 * 1024; // 2MB target
        webpBuffer = await optimizeWebPImage(partPipeline, webpBuffer.length, maxFileSize, isEpisodePage);

        // ตั้งชื่อไฟล์: page-1-1.webp, page-1-2.webp, page-1-3.webp
        const baseName = customFilename?.replace(/\.[^/.]+$/, "") || generateShortFileName("webp").replace(/\.[^/.]+$/, "");
        const partFileName = `${baseName}-${i + 1}.webp`;

        finalImages.push({
          buffer: webpBuffer,
          fileName: partFileName,
          contentType: "image/webp"
        });
      }
    } else {
      // ไม่ต้องแบ่ง ใช้รูปเดียว
      const pipeline = sharp(inputBuffer);
      
      // แปลงเป็น JPEG พร้อม optimization ขั้นสูง
      let jpegBuffer = await pipeline
        .jpeg({
          quality: isEpisodePage ? 92 : 95,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      // Optimize ถ้าจำเป็น
      const maxFileSize = 2 * 1024 * 1024; // 2MB target
      if (jpegBuffer.length > maxFileSize) {
        jpegBuffer = await optimizeImage(pipeline, jpegBuffer.length, maxFileSize, isEpisodePage);
      }

      finalImages.push({
        buffer: jpegBuffer,
        fileName: fileName,
        contentType: "image/jpeg"
      });
    }

    // อัปโหลดรูปทั้งหมด (หรือรูปเดียว)
    const uploadedUrls: string[] = [];
    const s3 = getS3Client();
    
    // ลบรูปเก่าถ้ามี oldUrl
    if (oldUrl) {
      try {
        const oldKey = extractKeyFromUrl(oldUrl, bucket);
        if (oldKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: oldKey,
            }),
          );
        }
      } catch (err) {
        console.error("Failed to delete old image:", err);
        // ไม่ throw error เพื่อไม่ให้การอัพโหลดล้มเหลว
      }
    }

    // อัปโหลดแต่ละรูป
    for (const image of finalImages) {
      const key = `${folder}/${image.fileName}`;
      
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: image.buffer,
          ContentType: image.contentType,
        }),
      );

      uploadedUrls.push(buildPublicUrl(bucket, key));
    }

    return ok({
      urls: uploadedUrls,
      split: shouldSplit,
      count: finalImages.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

