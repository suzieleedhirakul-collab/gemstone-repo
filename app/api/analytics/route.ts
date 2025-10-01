import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current month boundaries
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Fetch sold items with customer data
    const { data: soldItems, error: soldError } = await supabase
      .from("manufacturing_projects")
      .select(
        `
        id,
        project_name,
        selling_price,
        estimated_value,
        sold_at,
        created_at,
        customer_id,
        customers (
          id,
          name
        )
      `,
      )
      .eq("status", "sold")
      .order("sold_at", { ascending: false })

    if (soldError) throw soldError

    // Fetch all customers
    const { data: customers, error: customersError } = await supabase.from("customers").select("id, name").order("name")

    if (customersError) throw customersError

    // Calculate current month metrics
    const currentMonthSales = (soldItems || []).filter((item) => {
      const soldDate = new Date(item.sold_at || item.created_at)
      return soldDate >= currentMonthStart && soldDate <= currentMonthEnd
    })

    const currentMonthRevenue = currentMonthSales.reduce(
      (sum, item) => sum + (item.selling_price || item.estimated_value || 0),
      0,
    )

    const currentMonthTransactions = currentMonthSales.length

    // Calculate total metrics
    const totalRevenue = (soldItems || []).reduce(
      (sum, item) => sum + (item.selling_price || item.estimated_value || 0),
      0,
    )
    const totalOrders = soldItems?.length || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate monthly revenue data (last 6 months)
    const monthlyRevenueData = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const monthSales = (soldItems || []).filter((item) => {
        const soldDate = new Date(item.sold_at || item.created_at)
        return soldDate >= monthDate && soldDate <= monthEnd
      })

      const uniqueCustomers = new Set(monthSales.map((item) => item.customer_id).filter(Boolean))

      monthlyRevenueData.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short" }),
        revenue: monthSales.reduce((sum, item) => sum + (item.selling_price || item.estimated_value || 0), 0),
        customers: uniqueCustomers.size,
        orders: monthSales.length,
      })
    }

    // Calculate top customers
    const customerPurchases = (soldItems || []).reduce((acc: any, item) => {
      if (!item.customer_id) return acc

      if (!acc[item.customer_id]) {
        acc[item.customer_id] = {
          customerId: item.customer_id,
          customerName: item.customers?.name || "Unknown Customer",
          totalSpent: 0,
          purchases: 0,
          lastPurchase: item.sold_at || item.created_at,
        }
      }

      acc[item.customer_id].totalSpent += item.selling_price || item.estimated_value || 0
      acc[item.customer_id].purchases += 1

      const lastPurchase = new Date(acc[item.customer_id].lastPurchase)
      const currentPurchase = new Date(item.sold_at || item.created_at)
      if (currentPurchase > lastPurchase) {
        acc[item.customer_id].lastPurchase = item.sold_at || item.created_at
      }

      return acc
    }, {})

    const topCustomers = Object.values(customerPurchases)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // Calculate unique customers with purchases
    const customersWithPurchases = new Set((soldItems || []).map((item) => item.customer_id).filter(Boolean)).size

    return NextResponse.json({
      currentMonth: {
        revenue: currentMonthRevenue,
        transactions: currentMonthTransactions,
        startDate: currentMonthStart.toISOString(),
      },
      totals: {
        revenue: totalRevenue,
        orders: totalOrders,
        avgOrderValue,
        customers: customers?.length || 0,
        customersWithPurchases,
      },
      monthlyRevenue: monthlyRevenueData,
      topCustomers,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
