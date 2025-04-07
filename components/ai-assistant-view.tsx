"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Brain,
  Send,
  Settings,
  Save,
  User,
  Bot,
  Loader2,
  RefreshCw,
  FileText,
  PlusCircle,
  DollarSign,
  BarChart2,
  Globe,
  Home,
} from "lucide-react"
import {
  getAISettings,
  saveAISettings,
  saveAIConversation,
  getAIConversations,
  saveCustomerNote,
  getCustomerNotes,
  getAllData,
  getSettings,
  getExpenseTypes,
  getProviders,
  getActivities,
  getDestinations,
} from "@/lib/db"
import {
  searchToursByDate,
  searchToursByCustomer,
  searchCustomerByName,
  searchTourBySerialNumber,
} from "@/lib/search-utils"

export function AIAssistantView({ onNavigate, onClose, financialData, toursData, customersData }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("chat")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: null,
    messages: [],
  })
  const [settings, setSettings] = useState<AISettings>({
    apiKey: "",
    provider: "gemini",
    model: "gpt-3.5-turbo",
    geminiModel: "gemini-1.5-flash",
    geminiApiKey: "",
    instructions: "",
    programControl: true,
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [programData, setProgramData] = useState<ProgramData>({
    companyInfo: {},
    expenseTypes: [],
    providers: [],
    activities: [],
    destinations: [],
  })
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ayarları ve konuşmaları yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const aiSettings = (await getAISettings()) as AISettings
        if (aiSettings.geminiApiKey) {
          aiSettings.geminiApiKey = ""
          await saveAISettings(aiSettings)
        }
        setSettings(aiSettings)

        const aiConversations = (await getAIConversations()) as Conversation[]
        setConversations(aiConversations)

        if (aiConversations.length > 0) {
          const sortedConversations = [...aiConversations].sort((a, b) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          )
          setCurrentConversation(sortedConversations[0])
        } else {
          startNewConversation()
        }

        const fetchedCustomers = customersData
        setCustomers(fetchedCustomers)

        if (fetchedCustomers.length > 0) {
          setSelectedCustomerId(String(fetchedCustomers[0].id))
          const notes = (await getCustomerNotes(String(fetchedCustomers[0].id))) as CustomerNote[]
          setCustomerNotes(notes)
        }

        const companyInfo = await getSettings()
        const expenseTypes = (await getExpenseTypes()) as BaseRecord[]
        const providers = (await getProviders()) as BaseRecord[]
        const activities = (await getActivities()) as BaseRecord[]
        const destinations = (await getDestinations()) as BaseRecord[]

        setProgramData({
          companyInfo,
          expenseTypes,
          providers,
          activities,
          destinations,
        })
      } catch (error) {
        console.error("Veri yüklenirken hata:", error)
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [toast, customersData])

  // Mesajların sonuna otomatik kaydırma
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentConversation.messages])

  // Müşteri seçildiğinde notları yükle
  useEffect(() => {
    const loadCustomerNotes = async () => {
      if (selectedCustomerId) {
        const notes = (await getCustomerNotes(selectedCustomerId)) as CustomerNote[]
        setCustomerNotes(notes)
      }
    }

    loadCustomerNotes()
  }, [selectedCustomerId])

  // Ayarları kaydet
  const handleSaveSettings = async () => {
    try {
      const { geminiApiKey, ...settingsToSave } = settings
      await saveAISettings(settingsToSave)
      setIsSettingsOpen(false)
      toast({
        title: "Başarılı",
        description: "AI ayarları kaydedildi.",
      })
    } catch (error) {
      console.error("AI ayarları kaydedilirken hata:", error)
      toast({
        title: "Hata",
        description: "AI ayarları kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Yeni konuşma başlat
  const startNewConversation = async () => {
    const newConversation: Conversation = {
      id: null,
      messages: [],
      timestamp: new Date().toISOString(),
    }

    try {
      const savedConversation = (await saveAIConversation(newConversation)) as Conversation
      setCurrentConversation(savedConversation)
      setConversations((prev) => [savedConversation, ...prev])
    } catch (error) {
      console.error("Yeni konuşma başlatılırken hata:", error)
      toast({
        title: "Hata",
        description: "Yeni konuşma başlatılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Konuşma seç
  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
  }

  // Program verilerini hazırla
  const prepareProgramContext = (): ContextData => {
    return {
      companyInfo: programData.companyInfo,
      statistics: {
        totalTours: toursData.length,
        totalCustomers: customers.length,
        financialSummary: {
          income: financialData
            .filter((item) => item.type === "income")
            .reduce((sum, item) => sum + Number(item.amount), 0),
          expense: financialData
            .filter((item) => item.type === "expense")
            .reduce((sum, item) => sum + Number(item.amount), 0),
        },
      },
      providers: programData.providers.map((p) => p.name),
      activities: programData.activities.map((a) => a.name),
      destinations: programData.destinations.map((d) => `${d.name}, ${d.country}`),
      tours: toursData.map(t => ({id: t.id, name: t.tourName, date: t.tourDate, customer: t.customerName, serial: t.serialNumber})).slice(0, 50),
      customers: customers.map(c => ({id: c.id, name: c.name, phone: c.phone})).slice(0, 50),
    }
  }

  // Mesaj gönder
  const sendMessage = async () => {
    if (!message.trim() || !currentConversation) return

    const userMessageContent = message
    setMessage("")
    setIsLoading(true)

    const newMessage: ConversationMessage = { role: "user", content: userMessageContent }
    const updatedMessages = [...currentConversation.messages, newMessage]

    const optimisticConversation: Conversation = {
      ...currentConversation,
      messages: updatedMessages,
    }
    setCurrentConversation(optimisticConversation)

    try {
        let assistantResponseContent = ""

        if (settings.programControl) {
            const navigationCommand = processNavigationCommands(userMessageContent)
            if (navigationCommand) {
                onNavigate(navigationCommand.viewId)
                assistantResponseContent = navigationCommand.responseText
            }
        }

        if (!assistantResponseContent) {
            if (settings.provider === "gemini") {
                const programContext = prepareProgramContext()
                const apiResponse = await fetch('/api/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history: currentConversation.messages.map(m => ({ role: m.role, parts: [{text: m.content}] })),
                        message: userMessageContent,
                        context: programContext,
                    }),
                })

                if (!apiResponse.ok) {
                    const errorData = await apiResponse.json()
                    throw new Error(errorData.error || `API isteği başarısız: ${apiResponse.statusText}`)
                }

                const data = await apiResponse.json()
                assistantResponseContent = data.response
            } else {
                assistantResponseContent = "Şu anda sadece Google Gemini sağlayıcısı desteklenmektedir."
        }
      }

        const assistantMessage: ConversationMessage = { role: "assistant", content: assistantResponseContent }
      const finalMessages = [...updatedMessages, assistantMessage]

        const finalConversation: Conversation = {
        ...currentConversation,
        messages: finalMessages,
      }
        setCurrentConversation(finalConversation)
        await saveAIConversation(finalConversation)

        setConversations(prev =>
            prev.map(conv => (conv.id === finalConversation.id ? finalConversation : conv))
        )

    } catch (error) {
        console.error("Mesaj gönderilirken hata:", error)
        const errorMessageContent = (error instanceof Error ? error.message : String(error)) || "AI asistana mesaj gönderilemedi."
      toast({
        title: "Hata",
            description: errorMessageContent,
        variant: "destructive",
      })
        setCurrentConversation(prev => ({ ...prev, messages: currentConversation.messages }))
    } finally {
      setIsLoading(false)
    }
  }

  // Sadece sayfa yönlendirme komutlarını işle
  const processNavigationCommands = (messageText: string): { viewId: string; responseText: string } | null => {
    const lowerMessage = messageText.toLowerCase();
    const commands = {
      "ana sayfa": { viewId: "main-dashboard", responseText: "Ana sayfaya yönlendiriyorum." },
      "tur satış": { viewId: "tour-sales", responseText: "Tur satışı sayfasına yönlendiriyorum." },
      "finansal giriş": { viewId: "financial-entry", responseText: "Finansal giriş sayfasına yönlendiriyorum." },
      "takvim": { viewId: "calendar", responseText: "Takvim görünümüne yönlendiriyorum." },
      "kayıtlar": { viewId: "data-view", responseText: "Kayıtlar sayfasına yönlendiriyorum." },
      "müşteriler": { viewId: "customers", responseText: "Müşteriler sayfasına yönlendiriyorum." },
      "raporlar": { viewId: "analytics", responseText: "Raporlar sayfasına yönlendiriyorum." },
      "ayarlar": { viewId: "settings", responseText: "Ayarlar sayfasına yönlendiriyorum." },
    } as const; // as const ekleyerek key'lerin literal tip olmasını sağla

    for (const key in commands) {
        // key artık literal bir tip, güvenli indeksleme
      if (lowerMessage.includes(key) && (lowerMessage.includes("aç") || lowerMessage.includes("göster") || lowerMessage.includes("git"))) {
        // return commands[key]; // Bu hala hata verebilir, keyof kullanalım
        return commands[key as keyof typeof commands];
      }
    }
    return null;
  };

  // Not ekle
  const addCustomerNote = async () => {
    if (!newNote.trim() || !selectedCustomerId) return

    try {
      const note: Omit<CustomerNote, 'id'> = {
        customerId: selectedCustomerId,
        content: newNote,
        timestamp: new Date().toISOString(),
      }

      const savedNote = (await saveCustomerNote(note)) as CustomerNote
      setCustomerNotes((prev) => [savedNote, ...prev])
      setNewNote("")
      setIsAddingNote(false)

      toast({
        title: "Başarılı",
        description: "Müşteri notu eklendi.",
      })
    } catch (error) {
      console.error("Not eklenirken hata:", error)
      const description = error instanceof Error ? error.message : "Not eklenirken bir hata oluştu."
      toast({
        title: "Hata",
        description,
        variant: "destructive",
      })
    }
  }

  // Müşteri adını bul
  const getCustomerName = (customerId: string): string => {
    const customer = customers.find((c) => String(c.id) === customerId)
    return customer ? customer.name : "Bilinmeyen Müşteri"
  }

  // API anahtarını test et
  const testApiConnection = async () => {
    setIsLoading(true)
    try {
      if (settings.provider === "gemini") {
        const testMessage = "Merhaba Gemini!"
        const apiResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: [], message: testMessage, context: {} }),
        })

        if (!apiResponse.ok) {
          throw new Error(`API bağlantı hatası: ${apiResponse.statusText}`)
        }
        const data = await apiResponse.json()
        if (!data.response) {
          throw new Error("API'den geçerli yanıt alınamadı.")
        }
        toast({
          title: "Bağlantı Başarılı",
          description: `Google Gemini API'ye (${settings.geminiModel}) başarıyla bağlanıldı.`,
        })
      }
    } catch (error) {
      console.error("API test hatası:", error)
      const description = error instanceof Error ? error.message : "API bağlantısı test edilirken bilinmeyen bir hata oluştu."
      toast({
        title: "Bağlantı Hatası",
        description,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#00a1c6] flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          AI Asistan
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="chat">
              <Bot className="h-4 w-4 mr-2" />
              AI Sohbet
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-2" />
              Müşteri Notları
            </TabsTrigger>
            {debugInfo && (
              <TabsTrigger value="debug">
                <RefreshCw className="h-4 w-4 mr-2" />
                Hata Ayıklama
              </TabsTrigger>
            )}
          </TabsList>

          {/* AI Sohbet */}
          <TabsContent value="chat" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={startNewConversation}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Yeni Konuşma
              </Button>

              {conversations.length > 0 && currentConversation && (
                <Select
                  value={currentConversation.id ?? undefined}
                  onValueChange={(value) => {
                    const selected = conversations.find((c) => c.id === value)
                    if (selected) selectConversation(selected)
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Konuşma seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id!}>
                        {new Date(conv.timestamp || Date.now()).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Program Kontrol Paneli */}
            {settings.programControl && (
              <div className="border rounded-md p-3 bg-gray-50">
                <p className="text-sm text-muted-foreground mb-2">Program Kontrol Komutları:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-1 text-xs"
                    onClick={() => {
                      setMessage("Programı ana sayfaya götür")
                      setTimeout(() => sendMessage(), 100)
                    }}
                  >
                    <Home className="h-3 w-3 mr-1" /> Ana Sayfa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-1 text-xs"
                    onClick={() => {
                      setMessage("Tur satışı sayfasına git")
                      setTimeout(() => sendMessage(), 100)
                    }}
                  >
                    <Globe className="h-3 w-3 mr-1" /> Tur Satışı
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-1 text-xs"
                    onClick={() => {
                      setMessage("Finansal giriş sayfasına git")
                      setTimeout(() => sendMessage(), 100)
                    }}
                  >
                    <DollarSign className="h-3 w-3 mr-1" /> Finansal Giriş
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-1 text-xs"
                    onClick={() => {
                      setMessage("Analiz sayfasına git")
                      setTimeout(() => sendMessage(), 100)
                    }}
                  >
                    <BarChart2 className="h-3 w-3 mr-1" /> Analiz
                  </Button>
                </div>
              </div>
            )}

            {/* Mesajlar */}
            <div className="border rounded-md p-4 h-[50vh] overflow-y-auto bg-gray-50">
              {currentConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mb-2 text-[#00a1c6]" />
                  <p>AI asistanınıza bir soru sorun veya yardım isteyin.</p>
                  <p className="text-sm mt-2">Örnek: "15.05.2023 tarihindeki turları göster"</p>
                  <p className="text-sm mt-2">Örnek: "Ahmet Yılmaz müşterisinin turlarını göster"</p>
                  <p className="text-sm mt-2">Örnek: "ABC123 seri numaralı turu göster"</p>
                  {settings.programControl && (
                    <p className="text-sm mt-2">
                      Program kontrolü aktif! "Programı ana sayfaya götür" gibi komutlar verebilirsiniz.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentConversation.messages.map((msg, index) => (
                    <div key={`${currentConversation.id}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user" ? "bg-[#00a1c6] text-white" : "bg-white border shadow-sm"
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {msg.role === "user" ? <User className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                          <span className="text-xs font-medium">{msg.role === "user" ? "Siz" : "AI Asistan"}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Mesaj gönderme */}
            <div className="flex gap-2">
              <Input
                placeholder="Mesajınızı yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="bg-[#00a1c6] hover:bg-[#0090b0]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          {/* Müşteri Notları */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="customerSelect">Müşteri:</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name || "İsimsiz Müşteri"}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsAddingNote(true)} disabled={!selectedCustomerId}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Not Ekle
              </Button>
            </div>

            {/* Notlar */}
            <div className="border rounded-md p-4 h-[400px] overflow-y-auto bg-gray-50">
              {customerNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mb-2 text-[#00a1c6]" />
                  <p>Bu müşteri için henüz not eklenmemiş.</p>
                  <p className="text-sm mt-2">Müşteri ile ilgili önemli bilgileri not olarak ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerNotes.map((note) => (
                    <div key={note.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap">{note.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Hata Ayıklama Sekmesi */}
          {debugInfo && (
            <TabsContent value="debug" className="space-y-4">
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2">API İstek Bilgileri</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>URL:</strong> {debugInfo.requestUrl}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">İstek Gövdesi:</p>
                    <pre className="text-xs bg-black text-white p-4 rounded-md overflow-auto max-h-[300px]">
                      {debugInfo.requestBody}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* AI Ayarları Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Asistan Ayarları</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Sağlayıcısı</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => setSettings({ ...settings, provider: value as 'openai' | 'gemini' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sağlayıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.provider === "openai" && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Anahtarı</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  API anahtarınızı{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00a1c6] hover:underline"
                  >
                    OpenAI
                  </a>{" "}
                  sitesinden alabilirsiniz.
                </p>
              </div>
            )}

            {settings.provider === "gemini" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Google Gemini API anahtarı proje ortam değişkenlerinden okunur (.env.local).
                </p>
              </div>
            )}

            {settings.provider === "openai" && (
              <div className="space-y-2">
                <Label htmlFor="model">OpenAI Modeli</Label>
                <Select value={settings.model} onValueChange={(value) => setSettings({ ...settings, model: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {settings.provider === "gemini" && (
              <div className="space-y-2">
                <Label htmlFor="geminiModel">Gemini Modeli</Label>
                <Select
                  value={settings.geminiModel}
                  onValueChange={(value) => setSettings({ ...settings, geminiModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="models/gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="models/gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instructions">Sistem Talimatları</Label>
              <Textarea
                id="instructions"
                value={settings.instructions}
                onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                placeholder="AI asistanınıza özel talimatlar verin..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                AI asistanınızın nasıl davranması gerektiğini belirten talimatlar. Örneğin: "Sen bir seyahat acentesi
                asistanısın. Müşteri takibi, tur planlaması ve seyahat önerileri konusunda yardımcı olursun."
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="programControl"
                checked={settings.programControl}
                onChange={(e) => setSettings({ ...settings, programControl: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#00a1c6] focus:ring-[#00a1c6]"
              />
              <Label htmlFor="programControl">Yapay zekaya program kontrolü ver</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Bu seçenek etkinleştirildiğinde, yapay zeka programın farklı bölümlerine erişebilir ve komutlarınıza göre
              program içinde gezinebilir.
            </p>

            {/* API Bağlantı Test Butonu */}
            <Button
              type="button"
              variant="outline"
              onClick={testApiConnection}
              disabled={
                isLoading ||
                (settings.provider === "openai" && !settings.apiKey) ||
                (settings.provider === "gemini" && !settings.geminiApiKey)
              }
              className="w-full mt-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              API Bağlantısını Test Et
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              İptal
            </Button>
            <Button className="bg-[#00a1c6] hover:bg-[#0090b0]" onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Ekleme Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Notu Ekle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Müşteri</Label>
              <div className="font-medium">{getCustomerName(selectedCustomerId)}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noteContent">Not</Label>
              <Textarea
                id="noteContent"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Müşteri ile ilgili notunuzu yazın..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNote(false)}>
              İptal
            </Button>
            <Button className="bg-[#00a1c6] hover:bg-[#0090b0]" onClick={addCustomerNote} disabled={!newNote.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}


