import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function ensureBucketExists(supabase: any, bucketName: string) {
  try {
    console.log(`[v0] Checking if bucket ${bucketName} exists...`)

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error(`[v0] Error listing buckets:`, listError)
      throw listError
    }

    console.log(
      `[v0] Found ${buckets?.length || 0} buckets:`,
      buckets?.map((b: any) => b.name),
    )

    const bucketExists = buckets?.some((b: any) => b.name === bucketName)

    if (!bucketExists) {
      console.log(`[v0] Bucket ${bucketName} does not exist. Creating...`)

      // Create the bucket if it doesn't exist
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      })

      if (createError) {
        console.error(`[v0] Error creating bucket ${bucketName}:`, createError)
        // Check if error is because bucket already exists (race condition)
        if (!createError.message.includes("already exists")) {
          throw createError
        }
        console.log(`[v0] Bucket ${bucketName} already exists (race condition)`)
      } else {
        console.log(`[v0] Bucket ${bucketName} created successfully:`, createData)
      }
    } else {
      console.log(`[v0] Bucket ${bucketName} already exists`)
    }

    return true
  } catch (error: any) {
    console.error(`[v0] Error in ensureBucketExists:`, error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] ========== UPLOAD ROUTE CALLED ==========")
    console.log("[v0] Request URL:", request.url)
    console.log("[v0] Request method:", request.method)

    // Parse form data
    const formData = await request.formData()
    console.log("[v0] FormData parsed successfully")

    const file = formData.get("file") as File
    const type = (formData.get("type") as string) || "customer"

    console.log("[v0] Form data contents:")
    console.log("[v0] - file:", file ? `${file.name} (${file.type}, ${file.size} bytes)` : "null")
    console.log("[v0] - type:", type)

    if (!file) {
      console.log("[v0] ERROR: No file provided in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if (!validTypes.includes(file.type)) {
      console.log("[v0] ERROR: Invalid file type:", file.type)
      return NextResponse.json({ error: `Invalid file type. Allowed: ${validTypes.join(", ")}` }, { status: 400 })
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.log("[v0] ERROR: File too large:", file.size, "bytes")
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    console.log("[v0] Generated filename:", fileName)

    // Determine bucket and path based on type
    let bucket: string
    let filePath: string

    switch (type) {
      case "customer":
        bucket = "customer-photos"
        filePath = `customers/${fileName}`
        break
      case "manufacturing":
        bucket = "manufacturing-photos"
        filePath = `manufacturing/${fileName}`
        break
      default:
        bucket = "customer-photos"
        filePath = `customers/${fileName}`
    }

    console.log("[v0] Upload destination:")
    console.log("[v0] - bucket:", bucket)
    console.log("[v0] - path:", filePath)

    // Create Supabase admin client
    console.log("[v0] Creating Supabase admin client...")
    const supabase = createAdminClient()
    console.log("[v0] Admin client created")

    // Ensure bucket exists
    console.log("[v0] Ensuring bucket exists...")
    await ensureBucketExists(supabase, bucket)
    console.log("[v0] Bucket check complete")

    console.log("[v0] Starting upload to Supabase Storage...")
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload failed with error:", error.message)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return NextResponse.json({ error: `Failed to upload file: ${error.message}` }, { status: 500 })
    }

    console.log("[v0] Upload successful!")
    console.log("[v0] Upload data:", data)

    // Get public URL
    console.log("[v0] Getting public URL...")
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    console.log("[v0] Public URL generated:", publicUrl)
    console.log("[v0] ========== UPLOAD COMPLETE ==========")

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("[v0] ========== UPLOAD ERROR ==========")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error?.message)
    console.error("[v0] Error stack:", error?.stack)
    console.error("[v0] Full error:", JSON.stringify(error, null, 2))

    return NextResponse.json({ error: `Failed to upload file: ${error?.message || "Unknown error"}` }, { status: 500 })
  }
}
