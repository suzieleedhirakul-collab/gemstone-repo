import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: gemstone, error } = await supabase.from("gemstones").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching gemstone:", error)
      return NextResponse.json({ error: "Gemstone not found" }, { status: 404 })
    }

    return NextResponse.json(gemstone)
  } catch (error) {
    console.error("Error in gemstone GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data: gemstone, error } = await supabase
      .from("gemstones")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating gemstone:", error)
      return NextResponse.json({ error: "Failed to update gemstone" }, { status: 500 })
    }

    return NextResponse.json(gemstone)
  } catch (error) {
    console.error("Error in gemstone PUT API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("gemstones").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting gemstone:", error)
      return NextResponse.json({ error: "Failed to delete gemstone" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in gemstone DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
