"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, Plus, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Gemstone {
  id?: number
  code: string
  type: string
  weight: number
  pcs: number
  shape: string
  price_ct: number
  price_piece: number
  buying_date: string
  balance_pcs: number
  balance_ct: number
  color?: string
  clarity?: string
  origin?: string
  notes?: string
  supplier?: string
  certificate?: string
}

interface AddGemstoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (gemstone: Gemstone | Gemstone[]) => void
}

export function AddGemstoneModal({ isOpen, onClose, onSave }: AddGemstoneModalProps) {
  const [activeTab, setActiveTab] = useState("single")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Gemstone[]>([])
  const [parseError, setParseError] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")

  const [formData, setFormData] = useState<Gemstone>({
    code: "",
    type: "",
    weight: 0,
    pcs: 0,
    shape: "",
    price_ct: 0,
    price_piece: 0,
    buying_date: "",
    balance_pcs: 0,
    balance_ct: 0,
    color: "",
    clarity: "",
    origin: "",
    notes: "",
    supplier: "",
    certificate: "",
  })

  const handleInputChange = (field: keyof Gemstone, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setValidationError("")
  }

  const validateGemstone = (gemstone: Gemstone): string | null => {
    if (!gemstone.code || gemstone.code.trim() === "") {
      return "Code is required"
    }

    const hasPricePerCarat = gemstone.price_ct && gemstone.price_ct > 0
    const hasPricePerPiece = gemstone.price_piece && gemstone.price_piece > 0

    if (!hasPricePerCarat && !hasPricePerPiece) {
      return "Either Price per Carat or Price per Piece is required"
    }

    if (hasPricePerCarat && (!gemstone.balance_ct || gemstone.balance_ct <= 0)) {
      return "Balance in Carats (ct) is required when using Price per Carat"
    }

    if (hasPricePerPiece && (!gemstone.balance_pcs || gemstone.balance_pcs <= 0)) {
      return "Balance in Pieces (pcs) is required when using Price per Piece"
    }

    return null
  }

  const handleSingleSave = () => {
    const error = validateGemstone(formData)
    if (error) {
      setValidationError(error)
      return
    }

    onSave(formData)
    handleClose()
  }

  const handleBulkSave = () => {
    for (let i = 0; i < parsedData.length; i++) {
      const error = validateGemstone(parsedData[i])
      if (error) {
        setParseError(`Row ${i + 2}: ${error}`)
        return
      }
    }

    if (parsedData.length > 0) {
      onSave(parsedData)
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      code: "",
      type: "",
      weight: 0,
      pcs: 0,
      shape: "",
      price_ct: 0,
      price_piece: 0,
      buying_date: "",
      balance_pcs: 0,
      balance_ct: 0,
      color: "",
      clarity: "",
      origin: "",
      notes: "",
      supplier: "",
      certificate: "",
    })
    setUploadedFile(null)
    setParsedData([])
    setParseError("")
    setValidationError("")
    setActiveTab("single")
    onClose()
  }

  const downloadTemplate = () => {
    const headers = [
      "Code",
      "Type",
      "Weight (ct)",
      "Pieces",
      "Shape",
      "Price/CT",
      "Price/Piece",
      "Buying Date",
      "Balance Pieces",
      "Balance Weight (ct)",
      "Color",
      "Clarity",
      "Origin",
      "Supplier",
      "Certificate",
      "Notes",
    ]

    const sampleData = [
      [
        "DIA-007",
        "Diamond",
        "1.25",
        "1",
        "Round Brilliant",
        "5500",
        "6875",
        "15/03/2024",
        "1",
        "1.25",
        "G",
        "VS2",
        "Canada",
        "Northern Diamonds",
        "GIA-1234567890",
        "Beautiful diamond for engagement ring",
      ],
      [
        "SAP-008",
        "Sapphire",
        "8.60",
        "4",
        "Oval",
        "800",
        "1720",
        "20/03/2024",
        "4",
        "8.60",
        "Royal Blue",
        "VVS",
        "Sri Lanka",
        "Ceylon Gems",
        "SSEF-S2024020",
        "Exceptional Ceylon sapphire lot - nothing used yet",
      ],
      [
        "RUB-009",
        "Ruby",
        "12.50",
        "10",
        "Oval",
        "1200",
        "1500",
        "10/02/2024",
        "7",
        "8.75",
        "Pigeon Blood",
        "VS",
        "Myanmar",
        "Burma Gems",
        "GRS-2024001",
        "Used 3 pieces (3.75ct) for custom order",
      ],
    ]

    const csvContent = [headers, ...sampleData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gemstone_import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setParseError("")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          setParseError("File must contain at least a header row and one data row")
          return
        }

        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
        const data: Gemstone[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())

          if (values.length < 10) {
            setParseError(`Row ${i + 1} has insufficient columns. Expected at least 10 columns.`)
            return
          }

          const gemstone: Gemstone = {
            code: values[0] || "",
            type: values[1] || "",
            weight: Number.parseFloat(values[2]) || 0,
            pcs: Number.parseInt(values[3]) || 0,
            shape: values[4] || "",
            price_ct: Number.parseFloat(values[5]) || 0,
            price_piece: Number.parseFloat(values[6]) || 0,
            buying_date: values[7] || "",
            balance_pcs: Number.parseInt(values[8]) || 0,
            balance_ct: Number.parseFloat(values[9]) || 0,
            color: values[10] || "",
            clarity: values[11] || "",
            origin: values[12] || "",
            supplier: values[13] || "",
            certificate: values[14] || "",
            notes: values[15] || "",
          }

          const validationError = validateGemstone(gemstone)
          if (validationError) {
            setParseError(`Row ${i + 1}: ${validationError}`)
            return
          }

          data.push(gemstone)
        }

        setParsedData(data)
      } catch (error) {
        setParseError("Error parsing CSV file. Please check the format.")
      }
    }

    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-balance">Add Gemstones</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Single Gemstone
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pricing Requirements:</strong> You must provide either Price per Carat OR Price per Piece (not
                both required). If using Price per Carat, Balance in Carats is required. If using Price per Piece,
                Balance in Pieces is required.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="e.g., DIA-007"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  placeholder="e.g., Diamond"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (carats)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 1.25"
                />
              </div>
              <div>
                <Label htmlFor="pcs">Pieces</Label>
                <Input
                  id="pcs"
                  type="number"
                  value={formData.pcs}
                  onChange={(e) => handleInputChange("pcs", Number.parseInt(e.target.value) || 0)}
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <Label htmlFor="shape">Shape</Label>
                <Input
                  id="shape"
                  value={formData.shape}
                  onChange={(e) => handleInputChange("shape", e.target.value)}
                  placeholder="e.g., Round Brilliant"
                />
              </div>
              <div>
                <Label htmlFor="price_ct">Price per Carat ($/ct) {formData.price_piece > 0 ? "" : "*"}</Label>
                <Input
                  id="price_ct"
                  type="number"
                  step="0.01"
                  value={formData.price_ct}
                  onChange={(e) => handleInputChange("price_ct", Number.parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 5500"
                />
              </div>
              <div>
                <Label htmlFor="price_piece">Price per Piece ($/pc) {formData.price_ct > 0 ? "" : "*"}</Label>
                <Input
                  id="price_piece"
                  type="number"
                  step="0.01"
                  value={formData.price_piece}
                  onChange={(e) => handleInputChange("price_piece", Number.parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 6875"
                />
              </div>
              <div>
                <Label htmlFor="buying_date">Buying Date</Label>
                <Input
                  id="buying_date"
                  type="date"
                  value={formData.buying_date}
                  onChange={(e) => handleInputChange("buying_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="balance_pcs">Balance in Pieces (pcs) {formData.price_piece > 0 ? "*" : ""}</Label>
                <Input
                  id="balance_pcs"
                  type="number"
                  value={formData.balance_pcs}
                  onChange={(e) => handleInputChange("balance_pcs", Number.parseInt(e.target.value) || 0)}
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <Label htmlFor="balance_ct">Balance in Carats (ct) {formData.price_ct > 0 ? "*" : ""}</Label>
                <Input
                  id="balance_ct"
                  type="number"
                  step="0.01"
                  value={formData.balance_ct}
                  onChange={(e) => handleInputChange("balance_ct", Number.parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 1.25"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="e.g., G"
                />
              </div>
              <div>
                <Label htmlFor="clarity">Clarity</Label>
                <Input
                  id="clarity"
                  value={formData.clarity}
                  onChange={(e) => handleInputChange("clarity", e.target.value)}
                  placeholder="e.g., VS2"
                />
              </div>
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  placeholder="e.g., Canada"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
                placeholder="e.g., Northern Diamonds"
              />
            </div>

            <div>
              <Label htmlFor="certificate">Certificate</Label>
              <Input
                id="certificate"
                value={formData.certificate}
                onChange={(e) => handleInputChange("certificate", e.target.value)}
                placeholder="e.g., GIA-1234567890"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this gemstone..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSingleSave}>Add Gemstone</Button>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CSV Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Download the CSV template with the correct column format and sample data.
                </p>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csvFile">Select CSV File</Label>
                    <Input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
                  </div>

                  {parseError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                  )}

                  {uploadedFile && !parseError && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        Successfully parsed {parsedData.length} gemstones from {uploadedFile.name}
                      </AlertDescription>
                    </Alert>
                  )}

                  {parsedData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Preview ({parsedData.length} gemstones)</h4>
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <div className="grid gap-2 p-4">
                          {parsedData.slice(0, 5).map((gem, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-4">
                                <span className="font-medium">{gem.code}</span>
                                <span className="text-sm text-muted-foreground">{gem.type}</span>
                                <span className="text-sm">{gem.weight ? `${gem.weight} ct` : `${gem.pcs} pcs`}</span>
                                <span className="text-sm">{gem.shape}</span>
                              </div>
                              <span className="text-sm font-medium">${gem.price_piece.toLocaleString()}</span>
                            </div>
                          ))}
                          {parsedData.length > 5 && (
                            <div className="text-center text-sm text-muted-foreground py-2">
                              ... and {parsedData.length - 5} more gemstones
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleBulkSave} disabled={parsedData.length === 0}>
                Import {parsedData.length} Gemstones
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
