import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const customerId = searchParams.get("customer_id")

    let query = supabase
      .from("manufacturing_projects")
      .select(`
        *,
        manufacturing_gemstones (*),
        manufacturing_activity_log (*)
      `)
      .order("created_at", { ascending: false })

    if (status === "in_production") {
      query = query.not("status", "in", "(ready_for_sale,sold)")
    } else if (status === "ready_for_sale") {
      query = query.eq("status", "ready_for_sale")
    } else if (status === "sold") {
      query = query.eq("status", "sold")
    }

    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data: projects, error: projectsError } = await query

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)

      const errorMessage =
        typeof projectsError === "string" ? projectsError : projectsError.message || "Failed to fetch projects"

      if (
        errorMessage.toLowerCase().includes("too many requests") ||
        errorMessage.toLowerCase().includes("rate limit")
      ) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json(projects || [])
  } catch (error) {
    console.error("API Error:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.toLowerCase().includes("too many requests") || errorMessage.toLowerCase().includes("rate limit")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      manufacturingCode,
      pieceName,
      pieceType,
      designDate,
      designer,
      status,
      craftsman,
      settingCost,
      diamondCost,
      totalCost,
      sellingPrice,
      metalPlating,
      metalPlatingNotes,
      notes,
      photos,
      gemstones,
    } = body

    const { data: project, error: projectError } = await supabase
      .from("manufacturing_projects")
      .insert({
        project_name: pieceName,
        customer_name: manufacturingCode,
        piece_type: pieceType,
        designer_name: designer,
        status,
        craftsman_name: craftsman,
        setting_cost: settingCost || 0,
        diamond_cost: diamondCost || 0,
        total_cost: totalCost,
        estimated_value: sellingPrice,
        metal_plating: metalPlating,
        plating_notes: metalPlatingNotes,
        usage_notes: notes,
        photos: photos || [],
      })
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    if (gemstones && gemstones.length > 0) {
      const validGemstones = gemstones.filter((gem: any) => gem.code && gem.code.trim() !== "")

      if (validGemstones.length > 0) {
        const gemstonesData = validGemstones.map((gem: any) => ({
          project_id: project.id,
          gemstone_code: gem.code,
          gemstone_type: gem.type,
          gemstone_details: gem.notes,
          pieces_used: gem.piecesUsed || 1,
          weight_used: gem.weightUsed || 0,
        }))

        const { error: gemstonesError } = await supabase.from("manufacturing_gemstones").insert(gemstonesData)

        if (gemstonesError) {
          console.error("Error inserting gemstones:", gemstonesError)
        }
      }
    }

    const { error: activityError } = await supabase.from("manufacturing_activity_log").insert({
      project_id: project.id,
      status,
      craftsman_name: craftsman,
      notes: `Project created with status: ${status}`,
    })

    if (activityError) {
      console.error("Error creating activity log:", activityError)
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
