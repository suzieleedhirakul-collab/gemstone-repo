import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch the manufacturing project
    const { data: project, error: projectError } = await supabase
      .from("manufacturing_projects")
      .select("*")
      .eq("id", id)
      .single()

    if (projectError || !project) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ error: "Manufacturing record not found" }, { status: 404 })
    }

    const { data: gemstones, error: gemstonesError } = await supabase
      .from("manufacturing_gemstones")
      .select(`
        *,
        gemstone:gemstones!manufacturing_gemstones_gemstone_code_fkey (
          price_ct,
          price_piece
        )
      `)
      .eq("project_id", id)

    if (gemstonesError) {
      console.error("Error fetching gemstones:", gemstonesError)
    }

    // Fetch activity log
    const { data: activityLog, error: activityError } = await supabase
      .from("manufacturing_activity_log")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false })

    if (activityError) {
      console.error("Error fetching activity log:", activityError)
    }

    // Combine all data
    const response = {
      ...project,
      manufacturing_gemstones: gemstones || [],
      manufacturing_activity_log: activityLog || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
      gemstoneCost, // Added gemstone cost field
      totalCost,
      sellingPrice,
      metalPlating,
      metalPlatingNotes,
      notes,
      photos,
      gemstones,
      customer_id,
      selling_price,
      sold_at,
    } = body

    // Get current project to check for status changes
    const { data: currentProject } = await supabase
      .from("manufacturing_projects")
      .select("status, craftsman_name")
      .eq("id", id)
      .single()

    const updateData: any = {
      project_name: pieceName,
      customer_name: manufacturingCode,
      piece_type: pieceType,
      designer_name: designer,
      status,
      craftsman_name: craftsman,
      setting_cost: settingCost || 0,
      diamond_cost: diamondCost || 0,
      gemstone_cost: gemstoneCost || 0, // Added gemstone cost to database update
      total_cost: totalCost,
      estimated_value: sellingPrice,
      metal_plating: metalPlating,
      plating_notes: metalPlatingNotes,
      usage_notes: notes,
      photos: photos || [],
    }

    if (status === "sold") {
      updateData.customer_id = customer_id
      updateData.selling_price = selling_price
      updateData.sold_at = sold_at
    }

    // Update the main project
    const { data: project, error: projectError } = await supabase
      .from("manufacturing_projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (projectError) {
      console.error("Error updating project:", projectError)
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    // Delete existing gemstones and insert new ones
    await supabase.from("manufacturing_gemstones").delete().eq("project_id", id)

    if (gemstones && gemstones.length > 0) {
      const gemstonesData = gemstones.map((gem: any) => ({
        project_id: id,
        gemstone_code: gem.code,
        gemstone_type: gem.type,
        gemstone_details: gem.notes,
        pieces_used: gem.piecesUsed || 1,
        weight_used: gem.weightUsed || 0,
      }))

      const { error: gemstonesError } = await supabase.from("manufacturing_gemstones").insert(gemstonesData)

      if (gemstonesError) {
        console.error("Error updating gemstones:", gemstonesError)
      }
    }

    // Log status change if status changed
    if (currentProject && currentProject.status !== status) {
      let logNotes = `Status changed from ${currentProject.status} to ${status}`
      if (status === "sold" && selling_price) {
        logNotes += ` for ${selling_price} THB`
      }

      const { error: activityError } = await supabase.from("manufacturing_activity_log").insert({
        project_id: id,
        status,
        craftsman_name: craftsman,
        notes: logNotes,
      })

      if (activityError) {
        console.error("Error creating activity log:", activityError)
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from("manufacturing_projects").delete().eq("id", id)

    if (error) {
      console.error("Error deleting project:", error)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
