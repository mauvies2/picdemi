import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { addWatermarkToImage } from "@/lib/watermark";

/**
 * API route to serve watermarked images
 * Path format: /api/watermark/photos/userId/eventId/filename
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    const fullPath = pathSegments.join("/");

    // Validate path structure
    if (pathSegments.length < 3) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // Use service role client for admin access to storage
    // Fallback to anon key if service role key is not available
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!serviceRoleKey || serviceRoleKey.trim() === "") {
      console.error("Missing Supabase key for watermark API");
      return new NextResponse("Configuration error", { status: 500 });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("Missing Supabase URL for watermark API");
      return new NextResponse("Configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Download the original image from storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("photos")
      .download(fullPath);

    if (downloadError || !imageData) {
      console.error("Failed to download image:", downloadError);
      return new NextResponse("Image not found", { status: 404 });
    }

    // Convert blob to buffer
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Add watermark
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer);

    // Determine content type
    const contentType =
      imageData.type ||
      (fullPath.toLowerCase().endsWith(".png")
        ? "image/png"
        : fullPath.toLowerCase().endsWith(".webp")
          ? "image/webp"
          : "image/jpeg");

    // Return watermarked image with caching
    return new NextResponse(new Uint8Array(watermarkedBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Watermark API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
