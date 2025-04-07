// IndexedDB veritabanı işlemleri için yardımcı fonksiyonlar
const DB_NAME = "passionistravelDB"
const DB_VERSION = 1

// Veritabanı şeması
const STORES = {
  tours: { keyPath: "id", indexes: ["customerName", "tourDate"] },
  financials: { keyPath: "id", indexes: ["date", "type"] },
  customers: { keyPath: "id", indexes: ["name", "phone"] },
  settings: { keyPath: "id" },
  expenses: { keyPath: "id", indexes: ["type", "name"] },
  providers: { keyPath: "id", indexes: ["name"] },
  activities: { keyPath: "id", indexes: ["name"] },
  destinations: { keyPath: "id", indexes: ["name", "country"] },
  ai_conversations: { keyPath: "id", indexes: ["timestamp"] },
  customer_notes: { keyPath: "id", indexes: ["customerId", "timestamp"] },
}

// Veritabanını başlat
export const initializeDB = async (): Promise<void> => {
  try {
    const db = await openDB()
    console.log("Veritabanı başarıyla başlatıldı:", db.name, "v", db.version)
    db.close()
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error)
    throw error
  }
}

// Veritabanı bağlantısını aç
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      reject("Veritabanı açılırken hata oluştu: " + request.error)
    }

    request.onsuccess = (event) => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Veri depolarını oluştur
      Object.entries(STORES).forEach(([storeName, storeConfig]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath })

          // İndeksleri oluştur
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach((indexName) => {
              store.createIndex(indexName, indexName, { unique: false })
            })
          }
        }
      })
    }
  })
}

// Veri ekle
export const addData = async (storeName: string, data: any): Promise<any> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.add(data)

    request.onsuccess = () => {
      resolve(data)
    }

    request.onerror = () => {
      reject("Veri eklenirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veri güncelle
export const updateData = async (storeName: string, data: any): Promise<any> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => {
      resolve(data)
    }

    request.onerror = () => {
      reject("Veri güncellenirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veri sil
export const deleteData = async (storeName: string, id: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject("Veri silinirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Tüm verileri getir
export const getAllData = async (storeName: string): Promise<any[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject("Veriler alınırken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// ID ile veri getir
export const getDataById = async (storeName: string, id: string): Promise<any> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject("Veri alınırken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Veritabanını temizle
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject("Veri deposu temizlenirken hata oluştu: " + request.error)
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

// Ayarları kaydet
export const saveSettings = async (settings: any): Promise<any> => {
  settings.id = "app-settings" // Sabit bir ID kullan
  return updateData("settings", settings)
}

// Ayarları getir
export const getSettings = async (): Promise<any> => {
  try {
    const settings = await getDataById("settings", "app-settings")
    return settings || {} // Ayarlar yoksa boş nesne döndür
  } catch (error) {
    console.error("Ayarlar alınırken hata:", error)
    return {}
  }
}

// Gider türlerini kaydet
export const saveExpenseTypes = async (expenseTypes: any[]): Promise<void> => {
  try {
    // Önce mevcut gider türlerini temizle
    await clearStore("expenses")

    // Sonra yeni gider türlerini ekle
    for (const expenseType of expenseTypes) {
      await addData("expenses", expenseType)
    }
  } catch (error) {
    console.error("Gider türleri kaydedilirken hata:", error)
    throw error
  }
}

// Gider türlerini getir
export const getExpenseTypes = async (type?: string): Promise<any[]> => {
  try {
    const allExpenses = await getAllData("expenses")

    if (type) {
      return allExpenses.filter((expense) => expense.type === type)
    }

    return allExpenses
  } catch (error) {
    console.error("Gider türleri alınırken hata:", error)
    return []
  }
}

// Sağlayıcıları kaydet
export const saveProviders = async (providers: any[]): Promise<void> => {
  try {
    // Önce mevcut sağlayıcıları temizle
    await clearStore("providers")

    // Sonra yeni sağlayıcıları ekle
    for (const provider of providers) {
      await addData("providers", provider)
    }
  } catch (error) {
    console.error("Sağlayıcılar kaydedilirken hata:", error)
    throw error
  }
}

// Sağlayıcıları getir
export const getProviders = async (): Promise<any[]> => {
  try {
    const allProviders = await getAllData("providers")
    return allProviders
  } catch (error) {
    console.error("Sağlayıcılar alınırken hata:", error)
    return []
  }
}

// Aktiviteleri kaydet
export const saveActivities = async (activities: any[]): Promise<void> => {
  try {
    // Önce mevcut aktiviteleri temizle
    await clearStore("activities")

    // Sonra yeni aktiviteleri ekle
    for (const activity of activities) {
      await addData("activities", activity)
    }
  } catch (error) {
    console.error("Aktiviteler kaydedilirken hata:", error)
    throw error
  }
}

// Aktiviteleri getir
export const getActivities = async (): Promise<any[]> => {
  try {
    const allActivities = await getAllData("activities")
    return allActivities
  } catch (error) {
    console.error("Aktiviteler alınırken hata:", error)
    return []
  }
}

// Destinasyonları kaydet
export const saveDestinations = async (destinations: any[]): Promise<void> => {
  try {
    // Önce mevcut destinasyonları temizle
    await clearStore("destinations")

    // Sonra yeni destinasyonları ekle
    for (const destination of destinations) {
      await addData("destinations", destination)
    }
  } catch (error) {
    console.error("Destinasyonlar kaydedilirken hata:", error)
    throw error
  }
}

// Destinasyonları getir
export const getDestinations = async (): Promise<any[]> => {
  try {
    const allDestinations = await getAllData("destinations")
    return allDestinations
  } catch (error) {
    console.error("Destinasyonlar alınırken hata:", error)
    return []
  }
}

// AI ayarlarını kaydet
export const saveAISettings = async (settings: any): Promise<any> => {
  settings.id = "ai-settings" // Sabit bir ID kullan
  return updateData("settings", settings)
}

// AI ayarlarını getir
export const getAISettings = async (): Promise<any> => {
try {
  const settings = await getDataById("settings", "ai-settings")
  return (
    settings || {
      apiKey: "",
      provider: "openai",
      model: "gpt-3.5-turbo",
      geminiModel: "models/gemini-pro", // "gemini-pro" yerine "models/gemini-pro" olarak değiştirdik
      geminiApiKey: "",
      instructions: "",
      programControl: true,
    }
  ) // Ayarlar yoksa varsayılan değerler
} catch (error) {
  console.error("AI ayarları alınırken hata:", error)
  return {
    apiKey: "",
    provider: "openai",
    model: "gpt-3.5-turbo",
    geminiModel: "models/gemini-pro", // "gemini-pro" yerine "models/gemini-pro" olarak değiştirdik
    geminiApiKey: "",
    instructions: "",
    programControl: true,
  }
}
}

// AI konuşmalarını kaydet
export const saveAIConversation = async (conversation: any): Promise<any> => {
  if (!conversation.id) {
    conversation.id = generateUUID()
  }
  conversation.timestamp = new Date().toISOString()
  return addData("ai_conversations", conversation)
}

// AI konuşmalarını getir
export const getAIConversations = async (): Promise<any[]> => {
  try {
    const conversations = await getAllData("ai_conversations")
    return conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("AI konuşmaları alınırken hata:", error)
    return []
  }
}

// Müşteri notlarını kaydet
export const saveCustomerNote = async (note: any): Promise<any> => {
  if (!note.id) {
    note.id = generateUUID()
  }
  note.timestamp = new Date().toISOString()
  return addData("customer_notes", note)
}

// Müşteri notlarını getir
export const getCustomerNotes = async (customerId?: string): Promise<any[]> => {
  try {
    const notes = await getAllData("customer_notes")
    if (customerId) {
      return notes
        .filter((note) => note.customerId === customerId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("Müşteri notları alınırken hata:", error)
    return []
  }
}

// UUID oluşturucu fonksiyon (zaten varsa kullanın)
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

