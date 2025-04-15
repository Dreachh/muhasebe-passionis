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

// Tip tanımlamaları
interface TourData {
  id: string
  serialNumber?: string
  tourName?: string
  tourDate: string | Date
  tourEndDate?: string | Date
  numberOfPeople?: number
  numberOfChildren?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerIdNumber?: string
  customerTC?: string
  customerPassport?: string
  customerDrivingLicense?: string
  pricePerPerson?: number
  totalPrice?: number
  currency?: string
  paymentStatus?: string
  paymentMethod?: string
  partialPaymentAmount?: number
  partialPaymentCurrency?: string
  notes?: string
  activities?: Array<{
    name: string
    date?: string | Date
    duration?: string
    price: number
    currency?: string
  }>
  companyName?: string
  additionalCustomers?: Array<{
    name?: string
    phone?: string
    email?: string
    idNumber?: string
  }>
  expenses?: Array<{
    id?: string
    type?: string
    name?: string
    provider?: string
    description?: string
    amount?: number
    date?: string | Date
    category?: string
    currency?: string
  }>
}

interface FinancialData {
  id: string
  date: string | Date
  type: string
  category?: string
  description?: string
  amount?: number
  currency?: string
  paymentMethod?: string
}

interface CustomerData {
  id: string
  name?: string
  phone?: string
  email?: string
  idNumber?: string
}

interface DataViewProps {
  financialData: FinancialData[]
  toursData: TourData[]
  customersData: CustomerData[]
  onClose: () => void
  onDataUpdate: (type: string, data: any) => void
  onEdit: (type: string, item: any) => void
}

export function DataView({ financialData = [], toursData = [], customersData = [], onClose, onDataUpdate, onEdit }: DataViewProps) {
  const [activeTab, setActiveTab] = useState("tours")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTour, setSelectedTour] = useState<TourData | null>(null)
  const [selectedFinancial, setSelectedFinancial] = useState<FinancialData | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ type: "", id: "" })

  const handleDelete = async () => {
    try {
      if (itemToDelete.type === "financial") {
        // Önce doğrudan IndexedDB'den sil
        await deleteData("financials", itemToDelete.id);
        console.log("IndexedDB'den finansal veri silindi:", itemToDelete.id);
        
        // Sonra UI state'ini güncelle
        const updatedData = financialData.filter((item: FinancialData) => item.id !== itemToDelete.id);
        console.log("Kalan finansal veri sayısı:", updatedData.length);
        
        // Hem state hem de localStorage güncelleniyor
        onDataUpdate("financial", updatedData);
      } else if (itemToDelete.type === "tours") {
        // Önce doğrudan IndexedDB'den sil
        await deleteData("tours", itemToDelete.id);
        console.log("IndexedDB'den tur verisi silindi:", itemToDelete.id);
        
        // Sonra UI state'ini güncelle
        const updatedData = toursData.filter((item: TourData) => item.id !== itemToDelete.id);
        console.log("Kalan tur verisi sayısı:", updatedData.length);
        
        // Hem state hem de localStorage güncelleniyor
        onDataUpdate("tours", updatedData);
      } else if (itemToDelete.type === "customers") {
        // Önce doğrudan IndexedDB'den sil
        await deleteData("customers", itemToDelete.id);
        console.log("IndexedDB'den müşteri verisi silindi:", itemToDelete.id);
        
        // Sonra UI state'ini güncelle
        const updatedData = customersData.filter((item: CustomerData) => item.id !== itemToDelete.id);
        console.log("Kalan müşteri sayısı:", updatedData.length);
        
        // Hem state hem de localStorage güncelleniyor
        onDataUpdate("customers", updatedData);
      }
      
      // Silme işlemi tamamlandı
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Silme işlemi sırasında hata oluştu:", error);
      alert("Kayıt silinirken bir hata oluştu! Lütfen tekrar deneyin.");
      setIsDeleteDialogOpen(false);
    }
  }

  const openDeleteDialog = (type: string, id: string) => {
    setItemToDelete({ type, id })
    setIsDeleteDialogOpen(true)
  }

  const handleEdit = (type: string, item: any) => {
    onEdit(type, item)
  }

  // Yazdırma işlemi için fonksiyon
  const handlePrint = (tour: TourData) => {
    try {
      // Tur verilerini localStorage'a kaydet
      localStorage.removeItem('printTourData'); // Önce eski veriyi temizle
      localStorage.setItem('printTourData', JSON.stringify(tour));
      console.log('Yazdırılacak veri kaydedildi:', tour);
      
      // Yeni bir pencere aç ve print sayfasına yönlendir
      const printWindow = window.open(`/print/tour/${tour.id}`, '_blank');
      
      if (!printWindow) {
        alert('Yazdırma penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.');
      }
    } catch (error) {
      console.error('Yazdırma işlemi sırasında hata oluştu:', error);
      alert('Yazdırma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }
  
  // Filtreleme fonksiyonları
  const filteredToursData = toursData.filter(
    (item: TourData) =>
      (item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const filteredFinancialData = financialData.filter(
    (item: FinancialData) =>
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredCustomersData = customersData.filter(
    (item: CustomerData) =>
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )
  
  // Tur Önizleme Bileşeni
  const TourPreview = ({ tour }: { tour: TourData | null }) => {
    if (!tour) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Tur Adı</h3>
            <p className="text-sm">{tour.tourName || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Seri No</h3>
            <p className="text-sm">{tour.serialNumber || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Tur Tarihi</h3>
            <p className="text-sm">{formatDate(tour.tourDate)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Bitiş Tarihi</h3>
            <p className="text-sm">{tour.tourEndDate ? formatDate(tour.tourEndDate) : '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Kişi Sayısı</h3>
            <p className="text-sm">{tour.numberOfPeople || '0'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Çocuk Sayısı</h3>
            <p className="text-sm">{tour.numberOfChildren || '0'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Müşteri Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Ad Soyad</h4>
              <p className="text-sm">{tour.customerName || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Telefon</h4>
              <p className="text-sm">{tour.customerPhone || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">E-posta</h4>
              <p className="text-sm">{tour.customerEmail || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Kimlik No</h4>
              <p className="text-sm">{tour.customerIdNumber || tour.customerTC || tour.customerPassport || '-'}</p>
            </div>
          </div>
        </div>

        {tour.additionalCustomers && tour.additionalCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Ek Müşteriler</h3>
            <div className="space-y-2">
              {tour.additionalCustomers.map((customer, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 border p-2 rounded-md">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Ad Soyad</h4>
                    <p className="text-sm">{customer.name || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Telefon</h4>
                    <p className="text-sm">{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">E-posta</h4>
                    <p className="text-sm">{customer.email || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Kimlik No</h4>
                    <p className="text-sm">{customer.idNumber || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tour.activities && tour.activities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Aktiviteler</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktivite</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tour.activities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell>{activity.date ? formatDate(activity.date) : '-'}</TableCell>
                    <TableCell>{activity.duration || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(activity.price, activity.currency || 'TRY')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {tour.expenses && tour.expenses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Harcamalar</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tour.expenses.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell>{expense.name || expense.description || '-'}</TableCell>
                    <TableCell>{expense.category || '-'}</TableCell>
                    <TableCell>{expense.date ? formatDate(expense.date) : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount || 0, expense.currency || 'TRY')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium mb-2">Ödeme Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Kişi Başı Fiyat</h4>
              <p className="text-sm">{formatCurrency(tour.pricePerPerson || 0, tour.currency || 'TRY')}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Toplam Fiyat</h4>
              <p className="text-sm font-bold">{formatCurrency(tour.totalPrice || 0, tour.currency || 'TRY')}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Ödeme Durumu</h4>
              <p className="text-sm">
                {tour.paymentStatus === "pending" ? "Beklemede" : 
                  tour.paymentStatus === "partial" ? "Kısmi Ödeme" : 
                  tour.paymentStatus === "completed" ? "Tamamlandı" : 
                  tour.paymentStatus === "refunded" ? "İade Edildi" : "Bilinmiyor"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Ödeme Yöntemi</h4>
              <p className="text-sm">
                {tour.paymentMethod === "cash" ? "Nakit" : 
                  tour.paymentMethod === "creditCard" ? "Kredi Kartı" : 
                  tour.paymentMethod === "bankTransfer" ? "Banka Transferi" : 
                  tour.paymentMethod === "other" ? "Diğer" : "Bilinmiyor"}
              </p>
            </div>
            
            {tour.paymentStatus === "partial" && (
              <>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Yapılan Ödeme</h4>
                  <p className="text-sm">{formatCurrency(tour.partialPaymentAmount || 0, tour.partialPaymentCurrency || tour.currency || 'TRY')}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Kalan Ödeme</h4>
                  <p className="text-sm font-bold">{formatCurrency((tour.totalPrice || 0) - (tour.partialPaymentAmount || 0), tour.currency || 'TRY')}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {tour.notes && (
          <div>
            <h3 className="text-sm font-medium mb-2">Notlar</h3>
            <p className="text-sm whitespace-pre-line border p-3 rounded-md bg-muted/50">{tour.notes}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => handleEdit('tours', tour)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="default" size="sm" onClick={() => handlePrint(tour)}>
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
        </div>
      </div>
    )
  }
  
  // Finansal Kayıt Önizleme Bileşeni
  const FinancialPreview = ({ financial }: { financial: FinancialData | null }) => {
    if (!financial) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Tarih</h3>
            <p className="text-sm">{formatDate(financial.date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Tür</h3>
            <p className="text-sm">
              {financial.type === "income" ? "Gelir" : 
               financial.type === "expense" ? "Gider" : 
               financial.type === "transfer" ? "Transfer" : financial.type}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Kategori</h3>
            <p className="text-sm">{financial.category || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Tutar</h3>
            <p className="text-sm font-bold">{formatCurrency(financial.amount || 0, financial.currency || 'TRY')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Ödeme Yöntemi</h3>
            <p className="text-sm">
              {financial.paymentMethod === "cash" ? "Nakit" : 
               financial.paymentMethod === "creditCard" ? "Kredi Kartı" : 
               financial.paymentMethod === "bankTransfer" ? "Banka Transferi" : 
               financial.paymentMethod === "other" ? "Diğer" : "-"}
            </p>
          </div>
        </div>
        
        {financial.description && (
          <div>
            <h3 className="text-sm font-medium mb-2">Açıklama</h3>
            <p className="text-sm whitespace-pre-line border p-3 rounded-md bg-muted/50">{financial.description}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => handleEdit('financial', financial)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>
    )
  }
  
  // Müşteri Önizleme Bileşeni
  const CustomerPreview = ({ customer }: { customer: CustomerData | null }) => {
    if (!customer) return null

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Ad Soyad</h3>
            <p className="text-sm">{customer.name || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Telefon</h3>
            <p className="text-sm">{customer.phone || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">E-posta</h3>
            <p className="text-sm">{customer.email || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Kimlik No</h3>
            <p className="text-sm">{customer.idNumber || '-'}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => handleEdit('customers', customer)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>
    )
  }
  
  // Ana bileşen render
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Veri Görüntüleme</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Kapat</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="tours">Turlar</TabsTrigger>
              <TabsTrigger value="financial">Finansal</TabsTrigger>
              <TabsTrigger value="customers">Müşteriler</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="tours" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tur Adı</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredToursData.length > 0 ? (
                    filteredToursData.map((item: TourData) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.tourName || 'İsimsiz Tur'}</TableCell>
                        <TableCell>{item.customerName || '-'}</TableCell>
                        <TableCell>{formatDate(item.tourDate)}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice || 0, item.currency || 'TRY')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedTour(item); setIsPreviewOpen(true); }}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Görüntüle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlePrint(item)}>
                              <Printer className="h-4 w-4" />
                              <span className="sr-only">Yazdır</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit('tours', item)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Düzenle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('tours', item.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        {searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz tur kaydı bulunmuyor.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinancialData.length > 0 ? (
                    filteredFinancialData.map((item: FinancialData) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          {item.type === "income" ? "Gelir" : 
                           item.type === "expense" ? "Gider" : 
                           item.type === "transfer" ? "Transfer" : item.type}
                        </TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.description || '-'}</TableCell>
                        <TableCell className={item.type === "income" ? "text-green-600" : item.type === "expense" ? "text-red-600" : ""}>
                          {formatCurrency(item.amount || 0, item.currency || 'TRY')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedFinancial(item); setIsPreviewOpen(true); }}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Görüntüle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit('financial', item)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Düzenle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('financial', item.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        {searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz finansal kayıt bulunmuyor.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Kimlik No</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomersData.length > 0 ? (
                    filteredCustomersData.map((item: CustomerData) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name || '-'}</TableCell>
                        <TableCell>{item.phone || '-'}</TableCell>
                        <TableCell>{item.email || '-'}</TableCell>
                        <TableCell>{item.idNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCustomer(item); setIsPreviewOpen(true); }}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Görüntüle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit('customers', item)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Düzenle</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('customers', item.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        {searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz müşteri kaydı bulunmuyor.'}
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
            <DialogTitle>
              {activeTab === "tours" && selectedTour ? selectedTour.tourName || "Tur Detayları" : 
               activeTab === "financial" && selectedFinancial ? "Finansal Kayıt Detayları" : 
               activeTab === "customers" && selectedCustomer ? selectedCustomer.name || "Müşteri Detayları" : 
               "Detaylar"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "tours" && <TourPreview tour={selectedTour} />}
          {activeTab === "financial" && <FinancialPreview financial={selectedFinancial} />}
          {activeTab === "customers" && <CustomerPreview customer={selectedCustomer} />}
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu kaydı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu kayıt kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
