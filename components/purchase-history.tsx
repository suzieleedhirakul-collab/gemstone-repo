"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, DollarSign, CreditCard, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface Purchase {
  id: number
  customerId: string
  customerName: string
  purchaseDate: string
  salePrice: number
  paymentStatus: string
  notes: string
  itemDescription: string
}

export function PurchaseHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const response = await fetch("/api/manufacturing?status=sold")
        if (!response.ok) {
          throw new Error("Failed to fetch purchases")
        }
        const soldItems = await response.json()

        const formattedPurchases = soldItems.map((item: any) => ({
          id: item.id,
          customerId: item.customer_id || "",
          customerName: item.customers?.name || "Unknown Customer",
          purchaseDate: item.sold_at || item.created_at,
          salePrice: item.selling_price || item.estimated_value || 0,
          paymentStatus: "completed", // All sold items are completed
          notes: item.usage_notes || "",
          itemDescription: `${item.project_name}${item.piece_type ? ` - ${item.piece_type.replace("_", " ")}` : ""}`,
        }))

        setPurchases(formattedPurchases)
      } catch (error) {
        console.error("Error loading purchases:", error)
        setPurchases([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPurchases()
  }, [])

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || purchase.paymentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const currentMonthPurchases = filteredPurchases.filter((p) => {
    const purchaseDate = new Date(p.purchaseDate)
    return purchaseDate >= currentMonthStart && purchaseDate <= now
  })

  const currentMonthRevenue = currentMonthPurchases.reduce((sum, purchase) => sum + purchase.salePrice, 0)
  const currentMonthTransactions = currentMonthPurchases.length

  const totalRevenue = filteredPurchases.reduce((sum, purchase) => sum + purchase.salePrice, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading purchase history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Since {currentMonthStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {currentMonthTransactions} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {filteredPurchases.length} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Purchase History</CardTitle>
              <p className="text-sm text-muted-foreground">All customer purchases and completed transactions</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
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
                  placeholder="Search by customer or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Purchase List */}
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-balance">{purchase.itemDescription}</h3>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Completed
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div>Customer: {purchase.customerName}</div>
                        <div>Date: {formatDate(purchase.purchaseDate)}</div>
                        <div>ID: #{purchase.id.toString().padStart(4, "0")}</div>
                      </div>

                      {purchase.notes && (
                        <div className="mt-3 rounded-md bg-muted p-3">
                          <p className="text-xs text-muted-foreground text-pretty">{purchase.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(purchase.salePrice)}</p>
                        <p className="text-xs text-muted-foreground">Sale Price</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {purchases.length === 0
                  ? "No purchases yet. Mark items as sold from the In Stock module to see them here."
                  : "No purchases found matching your criteria."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
