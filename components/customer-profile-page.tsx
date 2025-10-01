"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  FileText,
  Activity,
  Plus,
  Upload,
  ImageIcon,
  Camera,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes: string
  photo_url?: string
  nickname?: string
  customer_since?: string
  created_at: string
  updated_at: string
}

interface Purchase {
  id: string
  project_name: string
  piece_type: string
  selling_price: number
  sold_at: string
  photos: string[]
  customer_id: string
}

interface CustomerProfilePageProps {
  customerId: string
  onBack: () => void
}

export function CustomerProfilePage({ customerId, onBack }: CustomerProfilePageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    photo_url: "",
    nickname: "",
    customer_since: "",
  })
  const [newNote, setNewNote] = useState("")
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<{ images: string[]; currentIndex: number } | null>(null)

  useEffect(() => {
    fetchCustomerData()
    fetchCustomerPurchases()
    fetchCustomerActivity()
  }, [customerId])

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          notes: data.notes || "",
          photo_url: data.photo_url || "",
          nickname: data.nickname || "",
          customer_since: data.customer_since ? new Date(data.customer_since).toISOString().split("T")[0] : "",
        })
      }
    } catch (error) {
      console.error("Error fetching customer:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerPurchases = async () => {
    try {
      console.log("[v0] Fetching purchases for customer:", customerId)
      const response = await fetch(`/api/manufacturing?status=sold&customer_id=${customerId}`)
      console.log("[v0] Purchase API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Purchase data received:", data)
        console.log("[v0] Number of purchases:", data.length)

        // Log photo information for each purchase
        data.forEach((purchase: Purchase, index: number) => {
          console.log(`[v0] Purchase ${index + 1} (${purchase.project_name}):`, {
            id: purchase.id,
            photos: purchase.photos,
            photosLength: purchase.photos?.length || 0,
            hasPhotos: !!(purchase.photos && purchase.photos.length > 0),
          })
        })

        setPurchases(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching purchases:", error)
    }
  }

  const fetchCustomerActivity = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityLog(data)
      }
    } catch (error) {
      console.error("Error fetching activity:", error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomer(updatedCustomer)
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }

  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        notes: customer.notes || "",
        photo_url: customer.photo_url || "",
        nickname: customer.nickname || "",
        customer_since: customer.customer_since ? new Date(customer.customer_since).toISOString().split("T")[0] : "",
      })
    }
    setIsEditing(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] ========== PHOTO UPLOAD STARTED ==========")
    console.log("[v0] File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    try {
      setUploadingPhoto(true)

      // Create form data
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", "customer")

      console.log("[v0] FormData created, sending to /api/upload...")

      // Upload file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      console.log("[v0] Upload response status:", response.status)
      console.log("[v0] Upload response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Upload failed:", errorData)
        alert(`Upload failed: ${errorData.error || "Unknown error"}`)
        return
      }

      const { url } = await response.json()
      console.log("[v0] Upload successful! URL:", url)

      // Update form data with new photo URL
      setFormData((prev) => ({ ...prev, photo_url: url }))

      // Update customer in database
      console.log("[v0] Updating customer with new photo URL...")
      const updateResponse = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, photo_url: url }),
      })

      console.log("[v0] Customer update response status:", updateResponse.status)

      if (updateResponse.ok) {
        const updatedCustomer = await updateResponse.json()
        setCustomer(updatedCustomer)
        console.log("[v0] Customer updated successfully!")
        console.log("[v0] ========== PHOTO UPLOAD COMPLETE ==========")
      } else {
        const errorData = await updateResponse.json()
        console.error("[v0] Failed to update customer:", errorData)
        alert(`Failed to update customer: ${errorData.error || "Unknown error"}`)
      }
    } catch (error: any) {
      console.error("[v0] ========== PHOTO UPLOAD ERROR ==========")
      console.error("[v0] Error:", error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error stack:", error?.stack)
      alert(`Error uploading photo: ${error?.message || "Unknown error"}`)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const response = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: newNote }),
      })

      if (response.ok) {
        setNewNote("")
        fetchCustomerActivity()
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.selling_price || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer profile...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Customer not found</h3>
          <Button onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  const handleNextImage = () => {
    if (selectedImage && selectedImage.currentIndex < selectedImage.images.length - 1) {
      setSelectedImage({
        ...selectedImage,
        currentIndex: selectedImage.currentIndex + 1,
      })
    }
  }

  const handlePrevImage = () => {
    if (selectedImage && selectedImage.currentIndex > 0) {
      setSelectedImage({
        ...selectedImage,
        currentIndex: selectedImage.currentIndex - 1,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-balance">Customer Profile</h1>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Customer Details */}
        <div className="w-96 border-r bg-card">
          {/* Photo Hero Section */}
          <div className="relative h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {formData.photo_url ? (
                  <div className="relative">
                    <img
                      src={formData.photo_url || "/placeholder.svg"}
                      alt={customer?.name}
                      className="h-56 w-56 rounded-2xl object-cover shadow-2xl ring-4 ring-white dark:ring-gray-800"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-2 right-2 h-10 w-10 rounded-full shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="h-56 w-56 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl ring-4 ring-white dark:ring-gray-800 flex items-center justify-center">
                      <span className="text-6xl font-bold text-white">
                        {customer?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) || "CU"}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-2 right-2 h-10 w-10 rounded-full shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>
          </div>

          {/* Customer Info Section */}
          <div className="p-6 space-y-6">
            {/* Name and Status */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-balance mb-2">
                {customer?.name}
                {customer?.nickname && <span className="text-muted-foreground"> ({customer.nickname})</span>}
              </h2>
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
              >
                Active Customer
              </Badge>
            </div>

            <Separator />

            {/* Client Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Client details</h3>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {(isEditing || customer?.nickname) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Nickname</Label>
                    {isEditing ? (
                      <Input
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className="mt-1"
                        placeholder="Optional nickname"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm">{customer?.nickname}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.email || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Phone number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Home address</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <div className="flex items-start space-x-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{customer.address || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Customer since</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.customer_since}
                      onChange={(e) => setFormData({ ...formData, customer_since: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {customer?.customer_since
                          ? formatDate(customer.customer_since)
                          : customer?.created_at
                            ? formatDate(customer.created_at)
                            : "Unknown"}
                      </span>
                    </div>
                  )}
                  {isEditing && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current date</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Total Spent */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div className="text-xs text-muted-foreground mt-1">
                {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          <Tabs defaultValue="overview" className="h-full">
            {/* Tab Navigation */}
            <div className="border-b px-6">
              <TabsList className="h-12">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="purchases">
                  Purchases{" "}
                  <Badge variant="secondary" className="ml-2">
                    {purchases.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Recent Purchases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {purchases.slice(0, 3).map((purchase) => (
                        <div key={purchase.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-sm text-balance">{purchase.project_name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(purchase.sold_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(purchase.selling_price)}</p>
                          </div>
                        </div>
                      ))}
                      {purchases.length === 0 && <p className="text-sm text-muted-foreground">No purchases yet</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Orders</span>
                        <span className="font-medium">{purchases.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Order</span>
                        <span className="font-medium">
                          {purchases.length > 0 ? formatCurrency(totalSpent / purchases.length) : formatCurrency(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Purchase</span>
                        <span className="font-medium">
                          {purchases.length > 0 ? formatDate(purchases[0].sold_at) : "Never"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="purchases" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Purchase History</h3>
                  <div className="text-sm text-muted-foreground">
                    {purchases.length} purchase{purchases.length !== 1 ? "s" : ""} • {formatCurrency(totalSpent)} total
                  </div>
                </div>

                {purchases.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {purchases.map((purchase) => (
                      <Card key={purchase.id} className="overflow-hidden group">
                        <div
                          className="aspect-square bg-muted relative cursor-pointer overflow-hidden"
                          onClick={() => {
                            if (purchase.photos && purchase.photos.length > 0) {
                              setSelectedImage({
                                images: purchase.photos,
                                currentIndex: 0,
                              })
                            }
                          }}
                        >
                          {purchase.photos && purchase.photos.length > 0 ? (
                            <>
                              <img
                                src={purchase.photos[0] || "/placeholder.svg"}
                                alt={purchase.project_name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {purchase.photos && purchase.photos.length > 1 && (
                            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {purchase.photos.length}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-medium text-balance mb-1">{purchase.project_name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{purchase.piece_type}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{formatCurrency(purchase.selling_price)}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(purchase.sold_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground">This customer hasn't made any purchases.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Customer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Add a note about this customer..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1"
                        rows={3}
                      />
                      <div className="flex flex-col space-y-2">
                        <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Customer Profile Notes</span>
                          <span className="text-xs text-muted-foreground">{formatDate(customer.updated_at)}</span>
                        </div>
                        <p className="text-sm text-pretty">{customer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-4 w-4" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Customer creation */}
                      <div className="flex items-start space-x-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Customer profile created</p>
                          <p className="text-xs text-muted-foreground">{formatDate(customer.created_at)}</p>
                        </div>
                      </div>

                      {/* Purchase activities */}
                      {purchases.map((purchase) => (
                        <div key={purchase.id} className="flex items-start space-x-3">
                          <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Purchased {purchase.project_name} for {formatCurrency(purchase.selling_price)}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(purchase.sold_at)}</p>
                          </div>
                        </div>
                      ))}

                      {/* Profile updates */}
                      {customer.updated_at !== customer.created_at && (
                        <div className="flex items-start space-x-3">
                          <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Profile information updated</p>
                            <p className="text-xs text-muted-foreground">{formatDate(customer.updated_at)}</p>
                          </div>
                        </div>
                      )}

                      {activityLog.length === 0 && purchases.length === 0 && (
                        <div className="text-center py-8">
                          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                          <p className="text-muted-foreground">Customer activity will appear here.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              Product Image {selectedImage && `${selectedImage.currentIndex + 1} of ${selectedImage.images.length}`}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <>
                <div className="aspect-square bg-muted flex items-center justify-center p-6">
                  <img
                    src={selectedImage.images[selectedImage.currentIndex] || "/placeholder.svg"}
                    alt={`Product image ${selectedImage.currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {selectedImage.images.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto rounded-full shadow-lg"
                      onClick={handlePrevImage}
                      disabled={selectedImage.currentIndex === 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto rounded-full shadow-lg"
                      onClick={handleNextImage}
                      disabled={selectedImage.currentIndex === selectedImage.images.length - 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
