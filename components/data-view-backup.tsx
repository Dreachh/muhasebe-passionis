"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Edit, Trash2, Eye, Printer } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/data-utils"
import { deleteData } from "@/lib/db"

export function DataView({ financialData = [], toursData = [], customersData = [], onClose, onDataUpdate, onEdit }) {
  const [activeTab, setActiveTab] = useState("tours")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTour, setSelectedTour] = useState(null)
  const [selectedFinancial, setSelectedFinancial] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ type: "", id: "" })

  const handleDelete = async () => {
    try {
      if (itemToDelete.type === "financial") {
        // Ã–nce doÄŸrudan IndexedDB'den sil
        await deleteData("financials", itemToDelete.id);
        console.log("IndexedDB'den finansal veri silindi:", itemToDelete.id);
        
        // Sonra UI state'ini gÃ¼ncelle
        const updatedData = financialData.filter((item) => item.id !== itemToDelete.id);
        console.log("Kalan finansal veri sayÄ±sÄ±:", updatedData.length);
        
        // Hem state hem de localStorage gÃ¼ncelleniyor
        onDataUpdate("financial", updatedData);
      } else if (itemToDelete.type === "tours") {
        // Ã–nce doÄŸrudan IndexedDB'den sil
        await deleteData("tours", itemToDelete.id);
        console.log("IndexedDB'den tur verisi silindi:", itemToDelete.id);
        
        // Sonra UI state'ini gÃ¼ncelle
        const updatedData = toursData.filter((item) => item.id !== itemToDelete.id);
        console.log("Kalan tur verisi sayÄ±sÄ±:", updatedData.length);
        
        // Hem state hem de localStorage gÃ¼ncelleniyor
        onDataUpdate("tours", updatedData);
      } else if (itemToDelete.type === "customers") {
        // Ã–nce doÄŸrudan IndexedDB'den sil
        await deleteData("customers", itemToDelete.id);
        console.log("IndexedDB'den mÃ¼ÅŸteri verisi silindi:", itemToDelete.id);
        
        // Sonra UI state'ini gÃ¼ncelle
        const updatedData = customersData.filter((item) => item.id !== itemToDelete.id);
        console.log("Kalan mÃ¼ÅŸteri sayÄ±sÄ±:", updatedData.length);
        
        // Hem state hem de localStorage gÃ¼ncelleniyor
        onDataUpdate("customers", updatedData);
      }
      
      // Silme iÅŸlemi tamamlandÄ±
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Silme iÅŸlemi sÄ±rasÄ±nda hata oluÅŸtu:", error);
      alert("KayÄ±t silinirken bir hata oluÅŸtu! LÃ¼tfen tekrar deneyin.");
      setIsDeleteDialogOpen(false);
    }
  }

  const openDeleteDialog = (type, id) => {
    setItemToDelete({ type, id })
    setIsDeleteDialogOpen(true)
  }

  const handleEdit = (type, item) => {
    onEdit(type, item)
  }

  // YazdÄ±rma iÅŸlemi iÃ§in basit fonksiyon
  const handlePrint = (tour) => {
    // TourPrintView bileÅŸenini doÄŸrudan kullanarak yazdÄ±rma
    const printContent = document.createElement('div')
    printContent.style.position = 'fixed'
    printContent.style.left = '0'
    printContent.style.top = '0'
    printContent.style.width = '100%'
    printContent.style.height = '100%'
    printContent.style.zIndex = '9999'
    printContent.style.backgroundColor = 'white'
    printContent.style.overflow = 'auto'
    printContent.style.padding = '20px'
    
    // YazdÄ±rma iÃ§eriÄŸini oluÅŸtur
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h1 style="color: #0d9488; margin: 0;">${tour.companyName || 'PassionisTravel'}</h1>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
            <p style="margin: 0;">Belge No: ${tour.serialNumber || ''}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d9488;">Tur Bilgileri</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Tur DetaylarÄ±</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #666; margin-bottom: 0;">Seri No:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.serialNumber || '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">Tur KaydÄ±nÄ± OluÅŸturan KiÅŸi:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.tourName || '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">BaÅŸlangÄ±Ã§ Tarihi:</p>
              <p style="font-weight: 500; margin-top: 5px;">${new Date(tour.tourDate).toLocaleDateString('tr-TR')}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">BitiÅŸ Tarihi:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.tourEndDate ? new Date(tour.tourEndDate).toLocaleDateString('tr-TR') : '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">KiÅŸi SayÄ±sÄ±:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.numberOfPeople || 0} YetiÅŸkin, ${tour.numberOfChildren || 0} Ã‡ocuk</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">MÃ¼ÅŸteri Bilgileri</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #666; margin-bottom: 0;">Ad Soyad:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.customerName || '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">Telefon:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.customerPhone || '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">E-posta:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.customerEmail || '-'}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">TC/Pasaport No:</p>
              <p style="font-weight: 500; margin-top: 5px;">${tour.customerIdNumber || '-'}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Ã–deme Bilgileri</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #666; margin-bottom: 0;">KiÅŸi BaÅŸÄ± Fiyat:</p>
              <p style="font-weight: 500; margin-top: 5px;">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: tour.currency || 'TRY' }).format(tour.pricePerPerson || 0)}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">Toplam Fiyat:</p>
              <p style="font-weight: 700; margin-top: 5px;">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: tour.currency || 'TRY' }).format(tour.totalPrice || 0)}</p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">Ã–deme Durumu:</p>
              <p style="font-weight: 500; margin-top: 5px;">
                ${tour.paymentStatus === "pending" ? "Beklemede" : 
                  tour.paymentStatus === "partial" ? "KÄ±smi Ã–deme" : 
                  tour.paymentStatus === "completed" ? "TamamlandÄ±" : 
                  tour.paymentStatus === "refunded" ? "Ä°ade Edildi" : "Bilinmiyor"}
              </p>
            </div>
            <div>
              <p style="color: #666; margin-bottom: 0;">Ã–deme YÃ¶ntemi:</p>
              <p style="font-weight: 500; margin-top: 5px;">
                ${tour.paymentMethod === "cash" ? "Nakit" : 
                  tour.paymentMethod === "creditCard" ? "Kredi KartÄ±" : 
                  tour.paymentMethod === "bankTransfer" ? "Banka Transferi" : 
                  tour.paymentMethod === "other" ? "DiÄŸer" : "Bilinmiyor"}
              </p>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.8em;">
          <p style="margin-bottom: 5px;">Bu belge PassionisTravel tarafÄ±ndan dÃ¼zenlenmiÅŸtir.</p>
          <p style="margin-top: 0;">Ä°letiÅŸim: +90 212 123 4567 | info@passionistour.com</p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="window.print(); document.body.removeChild(this.parentNode.parentNode.parentNode);" 
                  style="padding: 8px 16px; background-color: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer;">
            YazdÄ±r
          </button>
        </div>
      </div>
    `
    
    // YazdÄ±rma iÃ§eriÄŸini sayfaya ekle
    document.body.appendChild(printContent)
    
    // YazdÄ±rma iÅŸlemini baÅŸlat
    setTimeout(() => {
      window.print()
      // YazdÄ±rma tamamlandÄ±ktan sonra iÃ§eriÄŸi kaldÄ±r
      document.body.removeChild(printContent)
    }, 500)
  }
              tour.activities && tour.activities.length > 0
                ? `
              <div class="section">
                <h2 class="section-title">Aktiviteler</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Aktivite</th>
                      <th>Tarih</th>
                      <th>SÃ¼re</th>
                      <th style="text-align: right;">Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tour.activities
                      .map(
                        (activity) => `
                      <tr>
                        <td>${activity.name}</td>
                        <td>${activity.date ? new Date(activity.date).toLocaleDateString("tr-TR") : "-"}</td>
                        <td>${activity.duration || "-"}</td>
                        <td style="text-align: right;">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: activity.currency || "TRY" }).format(activity.price)}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }
            
            <div class="section">
              <h2 class="section-title">Ã–deme Bilgileri</h2>
              <div class="grid">
                <div>
                  <p class="label">KiÅŸi BaÅŸÄ± Fiyat:</p>
                  <p class="value">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.currency || "TRY" }).format(tour.pricePerPerson)}</p>
                </div>
                <div>
                  <p class="label">Toplam Fiyat:</p>
                  <p class="value" style="font-weight: bold;">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.currency || "TRY" }).format(tour.totalPrice)}</p>
                </div>
                <div>
                  <p class="label">Ã–deme Durumu:</p>
                  <p class="value">
                    ${
                      tour.paymentStatus === "completed"
                        ? "TamamlandÄ±"
                        : tour.paymentStatus === "partial"
                          ? "KÄ±smi Ã–deme"
                          : tour.paymentStatus === "pending"
                            ? "Beklemede"
                            : tour.paymentStatus === "refunded"
                              ? "Ä°ade Edildi"
                              : "Bilinmiyor"
                    }
                  </p>
                </div>
                <div>
                  <p class="label">Ã–deme YÃ¶ntemi:</p>
                  <p class="value">
                    ${
                      tour.paymentMethod === "cash"
                        ? "Nakit"
                        : tour.paymentMethod === "creditCard"
                          ? "Kredi KartÄ±"
                          : tour.paymentMethod === "bankTransfer"
                            ? "Banka Transferi"
                            : tour.paymentMethod === "other"
                              ? "DiÄŸer"
                              : "Bilinmiyor"
                    }
                  </p>
                </div>
                
                ${
                  tour.paymentStatus === "partial"
                    ? `
                  <div>
                    <p class="label">YapÄ±lan Ã–deme:</p>
                    <p class="value">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.partialPaymentCurrency || "TRY" }).format(tour.partialPaymentAmount)}</p>
                  </div>
                  <div>
                    <p class="label">Kalan Ã–deme:</p>
                    <p class="value" style="font-weight: bold;">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.currency || "TRY" }).format(tour.totalPrice - tour.partialPaymentAmount)}</p>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
            
            ${
              tour.notes
                ? `
              <div class="section">
                <h2 class="section-title">Notlar</h2>
                <p style="white-space: pre-line;">${tour.notes}</p>
              </div>
            `
                : ""
            }
            
            <div class="footer">
              <p>Bu belge PassionisTravel tarafÄ±ndan dÃ¼zenlenmiÅŸtir.</p>
              <p>Ä°letiÅŸim: +90 212 123 4567 | info@passionistour.com</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <button onclick="window.print();" style="padding: 8px 16px; background-color: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer;">YazdÄ±r</button>
            </div>
          </div>
          
          <script>
            // Sayfa yÃ¼klendiÄŸinde otomatik yazdÄ±rma diyaloÄŸunu aÃ§
            window.onload = function() {
              // YazdÄ±rma iÅŸlemi iÃ§in kÄ±sa bir gecikme
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const filteredToursData = toursData.filter(
    (item) =>
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.totalPrice?.toString().includes(searchTerm),
  )

  const filteredFinancialData = financialData.filter(
    (item) =>
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.amount?.toString().includes(searchTerm),
  )

  const filteredCustomersData = customersData.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Tur Ã–nizleme BileÅŸeni
  const TourPreview = ({ tour }) => {
    if (!tour) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">MÃ¼ÅŸteri Bilgileri</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Ad Soyad:</span>
              <p>{tour.customerName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Telefon:</span>
              <p>{tour.customerPhone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">E-posta:</span>
              <p>{tour.customerEmail}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
              <p>{tour.customerIdNumber}</p>
            </div>
          </div>

          {tour.additionalCustomers?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Ek KatÄ±lÄ±mcÄ±lar</h4>
              {tour.additionalCustomers.map((customer, index) => (
                <div key={customer.id} className="border-t pt-2 mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Ad Soyad:</span>
                      <p>{customer.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Telefon:</span>
                      <p>{customer.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
                      <p>{customer.idNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Tur DetaylarÄ±</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Seri No:</span>
              <p>{tour.serialNumber}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tur AdÄ±:</span>
              <p>{tour.tourName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">BaÅŸlangÄ±Ã§ Tarihi:</span>
              <p>{formatDate(tour.tourDate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">BitiÅŸ Tarihi:</span>
              <p>{tour.tourEndDate ? formatDate(tour.tourEndDate) : "-"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">YetiÅŸkin SayÄ±sÄ±:</span>
              <p>{tour.numberOfPeople}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ã‡ocuk SayÄ±sÄ±:</span>
              <p>{tour.numberOfChildren}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">KiÅŸi BaÅŸÄ± Fiyat:</span>
              <p>{formatCurrency(tour.pricePerPerson, tour.currency)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Toplam Fiyat:</span>
              <p className="font-bold">{formatCurrency(tour.totalPrice, tour.currency)}</p>
            </div>
          </div>
        </div>

        {tour.expenses?.length > 0 && (
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-4">Tur Giderleri</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">TÃ¼r</th>
                  <th className="text-left py-2">AÃ§Ä±klama</th>
                  <th className="text-left py-2">SaÄŸlayÄ±cÄ±</th>
                  <th className="text-right py-2">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {tour.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="py-2">{expense.type}</td>
                    <td className="py-2">{expense.name}</td>
                    <td className="py-2">{expense.provider}</td>
                    <td className="py-2 text-right">{formatCurrency(expense.amount, expense.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Ã–deme Bilgileri</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Ã–deme Durumu:</span>
              <p>
                {tour.paymentStatus === "pending"
                  ? "Beklemede"
                  : tour.paymentStatus === "partial"
                    ? "KÄ±smi Ã–deme"
                    : tour.paymentStatus === "completed"
                      ? "TamamlandÄ±"
                      : tour.paymentStatus === "refunded"
                        ? "Ä°ade Edildi"
                        : "Bilinmiyor"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ã–deme YÃ¶ntemi:</span>
              <p>
                {tour.paymentMethod === "cash"
                  ? "Nakit"
                  : tour.paymentMethod === "creditCard"
                    ? "Kredi KartÄ±"
                    : tour.paymentMethod === "bankTransfer"
                      ? "Banka Transferi"
                      : tour.paymentMethod === "other"
                        ? "DiÄŸer"
                        : "Bilinmiyor"}
              </p>
            </div>

            {tour.paymentStatus === "partial" && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">YapÄ±lan Ã–deme:</span>
                  <p>{formatCurrency(tour.partialPaymentAmount, tour.partialPaymentCurrency)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kalan Ã–deme:</span>
                  <p className="font-bold">
                    {formatCurrency(tour.totalPrice - tour.partialPaymentAmount, tour.currency)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {tour.notes && (
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Notlar</h3>
            <p className="whitespace-pre-line">{tour.notes}</p>
          </div>
        )}
      </div>
    )
  }

  // Finansal KayÄ±t Ã–nizleme BileÅŸeni
  const FinancialPreview = ({ financial }) => {
    if (!financial) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Finansal KayÄ±t DetaylarÄ±</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Tarih:</span>
              <p>{formatDate(financial.date)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">TÃ¼r:</span>
              <p className={financial.type === "income" ? "text-green-600" : "text-red-600"}>
                {financial.type === "income" ? "Gelir" : "Gider"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Kategori:</span>
              <p>{financial.category}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tutar:</span>
              <p className="font-bold">{formatCurrency(financial.amount)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ã–deme YÃ¶ntemi:</span>
              <p>
                {financial.paymentMethod === "cash"
                  ? "Nakit"
                  : financial.paymentMethod === "creditCard"
                    ? "Kredi KartÄ±"
                    : financial.paymentMethod === "bankTransfer"
                      ? "Banka Transferi"
                      : financial.paymentMethod === "other"
                        ? "DiÄŸer"
                        : "Bilinmiyor"}
              </p>
            </div>
          </div>

          {financial.description && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">AÃ§Ä±klama:</span>
              <p className="whitespace-pre-line">{financial.description}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // MÃ¼ÅŸteri Ã–nizleme BileÅŸeni
  const CustomerPreview = ({ customer }) => {
    if (!customer) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">MÃ¼ÅŸteri Bilgileri</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Ad Soyad:</span>
              <p>{customer.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Telefon:</span>
              <p>{customer.phone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">E-posta:</span>
              <p>{customer.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
              <p>{customer.idNumber}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#00a1c6]">Veri GÃ¶rÃ¼ntÃ¼leme</CardTitle>
        <Button variant="outline" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tours">Tur SatÄ±ÅŸlarÄ±</TabsTrigger>
            <TabsTrigger value="financial">Finansal KayÄ±tlar</TabsTrigger>
            <TabsTrigger value="customers">MÃ¼ÅŸteriler</TabsTrigger>
          </TabsList>

          <TabsContent value="tours">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seri No</TableHead>
                    <TableHead>MÃ¼ÅŸteri</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>KiÅŸi SayÄ±sÄ±</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ä°ÅŸlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredToursData.length > 0 ? (
                    filteredToursData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.tourName}</TableCell>
                        <TableCell>{formatDate(item.tourDate)}</TableCell>
                        <TableCell>{item.numberOfPeople}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice, item.currency)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              item.paymentStatus === "completed"
                                ? "text-green-600"
                                : item.paymentStatus === "partial"
                                  ? "text-yellow-600"
                                  : item.paymentStatus === "refunded"
                                    ? "text-red-600"
                                    : "text-blue-600"
                            }
                          >
                            {item.paymentStatus === "completed"
                              ? "TamamlandÄ±"
                              : item.paymentStatus === "partial"
                                ? "KÄ±smi Ã–deme"
                                : item.paymentStatus === "refunded"
                                  ? "Ä°ade Edildi"
                                  : "Beklemede"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTour(item)
                                setIsPreviewOpen(true)
                              }}
                              title="Ã–nizle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("tours", item)}
                              title="DÃ¼zenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("tours", item.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        KayÄ±t bulunamadÄ±
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>TÃ¼r</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ã–deme YÃ¶ntemi</TableHead>
                    <TableHead>Ä°ÅŸlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinancialData.length > 0 ? (
                    filteredFinancialData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          <span className={item.type === "income" ? "text-green-600" : "text-red-600"}>
                            {item.type === "income" ? "Gelir" : "Gider"}
                          </span>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          {item.paymentMethod === "cash"
                            ? "Nakit"
                            : item.paymentMethod === "creditCard"
                              ? "Kredi KartÄ±"
                              : item.paymentMethod === "bankTransfer"
                                ? "Banka Transferi"
                                : "DiÄŸer"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedFinancial(item)
                                setIsPreviewOpen(true)
                              }}
                              title="Ã–nizle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("financial", item)}
                              title="DÃ¼zenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("financial", item.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        KayÄ±t bulunamadÄ±
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>TC/Pasaport No</TableHead>
                    <TableHead>Ä°ÅŸlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomersData.length > 0 ? (
                    filteredCustomersData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.phone}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.idNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCustomer(item)
                                setIsPreviewOpen(true)
                              }}
                              title="Ã–nizle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("customers", item)}
                              title="DÃ¼zenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog("customers", item.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        KayÄ±t bulunamadÄ±
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Ã–nizleme Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeTab === "tours" ? "Tur DetaylarÄ±" : activeTab === "financial" ? "Finansal KayÄ±t DetaylarÄ±" : "MÃ¼ÅŸteri Bilgileri"}</DialogTitle>
          </DialogHeader>

          {activeTab === "tours" ? (
            <TourPreview tour={selectedTour} />
          ) : activeTab === "financial" ? (
            <FinancialPreview financial={selectedFinancial} />
          ) : (
            <CustomerPreview customer={selectedCustomer} />
          )}

          {/* DialogFooter iÃ§indeki yazdÄ±rma butonunu gÃ¼ncelleyelim */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Kapat
            </Button>
            {activeTab === "tours" && (
              <Button variant="outline" onClick={() => handlePrint(selectedTour)}>
                <Printer className="mr-2 h-4 w-4" />
                YazdÄ±r
              </Button>
            )}
            <Button
              className="bg-[#00a1c6] hover:bg-[#00a1c6]"
              onClick={() => {
                setIsPreviewOpen(false)
                handleEdit(
                  activeTab === "tours" ? "tours" : activeTab === "financial" ? "financial" : "customers",
                  activeTab === "tours" ? selectedTour : activeTab === "financial" ? selectedFinancial : selectedCustomer,
                )
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              DÃ¼zenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>KaydÄ± Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kaydÄ± silmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ä°ptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
