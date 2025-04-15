"use client"

import { useState, useEffect } from "react"
import AppLoadSampleData from "./_app-load-sample-data"
import { MainDashboard } from "../components/main-dashboard"
import { FinancialEntryForm } from "../components/financial-entry-form"
import { TourSalesForm } from "../components/tour-sales-form"
import { DataView } from "../components/data-view"
import { SettingsView } from "../components/settings-view"
import { EnhancedAnalyticsView } from "../components/enhanced-analytics-view"
import { DashboardView } from "../components/dashboard-view"
import { CalendarView } from "../components/calendar-view"
import { BackupRestoreView } from "../components/backup-restore"
import { SplashScreen } from "../components/splash-screen"
import { Toaster } from "../components/ui/toaster"
import { useToast } from "../components/ui/use-toast"
import { CurrencyView } from "../components/currency-view"
import { exportData, importData } from "../lib/export-import"
import { getAllData, addData, updateData, initializeDB, clearStore } from "../lib/db"
import { CustomerView } from "../components/customer-view"
import { MainHeader } from "../components/main-header"
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
interface TourActivity {
  name: string;
  date?: string | Date;
  duration?: string;
  price: number;
  currency?: string;
}

interface TourAdditionalCustomer {
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
}

interface TourExpense {
  id?: string;
  type?: string;
  name?: string;
  provider?: string;
  description?: string;
  amount?: number;
  date?: string | Date;
  category?: string;
  currency?: string;
}

interface TourData {
  id: string;
  serialNumber?: string;
  tourName?: string;
  tourDate: string | Date;
  tourEndDate?: string | Date;
  numberOfPeople?: number;
  numberOfChildren?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerIdNumber?: string;
  customerTC?: string;
  customerPassport?: string;
  customerDrivingLicense?: string;
  pricePerPerson?: number;
  totalPrice?: number;
  currency?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  partialPaymentAmount?: number;
  partialPaymentCurrency?: string;
  notes?: string;
  activities?: TourActivity[];
  companyName?: string;
  additionalCustomers?: TourAdditionalCustomer[];
  expenses?: TourExpense[];
}

interface FinancialData {
  id: string;
  date: string | Date;
  type: string;
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

interface CustomerData {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
}


export default function Home() {
  const [currentView, setCurrentView] = useState<string>("splash")
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [toursData, setToursData] = useState<TourData[]>([])
  const [customersData, setCustomersData] = useState<CustomerData[]>([])
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [splashFinished, setSplashFinished] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [isAIOpen, setIsAIOpen] = useState(false)

  // Add state to store temporary form data
  const [tempTourFormData, setTempTourFormData] = useState<any>(null)
  const [previousView, setPreviousView] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Sadece giriş yapılmamışsa admin login'e yönlendir
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isLoggedIn) {
        localStorage.removeItem('financialData');
        localStorage.removeItem('toursData');
        localStorage.removeItem('customerData');
        window.location.href = '/admin/login';
      }
      // Eğer giriş yapılmışsa ana sayfada kal
    } catch (err) {
      console.error('Home redirect error:', err);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (typeof window !== 'undefined') {
          console.log("Veritabanından veriler yükleniyor...");
          await initializeDB();

          // 1. IndexedDB'den veri yükle
          const financialDataFromDB = await getAllData("financials") as FinancialData[];
          const toursDataFromDB = await getAllData("tours") as TourData[];
          const customersDataFromDB = await getAllData("customers") as CustomerData[];

          let financialLoaded = false;
          let toursLoaded = false;
          let customersLoaded = false;

          if (financialDataFromDB && financialDataFromDB.length > 0) {
            setFinancialData(financialDataFromDB);
            financialLoaded = true;
          }
          if (toursDataFromDB && toursDataFromDB.length > 0) {
            setToursData(toursDataFromDB);
            toursLoaded = true;
          }
          if (customersDataFromDB && customersDataFromDB.length > 0) {
            setCustomersData(customersDataFromDB);
            customersLoaded = true;
          }

          // 2. Eğer hiç veri yoksa örnek dosyadan yükle (örnekler sadece ilk açılışta)
          if (!financialLoaded || !toursLoaded || !customersLoaded) {
            const loadSample = async (file: string): Promise<any | null> => {
              // public/data/ dizininde olmalı
              try {
                const res = await fetch(`/data/${file}`);
                if (!res.ok) return null;
                return await res.json();
              } catch (err) { return null; }
            };
            if (!financialLoaded) {
              const financeSample = await loadSample('sample-finance.json');
              if (financeSample && financeSample.expenses && financeSample.incomes) {
                const allFinancials = [
                  ...financeSample.expenses.map((e: any) => ({ ...e, type: 'expense' })),
                  ...financeSample.incomes.map((e: any) => ({ ...e, type: 'income' }))
                ];
                setFinancialData(allFinancials);
                await clearStore("financials");
                for (const item of allFinancials) {
                  await addData("financials", item);
                }
              }
            }
            if (!toursLoaded) {
              const toursSample = await loadSample('sample-tours.json');
              if (toursSample && Array.isArray(toursSample)) {
                setToursData(toursSample);
                await clearStore("tours");
                for (const item of toursSample) {
                  await addData("tours", item);
                }
              }
            }
            if (!customersLoaded) {
              // Eğer müşteri dosyan yoksa, turlardan müşteri üret
              const toursSample = await loadSample('sample-tours.json');
              if (toursSample && Array.isArray(toursSample)) {
                const customers = toursSample.map((t: any) => ({
                  id: t.customerPhone || t.customerEmail || generateUUID(),
                  name: t.customerName,
                  phone: t.customerPhone,
                  email: t.customerEmail
                }));
                setCustomersData(customers);
                await clearStore("customers");
                for (const item of customers) {
                  await addData("customers", item);
                }
              }
            }
          }
          setSplashFinished(true);
        }
      } catch (error) {
        console.error("Veriler yüklenirken hata oluştu:", error);
        setSplashFinished(true);
      }
    }

    fetchData();
  }, []);

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
  }, [])

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

    // Düzenleme kaydı varsa ve ilgili düzenleme formlarına geçmiyorsak sıfırla
    const editForms = ["tour-sales", "financial-entry", "customers"];
    if (editingRecord && !editForms.includes(view)) {
      setEditingRecord(null)
    }
  }

  const handleDataUpdate = async (type: string, newData: any[]) => {
    try {
      if (type === "financial") {
        // Finansal verileri güncelle
        setFinancialData(newData as FinancialData[])
        
        // IndexedDB'yi güncelle
        await clearStore("financials");
        for (const item of newData) {
          await addData("financials", item);
        }
        
        // Ayrıca localStorage'a da kaydet (yedek olarak)
        localStorage.setItem("financialData", JSON.stringify(newData));
        
        console.log("Finansal veriler güncellendi:", newData);
      } else if (type === "tours") {
        // Tur verilerini güncelle
        setToursData(newData as TourData[])
        
        // IndexedDB'yi güncelle
        await clearStore("tours");
        for (const item of newData) {
          await addData("tours", item);
        }
        
        // Ayrıca localStorage'a da kaydet (yedek olarak)
        localStorage.setItem("toursData", JSON.stringify(newData));
        
        console.log("Tur verileri güncellendi:", newData);
      } else if (type === "customers") {
        // Müşteri verilerini güncelle
        setCustomersData(newData as CustomerData[])
        
        // IndexedDB'yi güncelle
        await clearStore("customers");
        for (const item of newData) {
          await addData("customers", item);
        }
        
        // Ayrıca localStorage'a da kaydet (yedek olarak)
        localStorage.setItem("customerData", JSON.stringify(newData));
        
        console.log("Müşteri verileri güncellendi:", newData);
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

  // Tur giderlerini finansal kayıtlara ekleyen yardımcı fonksiyon
  const addTourExpensesToFinancials = async (tourData: any) => {
    try {
      // Tur giderlerini finansal kayıtlara ekle
      if (tourData.expenses && tourData.expenses.length > 0) {
        for (const expense of tourData.expenses) {
          if (!expense.amount || expense.amount <= 0) continue;
          
          const financialRecord: FinancialData = {
            id: generateUUID(),
            date: new Date().toISOString(),
            type: "expense",
            category: expense.category || "Tur Gideri",
            description: `${tourData.tourName || 'İsimsiz Tur'} - ${expense.name || 'Gider'} (${tourData.serialNumber || 'No'})`,
            amount: expense.amount,
            currency: expense.currency || "TRY",
            paymentMethod: "cash",
            relatedTourId: tourData.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Finansal kaydı ekle
          await addData("financials", financialRecord);
          setFinancialData([...financialData, financialRecord]);
          
          console.log("Tur gideri finansal kayıtlara eklendi:", financialRecord);
        }
        
        toast({
          title: "Bilgi",
          description: "Tur giderleri finansal kayıtlara aktarıldı.",
        });
      }
    } catch (error) {
      console.error("Tur giderleri finansal kayıtlara eklenirken hata:", error);
      toast({
        title: "Uyarı",
        description: "Tur giderleri finansal kayıtlara eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

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

      // Ek katılımcıları kaydetme işlemi kaldırıldı
      // Kullanıcı isteğine göre sadece ana müşteri kaydedilecek, ek katılımcılar müşteriler kısmına kaydedilmeyecek
      // Ek katılımcılar sadece tur kaydında tutulacak ve tur ön izlemesinde görüntülenecek

      // Sonra tur kaydını kaydet
      if (tourData.id && toursData.some((tour) => tour.id === tourData.id)) {
        // Mevcut turu güncelle
        await updateData("tours", tourData)
        setToursData(toursData.map((tour) => (tour.id === tourData.id ? tourData : tour)))
        
        // Tur tamamlandıysa giderleri finansal kayıtlara ekle
        if (tourData.paymentStatus === "completed" && tourData.expenses && tourData.expenses.length > 0) {
          await addTourExpensesToFinancials(tourData);
        }
      } else {
        // Yeni tur ekle
        await addData("tours", tourData)
        setToursData([...toursData, tourData])
        
        // Tur tamamlandıysa giderleri finansal kayıtlara ekle
        if (tourData.paymentStatus === "completed" && tourData.expenses && tourData.expenses.length > 0) {
          await addTourExpensesToFinancials(tourData);
        }
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
    console.log("Düzenleme kaydı:", type, record);
    
    // Derin kopya oluştur (JSON parse/stringify kullanarak)
    const recordCopy = JSON.parse(JSON.stringify(record));
    
    // Doğrudan düzenlenecek kaydı ayarla
    setEditingRecord(recordCopy);
    
    // İlgili görünüme yönlendir
    if (type === "tours") {
      // Navigasyon öncesi düzenleme kaydını konsola yazdır
      console.log("Tur düzenleme verileri:", recordCopy);
      navigateTo("tour-sales");
    } else if (type === "financial") {
      console.log("Finansal düzenleme verileri:", recordCopy);
      navigateTo("financial-entry");
    } else if (type === "customers") {
      console.log("Müşteri düzenleme verileri:", recordCopy);
      navigateTo("customers");
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
      <AppLoadSampleData />
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
          <EnhancedAnalyticsView
            financialData={financialData}
            toursData={toursData}
            customersData={customersData}
            onClose={() => navigateTo("main-dashboard")}
          />
        )}

        {currentView === "backup-restore" && <BackupRestoreView onClose={() => navigateTo("main-dashboard")} />}

        {currentView === "currency" && <CurrencyView onClose={() => navigateTo("main-dashboard")} />}


      </main>

      {/* AI Floating Button */}
      {/* AIFloatingButton bileşeni kaldırıldı */}

      <footer className="py-4 px-6 text-center text-muted-foreground border-t bg-white">
        <p>&copy; {new Date().getFullYear()} PassionisTravel Yönetim Sistemi. Tüm hakları saklıdır.</p>
      </footer>

      <Toaster />
    </div>
  )
}
