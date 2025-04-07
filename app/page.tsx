"use client"

import { useState, useEffect } from "react"
import { MainDashboard } from "@/components/main-dashboard"
import { FinancialEntryForm } from "@/components/financial-entry-form"
import { TourSalesForm } from "@/components/tour-sales-form"
import { DataView } from "@/components/data-view"
import { SettingsView } from "@/components/settings-view"
import { AnalyticsView } from "@/components/analytics-view"
import { DashboardView } from "@/components/dashboard-view"
import { CalendarView } from "@/components/calendar-view"
import { BackupRestoreView } from "@/components/backup-restore"
import { SplashScreen } from "@/components/splash-screen"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyView } from "@/components/currency-view"
import { exportData, importData } from "@/lib/export-import"
import { getAllData, addData, updateData, initializeDB } from "@/lib/db"
import { AIAssistantView } from "@/components/ai-assistant-view"
import { CustomerView } from "@/components/customer-view"
import { MainHeader } from "@/components/main-header"
import { AIFloatingButton } from "@/components/ai-floating-button"
import { useRouter } from 'next/navigation'

// Benzersiz ID üretmek için fonksiyon
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Veri tipleri için arayüzler tanımlayalım
interface TourData {
  id: string;
  [key: string]: any;
}

interface FinancialData {
  id: string;
  [key: string]: any;
}

interface CustomerData {
  id: string;
  name?: string;
  phone?: string;
  [key: string]: any;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<string>("main-dashboard")
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [toursData, setToursData] = useState<TourData[]>([])
  const [customersData, setCustomersData] = useState<CustomerData[]>([])
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false)
  const { toast } = useToast()
  const router = useRouter()

  // Add state to store temporary form data
  const [tempTourFormData, setTempTourFormData] = useState<any>(null)
  const [previousView, setPreviousView] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Sadece giriş yapılmamışsa admin login'e yönlendir
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isLoggedIn) {
        window.location.href = '/admin/login';
      }
      // Eğer giriş yapılmışsa ana sayfada kal
    } catch (err) {
      console.error('Home redirect error:', err);
    }
  }, [router]);

  useEffect(() => {
    // Veritabanını başlat
    const setupDB = async () => {
      try {
        await initializeDB()
      } catch (error) {
        console.error("Veritabanı başlatma hatası:", error)
      }
    }

    setupDB()

    // Uygulama başlangıcında verileri yükle
    const loadData = async () => {
      setIsLoading(true)
      try {
        // IndexedDB'den verileri yükle
        const tours = await getAllData("tours")
        const financials = await getAllData("financials")
        const customers = await getAllData("customers")

        setToursData(tours)
        setFinancialData(financials)
        setCustomersData(customers)
      } catch (error) {
        console.error("Veri yükleme hatası:", error)
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleSplashFinish = () => {
    setCurrentView("main-dashboard")
  }

  const navigateTo = (view: string) => {
    // Store the current view before changing
    if (currentView !== view) {
      setPreviousView(currentView)

      // If navigating away from tour-sales to settings, store the form data
      if (currentView === "tour-sales" && view === "settings") {
        // We'll set a flag to indicate we need to return to tour-sales
        localStorage.setItem("returnToTourSales", "true")
      }
    }

    setCurrentView(view)

    // Only reset editing record if not temporarily navigating to settings
    if (!(currentView === "tour-sales" && view === "settings")) {
      setEditingRecord(null)
    }
  }

  const handleDataUpdate = async (type: string, newData: any[]) => {
    try {
      if (type === "financial") {
        // Finansal verileri güncelle
        setFinancialData(newData as FinancialData[])

        // Veritabanını temizle ve yeni verileri ekle
        for (const item of newData) {
          await updateData("financials", item)
        }
      } else if (type === "tours") {
        // Tur verilerini güncelle
        setToursData(newData as TourData[])

        // Veritabanını temizle ve yeni verileri ekle
        for (const item of newData) {
          await updateData("tours", item)
        }
      } else if (type === "customers") {
        // Müşteri verilerini güncelle
        setCustomersData(newData as CustomerData[])

        // Veritabanını güncelle
        for (const item of newData) {
          await updateData("customers", item)
        }
      }

      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla güncellendi.",
      })
    } catch (error) {
      console.error("Veri güncelleme hatası:", error)
      toast({
        title: "Hata",
        description: "Veriler güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveTour = async (tourData: any) => {
    try {
      // Önce müşteri verisini oluştur ve kaydet
      const customerExists = customersData.some(
        (customer) => 
          customer.name === tourData.customerName && 
          customer.phone === tourData.customerPhone
      );

      // Eğer müşteri veritabanında yoksa ekle
      if (!customerExists && tourData.customerName) {
        const newCustomer: CustomerData = {
          id: generateUUID(),
          name: tourData.customerName,
          phone: tourData.customerPhone,
          email: tourData.customerEmail,
          address: tourData.customerAddress,
          idNumber: tourData.customerIdNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Müşteriyi veritabanına ekle
        await addData("customers", newCustomer);
        setCustomersData([...customersData, newCustomer]);
        
        toast({
          title: "Bilgi",
          description: "Yeni müşteri kaydı otomatik olarak oluşturuldu.",
        });
      }

      // Ek katılımcıları da kaydet
      if (tourData.additionalCustomers && tourData.additionalCustomers.length > 0) {
        for (const additionalCustomer of tourData.additionalCustomers) {
          if (!additionalCustomer.name) continue; // Adı boş olanları atla
          
          const additionalCustomerExists = customersData.some(
            (customer) => 
              customer.name === additionalCustomer.name && 
              customer.phone === additionalCustomer.phone
          );
          
          if (!additionalCustomerExists) {
            const newAdditionalCustomer: CustomerData = {
              id: generateUUID(),
              name: additionalCustomer.name,
              phone: additionalCustomer.phone,
              idNumber: additionalCustomer.idNumber,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Ek katılımcıyı veritabanına ekle
            await addData("customers", newAdditionalCustomer);
            setCustomersData([...customersData, newAdditionalCustomer]);
          }
        }
      }

      // Sonra tur kaydını kaydet
      if (tourData.id && toursData.some((tour) => tour.id === tourData.id)) {
        // Mevcut turu güncelle
        await updateData("tours", tourData)
        setToursData(toursData.map((tour) => (tour.id === tourData.id ? tourData : tour)))
      } else {
        // Yeni tur ekle
        await addData("tours", tourData)
        setToursData([...toursData, tourData])
      }

      toast({
        title: "Başarılı!",
        description: "Tur satışı başarıyla kaydedildi.",
      })

      // Clear temp form data after successful save
      setTempTourFormData(null)
      localStorage.removeItem("returnToTourSales")

      // Navigate to dashboard
      navigateTo("main-dashboard")
    } catch (error) {
      console.error("Tur kaydetme hatası:", error)
      toast({
        title: "Hata",
        description: "Tur satışı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveFinancial = async (data: FinancialData) => {
    try {
      if (data.id && financialData.some((item) => item.id === data.id)) {
        // Mevcut finansal kaydı güncelle
        await updateData("financials", data)
        setFinancialData(financialData.map((item) => (item.id === data.id ? data : item)))
      } else {
        // Yeni finansal kayıt ekle
        await addData("financials", data)
        setFinancialData([...financialData, data])
      }

      toast({
        title: "Başarılı!",
        description: "Finansal kayıt başarıyla kaydedildi.",
      })

      navigateTo("main-dashboard")
    } catch (error) {
      console.error("Finansal kayıt hatası:", error)
      toast({
        title: "Hata",
        description: "Finansal kayıt kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCustomer = async (data: CustomerData) => {
    try {
      if (data.id && customersData.some((item) => item.id === data.id)) {
        // Mevcut müşteri kaydını güncelle
        await updateData("customers", data)
        setCustomersData(customersData.map((item) => (item.id === data.id ? data : item)))
      } else {
        // Yeni müşteri kaydı ekle
        await addData("customers", data)
        setCustomersData([...customersData, data])
      }

      toast({
        title: "Başarılı!",
        description: "Müşteri kaydı başarıyla kaydedildi.",
      })

      navigateTo("main-dashboard")
    } catch (error) {
      console.error("Müşteri kayıt hatası:", error)
      toast({
        title: "Hata",
        description: "Müşteri kaydı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleEditRecord = (type: string, record: any) => {
    setEditingRecord(record)
    if (type === "tours") {
      navigateTo("tour-sales")
    } else if (type === "financial") {
      navigateTo("financial-entry")
    } else if (type === "customers") {
      navigateTo("customers")
    }
  }

  // Function to temporarily store tour form data
  const handleStoreTourFormData = (formData: any) => {
    setTempTourFormData(formData)
  }

  // Function to return from settings to tour form
  const handleReturnFromSettings = () => {
    if (localStorage.getItem("returnToTourSales") === "true") {
      localStorage.removeItem("returnToTourSales")
      navigateTo("tour-sales")
    } else {
      navigateTo("main-dashboard")
    }
  }

  const handleExportData = async () => {
    try {
      const success = await exportData()
      if (success) {
        toast({
          title: "Başarılı!",
          description: "Veriler başarıyla dışa aktarıldı.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler dışa aktarılırken bir hata oluştu: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleImportData = async () => {
    try {
      await importData()
      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla içe aktarıldı.",
      })
      // Sayfayı yenile
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler içe aktarılırken bir hata oluştu: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Splash screen göster
  if (currentView === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <MainHeader currentView={currentView} onNavigate={navigateTo} />

      {/* Ana İçerik */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {currentView === "main-dashboard" && (
          <MainDashboard
            onNavigate={navigateTo}
            financialData={financialData}
            toursData={toursData}
            customersData={customersData}
          />
        )}

        {currentView === "dashboard" && <DashboardView onNavigate={navigateTo} />}

        {currentView === "calendar" && (
          <CalendarView
            onNavigate={navigateTo}
            toursData={toursData.map(tour => ({
              id: tour.id,
              date: tour.tourDate ? new Date(tour.tourDate) : new Date(),
              title: tour.tourName || "İsimsiz Tur",
              customers: tour.customerName || "Müşteri bilgisi yok",
              location: tour.destination,
              color: "#10b981", // Varsayılan yeşil renk
              tourName: tour.tourName,
              customerName: tour.customerName,
              totalPrice: tour.totalPrice,
              currency: tour.currency,
              serialNumber: tour.serialNumber
            }))}
          />
        )}

        {currentView === "financial-entry" && (
          <FinancialEntryForm
            initialData={editingRecord}
            onCancel={() => navigateTo("main-dashboard")}
            onSave={handleSaveFinancial}
          />
        )}

        {currentView === "tour-sales" && (
          <TourSalesForm
            initialData={editingRecord}
            tempData={tempTourFormData}
            onCancel={() => navigateTo("main-dashboard")}
            onSave={handleSaveTour}
            onStoreFormData={handleStoreTourFormData}
            onNavigateToSettings={() => navigateTo("settings")}
            customersData={customersData}
          />
        )}

        {currentView === "customers" && (
          <CustomerView
            initialData={editingRecord}
            onCancel={() => navigateTo("main-dashboard")}
            onSave={handleSaveCustomer}
            customersData={customersData}
          />
        )}

        {currentView === "data-view" && (
          <DataView
            financialData={financialData}
            toursData={toursData}
            customersData={customersData}
            onClose={() => navigateTo("main-dashboard")}
            onDataUpdate={handleDataUpdate}
            onEdit={handleEditRecord}
          />
        )}

        {currentView === "settings" && <SettingsView onClose={handleReturnFromSettings} />}

        {currentView === "analytics" && (
          <AnalyticsView
            financialData={financialData}
            toursData={toursData}
            onClose={() => navigateTo("main-dashboard")}
          />
        )}

        {currentView === "backup-restore" && <BackupRestoreView onClose={() => navigateTo("main-dashboard")} />}

        {currentView === "currency" && <CurrencyView onClose={() => navigateTo("main-dashboard")} />}

        {currentView === "ai-assistant" && (
          <AIAssistantView
            onNavigate={navigateTo}
            onClose={() => navigateTo("main-dashboard")}
            financialData={financialData}
            toursData={toursData}
            customersData={customersData}
          />
        )}
      </main>

      {/* AI Floating Button */}
      <AIFloatingButton
        isOpen={isAIOpen}
        onToggle={() => setIsAIOpen(!isAIOpen)}
        onNavigate={navigateTo}
        financialData={financialData}
        toursData={toursData}
        customersData={customersData}
      />

      <footer className="py-4 px-6 text-center text-muted-foreground border-t bg-white">
        <p>&copy; {new Date().getFullYear()} PassionisTravel Yönetim Sistemi. Tüm hakları saklıdır.</p>
      </footer>

      <Toaster />
    </div>
  )
}

