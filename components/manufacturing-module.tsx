"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Package, Calendar, DollarSign, Gem, Trash2, Edit, FileText, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation" // Added useRouter import

const designers = ["ML Rojanatorn", "Dao", "Ping", "Praewa", "Gub", "Suzie"]

const pieceTypeOptions = [
  { value: "earrings", label: "Earrings" },
  { value: "bracelet", label: "Bracelet" },
  { value: "choker", label: "Choker" },
  { value: "necklace", label: "Necklace" },
  { value: "brooch", label: "Brooch" },
  { value: "ring", label: "Ring" },
  { value: "pendant", label: "Pendant" },
  { value: "other", label: "Other" },
]

const craftsmen = ["Pichai", "Tui", "Ti", "Chanon"]

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

const metalPlatingOptions = [
  { value: "white_gold", label: "White Gold" },
  { value: "gold", label: "Gold" },
  { value: "rose_gold", label: "Rose Gold" },
  { value: "special", label: "Special" },
]

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
}

interface ManufacturingRecord {
  id?: number
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
  totalCost: number
  sellingPrice: number
  completionDate: string | null
  notes: string
  gemstones: Gemstone[]
  activityLog: ActivityLogEntry[]
  photos?: string[]
}

export function ManufacturingModule() {
  const router = useRouter() // Added router instance
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ManufacturingRecord | null>(null)
  const [availableGemstones, setAvailableGemstones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])

  // Added certificate generation state
  const [certificateRecord, setCertificateRecord] = useState<ManufacturingRecord | null>(null)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)

  // Generate next manufacturing code
  const generateManufacturingCode = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2) // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, "0")

    const currentMonthCodes = manufacturingRecords
      .filter((record) => record.manufacturingCode.startsWith(`ND${year}${month}`))
      .map((record) => Number.parseInt(record.manufacturingCode.slice(-3)))

    const nextNumber = currentMonthCodes.length > 0 ? Math.max(...currentMonthCodes) + 1 : 1

    return `ND${year}${month}${nextNumber.toString().padStart(3, "0")}`
  }

  useEffect(() => {
    const loadData = async () => {
      const records = await fetchManufacturingRecords("in_production")
      setManufacturingRecords(records)

      try {
        console.log("[v0] Loading gemstones from database for manufacturing...")
        const response = await fetch("/api/gemstones")

        if (!response.ok) {
          throw new Error("Failed to fetch gemstones from database")
        }

        const gemstonesData = await response.json()

        // Filter only available gemstones (balance > 0)
        const availableGems = gemstonesData.filter((gem: any) => gem.balance_pcs > 0 && gem.balance_ct > 0)

        // Map database fields to the format expected by the component
        const mappedGemstones = availableGems.map((gem: any) => ({
          Code: gem.code,
          TYPE: gem.type,
          "WEIGHT/PCS.": gem.weight ? `${gem.weight} ct` : `${gem.pcs} pcs`,
          SHAPE: gem.shape,
          "PRICE / CT.": gem.price_ct.toString(),
          "PRICE / PIECE": gem.price_piece.toString(),
          "BUYING DATE": gem.buying_date,
          "BALANCE/PCS.": gem.balance_pcs.toString(),
          "BALANCE/CT": gem.balance_ct.toString(),
          available: true,
        }))

        console.log("[v0] Loaded available gemstones from database:", mappedGemstones.length)
        setAvailableGemstones(mappedGemstones)
      } catch (error) {
        console.error("[v0] Error loading gemstones from database:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredRecords = (manufacturingRecords || []).filter(
    (record) =>
      (record?.manufacturingCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record?.pieceName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const handleAddNew = () => {
    setEditingRecord({
      manufacturingCode: generateManufacturingCode(),
      pieceName: "",
      pieceType: "",
      designDate: new Date().toISOString().split("T")[0],
      designer: "",
      metalPlating: [],
      metalPlatingNotes: "",
      status: "approved",
      settingCost: 0,
      diamondCost: 0,
      totalCost: 0,
      sellingPrice: 0,
      completionDate: null,
      notes: "",
      gemstones: [],
      activityLog: [
        {
          status: "approved",
          date: new Date().toISOString(),
          notes: "Project created",
        },
      ],
      photos: [],
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: ManufacturingRecord) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  const handleSave = async (record: ManufacturingRecord) => {
    try {
      const savedRecord = await saveManufacturingRecord(record)

      let updatedRecords: ManufacturingRecord[]
      if (record.id) {
        // Update existing record
        updatedRecords = manufacturingRecords.map((r) => (r.id === record.id ? savedRecord : r))
      } else {
        // Add new record
        updatedRecords = [...manufacturingRecords, savedRecord]
      }

      setManufacturingRecords(updatedRecords)
      setIsModalOpen(false)
      setEditingRecord(null)
    } catch (error) {
      console.error("[v0] Error saving manufacturing record:", error)
      // You could add a toast notification here for user feedback
    }
  }

  const handleDelete = async (recordId: number) => {
    try {
      await deleteManufacturingRecord(recordId)
      const updatedRecords = manufacturingRecords.filter((r) => r.id !== recordId)
      setManufacturingRecords(updatedRecords)
    } catch (error) {
      console.error("[v0] Error deleting manufacturing record:", error)
      // You could add a toast notification here for user feedback
    }
  }

  const handleGenerateCertificate = (record: ManufacturingRecord) => {
    // Open certificate modal
    setCertificateRecord(record)
    setIsCertificateModalOpen(true)
  }

  // Added handleViewDetails function
  const handleViewDetails = (recordId: number) => {
    router.push(`/manufacturing/${recordId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading manufacturing data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{manufacturingRecords.length}</div>
            <p className="text-xs text-muted-foreground">Currently in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Sale</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {manufacturingRecords.filter((r) => r.status === "ready_for_sale").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed pieces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(manufacturingRecords.reduce((sum, r) => sum + r.sellingPrice, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Selling price value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Gemstones</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableGemstones.length}</div>
            <p className="text-xs text-muted-foreground">Ready for manufacturing</p>
          </CardContent>
        </Card>
      </div>

      {/* Manufacturing Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Manufacturing Records</CardTitle>
              <p className="text-sm text-muted-foreground">Track jewelry production with detailed workflow</p>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code or piece name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {manufacturingRecords.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Manufacturing Records</h3>
              <p className="text-muted-foreground mb-4">Start by creating your first manufacturing project</p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
            </div>
          ) : (
            /* Records Grid */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(filteredRecords || []).map((record) => (
                <Card
                  key={record.id}
                  className="cursor-pointer transition-all hover:shadow-md flex flex-col"
                  onClick={() => handleViewDetails(record.id!)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-balance">{record.manufacturingCode}</h3>
                        <p className="text-sm text-muted-foreground">{record.pieceName}</p>
                        <p className="text-xs text-muted-foreground">Designer: {record.designer}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-auto">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Design Date:</span>
                          <span>{formatDate(record.designDate)}</span>
                        </div>
                        {record.completionDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completed:</span>
                            <span>{formatDate(record.completionDate)}</span>
                          </div>
                        )}
                        {record.pieceType && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="capitalize">{record.pieceType.replace("_", " ")}</span>
                          </div>
                        )}
                        {record.craftsman && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Craftsman:</span>
                            <span>{record.craftsman}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Metal Plating:</span>
                          <span className="text-xs">
                            {(record.metalPlating || []).map((p) => p.replace("_", " ")).join(", ") || "None"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Setting Cost:</span>
                          <span>{formatCurrency(record.settingCost || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Diamond Cost:</span>
                          <span>{formatCurrency(record.diamondCost || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-medium">{formatCurrency(record.totalCost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Selling Price:</span>
                          <span className="font-medium">{formatCurrency(record.sellingPrice)}</span>
                        </div>
                      </div>

                      {/* Gemstones Used */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Gemstones Used:</p>
                        <div className="space-y-1">
                          {(record.gemstones || []).map((gem, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-muted rounded p-2">
                              <span>
                                {gem.code} - {gem.type}
                              </span>
                              <span>{gem.weightUsed}ct</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Photos */}
                      {record.photos && Array.isArray(record.photos) && record.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Photos:</p>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {record.photos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo || "/placeholder.svg"}
                                  alt={`Manufacturing photo ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 mt-auto pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(record.id!)
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(record)
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        {record.status === "ready_for_sale" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateCertificate(record)
                            }}
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            Certificate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(record.id!)
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Manufacturing Modal */}
      <ManufacturingModal
        record={editingRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
        }}
        onSave={handleSave}
        availableGemstones={availableGemstones}
      />

      <CertificateModal
        record={certificateRecord}
        isOpen={isCertificateModalOpen}
        onClose={() => {
          setIsCertificateModalOpen(false)
          setCertificateRecord(null)
        }}
      />
    </div>
  )
}

function ManufacturingModal({
  record,
  isOpen,
  onClose,
  onSave,
  availableGemstones,
}: {
  record: ManufacturingRecord | null
  isOpen: boolean
  onClose: () => void
  onSave: (record: ManufacturingRecord) => void
  availableGemstones: any[]
}) {
  const [formData, setFormData] = useState<ManufacturingRecord>({
    manufacturingCode: "",
    pieceName: "",
    pieceType: "",
    designDate: "",
    designer: "",
    metalPlating: [],
    metalPlatingNotes: "",
    status: "approved",
    settingCost: 0,
    diamondCost: 0,
    totalCost: 0,
    sellingPrice: 0,
    completionDate: null,
    notes: "",
    gemstones: [],
    activityLog: [],
    photos: [],
  })
  const [gemstoneSearchTerm, setGemstoneSearchTerm] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const calculateTotalCost = (
    gemstones: Gemstone[],
    settingCost: number,
    diamondCost: number,
    availableGemstones: any[],
  ) => {
    let gemstoneCost = 0

    gemstones.forEach((gem) => {
      const availableGem = availableGemstones.find((g) => g.Code === gem.code)
      if (availableGem) {
        // Use ct amount x price per ct if weight is used, otherwise use pieces x price per piece
        if (gem.weightUsed > 0 && availableGem["PRICE / CT."]) {
          const pricePerCt = Number.parseFloat(availableGem["PRICE / CT."].replace(/[^\d.-]/g, "")) || 0
          gemstoneCost += gem.weightUsed * pricePerCt
        } else if (gem.piecesUsed > 0 && availableGem["PRICE / PIECE"]) {
          const pricePerPiece = Number.parseFloat(availableGem["PRICE / PIECE"].replace(/[^\d.-]/g, "")) || 0
          gemstoneCost += gem.piecesUsed * pricePerPiece
        }
      }
    })

    return gemstoneCost + settingCost + diamondCost
  }

  useEffect(() => {
    const newTotalCost = calculateTotalCost(
      formData.gemstones,
      formData.settingCost,
      formData.diamondCost,
      availableGemstones,
    )

    if (newTotalCost !== formData.totalCost) {
      setFormData((prev) => ({ ...prev, totalCost: newTotalCost }))
    }
  }, [formData.gemstones, formData.settingCost, formData.diamondCost, availableGemstones])

  useEffect(() => {
    if (record) {
      console.log("[v0] Loading record for editing:", record)
      console.log("[v0] Record gemstones:", record.gemstones)
      setFormData(record)
      // Initialize photos state from record.photos if available
      setPhotos(record.photos || [])
    } else {
      // Reset form data and photos when no record is being edited (for new entries)
      setFormData({
        manufacturingCode: "",
        pieceName: "",
        pieceType: "",
        designDate: new Date().toISOString().split("T")[0],
        designer: "",
        metalPlating: [],
        metalPlatingNotes: "",
        status: "approved",
        settingCost: 0,
        diamondCost: 0,
        totalCost: 0,
        sellingPrice: 0,
        completionDate: null,
        notes: "",
        gemstones: [],
        activityLog: [
          {
            status: "approved",
            date: new Date().toISOString(),
            notes: "Project created",
          },
        ],
        photos: [],
      })
      setPhotos([])
    }
  }, [record])

  const filteredGemstones = availableGemstones.filter(
    (gem) =>
      (gem.Code || "").toLowerCase().includes(gemstoneSearchTerm.toLowerCase()) ||
      (gem.TYPE || "").toLowerCase().includes(gemstoneSearchTerm.toLowerCase()),
  )

  const handleStatusChange = (newStatus: string) => {
    const now = new Date().toISOString()
    const newActivityEntry: ActivityLogEntry = {
      status: newStatus,
      date: now,
      notes: `Status changed to ${getStatusLabel(newStatus)}`,
    }

    // Add craftsman to activity log if status is "sent_to_craftsman"
    if (newStatus === "sent_to_craftsman" && formData.craftsman) {
      newActivityEntry.craftsman = formData.craftsman
      newActivityEntry.notes = `Assigned to ${formData.craftsman}`
    }

    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      activityLog: [...prev.activityLog, newActivityEntry],
    }))
  }

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.label || status.replace("_", " ")
  }

  const handleMetalPlatingChange = (plating: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      metalPlating: checked
        ? [...(prev.metalPlating || []), plating]
        : (prev.metalPlating || []).filter((p) => p !== plating),
    }))
  }

  const handleAddGemstone = () => {
    setFormData((prev) => ({
      ...prev,
      gemstones: [...(prev.gemstones || []), { code: "", type: "", weightUsed: 0, piecesUsed: 1, notes: "" }],
    }))
  }

  const handleRemoveGemstone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gemstones: (prev.gemstones || []).filter((_, i) => i !== index),
    }))
  }

  const handleGemstoneChange = (index: number, field: keyof Gemstone, value: any) => {
    setFormData((prev) => ({
      ...prev,
      gemstones: (prev.gemstones || []).map((gem, i) => (i === index ? { ...gem, [field]: value } : gem)),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ensure photos are correctly associated with the form data before saving
    onSave({ ...formData, photos })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `manufacturing/${fileName}`

      console.log("[v0] Uploading photo to Supabase Storage:", filePath)

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("manufacturing-photos")
        .upload(filePath, file)

      if (uploadError) {
        console.error("[v0] Error uploading photo:", uploadError)
        throw uploadError
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage.from("manufacturing-photos").getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        setPhotos((prev) => [...(prev || []), urlData.publicUrl])
        console.log("[v0] Photo uploaded successfully to:", urlData.publicUrl)
      } else {
        throw new Error("Failed to get public URL for uploaded photo")
      }
    } catch (error) {
      console.error("[v0] Error uploading photo:", error)
      // You could add a toast notification here for user feedback
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = photos[index]

    // If it's a Supabase Storage URL, extract the file path and delete from storage
    if (photoUrl.includes("supabase") && photoUrl.includes("manufacturing-photos")) {
      try {
        const supabase = createClient()

        // Extract file path from URL
        const urlParts = photoUrl.split("/manufacturing-photos/")
        if (urlParts.length > 1) {
          const filePath = urlParts[1]

          console.log("[v0] Deleting photo from Supabase Storage:", filePath)

          const { error } = await supabase.storage.from("manufacturing-photos").remove([`manufacturing/${filePath}`])

          if (error) {
            console.error("[v0] Error deleting photo from storage:", error)
          }
        }
      } catch (error) {
        console.error("[v0] Error deleting photo:", error)
      }
    }

    // Remove from local state
    setPhotos((prev) => {
      const newPhotos = [...(prev || [])]
      // Clean up blob URL if it exists (for backward compatibility)
      if (newPhotos[index].startsWith("blob:")) {
        URL.revokeObjectURL(newPhotos[index])
      }
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record?.id ? "Edit Manufacturing Record" : "New Manufacturing Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code">Manufacturing Code</Label>
              <Input
                id="code"
                value={formData.manufacturingCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, manufacturingCode: e.target.value }))}
                placeholder="ND2509001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieceName">Piece Name</Label>
              <Input
                id="pieceName"
                value={formData.pieceName}
                onChange={(e) => setFormData((prev) => ({ ...prev, pieceName: e.target.value }))}
                placeholder="Sapphire Engagement Ring"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieceType">Piece Type</Label>
              <Select
                value={formData.pieceType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, pieceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select piece type" />
                </SelectTrigger>
                <SelectContent>
                  {pieceTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designer">Designer</Label>
              <Select
                value={formData.designer}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, designer: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer} value={designer}>
                      {designer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designDate">Design Date</Label>
              <Input
                id="designDate"
                type="date"
                value={formData.designDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, designDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.status === "sent_to_craftsman" && (
              <div className="space-y-2">
                <Label htmlFor="craftsman">Craftsman</Label>
                <Select
                  value={formData.craftsman || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, craftsman: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select craftsman" />
                  </SelectTrigger>
                  <SelectContent>
                    {craftsmen.map((craftsman) => (
                      <SelectItem key={craftsman} value={craftsman}>
                        {craftsman}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Metal Plating Multi-Select */}
          <div className="space-y-4">
            <Label>Metal Plating</Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {metalPlatingOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={option.value}
                    checked={(formData.metalPlating || []).includes(option.value)}
                    onChange={(e) => handleMetalPlatingChange(option.value, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={option.value} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {(formData.metalPlating || []).includes("special") && (
              <div className="space-y-2">
                <Label htmlFor="metalPlatingNotes">Special Plating Notes</Label>
                <Input
                  id="metalPlatingNotes"
                  value={formData.metalPlatingNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metalPlatingNotes: e.target.value }))}
                  placeholder="Describe special plating requirements..."
                />
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settingCost">Setting Cost (฿)</Label>
              <Input
                id="settingCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.settingCost || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                  setFormData((prev) => ({ ...prev, settingCost: value }))
                }}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diamondCost">Diamond Cost (฿)</Label>
              <Input
                id="diamondCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.diamondCost || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                  setFormData((prev) => ({ ...prev, diamondCost: value }))
                }}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost (฿)</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalCost || ""}
                readOnly
                className="bg-muted"
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-muted-foreground">Auto-calculated from gemstones + setting + diamond costs</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price (฿)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice || ""}
              onChange={(e) => {
                const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                setFormData((prev) => ({ ...prev, sellingPrice: value }))
              }}
              placeholder="0"
            />
          </div>
          {formData.status === "ready_for_sale" && (
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, completionDate: e.target.value || null }))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this piece..."
              rows={3}
            />
          </div>
          {/* Enhanced Gemstones Section with Improved Search */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Gemstones Used</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {record?.id ? "Edit existing or add new gemstones" : "Add gemstones to this project"}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddGemstone}>
                <Plus className="mr-1 h-3 w-3" />
                Add Gemstone
              </Button>
            </div>
            // Added null check for gemstones array
            {(formData.gemstones || []).length === 0 && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Gem className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No gemstones added yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Add Gemstone" to select gemstones for this piece
                </p>
              </div>
            )}
            // Added null check for gemstones array
            {(formData.gemstones || []).map((gemstone, index) => (
              <div key={index} className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search & Select Gemstone</Label>
                  <GemstoneSearchSelect
                    availableGemstones={availableGemstones}
                    selectedCode={gemstone.code}
                    onSelect={(selectedGem) => {
                      console.log("[v0] Gemstone selected:", selectedGem)
                      handleGemstoneChange(index, "code", selectedGem.Code)
                      handleGemstoneChange(index, "type", selectedGem.TYPE || "")
                    }}
                  />
                </div>

                {gemstone.code && (
                  <div className="p-3 bg-background rounded border">
                    {(() => {
                      const selectedGem = availableGemstones.find((g) => g.Code === gemstone.code)
                      return selectedGem ? (
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <span className="font-medium">Code:</span>{" "}
                            <span className="font-mono">{selectedGem.Code}</span>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {selectedGem.TYPE}
                          </div>
                          <div>
                            <span className="font-medium">Shape:</span> {selectedGem.SHAPE}
                          </div>
                          <div>
                            <span className="font-medium">Weight/PCS:</span> {selectedGem["WEIGHT/PCS."]}
                          </div>
                          <div>
                            <span className="font-medium">Available:</span> {selectedGem["BALANCE/PCS."]}
                          </div>
                          <div>
                            <span className="font-medium">Price/CT:</span> {selectedGem["PRICE / CT."]}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Gemstone details will appear here</div>
                      )
                    })()}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="piecesUsed">Pieces Used</Label>
                    <Input
                      type="number"
                      min="1"
                      value={(gemstone as any).piecesUsed || 1}
                      onChange={(e) =>
                        handleGemstoneChange(index, "piecesUsed" as any, Number.parseInt(e.target.value) || 1)
                      }
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightUsed">Weight Used (ct)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={gemstone.weightUsed}
                      onChange={(e) =>
                        handleGemstoneChange(index, "weightUsed", Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="2.5"
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveGemstone(index)}
                      className="w-full"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Usage Notes</Label>
                  <Input
                    value={gemstone.notes}
                    onChange={(e) => handleGemstoneChange(index, "notes", e.target.value)}
                    placeholder="Center stone, side stones, accent pieces, etc."
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Activity Log */}
          // Added null check for activityLog array
          {(formData.activityLog || []).length > 0 && (
            <div className="space-y-4">
              <Label>Activity Log</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-4">
                // Added null check for activityLog array
                {(formData.activityLog || []).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{getStatusLabel(entry.status)}</span>
                      {entry.craftsman && <span className="text-muted-foreground"> - {entry.craftsman}</span>}
                      <p className="text-xs text-muted-foreground">{entry.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Photo Attachment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Photos</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploadingPhoto}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
            // Added null check for photos array
            {(photos || []).length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                // Added null check for photos array
                {(photos || []).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Manufacturing photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            // Added null check for photos array
            {(photos || []).length === 0 && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No photos attached</p>
                  <p className="text-xs">Click "Add Photo" to attach images of this piece</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Manufacturing Record</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GemstoneSearchSelect({
  availableGemstones,
  selectedCode,
  onSelect,
}: {
  availableGemstones: any[]
  selectedCode: string
  onSelect: (gemstone: any) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const filteredGemstones = availableGemstones.filter(
    (gem) =>
      (gem.Code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gem.TYPE || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedGem = availableGemstones.find((g) => g.Code === selectedCode)

  const handleSelect = (gemstone: any) => {
    onSelect(gemstone)
    setSearchTerm("")
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredGemstones.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredGemstones.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (filteredGemstones[highlightedIndex]) {
          handleSelect(filteredGemstones[highlightedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setHighlightedIndex(0)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={selectedGem ? `${selectedGem.Code} - ${selectedGem.TYPE}` : "Type gemstone code or name..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 font-mono"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredGemstones.length > 0 ? (
            filteredGemstones.map((gem, index) => (
              <div
                key={gem.Code}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-muted ${
                  index === highlightedIndex ? "bg-muted" : ""
                }`}
                onClick={() => handleSelect(gem)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{gem.Code}</span>
                    <span className="text-xs text-muted-foreground">{gem.TYPE}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {gem.SHAPE} • {gem["WEIGHT/PCS."]} • Balance: {gem["BALANCE/PCS."]}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchTerm ? "No gemstones found" : "Type to search gemstones"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Supabase API functions
const fetchManufacturingRecords = async (status?: string) => {
  try {
    console.log("[v0] Fetching manufacturing records from database...")
    const url = status ? `/api/manufacturing?status=${status}` : "/api/manufacturing"
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch manufacturing records")
    }
    const rawRecords = await response.json()

    if (!Array.isArray(rawRecords)) {
      console.warn("[v0] Invalid records format received from API")
      return []
    }

    // Map database fields to UI fields
    const records = rawRecords.map((record: any) => ({
      id: record.id,
      manufacturingCode: record.customer_name, // Using customer_name as manufacturing code
      pieceName: record.project_name,
      pieceType: record.piece_type || "", // Added piece type mapping
      designDate: record.created_at
        ? new Date(record.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      designer: record.designer_name || "",
      metalPlating: Array.isArray(record.metal_plating) ? record.metalPlating : [], // Ensure array
      metalPlatingNotes: record.plating_notes || "",
      status: record.status || "approved",
      craftsman: record.craftsman_name || "",
      settingCost: Number.parseFloat(record.setting_cost) || 0,
      diamondCost: Number.parseFloat(record.diamond_cost) || 0,
      totalCost: Number.parseFloat(record.total_cost) || 0,
      sellingPrice: Number.parseFloat(record.estimated_value) || 0, // Map estimated_value to sellingPrice
      completionDate: record.updated_at ? new Date(record.updated_at).toISOString().split("T")[0] : null,
      notes: record.usage_notes || "",
      gemstones: Array.isArray(record.manufacturing_gemstones) // Added array check
        ? record.manufacturing_gemstones.map((gem: any) => ({
            code: gem.gemstone_code || "",
            type: gem.gemstone_type || "",
            weightUsed: Number.parseFloat(gem.weight_used) || 0,
            piecesUsed: Number.parseInt(gem.pieces_used) || 1,
            notes: gem.gemstone_details || "",
          }))
        : [],
      activityLog: Array.isArray(record.manufacturing_activity_log) // Added array check
        ? record.manufacturing_activity_log.map((log: any) => ({
            status: log.status || "",
            date: log.created_at || new Date().toISOString(),
            notes: log.notes || "",
            craftsman: log.craftsman_name || "",
          }))
        : [],
      photos: Array.isArray(record.photos) ? record.photos : [], // Ensure array
    }))

    console.log("[v0] Loaded manufacturing records from database:", records.length)
    return records
  } catch (error) {
    console.error("[v0] Error fetching manufacturing records:", error)
    return []
  }
}

const saveManufacturingRecord = async (record: ManufacturingRecord) => {
  try {
    console.log("[v0] Saving manufacturing record to database:", record)
    const url = record.id ? `/api/manufacturing/${record.id}` : "/api/manufacturing"
    const method = record.id ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    })

    if (!response.ok) {
      throw new Error("Failed to save manufacturing record")
    }

    const savedRecord = await response.json()
    console.log("[v0] Manufacturing record saved successfully:", savedRecord.id)
    return savedRecord
  } catch (error) {
    console.error("[v0] Error saving manufacturing record:", error)
    throw error
  }
}

const deleteManufacturingRecord = async (recordId: number) => {
  try {
    console.log("[v0] Deleting manufacturing record:", recordId)
    const response = await fetch(`/api/manufacturing/${recordId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete manufacturing record")
    }

    console.log("[v0] Manufacturing record deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting manufacturing record:", error)
    throw error
  }
}

function CertificateModal({
  record,
  isOpen,
  onClose,
}: {
  record: ManufacturingRecord | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!record) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const generateCertificateNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
    return `WO${day}${month}${year}${random}`
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificate Generation</DialogTitle>
        </DialogHeader>

        <div className="certificate-container bg-white" style={{ aspectRatio: "8.5/11" }}>
          {/* Black frame container */}
          <div className="bg-black p-8 h-full px-0.5 py-0.5">
            <div className="bg-white h-full p-8 flex flex-col">
              {/* Certificate Header */}
              <div className="text-center mb-6">
                <div className="inline-block border-4 border-black rounded-full px-6 py-4 mb-4">
                  <div className="text-center">
                    <div className="text-base font-serif italic mb-1">for</div>
                    <div className="text-xl font-bold mb-1 font-serif">Narandha</div>
                    <div className="text-sm font-serif italic mb-1">...by...</div>
                    <div className="text-lg font-serif font-bold mb-1">M.L. Rojanatorn</div>
                    <div className="text-base font-serif font-bold">Na Songkhla</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 flex-1">
                {/* Product Image */}
                <div className="bg-black flex items-center justify-center text-white">
                  {record.photos && Array.isArray(record.photos) && record.photos.length > 0 ? (
                    <img
                      src={record.photos[0] || "/placeholder.svg"}
                      alt="Product"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-xl font-serif font-bold mb-2">ROJANATORN</div>
                      <div className="text-sm font-serif">Product Image</div>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-3 flex flex-col">
                  <div className="text-right text-base font-mono font-bold">{generateCertificateNumber()}</div>

                  <div className="space-y-2 text-sm font-serif flex-1">
                    {record.pieceType && (
                      <div className="capitalize mb-2 font-serif">{record.pieceType.replace("_", " ")}</div>
                    )}

                    {record.gemstones &&
                      Array.isArray(record.gemstones) &&
                      record.gemstones.map((gem, index) => (
                        <div key={index} className="font-serif">
                          <div className="text-base">
                            {gem.type} {gem.piecesUsed} pcs. {gem.weightUsed} ct.
                          </div>
                        </div>
                      ))}

                    {record.metalPlating && Array.isArray(record.metalPlating) && record.metalPlating.length > 0 && (
                      <div className="font-serif">
                        {record.metalPlating
                          .map((plating) => plating.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="font-serif font-bold text-lg">
                  Price ฿ {formatCurrency(record.sellingPrice).replace("฿", "").trim()}.-
                </div>
                <div className="font-serif italic text-sm mt-1">No Refund No Return</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <FileText className="mr-2 h-4 w-4" />
            Print Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
