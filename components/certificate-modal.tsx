"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface CertificateItem {
  manufacturingCode: string
  pieceName: string
  pieceType: string
  sellingPrice: number
  metalPlating: string[]
  gemstones: Array<{
    code: string
    type: string
    weightUsed: number
    piecesUsed: number
    notes: string
  }>
  photos?: string[]
}

interface CertificateModalProps {
  item: CertificateItem | null
  isOpen: boolean
  onClose: () => void
}

export function CertificateModal({ item, isOpen, onClose }: CertificateModalProps) {
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
