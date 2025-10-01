"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Package, DollarSign, Calendar, FileText, Eye, TrendingUp } from "lucide-react"

interface SoldItem {
  id: number
  manufacturingCode: string
  pieceName: string
  pieceType: string
  designer: string
  metalPlating: string[]
  originalPrice: number
  finalSellingPrice: number
  soldDate: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  gemstones: Array<{
    code: string
    type: string
    weightUsed: number
    piecesUsed: number
    notes: string
  }>
  photos: string[]
  notes: string
}

export function HistoryModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [soldItems, setSoldItems] = useState<SoldItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<SoldItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)

  useEffect(() => {
    const loadSoldItems = async () => {
      try {
        console.log("[v0] Loading sold items...")
        const response = await fetch("/api/manufacturing")
        if (!response.ok) {
          throw new Error("Failed to fetch manufacturing records")
        }
        const rawRecords = await response.json()

        if (!Array.isArray(rawRecords)) {
          console.warn("[v0] Invalid records format received from API")
          setSoldItems([])
          return
        }

        // Filter only items with status "sold"
        const soldItemsData = rawRecords
          .filter((record: any) => record.status === "sold")
          .map((record: any) => ({
            id: record.id,
            manufacturingCode: record.customer_name,
            pieceName: record.project_name,
            pieceType: record.piece_type || "",
            designer: record.designer_name || "",
            metalPlating: Array.isArray(record.metal_plating) ? record.metal_plating : [],
            originalPrice: record.estimated_value || 0,
            finalSellingPrice: record.selling_price || record.estimated_value || 0,
            soldDate: record.sold_at ? new Date(record.sold_at).toISOString().split("T")[0] : "",
            customerName: record.customers?.name || "Unknown Customer",
            customerEmail: record.customers?.email || "",
            customerPhone: record.customers?.phone || "",
            gemstones: Array.isArray(record.manufacturing_gemstones)
              ? record.manufacturing_gemstones.map((gem: any) => ({
                  code: gem.gemstone_code || "",
                  type: gem.gemstone_type || "",
                  weightUsed: gem.weight_used || 0,
                  piecesUsed: gem.pieces_used || 1,
                  notes: gem.gemstone_details || "",
                }))
              : [],
            photos: Array.isArray(record.photos) ? record.photos : [],
            notes: record.usage_notes || "",
          }))

        console.log("[v0] Loaded sold items:", soldItemsData.length)
        setSoldItems(soldItemsData)
      } catch (error) {
        console.error("[v0] Error loading sold items:", error)
        setSoldItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSoldItems()
  }, [])

  const filteredItems = soldItems.filter(
    (item) =>
      item.manufacturingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pieceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pieceType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleViewDetails = (item: SoldItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleGenerateCertificate = (item: SoldItem) => {
    setSelectedItem(item)
    setIsCertificateModalOpen(true)
  }

  const totalRevenue = soldItems.reduce((sum, item) => sum + item.finalSellingPrice, 0)
  const totalProfit = soldItems.reduce((sum, item) => sum + (item.finalSellingPrice - item.originalPrice), 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sales history...</p>
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
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldItems.length}</div>
            <p className="text-xs text-muted-foreground">Items sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">Revenue - Cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                soldItems.filter((item) => {
                  const soldDate = new Date(item.soldDate)
                  const now = new Date()
                  return soldDate.getMonth() === now.getMonth() && soldDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Sales this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Sales History</CardTitle>
              <p className="text-sm text-muted-foreground">Complete record of all sold jewelry pieces</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, piece name, customer, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {soldItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Sales History</h3>
              <p className="text-muted-foreground mb-4">
                Sold items will appear here when pieces are marked as sold from the In Stock module
              </p>
            </div>
          ) : (
            /* Sales Grid */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="cursor-pointer transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-balance">{item.manufacturingCode}</h3>
                        <p className="text-sm text-muted-foreground">{item.pieceName}</p>
                        <p className="text-xs text-muted-foreground">Designer: {item.designer}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        Sold
                      </Badge>
                    </div>

                    {/* Product Image */}
                    {item.photos && item.photos.length > 0 && (
                      <div className="mb-4">
                        <img
                          src={item.photos[0] || "/placeholder.svg"}
                          alt={item.pieceName}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-medium">{item.customerName}</span>
                      </div>
                      {item.pieceType && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">{item.pieceType.replace("_", " ")}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sold Date:</span>
                        <span>{formatDate(item.soldDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Final Price:</span>
                        <span className="font-medium text-lg">{formatCurrency(item.finalSellingPrice)}</span>
                      </div>
                      {item.finalSellingPrice !== item.originalPrice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Profit:</span>
                          <span
                            className={`font-medium ${
                              item.finalSellingPrice > item.originalPrice ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(item.finalSellingPrice - item.originalPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Gemstones Used */}
                    {item.gemstones && item.gemstones.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Gemstones:</p>
                        <div className="space-y-1">
                          {item.gemstones.slice(0, 2).map((gem, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-muted rounded p-2">
                              <span>
                                {gem.code} - {gem.type}
                              </span>
                              <span>{gem.weightUsed}ct</span>
                            </div>
                          ))}
                          {item.gemstones.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{item.gemstones.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                          <Eye className="mr-1 h-3 w-3" />
                          Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleGenerateCertificate(item)}>
                          <FileText className="mr-1 h-3 w-3" />
                          Certificate
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

      {/* Item Details Modal */}
      <SoldItemDetailsModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedItem(null)
        }}
      />

      {/* Certificate Modal */}
      <SoldItemCertificateModal
        item={selectedItem}
        isOpen={isCertificateModalOpen}
        onClose={() => {
          setIsCertificateModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </div>
  )
}

function SoldItemDetailsModal({
  item,
  isOpen,
  onClose,
}: {
  item: SoldItem | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!item) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details - {item.manufacturingCode}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product Images</h3>
            {item.photos && item.photos.length > 0 ? (
              <div className="grid gap-4">
                {item.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo || "/placeholder.svg"}
                    alt={`${item.pieceName} ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Package className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No photos available</p>
              </div>
            )}
          </div>

          {/* Sale Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Sale Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{item.customerName}</span>
                </div>
                {item.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{item.customerEmail}</span>
                  </div>
                )}
                {item.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{item.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sold Date:</span>
                  <span>{formatDate(item.soldDate)}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span>{formatCurrency(item.originalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Final Price:</span>
                  <span className="font-bold text-lg">{formatCurrency(item.finalSellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit/Loss:</span>
                  <span
                    className={`font-medium ${
                      item.finalSellingPrice > item.originalPrice ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(item.finalSellingPrice - item.originalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Piece Name:</span>
                  <span className="font-medium">{item.pieceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{item.pieceType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designer:</span>
                  <span>{item.designer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metal Plating:</span>
                  <span>{item.metalPlating.map((p) => p.replace("_", " ")).join(", ")}</span>
                </div>
              </div>
            </div>

            {/* Gemstones */}
            {item.gemstones && item.gemstones.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Gemstones Used</h3>
                <div className="space-y-3">
                  {item.gemstones.map((gem, index) => (
                    <div key={index} className="bg-muted rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{gem.code}</div>
                          <div className="text-sm text-muted-foreground">{gem.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{gem.weightUsed} ct</div>
                          <div className="text-sm text-muted-foreground">{gem.piecesUsed} pcs</div>
                        </div>
                      </div>
                      {gem.notes && <div className="text-sm text-muted-foreground mt-2">{gem.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm">{item.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SoldItemCertificateModal({
  item,
  isOpen,
  onClose,
}: {
  item: SoldItem | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!item) return null

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
          <DialogTitle>Certificate - {item.manufacturingCode}</DialogTitle>
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
                  {item.photos && item.photos.length > 0 ? (
                    <img
                      src={item.photos[0] || "/placeholder.svg"}
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
                    {item.pieceType && (
                      <div className="capitalize mb-2 font-serif">{item.pieceType.replace("_", " ")}</div>
                    )}

                    {item.gemstones &&
                      item.gemstones.map((gem, index) => (
                        <div key={index} className="font-serif">
                          <div className="text-base">
                            {gem.type} {gem.piecesUsed} pcs. {gem.weightUsed} ct.
                          </div>
                        </div>
                      ))}

                    {item.metalPlating && item.metalPlating.length > 0 && (
                      <div className="font-serif">
                        {item.metalPlating
                          .map((plating) => plating.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="font-serif font-bold text-lg">
                  Price ฿ {formatCurrency(item.finalSellingPrice).replace("฿", "").trim()}.-
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
