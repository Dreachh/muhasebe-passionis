"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, Globe, FileText, BarChart2, Settings, Save } from "lucide-react"
import { formatCurrency } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"

export function MainDashboard({ onNavigate, financialData = [], toursData = [], customersData = [] }) {
  // Son 30 gün içindeki verileri filtrele
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  const recentFinancialData = financialData.filter((item) => new Date(item.date) >= last30Days)
  const recentToursData = toursData.filter((item) => new Date(item.tourDate) >= last30Days)

  // Toplam gelir
  const totalIncome = recentFinancialData
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (Number.parseFloat(item.amount?.toString() || "0") || 0), 0)
    
  // Para birimlerine göre gelirler
  const incomeByCurrency = recentFinancialData
    .filter((item) => item.type === "income")
    .reduce<Record<string, number>>((acc, item) => {
      const currency = item.currency || "TRY";
      const amount = Number.parseFloat(item.amount?.toString() || "0") || 0;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {});

  // Toplam gider
  const totalExpense = recentFinancialData
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (Number.parseFloat((item as any).amount) || 0), 0)
    
  // Para birimlerine göre giderler
  const expenseByCurrency = recentFinancialData
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((acc, item) => {
      const currency = (item as any).currency || "TRY";
      const amount = Number.parseFloat((item as any).amount) || 0;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {});
    
  // Eğer para birimi gösterimi boşsa, varsayılan olarak TRY ekle
  if (Object.keys(incomeByCurrency).length === 0) {
    incomeByCurrency["TRY"] = 0;
  }
  
  if (Object.keys(expenseByCurrency).length === 0) {
    expenseByCurrency["TRY"] = 0;
  }

  // Toplam müşteri sayısı
  const totalCustomers = customersData.length

  // Yaklaşan turlar (bugünden sonraki 30 gün)
  const today = new Date()
  const next30Days = new Date()
  next30Days.setDate(next30Days.getDate() + 30)

  const upcomingTours = toursData.filter((item) => {
    const tourDate = new Date(item.tourDate)
    return tourDate >= today && tourDate <= next30Days
  })

  // Ana menü öğeleri
  const menuItems = [
    {
      title: "Finansal Giriş",
      description: "Gelir ve gider girişleri için hızlı form",
      icon: <DollarSign className="h-8 w-8 text-blue-500" />,
      color: "bg-blue-50 hover:bg-blue-100",
      onClick: () => onNavigate("financial-entry"),
    },
    {
      title: "Tur Satışı",
      description: "Tur ve müşteri kayıtları oluşturun",
      icon: <Globe className="h-8 w-8 text-indigo-500" />,
      color: "bg-indigo-50 hover:bg-indigo-100",
      onClick: () => onNavigate("tour-sales"),
    },
    {
      title: "Takvim",
      description: "Kayıtları takvim görünümünde inceleyin",
      icon: <Calendar className="h-8 w-8 text-purple-500" />,
      color: "bg-purple-50 hover:bg-purple-100",
      onClick: () => onNavigate("calendar"),
    },
    {
      title: "Müşteriler",
      description: "Müşteri veritabanını yönetin",
      icon: <Users className="h-8 w-8 text-green-500" />,
      color: "bg-green-50 hover:bg-green-100",
      onClick: () => onNavigate("customers"),
    },
    {
      title: "Kayıtlar",
      description: "Tüm finansal ve tur kayıtlarını görüntüleyin",
      icon: <FileText className="h-8 w-8 text-amber-500" />,
      color: "bg-amber-50 hover:bg-amber-100",
      onClick: () => onNavigate("data-view"),
    },
    {
      title: "Gelişmiş Analiz",
      description: "Detaylı finansal ve tur analizleri, müşteri demografisi ve yazdırılabilir raporlar",
      icon: <BarChart2 className="h-8 w-8 text-red-500" />,
      color: "bg-red-50 hover:bg-red-100",
      onClick: () => onNavigate("analytics"),
    },
    {
      title: "Yedekleme/Geri Yükleme",
      description: "Verileri bilgisayarınıza kaydedin veya geri yükleyin",
      icon: <Save className="h-8 w-8 text-teal-500" />,
      color: "bg-teal-50 hover:bg-teal-100",
      onClick: () => onNavigate("backup-restore"),
    },
    {
      title: "Ayarlar",
      description: "Destinasyonlar, döviz kurları ve program ayarları",
      icon: <Settings className="h-8 w-8 text-gray-500" />,
      color: "bg-gray-50 hover:bg-gray-100",
      onClick: () => onNavigate("settings"),
    },
  ]

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Gelir (Son 30 gün)</h3>
                <div>
                  {/* Para birimlerine göre ayrı ayrı göster */}
                  {Object.entries(incomeByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-xl font-bold text-green-600">
                      {formatCurrency(amount, currency)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Gider (Son 30 gün)</h3>
                <div>
                  {/* Para birimlerine göre ayrı ayrı göster */}
                  {Object.entries(expenseByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-xl font-bold text-red-600">
                      {formatCurrency(amount, currency)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Toplam Müşteriler</h3>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Yaklaşan Turlar</h3>
                <p className="text-2xl font-bold">{upcomingTours.length}</p>
                <p className="text-xs text-muted-foreground">Önümüzdeki 30 gün</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ana Menü */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <Card
            key={index}
            className={`border hover:shadow-md transition-all cursor-pointer ${item.color}`}
            onClick={item.onClick}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-full bg-white shadow-sm">{item.icon}</div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Son Etkinlikler */}
      {recentToursData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#00a1c6]">Son Tur Satışları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentToursData.slice(0, 5).map((tour) => (
                <div key={tour.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{tour.tourName}</p>
                    <p className="text-sm text-muted-foreground">{tour.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(tour.totalPrice, tour.currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tour.tourDate).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => onNavigate("data-view")}>
                Tüm Kayıtları Görüntüle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

