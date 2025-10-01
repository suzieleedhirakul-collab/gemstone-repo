"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CustomerProfileModal } from "@/components/customer-profile-modal"
import { PurchaseHistory } from "@/components/purchase-history"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { GemstonesInventory } from "@/components/gemstones-inventory"
import { ManufacturingModule } from "@/components/manufacturing-module"
import { InStockModule } from "@/components/in-stock-module"
import { HistoryModule } from "@/components/history-module"
import { CustomerProfilePage } from "@/components/customer-profile-page"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Search,
  Plus,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Gem,
  Package,
  Store,
  History,
} from "lucide-react"

export function CustomerDashboard({ initialTab = "customers" }: { initialTab?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    monthlyGrowth: 0,
  })
  const [showProfilePage, setShowProfilePage] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customers")

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          console.error("Error fetching customers:", errorData)
        } else {
          const errorText = await response.text()
          console.error("Error fetching customers:", errorText)
        }
        return
      }

      const data = await response.json()
      setCustomers(data)

      const totalCustomers = data.length
      const totalRevenue = data.reduce((sum: number, customer: any) => sum + (customer.total_spent || 0), 0)
      const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

      setStats({
        totalCustomers,
        totalRevenue,
        avgOrderValue,
        monthlyGrowth: 12.5,
      })
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIP":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomer(customerId)
    setShowProfilePage(true)
  }

  const handleAddCustomer = () => {
    setSelectedCustomer(null)
    setIsNewCustomer(true)
    setIsModalOpen(true)
  }

  const handleSaveCustomer = async (customerData: any) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        await fetchCustomers()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
    setIsNewCustomer(false)
  }

  const getSelectedCustomerData = () => {
    if (selectedCustomer) {
      return customers.find((c) => c.id === selectedCustomer) || null
    }
    return null
  }

  const handleBackFromProfile = () => {
    setShowProfilePage(false)
    setSelectedCustomer(null)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/?tab=${tab}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (showProfilePage && selectedCustomer) {
    return <CustomerProfilePage customerId={selectedCustomer} onBack={handleBackFromProfile} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <div className="h-4 w-4 rounded-full bg-current" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-balance">Gemstone CRM</h1>
              <p className="text-sm text-muted-foreground">Customer Management System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card">
          <div className="p-6">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "customers" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("customers")}
              >
                <Users className="mr-2 h-4 w-4" />
                Customers
              </Button>
              <Button
                variant={activeTab === "purchases" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("purchases")}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Purchases
              </Button>
              <Button
                variant={activeTab === "gemstones" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("gemstones")}
              >
                <Gem className="mr-2 h-4 w-4" />
                Gemstones
              </Button>
              <Button
                variant={activeTab === "manufacturing" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("manufacturing")}
              >
                <Package className="mr-2 h-4 w-4" />
                Manufacturing
              </Button>
              <Button
                variant={activeTab === "instock" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("instock")}
              >
                <Store className="mr-2 h-4 w-4" />
                In Stock
              </Button>
              <Button
                variant={activeTab === "history" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("history")}
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button
                variant={activeTab === "analytics" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTabChange("analytics")}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            {activeTab === "customers" && (
              <>
                {/* Stats Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                      <p className="text-xs text-muted-foreground">Active customer base</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">Lifetime customer value</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
                      <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
                      <p className="text-xs text-muted-foreground">Customer acquisition</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Management Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-balance">Customer Profiles</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage your customer relationships and purchase history
                        </p>
                      </div>
                      <Button onClick={handleAddCustomer}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Search */}
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search customers by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Customer Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCustomers.map((customer) => (
                        <Card
                          key={customer.id}
                          className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden"
                          onClick={() => handleCustomerClick(customer.id)}
                        >
                          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 pb-4">
                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-blue-100">
                                  {customer.photo_url && (
                                    <AvatarImage
                                      src={customer.photo_url || "/placeholder.svg"}
                                      alt={customer.name || "Customer"}
                                    />
                                  )}
                                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    {customer.name
                                      ?.split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .slice(0, 2) || "CU"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <h3 className="mt-3 font-semibold text-lg text-balance text-center">
                                {customer.name || "Unknown Customer"}
                                {customer.nickname && (
                                  <span className="text-muted-foreground font-normal"> ({customer.nickname})</span>
                                )}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`mt-2 ${getStatusColor(customer.status || "Active")}`}
                              >
                                {customer.status || "Active"}
                              </Badge>
                            </div>
                          </div>

                          <CardContent className="p-6 pt-4">
                            <div className="space-y-2">
                              {customer.email && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="mr-2 h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="mr-2 h-3 w-3 flex-shrink-0" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-start text-sm text-muted-foreground">
                                  <MapPin className="mr-2 h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{customer.address}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                              <div>
                                <p className="text-sm font-medium">{formatCurrency(customer.total_spent || 0)}</p>
                                <p className="text-xs text-muted-foreground">Total spent</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">Customer since</p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.customer_since
                                    ? formatDate(customer.customer_since)
                                    : customer.created_at
                                      ? formatDate(customer.created_at)
                                      : "Unknown"}
                                </p>
                              </div>
                            </div>

                            {customer.notes && (
                              <div className="mt-3 rounded-md bg-muted p-3">
                                <p className="text-xs text-muted-foreground text-pretty line-clamp-2">
                                  {customer.notes}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredCustomers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No customers found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first customer"}
                        </p>
                        <Button onClick={handleAddCustomer}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Customer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "purchases" && <PurchaseHistory />}

            {activeTab === "gemstones" && <GemstonesInventory />}

            {activeTab === "manufacturing" && <ManufacturingModule />}

            {activeTab === "instock" && <InStockModule />}

            {activeTab === "history" && <HistoryModule />}

            {activeTab === "analytics" && <AnalyticsOverview />}
          </div>
        </div>
      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        customer={getSelectedCustomerData()}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCustomer}
        isNewCustomer={isNewCustomer}
      />
    </div>
  )
}
