"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Package, DollarSign, Calendar, FileText, Eye, ShoppingCart, UserPlus, Check } from "lucide-react"
import { useRouter } from "next/navigation"

interface InStockItem {
  id: number
  manufacturingCode: string
  pieceName: string
  pieceType: string
  designer: string
  metalPlating: string[]
  sellingPrice: number
  completionDate: string
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

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export function InStockModule() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [inStockItems, setInStockItems] = useState<InStockItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<InStockItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [finalSellingPrice, setFinalSellingPrice] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[v0] Loading in-stock items and customers...")

        const itemsResponse = await fetch("/api/manufacturing?status=ready_for_sale")
        if (!itemsResponse.ok) {
          throw new Error("Failed to fetch manufacturing records")
        }
        const rawRecords = await itemsResponse.json()

        if (!Array.isArray(rawRecords)) {
          console.warn("[v0] Invalid records format received from API")
          setInStockItems([])
        } else {
          const readyForSaleItems = rawRecords.map((record: any) => ({
            id: record.id,
            manufacturingCode: record.customer_name,
            pieceName: record.project_name,
            pieceType: record.piece_type || "",
            designer: record.designer_name || "",
            metalPlating: Array.isArray(record.metal_plating) ? record.metal_plating : [],
            sellingPrice: record.estimated_value || 0,
            completionDate: record.updated_at ? new Date(record.updated_at).toISOString().split("T")[0] : "",
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

          console.log("[v0] Loaded in-stock items:", readyForSaleItems.length)
          setInStockItems(readyForSaleItems)
        }

        const customersResponse = await fetch("/api/customers")
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          setCustomers(Array.isArray(customersData) ? customersData : [])
        } else {
          console.warn("[v0] Failed to load customers")
          setCustomers([])
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        setInStockItems([])
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredItems = inStockItems.filter(
    (item) =>
      item.manufacturingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pieceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleViewDetails = (item: InStockItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleGenerateCertificate = (item: InStockItem) => {
    setSelectedItem(item)
    setIsCertificateModalOpen(true)
  }

  const handleMarkAsSold = (item: InStockItem) => {
    setSelectedItem(item)
    setFinalSellingPrice(item.sellingPrice)
    setIsSaleModalOpen(true)
  }

  const handleSaleSubmit = async () => {
    if (!selectedItem) return

    setIsSaving(true)
    try {
      let customerId = selectedCustomerId

      // Create new customer if needed
      if (isNewCustomer) {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCustomer),
        })

        if (!customerResponse.ok) {
          throw new Error("Failed to create customer")
        }

        const newCustomerData = await customerResponse.json()
        customerId = newCustomerData.id
      }

      // Mark item as sold
      const saleResponse = await fetch(`/api/manufacturing/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "sold",
          customer_id: customerId,
          selling_price: finalSellingPrice,
          sold_at: new Date().toISOString(),
        }),
      })

      if (!saleResponse.ok) {
        throw new Error("Failed to mark item as sold")
      }

      // Remove item from in-stock list
      setInStockItems((prev) => prev.filter((item) => item.id !== selectedItem.id))

      // Reset form
      setIsSaleModalOpen(false)
      setSelectedItem(null)
      setSelectedCustomerId("")
      setIsNewCustomer(false)
      setNewCustomer({ name: "", email: "", phone: "", address: "", notes: "" })
      setFinalSellingPrice(0)

      console.log("[v0] Item marked as sold successfully")
    } catch (error) {
      console.error("[v0] Error marking item as sold:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const totalInventoryValue = inStockItems.reduce((sum, item) => sum + item.sellingPrice, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory...</p>
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
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Ready for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Selling price value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inStockItems.length > 0 ? formatCurrency(totalInventoryValue / inStockItems.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per piece</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                inStockItems.filter((item) => {
                  const completionDate = new Date(item.completionDate)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return completionDate >= thirtyDaysAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* In Stock Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">In Stock Inventory</CardTitle>
              <p className="text-sm text-muted-foreground">Jewelry pieces ready for sale with certificates</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, piece name, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {inStockItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Items in Stock</h3>
              <p className="text-muted-foreground mb-4">
                Items will appear here when manufacturing projects are marked as "Ready for Sale"
              </p>
            </div>
          ) : (
            /* Items Grid */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all hover:shadow-md flex flex-col"
                  onClick={() => router.push(`/instock/${item.id}`)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-balance">{item.manufacturingCode}</h3>
                        <p className="text-sm text-muted-foreground">{item.pieceName}</p>
                        <p className="text-xs text-muted-foreground">Designer: {item.designer}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                        In Stock
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-auto">
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
                        {item.pieceType && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="capitalize">{item.pieceType.replace("_", " ")}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{formatDate(item.completionDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Metal Plating:</span>
                          <span className="text-xs">
                            {item.metalPlating.map((p) => p.replace("_", " ")).join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium text-lg">{formatCurrency(item.sellingPrice)}</span>
                        </div>
                      </div>

                      {/* Gemstones Used */}
                      {item.gemstones && item.gemstones.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Gemstones:</p>
                          <div className="space-y-1">
                            {item.gemstones.slice(0, 2).map((gem, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs bg-muted rounded p-2"
                              >
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
                    </div>

                    <div className="flex-shrink-0 mt-auto pt-4 border-t">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(item)
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateCertificate(item)
                            }}
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            Certificate
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsSold(item)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark as Sold
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
      <ItemDetailsModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedItem(null)
        }}
      />

      {/* Certificate Modal */}
      <CertificateModal
        item={selectedItem}
        isOpen={isCertificateModalOpen}
        onClose={() => {
          setIsCertificateModalOpen(false)
          setSelectedItem(null)
        }}
      />

      <MarkAsSoldModal
        item={selectedItem}
        customers={customers}
        isOpen={isSaleModalOpen}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        isNewCustomer={isNewCustomer}
        setIsNewCustomer={setIsNewCustomer}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        finalSellingPrice={finalSellingPrice}
        setFinalSellingPrice={setFinalSellingPrice}
        isSaving={isSaving}
        onSubmit={handleSaleSubmit}
        onClose={() => {
          setIsSaleModalOpen(false)
          setSelectedItem(null)
          setSelectedCustomerId("")
          setIsNewCustomer(false)
          setNewCustomer({ name: "", email: "", phone: "", address: "", notes: "" })
          setFinalSellingPrice(0)
        }}
      />
    </div>
  )
}

function ItemDetailsModal({
  item,
  isOpen,
  onClose,
}: {
  item: InStockItem | null
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
          <DialogTitle>Item Details - {item.manufacturingCode}</DialogTitle>
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

          {/* Product Details */}
          <div className="space-y-6">
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
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{formatDate(item.completionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metal Plating:</span>
                  <span>{item.metalPlating.map((p) => p.replace("_", " ")).join(", ")}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground font-medium">Selling Price:</span>
                  <span className="font-bold text-lg">{formatCurrency(item.sellingPrice)}</span>
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

function CertificateModal({
  item,
  isOpen,
  onClose,
}: {
  item: InStockItem | null
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
                  Price ฿ {formatCurrency(item.sellingPrice).replace("฿", "").trim()}.-
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

function MarkAsSoldModal({
  item,
  customers,
  isOpen,
  selectedCustomerId,
  setSelectedCustomerId,
  isNewCustomer,
  setIsNewCustomer,
  newCustomer,
  setNewCustomer,
  finalSellingPrice,
  setFinalSellingPrice,
  isSaving,
  onSubmit,
  onClose,
}: {
  item: InStockItem | null
  customers: Customer[]
  isOpen: boolean
  selectedCustomerId: string
  setSelectedCustomerId: (id: string) => void
  isNewCustomer: boolean
  setIsNewCustomer: (value: boolean) => void
  newCustomer: { name: string; email: string; phone: string; address: string; notes: string }
  setNewCustomer: (customer: any) => void
  finalSellingPrice: number
  setFinalSellingPrice: (price: number) => void
  isSaving: boolean
  onSubmit: () => void
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

  const canSubmit = isNewCustomer ? newCustomer.name.trim() !== "" : selectedCustomerId !== ""

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Sold - {item.manufacturingCode}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">Item Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Piece Name:</span>
                <div className="font-medium">{item.pieceName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="capitalize">{item.pieceType.replace("_", " ")}</div>
              </div>
            </div>
          </div>

          {/* Final Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="finalPrice">Final Selling Price</Label>
            <Input
              id="finalPrice"
              type="number"
              value={finalSellingPrice}
              onChange={(e) => setFinalSellingPrice(Number(e.target.value))}
              placeholder="Enter final selling price"
            />
            <p className="text-sm text-muted-foreground">Estimated price: {formatCurrency(item.sellingPrice)}</p>
          </div>

          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                variant={!isNewCustomer ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewCustomer(false)}
              >
                Existing Customer
              </Button>
              <Button variant={isNewCustomer ? "default" : "outline"} size="sm" onClick={() => setIsNewCustomer(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.email && `(${customer.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerNotes">Notes</Label>
                  <Textarea
                    id="customerNotes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    placeholder="Additional notes about the customer"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Mark as Sold
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
