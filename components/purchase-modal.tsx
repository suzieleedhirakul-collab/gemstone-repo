"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, Gem, CreditCard, DollarSign, FileText, Package } from "lucide-react"

interface Purchase {
  id?: number
  customerId: number
  gemstoneId?: number
  purchaseDate: Date
  salePrice: number
  paymentMethod: string
  paymentStatus: string
  notes: string
  itemDescription: string
}

interface Gemstone {
  id: number
  name: string
  type: string
  cut: string
  caratWeight: number
  color: string
  clarity: string
  sellingPrice: number
  status: string
}

interface PurchaseModalProps {
  purchase: Purchase | null
  isOpen: boolean
  onClose: () => void
  onSave: (purchase: Purchase) => void
  customerId?: number
  isNewPurchase?: boolean
}

const mockGemstones: Gemstone[] = [
  {
    id: 4,
    name: "Burmese Ruby",
    type: "Ruby",
    cut: "Cushion",
    caratWeight: 2.75,
    color: "Red",
    clarity: "VVS2",
    sellingPrice: 18000.0,
    status: "available",
  },
  {
    id: 5,
    name: "Pink Diamond",
    type: "Diamond",
    cut: "Princess",
    caratWeight: 1.25,
    color: "Pink",
    clarity: "VS1",
    sellingPrice: 35000.0,
    status: "available",
  },
  {
    id: 6,
    name: "Ceylon Sapphire",
    type: "Sapphire",
    cut: "Round",
    caratWeight: 4.1,
    color: "Blue",
    clarity: "VVS",
    sellingPrice: 12000.0,
    status: "available",
  },
]

export function PurchaseModal({
  purchase,
  isOpen,
  onClose,
  onSave,
  customerId,
  isNewPurchase = false,
}: PurchaseModalProps) {
  const [formData, setFormData] = useState<Purchase>(
    purchase || {
      customerId: customerId || 0,
      purchaseDate: new Date(),
      salePrice: 0,
      paymentMethod: "credit_card",
      paymentStatus: "completed",
      notes: "",
      itemDescription: "",
    },
  )

  const [selectedGemstone, setSelectedGemstone] = useState<Gemstone | null>(null)
  const [isCustomItem, setIsCustomItem] = useState(!purchase?.gemstoneId)

  const handleSave = () => {
    const purchaseData = {
      ...formData,
      gemstoneId: isCustomItem ? undefined : selectedGemstone?.id,
    }
    onSave(purchaseData)
    onClose()
  }

  const handleGemstoneSelect = (gemstoneId: string) => {
    const gemstone = mockGemstones.find((g) => g.id.toString() === gemstoneId)
    if (gemstone) {
      setSelectedGemstone(gemstone)
      setFormData({
        ...formData,
        gemstoneId: gemstone.id,
        salePrice: gemstone.sellingPrice,
        itemDescription: `${gemstone.name} - ${gemstone.caratWeight}ct ${gemstone.color} ${gemstone.type}`,
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "refunded":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-balance">{isNewPurchase ? "Record New Purchase" : "Edit Purchase"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={!isCustomItem ? "default" : "outline"}
                  onClick={() => setIsCustomItem(false)}
                  className="flex-1"
                >
                  <Gem className="mr-2 h-4 w-4" />
                  From Inventory
                </Button>
                <Button
                  variant={isCustomItem ? "default" : "outline"}
                  onClick={() => setIsCustomItem(true)}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Custom Item
                </Button>
              </div>

              {!isCustomItem ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gemstone">Select Gemstone</Label>
                    <Select value={selectedGemstone?.id.toString() || ""} onValueChange={handleGemstoneSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose from available inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockGemstones.map((gemstone) => (
                          <SelectItem key={gemstone.id} value={gemstone.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {gemstone.name} - {gemstone.caratWeight}ct
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                {formatCurrency(gemstone.sellingPrice)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGemstone && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{selectedGemstone.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cut:</span>
                            <span>{selectedGemstone.cut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Weight:</span>
                            <span>{selectedGemstone.caratWeight} carats</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Color:</span>
                            <span>{selectedGemstone.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clarity:</span>
                            <span>{selectedGemstone.clarity}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Selling Price:</span>
                            <span>{formatCurrency(selectedGemstone.sellingPrice)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="itemDescription">Item Description</Label>
                  <Input
                    id="itemDescription"
                    placeholder="e.g., Custom engagement ring, Setting and band, etc."
                    value={formData.itemDescription}
                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.purchaseDate ? formatDate(formData.purchaseDate) : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.purchaseDate}
                        onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: Number.parseFloat(e.target.value) || 0 })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                      <SelectItem value="financing">Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Badge variant="outline" className={`${getPaymentStatusColor(formData.paymentStatus)}`}>
                      {formData.paymentStatus.charAt(0).toUpperCase() + formData.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Purchase Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special notes about this purchase..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="text-pretty">{formData.itemDescription || "No item selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{formatDate(formData.purchaseDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment:</span>
                  <span>{formData.paymentMethod.replace("_", " ").toUpperCase()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(formData.salePrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {isNewPurchase ? "Record Purchase" : "Update Purchase"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
