"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Send, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getAISettings, saveAIConversation } from "@/lib/db"
import {
  searchToursByDate,
  searchToursByCustomer,
  searchCustomerByName,
  searchTourBySerialNumber,
} from "@/lib/search-utils"

export function AIFloatingButton({ isOpen, onToggle, onNavigate, financialData, toursData, customersData }) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState([])
  const [settings, setSettings] = useState(null)
  const { toast } = useToast()
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      const aiSettings = await getAISettings()
      setSettings(aiSettings)
    }

    loadSettings()
  }, [])

  // Mesajların sonuna otomatik kaydırma
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation])

  // Input'a otomatik odaklanma
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    // Kullanıcı mesajını ekle
    const userMessage = { role: "user", content: message }
    setConversation([...conversation, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      // Mesajı analiz et ve işlem yap
      const response = await processMessage(message)

      // Asistan mesajını ekle
      const assistantMessage = { role: "assistant", content: response }
      setConversation([...conversation, userMessage, assistantMessage])

      // Konuşmayı kaydet
      await saveAIConversation({
        id: null,
        messages: [...conversation, userMessage, assistantMessage],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Mesaj işlenirken hata:", error)

      // Hata mesajını ekle
      const errorMessage = {
        role: "assistant",
        content: "Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
      }
      setConversation([...conversation, userMessage, errorMessage])

      toast({
        title: "Hata",
        description: "Mesaj işlenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mesajı işle ve yanıt oluştur
  const processMessage = async (message) => {
    const lowerMessage = message.toLowerCase()

    // Tarih ile tur arama
    if (lowerMessage.includes("tarih") && (lowerMessage.includes("tur") || lowerMessage.includes("turlar"))) {
      // Tarih formatını bul (GG.AA.YYYY veya YYYY-AA-GG)
      const dateRegex = /(\d{2}[.-]\d{2}[.-]\d{4}|\d{4}[.-]\d{2}[.-]\d{2})/g
      const dateMatch = lowerMessage.match(dateRegex)

      if (dateMatch) {
        const dateStr = dateMatch[0]
        const tours = await searchToursByDate(toursData, dateStr)

        if (tours.length > 0) {
          return `${dateStr} tarihinde ${tours.length} tur bulundu:\n\n${tours
            .map(
              (tour, index) =>
                `${index + 1}. ${tour.tourName} - ${tour.customerName} - ${tour.totalPrice} ${tour.currency}`,
            )
            .join("\n")}`
        } else {
          return `${dateStr} tarihinde herhangi bir tur bulunamadı.`
        }
      }
    }

    // Müşteri adı ile tur arama
    if (lowerMessage.includes("müşteri") && (lowerMessage.includes("tur") || lowerMessage.includes("turlar"))) {
      // İsim bul (en az 3 karakter)
      const nameRegex = /müşteri\s+([a-zçğıöşü]{3,}\s+[a-zçğıöşü]{3,})/i
      const nameMatch = lowerMessage.match(nameRegex)

      if (nameMatch) {
        const customerName = nameMatch[1]
        const tours = await searchToursByCustomer(toursData, customerName)

        if (tours.length > 0) {
          return `${customerName} adlı müşteriye ait ${tours.length} tur bulundu:\n\n${tours
            .map(
              (tour, index) =>
                `${index + 1}. ${tour.tourName} - ${new Date(tour.tourDate).toLocaleDateString("tr-TR")} - ${tour.totalPrice} ${tour.currency}`,
            )
            .join("\n")}`
        } else {
          return `${customerName} adlı müşteriye ait tur bulunamadı.`
        }
      }
    }

    // Seri numarası ile tur arama
    if (lowerMessage.includes("seri") && lowerMessage.includes("numara")) {
      // Seri numarasını bul (alfanumerik)
      const serialRegex = /([a-z0-9]{3,})/i
      const serialMatch = lowerMessage.match(serialRegex)

      if (serialMatch) {
        const serialNumber = serialMatch[1]
        const tour = await searchTourBySerialNumber(toursData, serialNumber)

        if (tour) {
          return `${serialNumber} seri numaralı tur bulundu:\n\nTur Adı: ${tour.tourName}\nMüşteri: ${tour.customerName}\nTarih: ${new Date(tour.tourDate).toLocaleDateString("tr-TR")}\nTutar: ${tour.totalPrice} ${tour.currency}`
        } else {
          return `${serialNumber} seri numaralı tur bulunamadı.`
        }
      }
    }

    // Müşteri bilgisi arama
    if (lowerMessage.includes("müşteri") && lowerMessage.includes("bilgi")) {
      // İsim bul (en az 3 karakter)
      const nameRegex = /müşteri\s+([a-zçğıöşü]{3,}\s+[a-zçğıöşü]{3,})/i
      const nameMatch = lowerMessage.match(nameRegex)

      if (nameMatch) {
        const customerName = nameMatch[1]
        const customer = await searchCustomerByName(customersData, customerName)

        if (customer) {
          return `${customerName} adlı müşteri bulundu:\n\nAd Soyad: ${customer.name}\nTelefon: ${customer.phone || "Belirtilmemiş"}\nE-posta: ${customer.email || "Belirtilmemiş"}\nAdres: ${customer.address || "Belirtilmemiş"}`
        } else {
          return `${customerName} adlı müşteri bulunamadı.`
        }
      }
    }

    // Program navigasyonu
    if (lowerMessage.includes("git") || lowerMessage.includes("göster")) {
      if (lowerMessage.includes("ana sayfa")) {
        onNavigate("main-dashboard")
        return "Ana sayfaya yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("tur satış")) {
        onNavigate("tour-sales")
        return "Tur satışı sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("finansal") || lowerMessage.includes("finans")) {
        onNavigate("financial-entry")
        return "Finansal giriş sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("takvim")) {
        onNavigate("calendar")
        return "Takvim sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("müşteri")) {
        onNavigate("customers")
        return "Müşteriler sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("kayıt")) {
        onNavigate("data-view")
        return "Kayıtlar sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("rapor") || lowerMessage.includes("analiz")) {
        onNavigate("analytics")
        return "Raporlar sayfasına yönlendiriliyorsunuz."
      } else if (lowerMessage.includes("ayar")) {
        onNavigate("settings")
        return "Ayarlar sayfasına yönlendiriliyorsunuz."
      }
    }

    // Genel yardım
    if (lowerMessage.includes("yardım") || lowerMessage.includes("ne yapabilir")) {
      return `Size nasıl yardımcı olabilirim:

1. Belirli bir tarihteki turları gösterebilirim. Örnek: "15.05.2023 tarihindeki turları göster"
2. Müşteri adına göre turları listeleyebilirim. Örnek: "Ahmet Yılmaz müşterisinin turlarını göster"
3. Seri numarasına göre tur bilgilerini bulabilirim. Örnek: "ABC123 seri numaralı turu göster"
4. Müşteri bilgilerini gösterebilirim. Örnek: "Mehmet Kaya müşteri bilgilerini göster"
5. Program içinde gezinmenize yardımcı olabilirim. Örnek: "Tur satışı sayfasına git"

Nasıl yardımcı olabilirim?`
    }

    // Varsayılan yanıt
    return "Üzgünüm, isteğinizi anlayamadım. Belirli bir tarih, müşteri adı veya seri numarası belirterek sorgulama yapabilirsiniz. Yardım için 'yardım' yazabilirsiniz."
  }

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-[#00a1c6] hover:bg-[#0090b0]"
        onClick={onToggle}
      >
        <Brain className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 md:w-96 shadow-xl border-[#00a1c6]/20 z-50">
      <div className="bg-[#00a1c6] text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          <span className="font-medium">AI Asistan</span>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-[#0090b0]" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-3">
        <div className="h-80 overflow-y-auto mb-3 space-y-3 p-2">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Brain className="h-10 w-10 mb-2 text-[#00a1c6]" />
              <p className="text-sm">Merhaba! Size nasıl yardımcı olabilirim?</p>
              <p className="text-xs mt-2">Örnek: "15.05.2023 tarihindeki turları göster"</p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    msg.role === "user" ? "bg-[#00a1c6] text-white" : "bg-gray-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Mesajınızı yazın..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="bg-[#00a1c6] hover:bg-[#0090b0]"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

