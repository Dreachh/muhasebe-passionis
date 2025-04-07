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

export function DataView({ financialData = [], toursData = [], onClose, onDataUpdate, onEdit }) {
  const [activeTab, setActiveTab] = useState("tours")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTour, setSelectedTour] = useState(null)
  const [selectedFinancial, setSelectedFinancial] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ type: "", id: "" })

  const handleDelete = () => {
    if (itemToDelete.type === "financial") {
      const updatedData = financialData.filter((item) => item.id !== itemToDelete.id)
      onDataUpdate("financial", updatedData)
    } else if (itemToDelete.type === "tours") {
      const updatedData = toursData.filter((item) => item.id !== itemToDelete.id)
      onDataUpdate("tours", updatedData)
    }

    setIsDeleteDialogOpen(false)
  }

  const openDeleteDialog = (type, id) => {
    setItemToDelete({ type, id })
    setIsDeleteDialogOpen(true)
  }

  const handleEdit = (type, item) => {
    onEdit(type, item)
  }

  // Yazdırma işlemi için yeni fonksiyon ekleyelim
  const handlePrint = (tour) => {
    // Yazdırma görünümünü açmak için yeni bir pencere oluştur
    const printWindow = window.open("", "_blank")

    // Yazdırma görünümü için HTML içeriği oluştur
    printWindow.document.write(`
      <html>
        <head>
          <title>Tur Bilgileri - ${tour.tourName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .label { color: #666; font-size: 0.9em; }
            .value { font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.8em; color: #666; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #0d9488;">PassionisTravel</h1>
              <p>Tur Bilgileri</p>
            </div>
            
            <div class="section">
              <h2 class="section-title">Tur Detayları</h2>
              <div class="grid">
                <div>
                  <p class="label">Seri No:</p>
                  <p class="value">${tour.serialNumber || "-"}</p>
                </div>
                <div>
                  <p class="label">Tur Adı:</p>
                  <p class="value">${tour.tourName}</p>
                </div>
                <div>
                  <p class="label">Başlangıç Tarihi:</p>
                  <p class="value">${new Date(tour.tourDate).toLocaleDateString("tr-TR")}</p>
                </div>
                <div>
                  <p class="label">Bitiş Tarihi:</p>
                  <p class="value">${tour.tourEndDate ? new Date(tour.tourEndDate).toLocaleDateString("tr-TR") : "-"}</p>
                </div>
                <div>
                  <p class="label">Kişi Sayısı:</p>
                  <p class="value">${tour.numberOfPeople} Yetişkin, ${tour.numberOfChildren || 0} Çocuk</p>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">Müşteri Bilgileri</h2>
              <div class="grid">
                <div>
                  <p class="label">Ad Soyad:</p>
                  <p class="value">${tour.customerName}</p>
                </div>
                <div>
                  <p class="label">Telefon:</p>
                  <p class="value">${tour.customerPhone || "-"}</p>
                </div>
                <div>
                  <p class="label">E-posta:</p>
                  <p class="value">${tour.customerEmail || "-"}</p>
                </div>
                <div>
                  <p class="label">TC/Pasaport No:</p>
                  <p class="value">${tour.customerIdNumber || "-"}</p>
                </div>
              </div>
              
              ${
                tour.additionalCustomers && tour.additionalCustomers.length > 0
                  ? `
                <div style="margin-top: 15px;">
                  <h3 style="font-size: 1em; margin-bottom: 10px;">Ek Katılımcılar</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Ad Soyad</th>
                        <th>Telefon</th>
                        <th>TC/Pasaport No</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tour.additionalCustomers
                        .map(
                          (customer) => `
                        <tr>
                          <td>${customer.name}</td>
                          <td>${customer.phone || "-"}</td>
                          <td>${customer.idNumber || "-"}</td>
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
            </div>
            
            ${
              tour.activities && tour.activities.length > 0
                ? `
              <div class="section">
                <h2 class="section-title">Aktiviteler</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Aktivite</th>
                      <th>Tarih</th>
                      <th>Süre</th>
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
              <h2 class="section-title">Ödeme Bilgileri</h2>
              <div class="grid">
                <div>
                  <p class="label">Kişi Başı Fiyat:</p>
                  <p class="value">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.currency || "TRY" }).format(tour.pricePerPerson)}</p>
                </div>
                <div>
                  <p class="label">Toplam Fiyat:</p>
                  <p class="value" style="font-weight: bold;">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.currency || "TRY" }).format(tour.totalPrice)}</p>
                </div>
                <div>
                  <p class="label">Ödeme Durumu:</p>
                  <p class="value">
                    ${
                      tour.paymentStatus === "completed"
                        ? "Tamamlandı"
                        : tour.paymentStatus === "partial"
                          ? "Kısmi Ödeme"
                          : tour.paymentStatus === "pending"
                            ? "Beklemede"
                            : tour.paymentStatus === "refunded"
                              ? "İade Edildi"
                              : "Bilinmiyor"
                    }
                  </p>
                </div>
                <div>
                  <p class="label">Ödeme Yöntemi:</p>
                  <p class="value">
                    ${
                      tour.paymentMethod === "cash"
                        ? "Nakit"
                        : tour.paymentMethod === "creditCard"
                          ? "Kredi Kartı"
                          : tour.paymentMethod === "bankTransfer"
                            ? "Banka Transferi"
                            : tour.paymentMethod === "other"
                              ? "Diğer"
                              : "Bilinmiyor"
                    }
                  </p>
                </div>
                
                ${
                  tour.paymentStatus === "partial"
                    ? `
                  <div>
                    <p class="label">Yapılan Ödeme:</p>
                    <p class="value">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: tour.partialPaymentCurrency || "TRY" }).format(tour.partialPaymentAmount)}</p>
                  </div>
                  <div>
                    <p class="label">Kalan Ödeme:</p>
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
              <p>Bu belge PassionisTravel tarafından düzenlenmiştir.</p>
              <p>İletişim: +90 212 123 4567 | info@passionistour.com</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <button onclick="window.print();" style="padding: 8px 16px; background-color: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer;">Yazdır</button>
            </div>
          </div>
          
          <script>
            // Sayfa yüklendiğinde otomatik yazdırma diyaloğunu aç
            window.onload = function() {
              // Yazdırma işlemi için kısa bir gecikme
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

  // Tur Önizleme Bileşeni
  const TourPreview = ({ tour }) => {
    if (!tour) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Müşteri Bilgileri</h3>
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
              <h4 className="text-md font-medium mb-2">Ek Katılımcılar</h4>
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
          <h3 className="text-lg font-medium mb-4">Tur Detayları</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Seri No:</span>
              <p>{tour.serialNumber}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tur Adı:</span>
              <p>{tour.tourName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
              <p>{formatDate(tour.tourDate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Bitiş Tarihi:</span>
              <p>{tour.tourEndDate ? formatDate(tour.tourEndDate) : "-"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Yetişkin Sayısı:</span>
              <p>{tour.numberOfPeople}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Çocuk Sayısı:</span>
              <p>{tour.numberOfChildren}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Kişi Başı Fiyat:</span>
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
                  <th className="text-left py-2">Tür</th>
                  <th className="text-left py-2">Açıklama</th>
                  <th className="text-left py-2">Sağlayıcı</th>
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
          <h3 className="text-lg font-medium mb-4">Ödeme Bilgileri</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">Ödeme Durumu:</span>
              <p>
                {tour.paymentStatus === "pending"
                  ? "Beklemede"
                  : tour.paymentStatus === "partial"
                    ? "Kısmi Ödeme"
                    : tour.paymentStatus === "completed"
                      ? "Tamamlandı"
                      : tour.paymentStatus === "refunded"
                        ? "İade Edildi"
                        : "Bilinmiyor"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
              <p>
                {tour.paymentMethod === "cash"
                  ? "Nakit"
                  : tour.paymentMethod === "creditCard"
                    ? "Kredi Kartı"
                    : tour.paymentMethod === "bankTransfer"
                      ? "Banka Transferi"
                      : tour.paymentMethod === "other"
                        ? "Diğer"
                        : "Bilinmiyor"}
              </p>
            </div>

            {tour.paymentStatus === "partial" && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">Yapılan Ödeme:</span>
                  <p>{formatCurrency(tour.partialPaymentAmount, tour.partialPaymentCurrency)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kalan Ödeme:</span>
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

  // Finansal Kayıt Önizleme Bileşeni
  const FinancialPreview = ({ financial }) => {
    if (!financial) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Finansal Kayıt Detayları</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Tarih:</span>
              <p>{formatDate(financial.date)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tür:</span>
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
              <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
              <p>
                {financial.paymentMethod === "cash"
                  ? "Nakit"
                  : financial.paymentMethod === "creditCard"
                    ? "Kredi Kartı"
                    : financial.paymentMethod === "bankTransfer"
                      ? "Banka Transferi"
                      : financial.paymentMethod === "other"
                        ? "Diğer"
                        : "Bilinmiyor"}
              </p>
            </div>
          </div>

          {financial.description && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Açıklama:</span>
              <p className="whitespace-pre-line">{financial.description}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#00a1c6]">Veri Görüntüleme</CardTitle>
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
            <TabsTrigger value="tours">Tur Satışları</TabsTrigger>
            <TabsTrigger value="financial">Finansal Kayıtlar</TabsTrigger>
          </TabsList>

          <TabsContent value="tours">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seri No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kişi Sayısı</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
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
                              ? "Tamamlandı"
                              : item.paymentStatus === "partial"
                                ? "Kısmi Ödeme"
                                : item.paymentStatus === "refunded"
                                  ? "İade Edildi"
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
                              title="Önizle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("tours", item)}
                              title="Düzenle"
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
                        Kayıt bulunamadı
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
                    <TableHead>Tür</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ödeme Yöntemi</TableHead>
                    <TableHead>İşlemler</TableHead>
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
                              ? "Kredi Kartı"
                              : item.paymentMethod === "bankTransfer"
                                ? "Banka Transferi"
                                : "Diğer"}
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
                              title="Önizle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit("financial", item)}
                              title="Düzenle"
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
                        Kayıt bulunamadı
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Önizleme Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeTab === "tours" ? "Tur Detayları" : "Finansal Kayıt Detayları"}</DialogTitle>
          </DialogHeader>

          {activeTab === "tours" ? (
            <TourPreview tour={selectedTour} />
          ) : (
            <FinancialPreview financial={selectedFinancial} />
          )}

          {/* DialogFooter içindeki yazdırma butonunu güncelleyelim */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Kapat
            </Button>
            <Button variant="outline" onClick={() => handlePrint(selectedTour)}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </Button>
            <Button
              className="bg-[#00a1c6] hover:bg-[#00a1c6]"
              onClick={() => {
                setIsPreviewOpen(false)
                handleEdit(
                  activeTab === "tours" ? "tours" : "financial",
                  activeTab === "tours" ? selectedTour : selectedFinancial,
                )
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

