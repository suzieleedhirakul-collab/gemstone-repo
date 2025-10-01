"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Calendar, ShoppingBag, Edit3, Save, X, FileText, Camera } from "lucide-react"

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

interface CustomerProfileModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSave: (customer: any) => void
  isNewCustomer?: boolean
}

export function CustomerProfileModal({
  customer,
  isOpen,
  onClose,
  onSave,
  isNewCustomer = false,
}: CustomerProfileModalProps) {
  const [isEditing, setIsEditing] = useState(isNewCustomer)
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    photo_url: "",
    nickname: "",
    customer_since: "",
  })
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsEditing(isNewCustomer)
  }, [isNewCustomer])

  useEffect(() => {
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
    } else if (isNewCustomer) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        photo_url: "",
        nickname: "",
        customer_since: "",
      })
    }
  }, [customer, isNewCustomer])

  const fetchCustomerPurchases = async () => {
    if (!customer) return

    try {
      setLoading(true)
      const response = await fetch(`/api/manufacturing?status=sold&customer_id=${customer.id}`)
      if (response.ok) {
        const data = await response.json()
        setPurchases(data)
      }
    } catch (error) {
      console.error("Error fetching customer purchases:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (isNewCustomer) {
        await onSave(formData)
      } else {
        const response = await fetch(`/api/customers/${customer?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await onSave(formData)
        }
      }
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  const handleCancel = () => {
    if (isNewCustomer) {
      onClose()
    } else {
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
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", "customer") // Added type parameter for organized storage

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        const { url } = await response.json()
        setFormData((prev: any) => ({ ...prev, photo_url: url }))
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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

  if (!isOpen) return null

  const customerName = customer?.name
    ? customer.nickname
      ? `${customer.name} (${customer.nickname})`
      : customer.name
    : "New Customer"
  const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.selling_price || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-balance">{isNewCustomer ? "Add New Customer" : customerName}</DialogTitle>
            {!isNewCustomer && (
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="purchases" disabled={isNewCustomer}>
              Purchase History
            </TabsTrigger>
            <TabsTrigger value="notes" disabled={isNewCustomer}>
              Notes & Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  {formData.photo_url ? (
                    <AvatarImage src={formData.photo_url || "/placeholder.svg"} alt={customerName} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {customerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-balance">{customerName}</h3>
                  {!isNewCustomer && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{formData.email || "No email provided"}</p>
              </div>
              {!isNewCustomer && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Profile Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, nickname: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Optional nickname"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="customer@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer_since">Customer Since</Label>
                    {isEditing ? (
                      <Input
                        id="customer_since"
                        type="date"
                        value={formData.customer_since}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, customer_since: e.target.value }))}
                        placeholder="Select date"
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4" />
                        {customer?.customer_since
                          ? formatDate(customer.customer_since)
                          : formatDate(customer?.created_at || "")}
                      </div>
                    )}
                    {isEditing && <p className="text-xs text-muted-foreground mt-1">Leave empty to use today's date</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Enter customer address"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Customer Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes about customer preferences, special requests, etc..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {isNewCustomer && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Customer
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Purchase History
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading purchases...</p>
                  </div>
                ) : purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-balance">{purchase.project_name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{purchase.sold_at ? formatDate(purchase.sold_at) : "Unknown date"}</span>
                            <span>{purchase.piece_type}</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(purchase.selling_price || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground">This customer hasn't made any purchases.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Customer profile created</p>
                      <p className="text-xs text-muted-foreground">
                        {customer?.created_at ? formatDate(customer.created_at) : "Unknown date"}
                      </p>
                    </div>
                  </div>
                  {purchases.map((purchase, index) => (
                    <div key={purchase.id} className="flex items-start space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Purchase completed: {purchase.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {purchase.sold_at ? formatDate(purchase.sold_at) : "Unknown date"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
