"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Gem, Package, DollarSign, Calendar, Filter, Download, Edit, Eye, Database } from "lucide-react"
import { AddGemstoneModal } from "./add-gemstone-modal"
import { formatCurrency } from "@/lib/utils/currency"

interface Gemstone {
  id: number
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
  created_at?: string
  updated_at?: string
}

export function GemstonesInventory() {
  const [gemstones, setGemstones] = useState<Gemstone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedGemstone, setSelectedGemstone] = useState<Gemstone | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewGemstone, setIsNewGemstone] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [selectedGemstones, setSelectedGemstones] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadGemstones()
  }, [searchTerm, typeFilter, statusFilter])

  const loadGemstones = async () => {
    try {
      console.log("[v0] Starting to load gemstones...")
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const url = `/api/gemstones?${params}`
      console.log("[v0] Fetching from URL:", url)

      const response = await fetch(url)
      console.log("[v0] Response status:", response.status)

      if (!response.ok) throw new Error("Failed to fetch gemstones")

      const data = await response.json()
      console.log("[v0] Received data:", data)
      console.log("[v0] Data length:", data?.length || 0)

      setGemstones(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading gemstones:", error)
      setIsLoading(false)
    }
  }

  const handleMigrateCSV = async () => {
    setIsMigrating(true)
    try {
      const response = await fetch("/api/gemstones/import-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvUrl:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ROJANATORN%20GEMS%20STOCK%202024-ikBjcduYJAnSQSdIqZ3N7WUOUJ7XXL.csv",
        }),
      })

      if (!response.ok) throw new Error("Import failed")

      const result = await response.json()
      console.log("Import result:", result)

      // Reload gemstones after import
      await loadGemstones()

      alert(`CSV data successfully imported! ${result.count} gemstones added to database.`)
    } catch (error) {
      console.error("Error importing CSV:", error)
      alert("Failed to import CSV data")
    } finally {
      setIsMigrating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (balanceCt: number) => {
    if (balanceCt <= 1) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Low in Stock</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">Available</Badge>
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "diamond":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "sapphire":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "emerald":
        return "bg-green-100 text-green-800 border-green-200"
      case "ruby":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleAddGemstone = () => {
    setIsAddModalOpen(true)
  }

  const handleViewGemstone = (gemstone: Gemstone) => {
    setSelectedGemstone(gemstone)
    setIsNewGemstone(false)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditGemstone = (gemstone: Gemstone) => {
    setSelectedGemstone(gemstone)
    setIsNewGemstone(false)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedGemstone(null)
    setIsNewGemstone(false)
    setIsEditing(false)
  }

  const handleSaveGemstone = async (gemstoneData: Gemstone | Gemstone[]) => {
    try {
      // Handle single gemstone or array of gemstones
      const gemstonesToSave = Array.isArray(gemstoneData) ? gemstoneData : [gemstoneData]

      for (const gemstone of gemstonesToSave) {
        const response = await fetch("/api/gemstones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gemstone),
        })

        if (!response.ok) throw new Error("Failed to save gemstone")
      }

      // Reload gemstones after saving
      await loadGemstones()
      setIsAddModalOpen(false)
    } catch (error) {
      console.error("Error saving gemstone:", error)
      alert("Failed to save gemstone")
    }
  }

  const toggleGemstoneSelection = (gemstoneId: number) => {
    setSelectedGemstones((prev) =>
      prev.includes(gemstoneId) ? prev.filter((id) => id !== gemstoneId) : [...prev, gemstoneId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedGemstones.length === gemstones.length) {
      setSelectedGemstones([])
    } else {
      setSelectedGemstones(gemstones.map((gem) => gem.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedGemstones.length === 0) return

    if (
      !confirm(
        `Are you sure you want to delete ${selectedGemstones.length} gemstone${selectedGemstones.length > 1 ? "s" : ""}?`,
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = selectedGemstones.map((gemstoneId) =>
        fetch(`/api/gemstones/${gemstoneId}`, {
          method: "DELETE",
        }),
      )

      const results = await Promise.all(deletePromises)
      if (results.some((res) => !res.ok)) {
        throw new Error("Some gemstones failed to delete")
      }

      const updatedGemstones = gemstones.filter((gem) => !selectedGemstones.includes(gem.id))
      setGemstones(updatedGemstones)
      setSelectedGemstones([])
      console.log("[v0] Gemstones deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting gemstones:", error)
      alert("Failed to delete some gemstones. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const totalInventoryValue = gemstones.reduce((sum, gem) => sum + (gem.price_piece || 0) * (gem.balance_pcs || 0), 0)
  const availableGemstones = gemstones.filter((gem) => (gem.balance_ct || 0) > 1).length
  const lowStockGemstones = gemstones.filter((gem) => (gem.balance_ct || 0) <= 1 && (gem.balance_ct || 0) > 0).length
  const totalCarats = gemstones.reduce((sum, gem) => sum + (gem.balance_ct || 0), 0)

  const formatWeightPcs = (weight: number, pcs: number) => {
    if (weight && weight > 0) {
      return `${weight} ct`
    } else if (pcs && pcs > 0) {
      return `${pcs} pcs`
    }
    return "N/A"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your gemstone inventory...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableGemstones}</div>
            <p className="text-xs text-muted-foreground">Gemstones in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low in Stock</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockGemstones}</div>
            <p className="text-xs text-muted-foreground">1ct or below</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Carats</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalCarats || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Gemstones Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Gemstone Inventory</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your gemstone collection and track availability</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleMigrateCSV} disabled={isMigrating}>
                <Database className="mr-2 h-4 w-4" />
                {isMigrating ? "Migrating..." : "Migrate CSV"}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleAddGemstone}>
                <Plus className="mr-2 h-4 w-4" />
                Add Gemstone
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by code, type, shape, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Gemstone Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="sapphire">Sapphire</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Package className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low-stock">Low in Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk selection controls */}
          {gemstones.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedGemstones.length === gemstones.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedGemstones.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : `Delete Selected (${selectedGemstones.length})`}
                </Button>
              )}
            </div>
          )}

          {/* Gemstones Table */}
          <div className="space-y-4">
            {gemstones.map((gemstone) => {
              const isSelected = selectedGemstones.includes(gemstone.id)

              return (
                <Card
                  key={gemstone.id}
                  className={`group relative transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-6">
                    {/* Checkbox for selection */}
                    <div
                      className={`absolute top-2 left-2 z-10 ${selectedGemstones.length > 0 || "opacity-0 group-hover:opacity-100"} transition-opacity`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleGemstoneSelection(gemstone.id)} />
                    </div>

                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleGemstoneSelection(gemstone.id)}
                    >
                      <div className="flex-1 ml-8">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-balance">{gemstone.code}</h3>
                          <Badge variant="outline" className={getTypeColor(gemstone.type)}>
                            {gemstone.type}
                          </Badge>
                          {getStatusBadge(gemstone.balance_ct)}
                        </div>

                        <div className="grid gap-2 text-sm md:grid-cols-3 lg:grid-cols-4">
                          <div>
                            <span className="text-muted-foreground">Weight/PCS:</span>
                            <span className="ml-1 font-medium">{formatWeightPcs(gemstone.weight, gemstone.pcs)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Shape:</span>
                            <span className="ml-1 font-medium">{gemstone.shape}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price/CT:</span>
                            <span className="ml-1 font-medium">{formatCurrency(gemstone.price_ct)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price/Piece:</span>
                            <span className="ml-1 font-medium">{formatCurrency(gemstone.price_piece)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Buying Date:</span>
                            <span className="ml-1 font-medium">{formatDate(gemstone.buying_date)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance/PCS:</span>
                            <span className="ml-1 font-medium">{gemstone.balance_pcs}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance/CT:</span>
                            <span className="ml-1 font-medium">{(gemstone.balance_ct || 0).toFixed(2)} ct</span>
                          </div>
                          {gemstone.color && (
                            <div>
                              <span className="text-muted-foreground">Color:</span>
                              <span className="ml-1 font-medium">{gemstone.color}</span>
                            </div>
                          )}
                        </div>

                        {gemstone.notes && (
                          <div className="mt-3 rounded-md bg-muted p-3">
                            <p className="text-xs text-muted-foreground text-pretty">{gemstone.notes}</p>
                          </div>
                        )}
                      </div>

                      {selectedGemstones.length === 0 && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewGemstone(gemstone)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditGemstone(gemstone)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {gemstones.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No gemstones found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gemstone Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-balance">
              {isNewGemstone ? "Add New Gemstone" : selectedGemstone?.code}
            </DialogTitle>
          </DialogHeader>

          {selectedGemstone && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Code</Label>
                  <Input value={selectedGemstone.code} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={selectedGemstone.type} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input value={selectedGemstone.weight || ""} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Pieces</Label>
                  <Input value={selectedGemstone.pcs || ""} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Shape</Label>
                  <Input value={selectedGemstone.shape} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Price per Carat</Label>
                  <Input value={selectedGemstone.price_ct} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Price per Piece</Label>
                  <Input value={selectedGemstone.price_piece} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Buying Date</Label>
                  <Input value={selectedGemstone.buying_date} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Balance/PCS</Label>
                  <Input value={selectedGemstone.balance_pcs} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Balance/CT</Label>
                  <Input value={selectedGemstone.balance_ct} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input value={selectedGemstone.color || ""} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Clarity</Label>
                  <Input value={selectedGemstone.clarity || ""} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Origin</Label>
                  <Input value={selectedGemstone.origin || ""} disabled={!isEditing} />
                </div>
              </div>

              <div>
                <Label>Certificate</Label>
                <Input value={selectedGemstone.certificate || ""} disabled={!isEditing} />
              </div>

              <div>
                <Label>Supplier</Label>
                <Input value={selectedGemstone.supplier || ""} disabled={!isEditing} />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={selectedGemstone.notes || ""} disabled={!isEditing} rows={3} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  {isEditing ? "Cancel" : "Close"}
                </Button>
                {isEditing && <Button>Save Changes</Button>}
                {!isEditing && !isNewGemstone && (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddGemstoneModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveGemstone} />
    </div>
  )
}
