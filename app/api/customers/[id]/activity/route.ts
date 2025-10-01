import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const { data: activities, error } = await supabase
      .from("manufacturing_activity_log")
      .select(`
        *,
        manufacturing_projects!inner(customer_id, project_name)
      `)
      .eq("manufacturing_projects.customer_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customer activity:", error)
      return NextResponse.json({ error: "Failed to fetch customer activity" }, { status: 500 })
    }

    return NextResponse.json(activities || [])
  } catch (error) {
    console.error("Error in customer activity GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
