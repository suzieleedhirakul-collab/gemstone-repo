import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, "")) // Remove surrounding quotes
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim().replace(/^"|"$/g, "")) // Remove surrounding quotes
  return result
}

function formatDateFromCSV(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null

  console.log("[v0] Processing date:", dateStr)

  // Handle DD/MM/YY format (2-digit year)
  const ddmmyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (ddmmyyMatch) {
    const [, day, month, year] = ddmmyyMatch
    // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
    const fullYear = `20${year}`
    const formattedDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    console.log("[v0] Formatted date (2-digit year):", formattedDate)
    return formattedDate
  }

  // Handle DD/MM/YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    console.log("[v0] Formatted date (4-digit year):", formattedDate)
    return formattedDate
  }

  console.log("[v0] Could not parse date:", dateStr)
  return null
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr.trim() === "") return null

  // Remove currency symbols, commas, and extract numbers
  const cleanPrice = priceStr.replace(/[^\d.]/g, "")
  const parsed = Number.parseFloat(cleanPrice)
  return isNaN(parsed) ? null : parsed
}

function parseWeight(weightStr: string): { weight: number | null; pieces: number | null } {
  if (!weightStr || weightStr.trim() === "") return { weight: null, pieces: null }

  console.log("[v0] Parsing weight string:", weightStr)

  // Handle format like "13.15 ct / 12" or "2.5 ct / 4"
  const ctPcsMatch = weightStr.match(/([\d.]+)\s*ct\s*\/\s*(\d+)/i)
  if (ctPcsMatch) {
    const weight = Number.parseFloat(ctPcsMatch[1])
    const pieces = Number.parseInt(ctPcsMatch[2])
    console.log("[v0] Parsed weight:", weight, "pieces:", pieces)
    return { weight, pieces }
  }

  // Fallback: Extract pieces count (e.g., "4pc." -> 4)
  const piecesMatch = weightStr.match(/(\d+)pc/i)
  const pieces = piecesMatch ? Number.parseInt(piecesMatch[1]) : null

  // Fallback: Extract weight (e.g., "2.5ct" -> 2.5)
  const weightMatch = weightStr.match(/([\d.]+)ct/i)
  const weight = weightMatch ? Number.parseFloat(weightMatch[1]) : null

  console.log("[v0] Fallback parsed weight:", weight, "pieces:", pieces)
  return { weight, pieces }
}

function parseBalance(balanceStr: string): { pieces: number | null; ct: number | null } {
  if (!balanceStr || balanceStr.trim() === "" || balanceStr.includes("หมด") || balanceStr.includes("คืน")) {
    return { pieces: 0, ct: 0 }
  }

  // Extract pieces
  const piecesMatch = balanceStr.match(/(\d+)pc/i)
  const pieces = piecesMatch ? Number.parseInt(piecesMatch[1]) : null

  // Extract carats
  const ctMatch = balanceStr.match(/(\d+\.?\d*)ct/i)
  const ct = ctMatch ? Number.parseFloat(ctMatch[1]) : null

  return { pieces, ct }
}

export async function POST(request: NextRequest) {
  try {
    const { csvUrl } = await request.json()

    if (!csvUrl) {
      return NextResponse.json({ error: "CSV URL is required" }, { status: 400 })
    }

    console.log("[v0] Fetching CSV from:", csvUrl)

    // Fetch the CSV file
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("[v0] CSV fetched, length:", csvText.length)

    const lines = csvText.split(/\r?\n/).filter((line) => line.trim())
    console.log("[v0] Total lines after filtering:", lines.length)

    if (lines.length === 0) {
      throw new Error("CSV file is empty")
    }

    const headers = parseCSVLine(lines[0])
    console.log("[v0] Headers found:", headers)
    console.log("[v0] Number of headers:", headers.length)

    if (lines.length > 1) {
      console.log("[v0] First data line raw:", JSON.stringify(lines[1]))
      const firstDataValues = parseCSVLine(lines[1])
      console.log("[v0] First data values:", firstDataValues)
      console.log("[v0] Number of values in first row:", firstDataValues.length)
    }

    const gemstones = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      console.log(`[v0] Row ${i} values:`, values)

      if (values.length < 6 || !values[0] || values[0].trim() === "") {
        console.log(`[v0] Skipping row ${i} - insufficient data or empty code`)
        continue
      }

      const weight = Number.parseFloat(values[2]) || 0 // Weight (ct)
      const pieces = Number.parseInt(values[3]) || 0 // Pieces
      const pricePerCt = parsePrice(values[5] || "") // PRICE / CT.
      const pricePerPiece = parsePrice(values[6] || "") // PRICE / PIECE
      const buyingDate = formatDateFromCSV(values[7] || "") // BUYING DATE

      // Balance fields - if not provided, assume nothing used (balance = original)
      const balancePieces = values[8] && values[8].trim() !== "" ? Number.parseInt(values[8]) || 0 : pieces
      const balanceWeight = values[9] && values[9].trim() !== "" ? Number.parseFloat(values[9]) || 0 : weight

      const gemstone = {
        code: values[0].trim(), // Code
        type: values[1] || null, // TYPE
        weight: weight, // Weight (ct)
        pcs: pieces, // Pieces
        shape: values[4] || null, // SHAPE
        price_ct: pricePerCt,
        price_piece: pricePerPiece,
        buying_date: buyingDate,
        balance_pcs: balancePieces,
        balance_ct: balanceWeight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Processed gemstone:", gemstone)
      gemstones.push(gemstone)
    }

    console.log("[v0] Total gemstones to insert:", gemstones.length)

    if (gemstones.length === 0) {
      throw new Error("No valid gemstone data found in CSV")
    }

    // Insert in batches
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < gemstones.length; i += batchSize) {
      const batch = gemstones.slice(i, i + batchSize)

      console.log("[v0] Inserting batch:", i / batchSize + 1, "with", batch.length, "items")

      const { data, error } = await supabase.from("gemstones").insert(batch).select()

      if (error) {
        console.error("[v0] Error inserting batch:", error)
        throw new Error(`Error inserting batch: ${error.message}`)
      }

      insertedCount += batch.length
      console.log("[v0] Successfully inserted batch, total so far:", insertedCount)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} gemstones`,
      count: insertedCount,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
