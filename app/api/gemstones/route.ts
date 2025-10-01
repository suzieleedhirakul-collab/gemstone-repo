import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    let query = supabase.from("gemstones").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`code.ilike.%${search}%,type.ilike.%${search}%,shape.ilike.%${search}%,color.ilike.%${search}%`)
    }

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (status && status !== "all") {
      if (status === "available") {
        query = query.gt("balance_ct", 1)
      } else if (status === "low-stock") {
        query = query.lte("balance_ct", 1).gt("balance_ct", 0)
      }
    }

    const { data: gemstones, error } = await query

    if (error) {
      console.error("Error fetching gemstones:", error)
      return NextResponse.json({ error: "Failed to fetch gemstones" }, { status: 500 })
    }

    return NextResponse.json(gemstones)
  } catch (error) {
    console.error("Error in gemstones API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data: gemstone, error } = await supabase.from("gemstones").insert([body]).select().single()

    if (error) {
      console.error("Error creating gemstone:", error)
      return NextResponse.json({ error: "Failed to create gemstone" }, { status: 500 })
    }

    return NextResponse.json(gemstone)
  } catch (error) {
    console.error("Error in gemstones POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
