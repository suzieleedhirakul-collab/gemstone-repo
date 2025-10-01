"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, DollarSign, Gem, Package, Edit, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ActivityLogEntry {
  status: string
  date: string
  notes: string
  craftsman?: string
}

interface Gemstone {
  code: string
  type: string
  weightUsed: number
  piecesUsed: number
  notes: string
  priceCt?: number
  pricePiece?: number
}

interface ManufacturingRecord {
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

const statusOptions = [
  { value: "approved", label: "Approved", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "sent_to_craftsman", label: "Sent to Craftsman", color: "bg-purple-100 text-purple-800 border-purple-200" },
  {
    value: "internal_setting_qc",
    label: "Internal Setting QC",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  { value: "diamond_sorting", label: "Diamond Sorting", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "stone_setting", label: "Stone Setting", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { value: "plating", label: "Plating", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { value: "final_piece_qc", label: "Final Piece QC", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { value: "complete_piece", label: "Complete Piece", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { value: "ready_for_sale", label: "Ready for Sale", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "sold", label: "Sold", color: "bg-gray-100 text-gray-800 border-gray-200" },
]

export default function ManufacturingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [record, setRecord] = useState<ManufacturingRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ManufacturingRecord | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/manufacturing/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch manufacturing record")
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
          status: data.status || "approved",
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
                code: gem.gemstone_code || "",
                type: gem.gemstone_type || "",
                weightUsed: Number.parseFloat(gem.weight_used) || 0,
                piecesUsed: Number.parseInt(gem.pieces_used) || 1,
                notes: gem.gemstone_details || "",
                priceCt: gem.gemstone?.[0]?.price_ct ? Number.parseFloat(gem.gemstone[0].price_ct) : undefined,
                pricePiece: gem.gemstone?.[0]?.price_piece ? Number.parseFloat(gem.gemstone[0].price_piece) : undefined,
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
        console.error("[v0] Error fetching manufacturing record:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchRecord()
    }
  }, [params.id])

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

  useEffect(() => {
    if (isEditMode && formData) {
      const calculatedGemstoneCost = calculateGemstoneCost(formData.gemstones)
      const calculatedTotal = formData.settingCost + formData.diamondCost + calculatedGemstoneCost

      if (calculatedGemstoneCost !== formData.gemstoneCost || calculatedTotal !== formData.totalCost) {
        setFormData({
          ...formData,
          gemstoneCost: calculatedGemstoneCost,
          totalCost: calculatedTotal,
        })
      }
    }
  }, [isEditMode, formData])

  const handleEdit = () => {
    setFormData(record)
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setFormData(null)
    setIsEditMode(false)
  }

  const handleSave = async () => {
    if (!formData) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/manufacturing/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manufacturingCode: formData.manufacturingCode,
          pieceName: formData.pieceName,
          pieceType: formData.pieceType,
          designDate: formData.designDate,
          designer: formData.designer,
          metalPlating: formData.metalPlating,
          metalPlatingNotes: formData.metalPlatingNotes,
          status: formData.status,
          craftsman: formData.craftsman,
          settingCost: formData.settingCost,
          diamondCost: formData.diamondCost,
          gemstoneCost: formData.gemstoneCost,
          totalCost: formData.totalCost,
          sellingPrice: formData.sellingPrice,
          notes: formData.notes,
          photos: formData.photos,
          gemstones: formData.gemstones,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update manufacturing record")
      }

      toast({
        title: "Success",
        description: "Manufacturing record updated successfully",
      })

      setRecord(formData)
      setIsEditMode(false)
      setFormData(null)
    } catch (error) {
      console.error("[v0] Error saving manufacturing record:", error)
      toast({
        title: "Error",
        description: "Failed to update manufacturing record",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof ManufacturingRecord, value: any) => {
    if (!formData) return
    setFormData({ ...formData, [field]: value })
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.label || status.replace("_", " ")
  }

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
        toast({
          title: "Error",
          description: "Failed to upload photo",
          variant: "destructive",
        })
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from("manufacturing-photos").getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        const newPhotos = [...photos, urlData.publicUrl]
        setPhotos(newPhotos)
        console.log("[v0] Photo uploaded successfully to:", urlData.publicUrl)

        await savePhotosToDatabase(newPhotos)

        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        })
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

          const { error } = await supabase.storage.from("manufacturing-photos").remove([filePath])

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

    toast({
      title: "Success",
      description: "Photo removed successfully",
    })
  }

  const savePhotosToDatabase = async (updatedPhotos: string[]) => {
    if (!record) return

    try {
      const response = await fetch(`/api/manufacturing/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manufacturingCode: record.manufacturingCode,
          pieceName: record.pieceName,
          pieceType: record.pieceType,
          designDate: record.designDate,
          designer: record.designer,
          metalPlating: record.metalPlating,
          metalPlatingNotes: record.metalPlatingNotes,
          status: record.status,
          craftsman: record.craftsman,
          settingCost: record.settingCost,
          diamondCost: record.diamondCost,
          gemstoneCost: record.gemstoneCost,
          totalCost: record.totalCost,
          sellingPrice: record.sellingPrice,
          notes: record.notes,
          photos: updatedPhotos,
          gemstones: record.gemstones,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update photos")
      }

      setRecord({ ...record, photos: updatedPhotos })
      console.log("[v0] Photos updated successfully")
    } catch (error) {
      console.error("[v0] Error updating photos:", error)
      toast({
        title: "Error",
        description: "Failed to update photos",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading manufacturing details...</p>
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
          <h3 className="text-lg font-medium mb-2">Manufacturing Record Not Found</h3>
          <Button onClick={() => router.push("/?tab=manufacturing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manufacturing
          </Button>
        </div>
      </div>
    )
  }

  const displayData = isEditMode ? formData : record

  if (!displayData) return null

  const displayGemstoneCost = calculateGemstoneCost(displayData.gemstones)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/?tab=manufacturing")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">{displayData.manufacturingCode}</h1>
            <p className="text-muted-foreground">{displayData.pieceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <>
              <Badge variant="outline" className={`text-sm ${getStatusColor(displayData.status)}`}>
                {getStatusLabel(displayData.status)}
              </Badge>
              <Button onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manufacturing Code</Label>
                    <Input
                      value={displayData.manufacturingCode}
                      onChange={(e) => updateField("manufacturingCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Piece Name</Label>
                    <Input value={displayData.pieceName} onChange={(e) => updateField("pieceName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Piece Type</Label>
                    <Select value={displayData.pieceType} onValueChange={(value) => updateField("pieceType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ring">Ring</SelectItem>
                        <SelectItem value="necklace">Necklace</SelectItem>
                        <SelectItem value="bracelet">Bracelet</SelectItem>
                        <SelectItem value="earrings">Earrings</SelectItem>
                        <SelectItem value="pendant">Pendant</SelectItem>
                        <SelectItem value="brooch">Brooch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Designer</Label>
                    <Input value={displayData.designer} onChange={(e) => updateField("designer", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Design Date</Label>
                    <Input
                      type="date"
                      value={displayData.designDate}
                      onChange={(e) => updateField("designDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={displayData.status} onValueChange={(value) => updateField("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Craftsman</Label>
                    <Input value={displayData.craftsman} onChange={(e) => updateField("craftsman", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Metal Plating</Label>
                    <Input
                      value={displayData.metalPlating.join(", ")}
                      onChange={(e) =>
                        updateField(
                          "metalPlating",
                          e.target.value.split(",").map((s) => s.trim()),
                        )
                      }
                      placeholder="e.g., gold, silver"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plating Notes</Label>
                  <Textarea
                    value={displayData.metalPlatingNotes}
                    onChange={(e) => updateField("metalPlatingNotes", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={displayData.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturing Code</p>
                  <p className="font-medium">{displayData.manufacturingCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Piece Name</p>
                  <p className="font-medium">{displayData.pieceName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Piece Type</p>
                  <p className="font-medium capitalize">{displayData.pieceType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designer</p>
                  <p className="font-medium">{displayData.designer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Design Date</p>
                  <p className="font-medium">{formatDate(displayData.designDate)}</p>
                </div>
                {displayData.completionDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Date</p>
                    <p className="font-medium">{formatDate(displayData.completionDate)}</p>
                  </div>
                )}
                {displayData.craftsman && (
                  <div>
                    <p className="text-sm text-muted-foreground">Craftsman</p>
                    <p className="font-medium">{displayData.craftsman}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Metal Plating</p>
                  <p className="font-medium">
                    {displayData.metalPlating
                      .map((p) => p.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
            {!isEditMode && displayData.metalPlatingNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Plating Notes</p>
                <p className="font-medium">{displayData.metalPlatingNotes}</p>
              </div>
            )}
            {!isEditMode && displayData.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{displayData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Setting Cost</Label>
                  <Input
                    type="number"
                    value={displayData.settingCost}
                    onChange={(e) => updateField("settingCost", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diamond Cost</Label>
                  <Input
                    type="number"
                    value={displayData.diamondCost}
                    onChange={(e) => updateField("diamondCost", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gemstone Cost</Label>
                  <Input type="number" value={displayGemstoneCost.toFixed(2)} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Auto-calculated from gemstones used</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Cost</Label>
                  <Input type="number" value={displayData.totalCost.toFixed(2)} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Auto-calculated: Setting + Diamond + Gemstone</p>
                </div>
                <div className="space-y-2">
                  <Label>Selling Price</Label>
                  <Input
                    type="number"
                    value={displayData.sellingPrice}
                    onChange={(e) => updateField("sellingPrice", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Setting Cost</span>
                  <span className="font-medium">{formatCurrency(displayData.settingCost)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Diamond Cost</span>
                  <span className="font-medium">{formatCurrency(displayData.diamondCost)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Gemstone Cost</span>
                  <span className="font-medium">{formatCurrency(displayGemstoneCost)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b font-semibold text-lg">
                  <span>Total Cost</span>
                  <span>{formatCurrency(displayData.settingCost + displayData.diamondCost + displayGemstoneCost)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 font-semibold text-lg text-green-600">
                  <span>Selling Price</span>
                  <span>{formatCurrency(displayData.sellingPrice)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-medium">
                    {displayData.settingCost + displayData.diamondCost + displayGemstoneCost > 0
                      ? `${(((displayData.sellingPrice - (displayData.settingCost + displayData.diamondCost + displayGemstoneCost)) / (displayData.settingCost + displayData.diamondCost + displayGemstoneCost)) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gemstones Used */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5" />
            Gemstones Used ({displayData.gemstones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayData.gemstones.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayData.gemstones.map((gem, index) => {
                const gemCost =
                  gem.priceCt && gem.weightUsed
                    ? gem.weightUsed * gem.priceCt
                    : gem.pricePiece && gem.piecesUsed
                      ? gem.piecesUsed * gem.pricePiece
                      : 0

                return (
                  <Card key={index} className="bg-muted/20">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
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

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manufacturing Photos ({photos.length})</span>
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
                    alt={`Manufacturing photo ${index + 1}`}
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
              <p className="text-xs">Click "Add Photo" to attach images of this manufacturing project</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Log ({displayData.activityLog.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayData.activityLog.length > 0 ? (
            <div className="space-y-4">
              {displayData.activityLog.map((entry, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(entry.status)}`}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{getStatusLabel(entry.status)}</h4>
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
    </div>
  )
}
