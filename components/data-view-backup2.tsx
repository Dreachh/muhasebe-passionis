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

  const filteredToursData = toursData.filter(
    (item: TourData) =>
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.totalPrice?.toString().includes(searchTerm),
  )

  const filteredFinancialData = financialData.filter(
    (item: FinancialData) =>
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.amount?.toString().includes(searchTerm),
  )

  const filteredCustomersData = customersData.filter(
    (item: CustomerData) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Tur Önizleme Bileşeni
  const TourPreview = ({ tour }: { tour: TourData | null }) => {
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
            {tour.customerTC && (
              <div>
                <span className="text-sm text-muted-foreground">TC:</span>
                <p>{tour.customerTC}</p>
              </div>
            )}
            {tour.customerPassport && (
              <div>
                <span className="text-sm text-muted-foreground">Pasaport:</span>
                <p>{tour.customerPassport}</p>
              </div>
            )}
            {tour.customerDrivingLicense && (
              <div>
                <span className="text-sm text-muted-foreground">Ehliyet:</span>
          {/* DialogFooter içindeki yazdırma butonunu güncelleyelim */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Kapat
            </Button>
            {activeTab === "tours" && (
              <Button variant="outline" onClick={() => handlePrint(selectedTour)}>
                <Printer className="mr-2 h-4 w-4" />
                Yazdır
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
