import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { note } = body

    if (!note || note.trim() === "") {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("notes")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching customer:", fetchError)
      return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
    }

    const existingNotes = customer.notes || ""
    const timestamp = new Date().toISOString()
    const newNoteEntry = `[${timestamp}] ${note.trim()}`
    const updatedNotes = existingNotes ? `${existingNotes}\n\n${newNoteEntry}` : newNoteEntry

    const { data: updatedCustomer, error: updateError } = await supabase
      .from("customers")
      .update({
        notes: updatedNotes,
        updated_at: timestamp,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating customer notes:", updateError)
      return NextResponse.json({ error: "Failed to update customer notes" }, { status: 500 })
    }

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error) {
    console.error("Error in customer notes POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
