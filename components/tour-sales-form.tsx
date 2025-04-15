"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Check, Printer, Settings, AlertCircle, CircleSlash } from "lucide-react"
import { getExpenseTypes, getProviders, getActivities, getDestinations, getReferralSources } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

// Simple UUID generator function to replace the uuid package
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function TourSalesForm({
  initialData = null,
  tempData = null,
  onSave,
  onCancel,
  onStoreFormData,
  onNavigateToSettings,
  customersData = [],
}) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState([])
  const [providers, setProviders] = useState([])
  const [activities, setActivities] = useState([])
  const [destinations, setDestinations] = useState([])
  const [referralSources, setReferralSources] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Adım göstergesi için referans
  const stepsRef = useRef(null)

  // Adım değiştiğinde sayfayı yukarı kaydır
  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  // Initialize form data from initialData, tempData, or default values
  const [formData, setFormData] = useState(() => {
    if (tempData) return tempData
    if (initialData) return initialData

    return {
      id: generateUUID(),
      serialNumber: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      customerIdNumber: "",
      nationality: "", // Müşterinin vatandaşlık/ülke bilgisi
      referralSource: "", // Müşterinin nereden geldiği/bulduğu bilgisi
      additionalCustomers: [],
      tourName: "",
      tourDate: new Date().toISOString().split("T")[0],
      tourEndDate: "",
      numberOfPeople: 1,
      numberOfChildren: 0,
      pricePerPerson: "",
      totalPrice: "",
      currency: "TRY",
      paymentStatus: "pending",
      paymentMethod: "cash",
      partialPaymentAmount: "",
      partialPaymentCurrency: "TRY",
      notes: "",
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [],
      destinationId: "",
    }
  })

  // initialData değişikliklerini izle
  useEffect(() => {
    if (initialData) {
      console.log("Tour edit data received:", initialData);
      // Düzenlenecek tur verilerini forma yükle
      const formData = {
        ...initialData,
        id: initialData.id || generateUUID(),
        tourDate: initialData.tourDate || new Date().toISOString().split("T")[0],
        tourEndDate: initialData.tourEndDate || "",
        serialNumber: initialData.serialNumber || "",
        tourName: initialData.tourName || "",
        customerName: initialData.customerName || "",
        customerPhone: initialData.customerPhone || "",
        customerEmail: initialData.customerEmail || "",
        customerIdNumber: initialData.customerIdNumber || "",
        customerAddress: initialData.customerAddress || "",
        nationality: initialData.nationality || "", // Vatandaşlık/ülke bilgisi
        numberOfPeople: initialData.numberOfPeople || 1,
        numberOfChildren: initialData.numberOfChildren || 0,
        pricePerPerson: initialData.pricePerPerson || "",
        totalPrice: initialData.totalPrice || "",
        currency: initialData.currency || "TRY",
        paymentStatus: initialData.paymentStatus || "pending",
        paymentMethod: initialData.paymentMethod || "cash",
        partialPaymentAmount: initialData.partialPaymentAmount || "",
        partialPaymentCurrency: initialData.partialPaymentCurrency || "TRY",
        notes: initialData.notes || "",
        expenses: initialData.expenses || [],
        activities: initialData.activities || [],
        destinationId: initialData.destinationId || "",
      };
      
      // Form verilerini güncelle
      setFormData(formData);
    }
  }, [initialData]);

  // Gider türlerini, sağlayıcıları, aktiviteleri ve destinasyonları yükle
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Yükleme başladığında yükleme durumunu güncelle
      
      try {
        console.log('Veri yükleme başlıyor...');
        
        // Tüm verileri paralel olarak yükle ve her bir isteğe timeout ekle
        const fetchWithTimeout = async (fetchPromise, name, fallbackStorageKey) => {
          // Önce localStorage'dan yüklemeyi dene
          try {
            const cachedData = localStorage.getItem(fallbackStorageKey);
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
                console.log(`${name} önbellekten yüklendi:`, parsedData.length, 'adet veri');
                return parsedData;
              }
            }
          } catch (cacheError) {
            console.warn(`${name} önbellekten yüklenemedi:`, cacheError);
          }
          
          // Önbellekte yoksa API'den yüklemeyi dene
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${name} yüklenirken zaman aşımına uğradı`)), 10000);
          });
          
          try {
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            if (result && Array.isArray(result) && result.length > 0) {
              console.log(`${name} API'den başarıyla yüklendi:`, result.length, 'adet veri');
              
              // Başarılı sonuçları önbelleğe kaydet
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(result));
              } catch (storageError) {
                console.warn(`${name} önbelleğe kaydedilemedi:`, storageError);
              }
              
              return result;
            } else {
              console.warn(`${name} API'den yüklendi fakat veri yok veya boş dizi döndü`);
              throw new Error(`${name} için veri bulunamadı`);
            }
          } catch (error) {
            console.error(`${name} yüklenirken hata:`, error);
            
            // Hata durumunda varsayılan veriler
            if (name === 'Destinasyonlar') {
              const defaultData = [
                { id: "default-dest-1", name: "Antalya", country: "Türkiye", description: "Güzel sahiller" },
                { id: "default-dest-2", name: "İstanbul", country: "Türkiye", description: "Tarihi yarımada" },
                { id: "default-dest-3", name: "Kapadokya", country: "Türkiye", description: "Peri bacaları" }
              ];
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(defaultData));
              } catch (storageError) {}
              return defaultData;
            } else if (name === 'Aktiviteler') {
              const defaultData = [
                { id: "default-act-1", name: "Tekne Turu", destinationId: "default-dest-1", price: "300", currency: "TRY", description: "Güzel bir tekne turu" },
                { id: "default-act-2", name: "Müze Gezisi", destinationId: "default-dest-2", price: "150", currency: "TRY", description: "Tarihi müze gezisi" },
                { id: "default-act-3", name: "Balon Turu", destinationId: "default-dest-3", price: "2000", currency: "TRY", description: "Kapadokya'da balon turu" }
              ];
              try {
                localStorage.setItem(fallbackStorageKey, JSON.stringify(defaultData));
              } catch (storageError) {}
              return defaultData;
            }
            
            return [];
          }
        };
        
        // Verileri paralel olarak getir
        try {
          console.log('Referans kaynakları ve diğer veriler yükleniyor...');
          
          const [types, providersData, activitiesData, destinationsData, referralSourcesData] = await Promise.all([
            fetchWithTimeout(getExpenseTypes(), 'Gider türleri', 'expenseTypes'),
            fetchWithTimeout(getProviders(), 'Sağlayıcılar', 'providers'),
            fetchWithTimeout(getActivities(), 'Aktiviteler', 'activities'),
            fetchWithTimeout(getDestinations(), 'Destinasyonlar', 'destinations'),
            fetchWithTimeout(getReferralSources(), 'Referans Kaynakları', 'referralSources')
          ]);
          
          // Verileri yerel değişkenlere kaydet ve null kontrolü yap
          const typesResult = Array.isArray(types) ? types : [];
          const providersResult = Array.isArray(providersData) ? providersData : [];
          const activitiesResult = Array.isArray(activitiesData) ? activitiesData : [];
          const destinationsResult = Array.isArray(destinationsData) ? destinationsData : [];
          const referralSourcesResult = Array.isArray(referralSourcesData) ? referralSourcesData : [];
          
          // Verileri localStorage'a da kaydet (adımlar arası geçişte kaybolmaması için)
          try {
            localStorage.setItem('expenseTypes', JSON.stringify(typesResult));
            localStorage.setItem('providers', JSON.stringify(providersResult));
            localStorage.setItem('activities', JSON.stringify(activitiesResult));
            localStorage.setItem('destinations', JSON.stringify(destinationsResult));
            localStorage.setItem('referralSources', JSON.stringify(referralSourcesResult));
            console.log('Tüm veriler localStorage\'a başarıyla kaydedildi');
          } catch (storageError) {
            console.warn('Veriler önbelleğe kaydedilemedi:', storageError);
          }
          
          // Verileri state'e kaydet
          setExpenseTypes(typesResult);
          setProviders(providersResult);
          setActivities(activitiesResult);
          setDestinations(destinationsResult);
          setReferralSources(referralSourcesResult);
          
          console.log('Yüklenen destinasyonlar:', destinationsResult.length, 'adet');
          console.log('Yüklenen aktiviteler:', activitiesResult.length, 'adet');
          console.log('Yüklenen referans kaynakları:', referralSourcesResult.length, 'adet');
        } catch (parallelLoadError) {
          console.error('Paralel veri yükleme sırasında hata:', parallelLoadError);
          
          // Hata durumunda localStorage'dan yüklemeyi dene
          try {
            const cachedReferralSources = localStorage.getItem('referralSources');
            if (cachedReferralSources) {
              const parsedReferralSources = JSON.parse(cachedReferralSources);
              if (Array.isArray(parsedReferralSources) && parsedReferralSources.length > 0) {
                console.log('Referans kaynakları önbellekten yüklendi:', parsedReferralSources.length, 'adet');
                setReferralSources(parsedReferralSources);
              }
            }
          } catch (cacheError) {
            console.warn('Referans kaynakları önbellekten yüklenemedi:', cacheError);
          }
        }

        // Gider kategorilerini oluştur
        const categories = [
          { value: "accommodation", label: "Konaklama" },
          { value: "transportation", label: "Ulaşım" },
          { value: "transfer", label: "Transfer" },
          { value: "guide", label: "Rehberlik" },
          { value: "agency", label: "Acente" },
          { value: "porter", label: "Hanutçu" },
          { value: "food", label: "Yemek" },
          { value: "activity", label: "Aktivite" },
          { value: "general", label: "Genel" },
          { value: "other", label: "Diğer" },
        ];
        setExpenseCategories(categories);
        
        // Veri yükleme tamamlandı
        setIsLoading(false);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        
        // Hata durumunda localStorage'dan veri yüklemeyi dene
        try {
          const cachedTypes = localStorage.getItem('expenseTypes');
          const cachedProviders = localStorage.getItem('providers');
          const cachedActivities = localStorage.getItem('activities');
          const cachedDestinations = localStorage.getItem('destinations');
          const cachedReferralSources = localStorage.getItem('referralSources');
          
          if (cachedTypes) setExpenseTypes(JSON.parse(cachedTypes));
          if (cachedProviders) setProviders(JSON.parse(cachedProviders));
          if (cachedActivities) setActivities(JSON.parse(cachedActivities));
          if (cachedDestinations) {
            const parsedDestinations = JSON.parse(cachedDestinations);
            setDestinations(parsedDestinations);
            console.log('Önbellek destinasyonlar yüklendi:', parsedDestinations.length, 'adet');
          }
          if (cachedReferralSources) {
            const parsedReferralSources = JSON.parse(cachedReferralSources);
            setReferralSources(parsedReferralSources);
            console.log('Önbellek referans kaynakları yüklendi:', parsedReferralSources.length, 'adet');
          }
          
          toast({
            title: "Uyarı",
            description: "Veriler önbellekten yüklendi. Güncel olmayabilir.",
            variant: "default",
          });
        } catch (cacheError) {
          console.error("Önbellekten veri yükleme hatası:", cacheError);
          toast({
            title: "Hata",
            description: "Veriler yüklenemedi. Lütfen sayfayı yenileyin.",
            variant: "destructive",
          });
        }
        
        setIsLoading(false); // Hata durumunda da yükleme durumunu güncelle
      }
    };

    loadData();
  }, [toast])

  // Store form data when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      if (onStoreFormData && localStorage.getItem("returnToTourSales") === "true") {
        onStoreFormData(formData)
      }
    }
  }, [formData, onStoreFormData])

  const steps = [
    { id: "customer", label: "Müşteri Bilgileri" },
    { id: "tour", label: "Tur Detayları" },
    { id: "expenses", label: "Tur Giderleri" },
    { id: "activities", label: "Tur Aktiviteleri" },
    { id: "payment", label: "Ödeme Bilgileri" },
    { id: "summary", label: "Özet" },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Kişi başı fiyat değiştiğinde toplam fiyatı güncelle
    if (name === "pricePerPerson") {
      const totalPrice = Number.parseFloat(value) * Number.parseInt(formData.numberOfPeople)
      setFormData((prev) => ({ ...prev, totalPrice: totalPrice.toString() }))
    }

    // Kişi sayısı değiştiğinde toplam fiyatı güncelle
    if (name === "numberOfPeople" && formData.pricePerPerson) {
      const totalPrice = Number.parseFloat(formData.pricePerPerson) * Number.parseInt(value)
      setFormData((prev) => ({ ...prev, totalPrice: totalPrice.toString() }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Ek müşteri ekleme
  const addAdditionalCustomer = () => {
    const newCustomer = {
      id: generateUUID(),
      name: "",
      phone: "",
      idNumber: "",
      destinationName: formData.destinationId ? destinations.find(d => d.id === formData.destinationId)?.name : "",
    }

    setFormData((prev) => ({
      ...prev,
      additionalCustomers: [...prev.additionalCustomers, newCustomer],
    }))
  }

  // Ek müşteri silme
  const removeAdditionalCustomer = (id) => {
    setFormData((prev) => ({
      ...prev,
      additionalCustomers: prev.additionalCustomers.filter((customer) => customer.id !== id),
    }))
  }

  // Ek müşteri güncelleme
  const updateAdditionalCustomer = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      additionalCustomers: prev.additionalCustomers.map((customer) => {
        if (customer.id === id) {
          const updatedCustomer = { ...customer, [field]: value };
          // Eğer destinasyon değiştiyse, destinasyon adını da güncelle
          if (field === 'destinationId') {
            const destination = destinations.find(d => d.id === value);
            updatedCustomer.destinationName = destination ? destination.name : '';
          }
          return updatedCustomer;
        }
        return customer;
      }),
    }))
  }

  // Gider ekleme
  const addExpense = () => {
    const newExpense = {
      id: generateUUID(),
      type: "", // Gider türü
      name: "", // Açıklama
      amount: "",
      currency: "TRY",
      details: "",
      isIncludedInPrice: false, // Tur fiyatına dahil mi?
      // Dinamik alanlar
      rehberInfo: "",
      transferType: "",
      transferPerson: "",
      acentaName: ""
    }

    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }))
  }

  // Gider silme
  const removeExpense = (id) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((expense) => expense.id !== id),
    }))
  }

  // Gider güncelleme
  const updateExpense = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((expense) => {
        if (expense.id === id) {
          const updatedExpense = { ...expense, [field]: value }
          
          // Gider türü değiştiğinde ilgili alanları sıfırla
          if (field === "type") {
            updatedExpense.rehberInfo = ""
            updatedExpense.transferType = ""
            updatedExpense.transferPerson = ""
            updatedExpense.acentaName = ""
          }
          
          return updatedExpense
        }
        return expense
      }),
    }))
  }

  // Aktivite ekleme
  const addTourActivity = () => {
    const newActivity = {
      id: generateUUID(),
      activityId: "",
      date: "",
      duration: "",
      price: "",
      currency: formData.currency || "TRY",
      providerId: "",
      details: "",
      participants: Number(formData.numberOfPeople) || 0, // Varsayılan olarak toplam kişi sayısını kullan
      participantsType: "all", // all: tüm katılımcılar, custom: özel sayı
    }

    setFormData((prev) => ({
      ...prev,
      activities: [...prev.activities, newActivity],
    }))
  }

  // Aktivite silme
  const removeTourActivity = (id) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((activity) => activity.id !== id),
    }))
  }

  // Aktivite güncelleme
  const updateTourActivity = (id, field, value) => {
    setFormData((prev) => {
      const updatedActivities = prev.activities.map((activity) => {
        if (activity.id === id) {
          const updatedActivity = { ...activity, [field]: value }

          // Eğer aktivite seçildiyse, varsayılan değerleri doldur
          if (field === "activityId" && value) {
            const selectedActivity = activities.find((a) => a.id === value)
            if (selectedActivity) {
              updatedActivity.duration = updatedActivity.duration || selectedActivity.defaultDuration
              updatedActivity.price = updatedActivity.price || selectedActivity.defaultPrice
              updatedActivity.currency = updatedActivity.currency || selectedActivity.defaultCurrency
              updatedActivity.name = selectedActivity.name
            }
          }

          return updatedActivity
        }
        return activity
      })

      // Eğer fiyat, aktivite ID'si veya katılımcı sayısı değiştiyse toplam fiyatı güncelle
      if (field === "price" || field === "activityId" || field === "participants" || field === "participantsType") {
        // Toplam aktivite fiyatını hesapla
        let totalActivityPrice = 0

        updatedActivities.forEach((activity) => {
          if (activity.price) {
            const activityPrice = Number.parseFloat(activity.price)
            // Aktivite için belirtilen katılımcı sayısını kullan
            const activityParticipants = activity.participantsType === "all" ? 
              Number.parseInt(prev.numberOfPeople) : 
              Number.parseInt(activity.participants.toString())
            
            console.log(`Aktivite: ${activity.name}, Fiyat: ${activityPrice}, Katılımcı: ${activityParticipants}`);
            totalActivityPrice += activityPrice * activityParticipants
          }
        })

        // Tur fiyatı + aktivite fiyatları
        const baseTourPrice = Number.parseFloat(prev.pricePerPerson) * Number.parseInt(prev.numberOfPeople)
        const newTotalPrice = baseTourPrice + totalActivityPrice

        return {
          ...prev,
          activities: updatedActivities,
          totalPrice: newTotalPrice.toString(),
        }
      }

      return {
        ...prev,
        activities: updatedActivities,
      }
    })
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Destinasyon ve aktivite verilerinin tutarlılığını kontrol et
      if (currentStep === 0 || currentStep === 2) {
        // Eğer ikinci adıma (tur detayları) veya dördüncü adıma (aktiviteler) geçiyorsak
        // verilerin yüklü olduğundan emin ol
        ensureDataLoaded();
      }
      setCurrentStep(currentStep + 1);
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      // Destinasyon ve aktivite verilerinin tutarlılığını kontrol et
      if (currentStep === 2 || currentStep === 4) {
        // Eğer ikinci adımdan (tur detayları) veya dördüncü adımdan (aktiviteler) geri dönüyorsak
        // verilerin yüklü olduğundan emin ol
        ensureDataLoaded();
      }
      setCurrentStep(currentStep - 1);
    }
  }
  
  // Verilerin yüklü olduğundan emin ol
  const ensureDataLoaded = () => {
    console.log('Veri tutarlılığı kontrol ediliyor...');
    let dataLoadingStarted = false;
    
    // Yükleme durumunu kontrol et ve başlat
    const startLoading = () => {
      if (!dataLoadingStarted) {
        dataLoadingStarted = true;
        setIsLoading(true);
        toast({
          title: "Veriler Yükleniyor",
          description: "Destinasyonlar ve diğer veriler yükleniyor, lütfen bekleyin...",
          variant: "default",
        });
      }
    };
    
    // Yükleme tamamlandığında kontrol et
    const checkLoadingComplete = () => {
      // Veriler yüklendiyse yükleme durumunu güncelle
      if (destinations.length > 0 && activities.length > 0 && providers.length > 0 && referralSources.length > 0) {
        setIsLoading(false);
        toast({
          title: "Veriler Hazır",
          description: "Tüm veriler başarıyla yüklendi.",
          variant: "default",
        });
        return true;
      }
      return false;
    };
    
    // Verileri doğrudan API'den yükle (localStorage'a güvenme)
    const forceLoadData = async () => {
      startLoading();
      
      // Destinasyonları yükle
      try {
        console.log('Destinasyonlar yükleniyor...');
        const destData = await getDestinations();
        if (destData && destData.length > 0) {
          setDestinations(destData);
          localStorage.setItem('destinations', JSON.stringify(destData));
          console.log('Destinasyonlar yüklendi:', destData.length, 'adet');
        } else {
          console.error('Destinasyon verisi boş veya geçersiz');
        }
      } catch (err) {
        console.error('Destinasyon yükleme hatası:', err);
      }
      
      // Aktiviteleri yükle
      try {
        console.log('Aktiviteler yükleniyor...');
        const actData = await getActivities();
        if (actData && actData.length > 0) {
          setActivities(actData);
          localStorage.setItem('activities', JSON.stringify(actData));
          console.log('Aktiviteler yüklendi:', actData.length, 'adet');
        } else {
          console.error('Aktivite verisi boş veya geçersiz');
        }
      } catch (err) {
        console.error('Aktivite yükleme hatası:', err);
      }
      
      // Sağlayıcıları yükle
      try {
        console.log('Sağlayıcılar yükleniyor...');
        const provData = await getProviders();
        if (provData && provData.length > 0) {
          setProviders(provData);
          localStorage.setItem('providers', JSON.stringify(provData));
          console.log('Sağlayıcılar yüklendi:', provData.length, 'adet');
        } else {
          console.error('Sağlayıcı verisi boş veya geçersiz');
        }
      } catch (err) {
        console.error('Sağlayıcı yükleme hatası:', err);
      }
      
      // Referans kaynaklarını yükle
      try {
        console.log('Referans kaynakları yükleniyor...');
        const refData = await getReferralSources();
        if (refData && refData.length > 0) {
          setReferralSources(refData);
          localStorage.setItem('referralSources', JSON.stringify(refData));
          console.log('Referans kaynakları yüklendi:', refData.length, 'adet');
        } else {
          console.error('Referans kaynakları verisi boş veya geçersiz');
        }
      } catch (err) {
        console.error('Referans kaynakları yükleme hatası:', err);
      }
      
      // Yükleme tamamlandı
      checkLoadingComplete();
    };
    
    // Destinasyonların yüklü olup olmadığını kontrol et
    if (destinations.length === 0) {
      startLoading();
      
      console.log('Destinasyonlar eksik, önbellekten yükleniyor...');
      try {
        const cachedDestinations = localStorage.getItem('destinations');
        if (cachedDestinations) {
          const parsedDestinations = JSON.parse(cachedDestinations);
          if (parsedDestinations && parsedDestinations.length > 0) {
            setDestinations(parsedDestinations);
            console.log('Önbellek destinasyonlar yüklendi:', parsedDestinations.length, 'adet');
          } else {
            // Önbellekte geçersiz veri varsa, doğrudan yükle
            forceLoadData();
            return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
          }
        } else {
          // Önbellekte yoksa, doğrudan yükle
          forceLoadData();
          return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
        }
      } catch (error) {
        console.error('Destinasyon önbellek yükleme hatası:', error);
        // Hata durumunda doğrudan yükle
        forceLoadData();
        return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
      }
    }
    
    // Aktivitelerin yüklü olup olmadığını kontrol et
    if (activities.length === 0) {
      startLoading();
      
      console.log('Aktiviteler eksik, önbellekten yükleniyor...');
      try {
        const cachedActivities = localStorage.getItem('activities');
        if (cachedActivities) {
          const parsedActivities = JSON.parse(cachedActivities);
          if (parsedActivities && parsedActivities.length > 0) {
            setActivities(parsedActivities);
            console.log('Önbellek aktiviteler yüklendi:', parsedActivities.length, 'adet');
          } else {
            // Önbellekte geçersiz veri varsa, doğrudan yükle
            forceLoadData();
            return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
          }
        } else {
          // Önbellekte yoksa, doğrudan yükle
          forceLoadData();
          return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
        }
      } catch (error) {
        console.error('Aktivite önbellek yükleme hatası:', error);
        // Hata durumunda doğrudan yükle
        forceLoadData();
        return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
      }
    }
    
    // Sağlayıcıların yüklü olup olmadığını kontrol et
    if (providers.length === 0) {
      startLoading();
      
      console.log('Sağlayıcılar eksik, önbellekten yükleniyor...');
      try {
        const cachedProviders = localStorage.getItem('providers');
        if (cachedProviders) {
          const parsedProviders = JSON.parse(cachedProviders);
          if (parsedProviders && parsedProviders.length > 0) {
            setProviders(parsedProviders);
            console.log('Önbellek sağlayıcılar yüklendi:', parsedProviders.length, 'adet');
          } else {
            // Önbellekte geçersiz veri varsa, doğrudan yükle
            forceLoadData();
            return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
          }
        } else {
          // Önbellekte yoksa, doğrudan yükle
          forceLoadData();
          return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
        }
      } catch (error) {
        console.error('Sağlayıcı önbellek yükleme hatası:', error);
        // Hata durumunda doğrudan yükle
        forceLoadData();
        return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
      }
    }
    
    // Referans kaynaklarının yüklü olup olmadığını kontrol et
    if (referralSources.length === 0) {
      startLoading();
      
      console.log('Referans kaynakları eksik, önbellekten yükleniyor...');
      try {
        const cachedReferralSources = localStorage.getItem('referralSources');
        if (cachedReferralSources) {
          const parsedReferralSources = JSON.parse(cachedReferralSources);
          if (parsedReferralSources && parsedReferralSources.length > 0) {
            setReferralSources(parsedReferralSources);
            console.log('Önbellek referans kaynakları yüklendi:', parsedReferralSources.length, 'adet');
          } else {
            // Önbellekte geçersiz veri varsa, doğrudan yükle
            forceLoadData();
            return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
          }
        } else {
          // Önbellekte yoksa, doğrudan yükle
          forceLoadData();
          return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
        }
      } catch (error) {
        console.error('Referans kaynakları önbellek yükleme hatası:', error);
        // Hata durumunda doğrudan yükle
        forceLoadData();
        return; // Doğrudan yükleme başladı, diğer kontrolleri atlayabilirsin
      }
    }
    
    // Tüm veriler önbellekten yüklendiyse, yükleme durumunu güncelle
    if (dataLoadingStarted) {
      checkLoadingComplete();
    }
  }

  // Analiz verilerini güncelleme fonksiyonu
  const updateAnalysisData = (tourAnalysis) => {
    try {
      // Mevcut analiz verilerini al
      const savedAnalysisData = localStorage.getItem('analysisData') || '{"tours": [], "finances": []}';
      const analysisData = JSON.parse(savedAnalysisData);
      
      // Tur analizini ekle
      if (!analysisData.tours) {
        analysisData.tours = [];
      }
      
      // Aynı ID'ye sahip tur varsa güncelle, yoksa ekle
      const existingIndex = analysisData.tours.findIndex(tour => tour.tourId === tourAnalysis.tourId);
      if (existingIndex >= 0) {
        analysisData.tours[existingIndex] = tourAnalysis;
      } else {
        analysisData.tours.push(tourAnalysis);
      }
      
      // Analiz verilerini kaydet
      localStorage.setItem('analysisData', JSON.stringify(analysisData));
      console.log("Analiz verileri güncellendi");
    } catch (error) {
      console.error("Analiz verileri güncellenirken hata:", error);
    }
  };
  
  const handleSubmit = (e) => {
    if (e) e.preventDefault()

    // Form verilerini hazırla
    const submissionData = {
      ...formData,
      numberOfPeople: Number.parseInt(formData.numberOfPeople),
      numberOfChildren: Number.parseInt(formData.numberOfChildren),
      pricePerPerson: Number.parseFloat(formData.pricePerPerson),
      totalPrice: Number.parseFloat(formData.totalPrice),
      partialPaymentAmount: formData.partialPaymentAmount ? Number.parseFloat(formData.partialPaymentAmount) : 0,
      updatedAt: new Date().toISOString(),
    }
    
    // Tur analizi için gerekli verileri hazırla
    const tourAnalysis = {
      // Genel tur bilgileri
      tourId: submissionData.id,
      tourName: submissionData.tourName,
      destinationId: submissionData.destinationId,
      destinationName: getDestinationName(submissionData.destinationId),
      tourDate: submissionData.tourDate,
      tourEndDate: submissionData.tourEndDate,
      
      // Ana müşteri bilgileri
      mainCustomer: {
        name: submissionData.customerName,
        phone: submissionData.customerPhone,
        email: submissionData.customerEmail,
        idNumber: submissionData.customerIdNumber,
        isMainContact: true
      },
      
      // Yolcu bilgileri
      passengers: [
        // Ana müşteriyi de yolcu olarak ekle
        {
          name: submissionData.customerName,
          phone: submissionData.customerPhone,
          email: submissionData.customerEmail,
          idNumber: submissionData.customerIdNumber,
          isMainContact: true
        },
        // Ek yolcuları ekle
        ...submissionData.additionalCustomers.map(customer => ({
          name: customer.name,
          phone: customer.phone,
          idNumber: customer.idNumber,
          isMainContact: false
        }))
      ],
      
      // Katılımcı bilgileri
      totalParticipants: submissionData.numberOfPeople,
      childParticipants: submissionData.numberOfChildren,
      adultParticipants: submissionData.numberOfPeople - submissionData.numberOfChildren,
      
      // Finansal bilgiler
      pricePerPerson: submissionData.pricePerPerson,
      totalPrice: submissionData.totalPrice,
      paymentStatus: submissionData.paymentStatus,
      paymentMethod: submissionData.paymentMethod,
      partialPaymentAmount: submissionData.partialPaymentAmount,
      partialPaymentCurrency: submissionData.partialPaymentCurrency,
      currency: submissionData.currency,
      // Kur bilgisi için açık etiketler
      currencyLabel: submissionData.currency === "TRY" ? "Türk Lirası" : 
                    submissionData.currency === "USD" ? "Amerikan Doları" : 
                    submissionData.currency === "EUR" ? "Euro" : 
                    submissionData.currency === "GBP" ? "İngiliz Sterlini" : submissionData.currency,
      currencySymbol: submissionData.currency === "TRY" ? "₺" : 
                     submissionData.currency === "USD" ? "$" : 
                     submissionData.currency === "EUR" ? "€" : 
                     submissionData.currency === "GBP" ? "£" : submissionData.currency,
      
      // Aktivite bilgileri
      activities: submissionData.activities.map(activity => ({
        activityId: activity.activityId,
        activityName: getActivityName(activity.activityId),
        participants: activity.participantsType === "all" ? submissionData.numberOfPeople : activity.participants,
        participantsType: activity.participantsType,
        price: activity.price,
        currency: activity.currency,
        totalActivityPrice: Number(activity.price) * (activity.participantsType === "all" ? submissionData.numberOfPeople : activity.participants)
      })),
      
      // Gider bilgileri
      expenses: submissionData.expenses.map(expense => ({
        expenseType: expense.type,
        expenseName: expense.name,
        amount: expense.amount,
        currency: expense.currency,
        isIncludedInPrice: expense.isIncludedInPrice
      })),
      
      // Analiz tarihi
      analysisDate: new Date().toISOString(),
    }
    
    // Analiz verilerini submissionData'ya ekle
    submissionData.analysis = tourAnalysis;
    console.log("Tur analizi oluşturuldu:", tourAnalysis);
    
    // Tur verilerini localStorage'a kaydet (yazdırma ve analiz için)
    try {
      // Ana müşteri bilgisini doğru şekilde ayarla
      const tourDataWithCustomer = {
        ...submissionData,
        // Ana müşteri bilgisini açıkça belirt
        mainCustomer: {
          name: submissionData.customerName,
          phone: submissionData.customerPhone,
          email: submissionData.customerEmail,
          idNumber: submissionData.customerIdNumber,
          isMainContact: true
        },
        // Yolcu bilgilerini açıkça belirt
        passengers: [
          // Ana müşteriyi de yolcu olarak ekle
          {
            name: submissionData.customerName,
            phone: submissionData.customerPhone,
            email: submissionData.customerEmail,
            idNumber: submissionData.customerIdNumber,
            isMainContact: true
          },
          // Ek yolcuları ekle
          ...submissionData.additionalCustomers.map(customer => ({
            name: customer.name,
            phone: customer.phone,
            idNumber: customer.idNumber,
            isMainContact: false
          }))
        ]
      };
      
      // Her durumda tur verilerini kaydet (analiz için)
      console.log("Tur analizi için veri kaydediliyor...");
      localStorage.setItem('tourAnalysisData', JSON.stringify(tourAnalysis));
      console.log("Tur analizi verileri localStorage'a kaydedildi");
      
      // Yazdırma için tur verilerini kaydet - müşteri bilgisi içeren versiyonu kullan
      console.log("Tur yazdırma için veri kaydediliyor...");
      localStorage.setItem('printTourData', JSON.stringify(tourDataWithCustomer));
      console.log("Yazdırma verileri localStorage'a kaydedildi");
      
      // Tur raporları için veri kaydet
      const savedTourReports = localStorage.getItem('tourReports') || '[]';
      const tourReports = JSON.parse(savedTourReports);
      tourReports.push({
        id: submissionData.id,
        tourName: submissionData.tourName,
        customerName: submissionData.customerName,
        mainCustomer: {
          name: submissionData.customerName,
          phone: submissionData.customerPhone,
          email: submissionData.customerEmail,
          idNumber: submissionData.customerIdNumber
        },
        destinationName: getDestinationName(submissionData.destinationId),
        tourDate: submissionData.tourDate,
        totalPrice: submissionData.totalPrice,
        currency: submissionData.currency,
        paymentStatus: submissionData.paymentStatus,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('tourReports', JSON.stringify(tourReports));
      console.log("Tur rapor verileri güncellendi");
      
      // Analiz verilerini güncelle
      updateAnalysisData(tourAnalysis);
    } catch (error) {
      console.error("Tur verileri kaydedilirken hata:", error);
    }

    onSave(submissionData)
  }

  // Navigate to settings and store current form data
  const handleNavigateToSettings = () => {
    // Store the current form data before navigating
    if (onStoreFormData) {
      onStoreFormData(formData)
    }

    // Set flag to return to tour sales
    localStorage.setItem("returnToTourSales", "true")

    // Navigate to settings
    onNavigateToSettings()
  }

  // Para birimi seçenekleri
  const currencyOptions = [
    { value: "TRY", label: "Türk Lirası (₺)" },
    { value: "USD", label: "Amerikan Doları ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "İngiliz Sterlini (£)" },
  ]

  // Toplam giderleri hesapla
  const calculateTotalExpenses = () => {
    return formData.expenses.reduce((total, expense) => {
      // Tüm giderleri TRY'ye çevirerek topla (basit bir yaklaşım)
      let amount = Number.parseFloat(expense.amount) || 0

      // Döviz çevirme işlemi burada yapılabilir
      // Şimdilik basit bir yaklaşım kullanıyoruz
      if (expense.currency === "USD") amount *= 32
      if (expense.currency === "EUR") amount *= 35
      if (expense.currency === "GBP") amount *= 40

      return total + amount
    }, 0)
  }

  // Sağlayıcı adını bul
  const getProviderName = (providerId) => {
    if (!providerId || !providers || providers.length === 0) return "Seçilmedi"
    const provider = providers.find((p) => p.id === providerId)
    return provider ? provider.name : "Seçilmedi"
  }

  // Gider türü adını bul
  const getExpenseTypeName = (typeId) => {
    if (!typeId) return "Seçilmedi"
    const expenseType = expenseTypes.find((t) => t.id === typeId)
    return expenseType ? expenseType.name : typeId
  }

  // Gider kategorisi adını bul
  const getExpenseCategoryName = (categoryId) => {
    if (!categoryId) return "Seçilmedi"
    const category = expenseCategories.find((c) => c.value === categoryId)
    return category ? category.label : categoryId
  }

  // Aktivite adını bul
  const getActivityName = (activityId) => {
    if (!activityId || !activities || activities.length === 0) return "Seçilmedi"
    const activity = activities.find((a) => a.id === activityId)
    return activity ? activity.name : "Seçilmedi"
  }

  // Destinasyon adını bul
  const getDestinationName = (destinationId) => {
    if (!destinationId || !destinations || destinations.length === 0) return "Seçilmedi"
    const destination = destinations.find((d) => d.id === destinationId)
    return destination ? destination.name : "Seçilmedi"
  }

  // Belirli bir kategoriye ait gider türlerini filtrele
  const getExpenseTypesByCategory = (category) => {
    if (!category) return []
    // Kategoriye göre filtreleme yap, boş dizi durumunda crash olmaması için kontrol ekle
    const filteredTypes = expenseTypes.filter((type) => 
      type && type.category === category
    )
    // Eğer filtrelenen türler boşsa, kullanıcıya yardımcı mesaj göster
    if (filteredTypes.length === 0) {
      toast({
        title: "Bilgi",
        description: `"${expenseCategories.find(c => c.value === category)?.label || category}" kategorisinde gider türü bulunamadı. Ayarlar bölümünden ekleyebilirsiniz.`,
        variant: "default",
      })
    }
    return filteredTypes
  }

  // Belirli bir kategoriye ait sağlayıcıları filtrele
  const getProvidersByCategory = (category) => {
    if (!category) return providers
    // Kategoriye göre filtreleme yap, eğer sağlayıcının kategorisi yoksa veya kategorisi eşleşiyorsa göster
    return providers.filter((provider) => 
      provider && (provider.category === category || !provider.category)
    )
  }

  // Tur özeti
  const TourSummary = () => (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Müşteri Bilgileri</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-sm text-muted-foreground">Ad Soyad:</span>
            <p>{formData.customerName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Telefon:</span>
            <p>{formData.customerPhone}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">E-posta:</span>
            <p>{formData.customerEmail}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
            <p>{formData.customerIdNumber}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Vatandaşlık / Ülke:</span>
            <p>{formData.customerNationality || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Referans Kaynağı:</span>
            <p>
              {(() => {
                // Önce referralSources içinde ara
                if (referralSources && referralSources.length > 0) {
                  const source = referralSources.find(s => s.id === formData.referralSource);
                  if (source) return source.name;
                }
                
                // Bulunamazsa varsayılan değerlere bak
                switch(formData.referralSource) {
                  case "website": return "İnternet Sitemiz";
                  case "hotel": return "Otel Yönlendirmesi";
                  case "local_guide": return "Hanutçu / Yerel Rehber";
                  case "walk_in": return "Kapı Önü Müşterisi";
                  case "repeat": return "Tekrar Gelen Müşteri";
                  case "recommendation": return "Tavsiye";
                  case "social_media": return "Sosyal Medya";
                  case "other": return "Diğer";
                  default: return formData.referralSource || "-";
                }
              })()}
            </p>
          </div>
        </div>

        {formData.additionalCustomers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Ek Katılımcılar</h4>
            {formData.additionalCustomers.map((customer, index) => (
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
            <p>{formData.serialNumber}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tur Kaydını Oluşturan Kişi:</span>
            <p>{formData.tourName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Destinasyon:</span>
            <p>{getDestinationName(formData.destinationId)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
            <p>{new Date(formData.tourDate).toLocaleDateString("tr-TR")}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Bitiş Tarihi:</span>
            <p>{formData.tourEndDate ? new Date(formData.tourEndDate).toLocaleDateString("tr-TR") : "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Yetişkin Sayısı:</span>
            <p>{formData.numberOfPeople}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Çocuk Sayısı:</span>
            <p>{formData.numberOfChildren}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Kişi Başı Fiyat:</span>
            <p>
              {Number.parseFloat(formData.pricePerPerson).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Toplam Fiyat:</span>
            <p className="font-bold">
              {Number.parseFloat(formData.totalPrice).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
        </div>
      </div>

      {formData.expenses.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Tur Giderleri (Muhasebe)</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Kategori</th>
                <th className="text-left py-2">Tür</th>
                <th className="text-left py-2">Açıklama</th>
                <th className="text-left py-2">Sağlayıcı</th>
                <th className="text-right py-2">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {formData.expenses.map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="py-2">{expense.type === "konaklama" ? "Konaklama" : 
                               expense.type === "ulasim" ? "Ulaşım" :
                               expense.type === "rehber" ? "Rehber" :
                               expense.type === "acenta" ? "Acenta/Hanutçu" :
                               expense.type === "aktivite" ? "Aktivite" :
                               expense.type === "yemek" ? "Yemek" :
                               expense.type === "genel" ? "Genel" : "Diğer"}</td>
                  <td className="py-2">{expense.name}</td>
                  <td className="py-2">{expense.details}</td>
                  <td className="py-2">{getProviderName(expense.providerId)}</td>
                  <td className="py-2 text-right">
                    {Number.parseFloat(expense.amount).toLocaleString("tr-TR")} {expense.currency}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={4} className="py-2 text-right">
                  Toplam Gider (TRY):
                </td>
                <td className="py-2 text-right">{calculateTotalExpenses().toLocaleString("tr-TR")} TRY</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {formData.activities.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Tur Aktiviteleri</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Adı</th>
                <th className="text-left py-2">Tarih</th>
                <th className="text-left py-2">Süre</th>
                <th className="text-left py-2">Sağlayıcı</th>
                <th className="text-right py-2">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {formData.activities.map((activity) => (
                <tr key={activity.id} className="border-b">
                  <td className="py-2">{getActivityName(activity.activityId)}</td>
                  <td className="py-2">{activity.date}</td>
                  <td className="py-2">{activity.duration}</td>
                  <td className="py-2">{getProviderName(activity.providerId)}</td>
                  <td className="py-2 text-right">
                    {Number.parseFloat(activity.price).toLocaleString("tr-TR")} {activity.currency}
                  </td>
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
              {formData.paymentStatus === "pending"
                ? "Beklemede"
                : formData.paymentStatus === "partial"
                  ? "Kısmi Ödeme"
                  : formData.paymentStatus === "completed"
                    ? "Tamamlandı"
                    : formData.paymentStatus === "refunded"
                      ? "İade Edildi"
                      : "Bilinmiyor"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
            <p>
              {formData.paymentMethod === "cash"
                ? "Nakit"
                : formData.paymentMethod === "creditCard"
                  ? "Kredi Kartı"
                  : formData.paymentMethod === "bankTransfer"
                    ? "Banka Transferi"
                    : formData.paymentMethod === "other"
                      ? "Diğer"
                      : "Bilinmiyor"}
            </p>
          </div>

          {formData.paymentStatus === "partial" && (
            <>
              <div>
                <span className="text-sm text-muted-foreground">Yapılan Ödeme:</span>
                <p>
                  {Number.parseFloat(formData.partialPaymentAmount).toLocaleString("tr-TR")}{" "}
                  {formData.partialPaymentCurrency}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Kalan Ödeme:</span>
                <p className="font-bold">
                  {(
                    Number.parseFloat(formData.totalPrice) - Number.parseFloat(formData.partialPaymentAmount)
                  ).toLocaleString("tr-TR")}{" "}
                  {formData.currency}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {formData.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Notlar</h3>
          <p className="whitespace-pre-line">{formData.notes}</p>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>

        <div className="space-x-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>

          <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsConfirmDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-screen-xl mx-auto">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-700">
            {initialData ? "Tur Kaydını Düzenle" : "Yeni Tur Kaydı"}
          </CardTitle>

        <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              İptal
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              <Save className="mr-2 h-4 w-4" />
              Kaydet
          </Button>
        </div>
        </div>

        <div ref={stepsRef} className="mt-6 relative">
          <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {steps.map((step, index) => (
                <li key={step.id} className="md:flex-1">
                  <div
                    className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                      currentStep === index
                        ? "border-teal-600 md:border-teal-600"
                        : currentStep > index
                        ? "border-teal-300 md:border-teal-300"
                        : "border-gray-200 md:border-gray-200"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        currentStep === index
                          ? "text-teal-600"
                          : currentStep > index
                          ? "text-teal-500"
                          : "text-gray-500"
                      }`}
                    >
                      Adım {index + 1}
                    </span>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
            </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Adım 1: Müşteri Bilgileri */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı Soyadı</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="Telefon numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">E-posta</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Adres</Label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="Adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerIdNumber">T.C. Kimlik / Pasaport No</Label>
                <Input
                  id="customerIdNumber"
                  name="customerIdNumber"
                  value={formData.customerIdNumber}
                  onChange={handleChange}
                  placeholder="Kimlik numarası"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Vatandaşlık / Ülke</Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) => handleSelectChange("nationality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {/* Ülke listesini countries.ts dosyasından al */}
                      {(() => {
                        try {
                          // Dinamik olarak ülke listesini import et
                          const countriesList = require("@/lib/countries").countries;
                          return countriesList.map((country, index) => (
                            <SelectItem key={country.code + '-' + index} value={country.name}>{country.name}</SelectItem>
                          ));
                        } catch (error) {
                          console.error("Ülke listesi yüklenemedi:", error);
                          // Hata durumunda en yaygın ülkeleri göster
                          return [
                            <SelectItem key="TR" value="Türkiye">Türkiye</SelectItem>,
                            <SelectItem key="DE" value="Almanya">Almanya</SelectItem>,
                            <SelectItem key="GB" value="Birleşik Krallık">Birleşik Krallık</SelectItem>,
                            <SelectItem key="US" value="Amerika Birleşik Devletleri">Amerika Birleşik Devletleri</SelectItem>,
                            <SelectItem key="RU" value="Rusya">Rusya</SelectItem>,
                            <SelectItem key="FR" value="Fransa">Fransa</SelectItem>,
                            <SelectItem key="NL" value="Hollanda">Hollanda</SelectItem>,
                            <SelectItem key="UA" value="Ukrayna">Ukrayna</SelectItem>,
                            <SelectItem key="IT" value="İtalya">İtalya</SelectItem>,
                            <SelectItem key="other" value="Diğer">Diğer</SelectItem>
                          ];
                        }
                      })()} 
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralSource">Müşteriyi Nereden Bulduk?</Label>
                  <Select
                    value={formData.referralSource}
                    onValueChange={(value) => handleSelectChange("referralSource", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Referans kaynağı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {referralSources && referralSources.length > 0 ? (
                        // Veritabanından yüklenen referans kaynaklarını kullan
                        referralSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                        ))
                      ) : (
                        // Varsayılan referans kaynaklarını göster (yükleme başarısız olduğunda)
                        <>
                          <SelectItem value="website">İnternet Sitemiz</SelectItem>
                          <SelectItem value="hotel">Otel Yönlendirmesi</SelectItem>
                          <SelectItem value="local_guide">Hanutçu / Yerel Rehber</SelectItem>
                          <SelectItem value="walk_in">Kapı Önü Müşterisi</SelectItem>
                          <SelectItem value="repeat">Tekrar Gelen Müşteri</SelectItem>
                          <SelectItem value="recommendation">Tavsiye</SelectItem>
                          <SelectItem value="social_media">Sosyal Medya</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ek Katılımcılar */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Ek Katılımcılar</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAdditionalCustomer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Katılımcı Ekle
                  </Button>
                </div>

                {formData.additionalCustomers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    Henüz ek katılımcı eklenmemiş
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.additionalCustomers.map((customer, index) => (
                      <Card key={customer.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Katılımcı {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input
                              value={customer.name}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "name", e.target.value)}
                              placeholder="Ad soyad"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input
                              value={customer.phone}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "phone", e.target.value)}
                              placeholder="Telefon numarası"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>T.C. Kimlik / Pasaport No</Label>
                            <Input
                              value={customer.idNumber}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "idNumber", e.target.value)}
                              placeholder="Kimlik numarası"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 2: Tur Detayları */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Seri Numarası</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    placeholder="Tur seri numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourName">Tur Kaydını Oluşturan Kişi</Label>
                  <Input
                    id="tourName"
                    name="tourName"
                    value={formData.tourName}
                    onChange={handleChange}
                    placeholder="Kaydı oluşturan kişinin adını girin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationId">Destinasyon</Label>
                {isLoading ? (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-slate-50">
                    <div className="animate-spin h-4 w-4 border-2 border-teal-500 rounded-full border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Destinasyonlar yükleniyor...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.destinationId}
                    onValueChange={(value) => handleSelectChange("destinationId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Destinasyon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.length > 0 ? (
                        destinations.map((destination) => (
                          <SelectItem key={destination.id} value={destination.id}>
                            {destination.name} ({destination.country})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-destinations">
                          Destinasyon bulunamadı. Lütfen ayarlardan ekleyin.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tourDate">Başlangıç Tarihi</Label>
                  <Input
                    id="tourDate"
                    name="tourDate"
                    type="date"
                    value={formData.tourDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourEndDate">Bitiş Tarihi</Label>
                  <Input
                    id="tourEndDate"
                    name="tourEndDate"
                    type="date"
                    value={formData.tourEndDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">Yetişkin Sayısı</Label>
                  <Input
                    id="numberOfPeople"
                    name="numberOfPeople"
                    type="number"
                    min="1"
                    value={formData.numberOfPeople}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfChildren">Çocuk Sayısı</Label>
                  <Input
                    id="numberOfChildren"
                    name="numberOfChildren"
                    type="number"
                    min="0"
                    value={formData.numberOfChildren}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerPerson">Kişi Başı Fiyat</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pricePerPerson"
                      name="pricePerPerson"
                      type="number"
                      step="0.01"
                      value={formData.pricePerPerson}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select value={formData.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Toplam Fiyat</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ek notlar"
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 3: Tur Giderleri */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#00a1c6]">Tur Giderleri (Muhasebe)</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleNavigateToSettings}>
                  Ayarlara Git
                </Button>
              </div>

              <div className="border rounded-md p-4 bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Giderler Hakkında Bilgi:</strong> Bu bölümde tur için yapılacak ödemeleri (giderleri) kaydedebilirsiniz. 
                  Her bir gider için önce kategori seçin (konaklama, ulaşım vb.), sonra o kategoriye ait gider türlerinden birini seçin.
                </p>
                <p className="text-sm text-muted-foreground">
                  Gider türleri ve sağlayıcılar ayarlar sayfasından eklenebilir. Eğer istediğiniz gider türü listede yoksa, 
                  "Ayarlara Git" düğmesini kullanarak yeni gider türleri ekleyebilirsiniz.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-[#00a1c6] text-[#00a1c6]"
                  onClick={addExpense}
                >
                  <Plus className="mr-2 h-4 w-4" /> Yeni Gider Ekle
                </Button>

                {formData.expenses.length === 0 && (
                  <div className="border border-dashed rounded-md p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CircleSlash className="h-12 w-12 text-muted-foreground opacity-40" />
                      <div className="text-muted-foreground">Henüz gider eklenmemiş</div>
                      <Button variant="outline" onClick={addExpense}>
                        <Plus className="mr-2 h-4 w-4" /> İlk Gideri Ekle
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.expenses.map((expense, index) => (
                    <Card key={expense.id} className="p-4 border-l-4 border-l-[#00a1c6]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#00a1c6]">Gider {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Gider Türü</Label>
                          <Select
                            value={expense.type}
                            onValueChange={(value) => updateExpense(expense.id, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Gider türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="konaklama">Konaklama</SelectItem>
                              <SelectItem value="ulasim">Ulaşım</SelectItem>
                              <SelectItem value="rehber">Rehber</SelectItem>
                              <SelectItem value="acenta">Acenta / Hanutçu</SelectItem>
                              <SelectItem value="aktivite">Aktivite</SelectItem>
                              <SelectItem value="yemek">Yemek</SelectItem>
                              <SelectItem value="genel">Genel</SelectItem>
                              <SelectItem value="diger">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Gider Türüne Göre Dinamik Alanlar */}
                        {expense.type === "rehber" && (
                        <div className="space-y-2">
                            <Label>Rehber Bilgisi</Label>
                            <Input
                              value={expense.rehberInfo}
                              onChange={(e) => updateExpense(expense.id, "rehberInfo", e.target.value)}
                              placeholder="Rehber adı ve iletişim bilgileri"
                            />
                          </div>
                        )}

                        {expense.type === "ulasim" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Ulaşım Tipi</Label>
                          <Select
                                value={expense.transferType}
                                onValueChange={(value) => updateExpense(expense.id, "transferType", value)}
                          >
                            <SelectTrigger>
                                  <SelectValue placeholder="Ulaşım tipi seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                  <SelectItem value="ucak">Uçak</SelectItem>
                                  <SelectItem value="otobus">Otobüs</SelectItem>
                                  <SelectItem value="arac">Özel Araç</SelectItem>
                                  <SelectItem value="transfer">Transfer</SelectItem>
                                  <SelectItem value="diger">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                            {(expense.transferType === "arac" || expense.transferType === "transfer") && (
                              <div className="space-y-2">
                                <Label>Transfer Yapacak Kişi</Label>
                                <Input
                                  value={expense.transferPerson}
                                  onChange={(e) => updateExpense(expense.id, "transferPerson", e.target.value)}
                                  placeholder="Sürücü veya transfer sorumlusu"
                                />
                      </div>
                            )}
                          </div>
                        )}

                        {expense.type === "acenta" && (
                          <div className="space-y-2">
                            <Label>Acenta İsmi</Label>
                            <Input
                              value={expense.acentaName}
                              onChange={(e) => updateExpense(expense.id, "acentaName", e.target.value)}
                              placeholder="Acenta veya hanutçu adı"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Input
                          value={expense.name}
                          onChange={(e) => updateExpense(expense.id, "name", e.target.value)}
                          placeholder="Gider açıklaması"
                        />
                      </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tutar</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                              placeholder="0.00"
                            />
                            <Select
                              value={expense.currency}
                              onValueChange={(value) => updateExpense(expense.id, "currency", value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Para birimi" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                      </div>

                          <div className="space-y-2">
                        <Label>Detaylar</Label>
                        <Input
                          value={expense.details}
                          onChange={(e) => updateExpense(expense.id, "details", e.target.value)}
                          placeholder="Ek bilgiler"
                        />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Checkbox
                            id={`included-${expense.id}`}
                            checked={expense.isIncludedInPrice}
                            onCheckedChange={(checked) =>
                              updateExpense(expense.id, "isIncludedInPrice", checked === true)
                            }
                          />
                          <label
                            htmlFor={`included-${expense.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Tur fiyatına dahil
                          </label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 4: Tur Aktiviteleri */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#00a1c6]">Tur Aktiviteleri</h3>
                <Button type="button" variant="outline" size="sm" onClick={addTourActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aktivite Ekle
                </Button>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                Aktiviteler ekstra ücretli hizmetlerdir ve tur fiyatına eklenir.
              </div>

              {formData.activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  Henüz aktivite eklenmemiş
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.activities.map((activity, index) => (
                    <Card key={activity.id} className="p-4 border-l-4 border-l-[#00a1c6]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#00a1c6]">Aktivite {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTourActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Aktivite</Label>
                          {isLoading ? (
                            <div className="flex items-center space-x-2 p-2 border rounded-md bg-slate-50">
                              <div className="animate-spin h-4 w-4 border-2 border-teal-500 rounded-full border-t-transparent"></div>
                              <span className="text-sm text-muted-foreground">Aktiviteler yükleniyor...</span>
                            </div>
                          ) : (
                            <Select
                              value={activity.activityId || ""}
                              onValueChange={(value) => updateTourActivity(activity.id, "activityId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Aktivite seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {activities && activities.length > 0 ? (
                                  activities.map((act) => (
                                    <SelectItem key={act.id} value={act.id}>
                                      {act.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-activities">
                                    Aktivite bulunamadı. Lütfen ayarlardan ekleyin.
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Tarih</Label>
                          <Input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateTourActivity(activity.id, "date", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Süre</Label>
                          <Input
                            value={activity.duration}
                            onChange={(e) => updateTourActivity(activity.id, "duration", e.target.value)}
                            placeholder="2 saat, Tam gün vb."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fiyat</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={activity.price}
                              onChange={(e) => updateTourActivity(activity.id, "price", e.target.value)}
                              placeholder="0.00"
                            />
                            <Select
                              value={activity.currency}
                              onValueChange={(value) => updateTourActivity(activity.id, "currency", value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Para birimi" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Katılımcı Sayısı</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`all-participants-${activity.id}`}
                                checked={activity.participantsType === "all"}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateTourActivity(activity.id, "participantsType", "all");
                                    updateTourActivity(activity.id, "participants", Number(formData.numberOfPeople) || 0);
                                  } else {
                                    updateTourActivity(activity.id, "participantsType", "custom");
                                  }
                                }}
                              />
                              <label
                                htmlFor={`all-participants-${activity.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Tüm tur katılımcıları ({formData.numberOfPeople} kişi)
                              </label>
                            </div>
                            
                            {activity.participantsType === "custom" && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max={formData.numberOfPeople}
                                  value={activity.participants}
                                  onChange={(e) => updateTourActivity(activity.id, "participants", Number(e.target.value))}
                                  placeholder="Katılımcı sayısı"
                                />
                                <span className="text-sm text-muted-foreground">
                                  / {formData.numberOfPeople} kişi
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Sağlayıcı</Label>
                          <Select
                            value={activity.providerId || ""}
                            onValueChange={(value) => updateTourActivity(activity.id, "providerId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers && providers.length > 0 ? (
                                providers.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-providers">
                                  Sağlayıcı bulunamadı. Lütfen ayarlardan ekleyin.
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Detaylar</Label>
                          <Input
                            value={activity.details}
                            onChange={(e) => updateTourActivity(activity.id, "details", e.target.value)}
                            placeholder="Ek bilgiler"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 5: Ödeme Bilgileri */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => handleSelectChange("paymentStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme durumu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="partial">Kısmi Ödeme</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentStatus === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="partialPaymentAmount">Yapılan Ödeme Tutarı</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partialPaymentAmount"
                      name="partialPaymentAmount"
                      type="number"
                      step="0.01"
                      value={formData.partialPaymentAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select
                      value={formData.partialPaymentCurrency}
                      onValueChange={(value) => handleSelectChange("partialPaymentCurrency", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="creditCard">Kredi Kartı</SelectItem>
                    <SelectItem value="bankTransfer">Banka Transferi</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 6: Özet */}
          {currentStep === 5 && <TourSummary />}
      </form>
      </CardContent>

      {/* Onay Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tur Satışını Kaydet</AlertDialogTitle>
            <AlertDialogDescription>Tur satış bilgilerini kaydetmek istediğinize emin misiniz?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
