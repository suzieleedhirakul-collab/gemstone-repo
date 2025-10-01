"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Calendar, DollarSign, Gem, Package, Edit, Save, X } from "lucide-react"
import { CertificateModal } from "@/components/certificate-modal"
import { createBrowserClient } from "@supabase/ssr"

interface ActivityLogEntry {
  status: string
  date: string
  notes: string
  craftsman?: string
}

interface Gemstone {
  id: string // Added id field for deletion
  code: string
  type: string
  weightUsed: number
  piecesUsed: number
  notes: string
  priceCt?: number
  pricePiece?: number
}

interface InStockRecord {
  id: number
  manufacturingCode: string
  pieceName: string
  pieceType: string
  designDate: string
  designer: string
  metalPlating: string[]
  metalPlatingNotes: string
  status: string
  craftsman?: string
  settingCost: number
  diamondCost: number
  gemstoneCost: number
  totalCost: number
  sellingPrice: number
  completionDate: string | null
  notes: string
  gemstones: Gemstone[]
  activityLog: ActivityLogEntry[]
  photos?: string[]
}

export default function InStockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<InStockRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editedSellingPrice, setEditedSellingPrice] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedGemstones, setSelectedGemstones] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/manufacturing/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch in-stock record")
        }
        const data = await response.json()

        const mappedRecord = {
          id: data.id,
          manufacturingCode: data.customer_name,
          pieceName: data.project_name,
          pieceType: data.piece_type || "",
          designDate: data.created_at
            ? new Date(data.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          designer: data.designer_name || "",
          metalPlating: Array.isArray(data.metal_plating) ? data.metal_plating : [],
          metalPlatingNotes: data.plating_notes || "",
          status: data.status || "ready_for_sale",
          craftsman: data.craftsman_name || "",
          settingCost: Number.parseFloat(data.setting_cost) || 0,
          diamondCost: Number.parseFloat(data.diamond_cost) || 0,
          gemstoneCost: Number.parseFloat(data.gemstone_cost) || 0,
          totalCost: Number.parseFloat(data.total_cost) || 0,
          sellingPrice: Number.parseFloat(data.estimated_value) || 0,
          completionDate: data.updated_at ? new Date(data.updated_at).toISOString().split("T")[0] : null,
          notes: data.usage_notes || "",
          gemstones: Array.isArray(data.manufacturing_gemstones)
            ? data.manufacturing_gemstones.map((gem: any) => ({
                id: gem.id, // Added id mapping
                code: gem.gemstone_code || "",
                type: gem.gemstone_type || "",
                weightUsed: Number.parseFloat(gem.weight_used) || 0,
                piecesUsed: Number.parseInt(gem.pieces_used) || 1,
                notes: gem.gemstone_details || "",
                priceCt: gem.gemstone?.price_ct ? Number.parseFloat(gem.gemstone.price_ct) : undefined,
                pricePiece: gem.gemstone?.price_piece ? Number.parseFloat(gem.gemstone.price_piece) : undefined,
              }))
            : [],
          activityLog: Array.isArray(data.manufacturing_activity_log)
            ? data.manufacturing_activity_log.map((log: any) => ({
                status: log.status || "",
                date: log.created_at || new Date().toISOString(),
                notes: log.notes || "",
                craftsman: log.craftsman_name || "",
              }))
            : [],
          photos: Array.isArray(data.photos) ? data.photos : [],
        }

        setRecord(mappedRecord)
        setPhotos(mappedRecord.photos || [])
      } catch (error) {
        console.error("[v0] Error fetching in-stock record:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchRecord()
    }
  }, [params.id])

  const formatCurrency = (amount: number) => {
    const validAmount = Number.isFinite(amount) ? amount : 0
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateGemstoneCost = (gemstones: Gemstone[]): number => {
    return gemstones.reduce((total, gem) => {
      if (gem.priceCt && gem.weightUsed) {
        return total + gem.weightUsed * gem.priceCt
      } else if (gem.pricePiece && gem.piecesUsed) {
        return total + gem.piecesUsed * gem.pricePiece
      }
      return total
    }, 0)
  }

  const handleEditPrice = () => {
    setEditedSellingPrice(record?.sellingPrice || 0)
    setIsEditingPrice(true)
  }

  const handleSavePrice = async () => {
    if (!record) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/manufacturing/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturingCode: record.manufacturingCode,
          pieceName: record.pieceName,
          pieceType: record.pieceType,
          designer: record.designer,
          status: record.status,
          craftsman: record.craftsman,
          settingCost: record.settingCost,
          diamondCost: record.diamondCost,
          gemstoneCost: record.gemstoneCost,
          totalCost: record.totalCost,
          sellingPrice: editedSellingPrice,
          metalPlating: record.metalPlating,
          metalPlatingNotes: record.metalPlatingNotes,
          notes: record.notes,
          photos: record.photos,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update selling price")
      }

      setRecord({ ...record, sellingPrice: editedSellingPrice })
      setIsEditingPrice(false)
      console.log("[v0] Selling price updated successfully")
    } catch (error) {
      console.error("[v0] Error updating selling price:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingPrice(false)
    setEditedSellingPrice(record?.sellingPrice || 0)
  }

  const handleMarkAsSold = async () => {
    if (!record) return

    const confirmed = window.confirm(
      `Are you sure you want to mark "${record.pieceName}" as sold for ${formatCurrency(record.sellingPrice)}?`,
    )
    if (!confirmed) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/manufacturing/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "sold",
          selling_price: record.sellingPrice,
          sold_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark as sold")
      }

      console.log("[v0] Item marked as sold successfully")
      router.push("/?tab=instock")
    } catch (error) {
      console.error("[v0] Error marking as sold:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const filePath = `manufacturing/${fileName}.${fileExt}`

      console.log("[v0] Uploading photo to Supabase Storage:", filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("manufacturing-photos")
        .upload(filePath, file)

      if (uploadError) {
        console.error("[v0] Error uploading photo:", uploadError)
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from("manufacturing-photos").getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        const newPhotos = [...photos, urlData.publicUrl]
        setPhotos(newPhotos)
        console.log("[v0] Photo uploaded successfully to:", urlData.publicUrl)

        await savePhotosToDatabase(newPhotos)
      } else {
        throw new Error("Failed to get public URL for uploaded photo")
      }
    } catch (error) {
      console.error("[v0] Error uploading photo:", error)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = photos[index]

    try {
      if (photoUrl.includes("supabase") && photoUrl.includes("manufacturing-photos")) {
        const urlParts = photoUrl.split("/manufacturing-photos/")
        if (urlParts.length === 2) {
          const filePath = urlParts[1]
          console.log("[v0] Deleting photo from Supabase Storage:", filePath)

          const { error } = await supabase.storage.from("manufacturing-photos").remove([`manufacturing/${filePath}`])

          if (error) {
            console.error("[v0] Error deleting photo from storage:", error)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error deleting photo:", error)
    }

    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    await savePhotosToDatabase(newPhotos)
  }

  const savePhotosToDatabase = async (updatedPhotos: string[]) => {
    if (!record) return

    try {
      const response = await fetch(`/api/manufacturing/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturingCode: record.manufacturingCode,
          pieceName: record.pieceName,
          pieceType: record.pieceType,
          designer: record.designer,
          status: record.status,
          craftsman: record.craftsman,
          settingCost: record.settingCost,
          diamondCost: record.diamondCost,
          gemstoneCost: record.gemstoneCost,
          totalCost: record.totalCost,
          sellingPrice: record.sellingPrice,
          metalPlating: record.metalPlating,
          metalPlatingNotes: record.metalPlatingNotes,
          notes: record.notes,
          photos: updatedPhotos,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update photos")
      }

      setRecord({ ...record, photos: updatedPhotos })
      console.log("[v0] Photos updated successfully")
    } catch (error) {
      console.error("[v0] Error updating photos:", error)
    }
  }

  const handleToggleGemstone = (gemstoneId: string) => {
    setSelectedGemstones((prev) =>
      prev.includes(gemstoneId) ? prev.filter((id) => id !== gemstoneId) : [...prev, gemstoneId],
    )
  }

  const handleSelectAll = () => {
    if (!record) return
    if (selectedGemstones.length === record.gemstones.length) {
      setSelectedGemstones([])
    } else {
      setSelectedGemstones(record.gemstones.map((gem) => gem.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (!record || selectedGemstones.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedGemstones.length} gemstone${selectedGemstones.length > 1 ? "s" : ""} from the project?`,
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const deletePromises = selectedGemstones.map((gemstoneId) =>
        fetch(`/api/manufacturing-gemstones/${gemstoneId}`, {
          method: "DELETE",
        }),
      )

      const results = await Promise.all(deletePromises)

      const allSuccessful = results.every((response) => response.ok)

      if (!allSuccessful) {
        throw new Error("Some gemstones failed to delete")
      }

      const updatedGemstones = record.gemstones.filter((gem) => !selectedGemstones.includes(gem.id))
      setRecord({ ...record, gemstones: updatedGemstones })
      setSelectedGemstones([])
      console.log("[v0] Gemstones deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting gemstones:", error)
      alert("Failed to delete some gemstones. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteGemstone = async (gemstoneId: string) => {
    if (!record) return

    const confirmed = window.confirm("Are you sure you want to remove this gemstone from the project?")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/manufacturing-gemstones/${gemstoneId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete gemstone")
      }

      const updatedGemstones = record.gemstones.filter((gem) => gem.id !== gemstoneId)
      setRecord({ ...record, gemstones: updatedGemstones })
      console.log("[v0] Gemstone deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting gemstone:", error)
      alert("Failed to delete gemstone. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Product Not Found</h3>
          <Button onClick={() => router.push("/?tab=instock")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to In Stock
          </Button>
        </div>
      </div>
    )
  }

  const displayGemstoneCost = calculateGemstoneCost(record.gemstones)
  const displayTotalCost = record.settingCost + record.diamondCost + displayGemstoneCost

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/?tab=instock")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">{record.manufacturingCode}</h1>
            <p className="text-muted-foreground">{record.pieceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm bg-green-100 text-green-800 border-green-200">
            Ready for Sale
          </Badge>
          <Button variant="outline" onClick={() => setIsCertificateModalOpen(true)}>
            Get Certificate
          </Button>
          <Button onClick={handleMarkAsSold} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            Mark as Sold
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Product Code</p>
                <p className="font-medium">{record.manufacturingCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>
                <p className="font-medium">{record.pieceName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Piece Type</p>
                <p className="font-medium capitalize">{record.pieceType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Designer</p>
                <p className="font-medium">{record.designer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Design Date</p>
                <p className="font-medium">{formatDate(record.designDate)}</p>
              </div>
              {record.completionDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Completion Date</p>
                  <p className="font-medium">{formatDate(record.completionDate)}</p>
                </div>
              )}
              {record.craftsman && (
                <div>
                  <p className="text-sm text-muted-foreground">Craftsman</p>
                  <p className="font-medium">{record.craftsman}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Metal Plating</p>
                <p className="font-medium">
                  {record.metalPlating
                    .map((p) => p.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                    .join(", ")}
                </p>
              </div>
            </div>
            {record.metalPlatingNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Plating Notes</p>
                <p className="font-medium">{record.metalPlatingNotes}</p>
              </div>
            )}
            {record.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{record.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Setting Cost</span>
                <span className="font-medium">{formatCurrency(record.settingCost)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Diamond Cost</span>
                <span className="font-medium">{formatCurrency(record.diamondCost)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Gemstone Cost</span>
                <span className="font-medium">{formatCurrency(displayGemstoneCost)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b font-semibold text-lg">
                <span>Total Cost</span>
                <span>{formatCurrency(displayTotalCost)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 font-semibold text-lg text-green-600">
                <span>Selling Price</span>
                {isEditingPrice ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editedSellingPrice}
                      onChange={(e) => setEditedSellingPrice(Number(e.target.value))}
                      className="w-32 h-8 text-right"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSavePrice} disabled={isSaving}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{formatCurrency(record.sellingPrice)}</span>
                    <Button size="icon" variant="ghost" onClick={handleEditPrice}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-medium">
                  {displayTotalCost > 0
                    ? `${(((record.sellingPrice - displayTotalCost) / displayTotalCost) * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 bg-muted rounded-lg px-4 py-3">
                <span className="font-medium">Expected Profit</span>
                <span
                  className={`font-bold ${record.sellingPrice - displayTotalCost > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(record.sellingPrice - displayTotalCost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5" />
              Gemstones Used ({record.gemstones.length})
            </CardTitle>
            {record.gemstones.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedGemstones.length === record.gemstones.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedGemstones.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : `Delete Selected (${selectedGemstones.length})`}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {record.gemstones.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {record.gemstones.map((gem, index) => {
                const gemCost =
                  gem.priceCt && gem.weightUsed
                    ? gem.weightUsed * gem.priceCt
                    : gem.pricePiece && gem.piecesUsed
                      ? gem.piecesUsed * gem.pricePiece
                      : 0

                const isSelected = selectedGemstones.includes(gem.id)

                return (
                  <Card
                    key={gem.id}
                    className={`bg-muted/20 relative group cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleToggleGemstone(gem.id)}
                  >
                    <div
                      className={`absolute top-2 left-2 z-10 ${selectedGemstones.length > 0 || "opacity-0 group-hover:opacity-100"} transition-opacity`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleGemstone(gem.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {selectedGemstones.length === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGemstone(gem.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between pr-6">
                        <span className="font-mono font-semibold">{gem.code}</span>
                        <Badge variant="outline">{gem.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Weight Used</p>
                          <p className="font-medium">{gem.weightUsed} ct</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pieces Used</p>
                          <p className="font-medium">{gem.piecesUsed} pcs</p>
                        </div>
                      </div>
                      {gemCost > 0 && (
                        <div className="text-sm pt-2 border-t">
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-semibold text-green-600">{formatCurrency(gemCost)}</p>
                        </div>
                      )}
                      {gem.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="font-medium">{gem.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gem className="mx-auto h-8 w-8 mb-2" />
              <p>No gemstones recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Photos ({photos.length})</span>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={uploadingPhoto}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("photo-upload")?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>+ Add Photo</>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Product photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2" />
              <p>No photos attached</p>
              <p className="text-xs">Click "Add Photo" to attach images of this product</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Log ({record.activityLog.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {record.activityLog.length > 0 ? (
            <div className="space-y-4">
              {record.activityLog.map((entry, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-800 border-green-200">
                      <Package className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold capitalize">{entry.status.replace("_", " ")}</h4>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                    {entry.craftsman && <p className="text-sm font-medium mt-1">Craftsman: {entry.craftsman}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-8 w-8 mb-2" />
              <p>No activity recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CertificateModal
        item={
          record
            ? {
                manufacturingCode: record.manufacturingCode,
                pieceName: record.pieceName,
                pieceType: record.pieceType,
                sellingPrice: record.sellingPrice,
                metalPlating: record.metalPlating,
                gemstones: record.gemstones,
                photos: record.photos,
              }
            : null
        }
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </div>
  )
}
