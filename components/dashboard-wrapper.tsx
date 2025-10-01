"use client"

import { useSearchParams } from "next/navigation"
import { CustomerDashboard } from "@/components/customer-dashboard"

export function DashboardWrapper() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "customers"

  return <CustomerDashboard initialTab={initialTab} />
}
