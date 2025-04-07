"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/data-utils"

export function AnalyticsView({ financialData = [], toursData = [], onClose }) {
  const [dateRange, setDateRange] = useState("thisMonth")
  const [filteredFinancialData, setFilteredFinancialData] = useState([])
  const [filteredToursData, setFilteredToursData] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState("all")

  // Tarih aralığına göre verileri filtrele
  useEffect(() => {
    const now = new Date()
    let startDate = new Date()

    // Tarih aralığını belirle
    if (dateRange === "thisWeek") {
      // Bu haftanın başlangıcı (Pazartesi)
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === "thisMonth") {
      // Bu ayın başlangıcı
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (dateRange === "lastMonth") {
      // Geçen ayın başlangıcı
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      now.setDate(0) // Geçen ayın son günü
    } else if (dateRange === "thisYear") {
      // Bu yılın başlangıcı
      startDate = new Date(now.getFullYear(), 0, 1)
    } else if (dateRange === "allTime") {
      // Tüm zamanlar
      startDate = new Date(0) // 1970-01-01
    }

    // Finansal verileri filtrele
    const filteredFinancial = financialData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= now
    })

    // Tur verilerini filtrele
    const filteredTours = toursData.filter((item) => {
      const itemDate = new Date(item.tourDate)
      return itemDate >= startDate && itemDate <= now
    })

    setFilteredFinancialData(filteredFinancial)
    setFilteredToursData(filteredTours)
  }, [dateRange, financialData, toursData])

  // Para birimine göre filtreleme
  const getFilteredToursByCurrency = () => {
    if (selectedCurrency === "all") {
      return filteredToursData
    }
    return filteredToursData.filter((tour) => tour.currency === selectedCurrency)
  }

  // Analitik hesaplamaları
  const totalIncome = filteredFinancialData
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)

  const totalExpense = filteredFinancialData
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)

  const totalProfit = totalIncome - totalExpense

  const filteredToursByCurrency = getFilteredToursByCurrency()
  const totalTours = filteredToursByCurrency.length

  const totalCustomers = filteredToursByCurrency.reduce(
    (sum, item) => sum + (Number.parseInt(item.numberOfPeople) || 0),
    0,
  )

  const averageTourPrice =
    totalTours > 0
      ? filteredToursByCurrency.reduce((sum, item) => sum + (Number.parseFloat(item.totalPrice) || 0), 0) / totalTours
      : 0

  // Para birimine göre toplam gelir
  const tourRevenueByCurrency = () => {
    const revenues = {}

    // Her para birimi için toplam geliri hesapla
    filteredToursData.forEach((tour) => {
      const currency = tour.currency || "TRY"
      const amount = Number.parseFloat(tour.totalPrice) || 0

      if (!revenues[currency]) {
        revenues[currency] = 0
      }

      revenues[currency] += amount
    })

    // Grafik için veri formatına dönüştür
    return Object.entries(revenues).map(([currency, amount]) => ({
      name: currency,
      value: amount,
    }))
  }

  // Gelir kategorileri
  const incomeByCurrency = () => {
    const incomeData = {}

    filteredFinancialData
      .filter((item) => item.type === "income")
      .forEach((item) => {
        const currency = item.currency || "TRY"
        const amount = Number.parseFloat(item.amount) || 0

        if (!incomeData[currency]) {
          incomeData[currency] = 0
        }

        incomeData[currency] += amount
      })

    return Object.entries(incomeData).map(([currency, amount]) => ({
      name: currency,
      value: amount,
    }))
  }

  // Gider kategorileri
  const expenseByCurrency = () => {
    const expenseData = {}

    filteredFinancialData
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const currency = item.currency || "TRY"
        const amount = Number.parseFloat(item.amount) || 0

        if (!expenseData[currency]) {
          expenseData[currency] = 0
        }

        expenseData[currency] += amount
      })

    return Object.entries(expenseData).map(([currency, amount]) => ({
      name: currency,
      value: amount,
    }))
  }

  // Gelir kategorileri
  const incomeByCategory = filteredFinancialData
    .filter((item) => item.type === "income")
    .reduce((acc, item) => {
      const category = item.category || "Diğer"
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Number.parseFloat(item.amount) || 0
      return acc
    }, {})

  const incomeCategoryData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  // Gider kategorileri
  const expenseByCategory = filteredFinancialData
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      const category = item.category || "Diğer"
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Number.parseFloat(item.amount) || 0
      return acc
    }, {})

  const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  // Aylık gelir/gider trendi
  const getMonthlyData = () => {
    const monthlyData = {}

    // Son 12 ayı hazırla
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`
      monthlyData[monthKey] = {
        name: month.toLocaleDateString("tr-TR", { month: "short", year: "numeric" }),
        income: 0,
        expense: 0,
        profit: 0,
        tours: 0,
      }
    }

    // Finansal verileri ekle
    filteredFinancialData.forEach((item) => {
      const date = new Date(item.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

      if (monthlyData[monthKey]) {
        if (item.type === "income") {
          monthlyData[monthKey].income += Number.parseFloat(item.amount) || 0
        } else if (item.type === "expense") {
          monthlyData[monthKey].expense += Number.parseFloat(item.amount) || 0
        }

        monthlyData[monthKey].profit = monthlyData[monthKey].income - monthlyData[monthKey].expense
      }
    })

    // Tur verilerini ekle
    filteredToursData.forEach((item) => {
      const date = new Date(item.tourDate)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].tours += 1
      }
    })

    return Object.values(monthlyData)
  }

  const monthlyData = getMonthlyData()

  // Tur popülerliği
  const tourPopularity = filteredToursByCurrency.reduce((acc, item) => {
    const tourName = item.tourName || "Bilinmeyen Tur"
    if (!acc[tourName]) {
      acc[tourName] = {
        count: 0,
        customers: 0,
        revenue: 0,
      }
    }
    acc[tourName].count += 1
    acc[tourName].customers += Number.parseInt(item.numberOfPeople) || 0
    acc[tourName].revenue += Number.parseFloat(item.totalPrice) || 0
    return acc
  }, {})

  const tourPopularityData = Object.entries(tourPopularity)
    .map(([name, data]) => ({
      name,
      count: data.count,
      customers: data.customers,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // En popüler 5 tur

  // Grafik renkleri
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658", "#8dd1e1"]

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#2b3275]">Analiz</CardTitle>
        <div className="flex items-center gap-4">
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dönem seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Bu Hafta</SelectItem>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="thisYear">Bu Yıl</SelectItem>
              <SelectItem value="allTime">Tüm Zamanlar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Para birimi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Para Birimleri</SelectItem>
              <SelectItem value="TRY">Türk Lirası (TRY)</SelectItem>
              <SelectItem value="USD">Amerikan Doları (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="GBP">İngiliz Sterlini (GBP)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial">
          <TabsList className="mb-4">
            <TabsTrigger value="financial">Finansal Analiz</TabsTrigger>
            <TabsTrigger value="tours">Tur Analizi</TabsTrigger>
            <TabsTrigger value="currency">Para Birimi Analizi</TabsTrigger>
          </TabsList>

          <TabsContent value="financial">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalProfit)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Aylık Gelir/Gider Trendi</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="income" name="Gelir" stroke="#4ade80" strokeWidth={2} />
                      <Line type="monotone" dataKey="expense" name="Gider" stroke="#f87171" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" name="Kar" stroke="#60a5fa" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Gelir Dağılımı</h3>
                  <div className="h-[300px]">
                    {incomeCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {incomeCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                        <p className="text-muted-foreground">Yeterli veri yok</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Gider Dağılımı</h3>
                  <div className="h-[300px]">
                    {expenseCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                        <p className="text-muted-foreground">Yeterli veri yok</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tours">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Tur Sayısı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTours}</div>
                  {selectedCurrency !== "all" && (
                    <p className="text-xs text-muted-foreground">{selectedCurrency} para biriminde</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Müşteri Sayısı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCustomers}</div>
                  {selectedCurrency !== "all" && (
                    <p className="text-xs text-muted-foreground">{selectedCurrency} para biriminde</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ortalama Tur Fiyatı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedCurrency !== "all"
                      ? `${averageTourPrice.toFixed(2)} ${selectedCurrency}`
                      : formatCurrency(averageTourPrice)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Tur Popülerliği</h3>
                <div className="h-[400px]">
                  {tourPopularityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tourPopularityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "revenue") {
                              return selectedCurrency !== "all"
                                ? `${value.toFixed(2)} ${selectedCurrency}`
                                : formatCurrency(value)
                            }
                            return value
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Tur Sayısı" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="customers" name="Müşteri Sayısı" fill="#82ca9d" />
                        <Bar yAxisId="right" dataKey="revenue" name="Gelir" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Aylık Tur Trendi</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tours" name="Tur Sayısı" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="currency">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Para Birimlerine Göre Tur Gelirleri</h3>
                <div className="h-[300px]">
                  {tourRevenueByCurrency().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tourRevenueByCurrency()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}% (${value.toFixed(2)})`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tourRevenueByCurrency().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [`${value.toFixed(2)} ${props.payload.name}`, "Gelir"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Para Birimlerine Göre Finansal Gelirler</h3>
                <div className="h-[300px]">
                  {incomeByCurrency().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByCurrency()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}% (${value.toFixed(2)})`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incomeByCurrency().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [`${value.toFixed(2)} ${props.payload.name}`, "Gelir"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Para Birimlerine Göre Finansal Giderler</h3>
                <div className="h-[300px]">
                  {expenseByCurrency().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCurrency()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}% (${value.toFixed(2)})`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseByCurrency().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [`${value.toFixed(2)} ${props.payload.name}`, "Gider"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Para Birimi Dağılımı Özeti</h3>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Tur Satışları</h4>
                      <div className="space-y-2">
                        {tourRevenueByCurrency().map((item) => (
                          <div key={item.name} className="flex justify-between">
                            <span>{item.name}:</span>
                            <span className="font-medium">
                              {item.value.toFixed(2)} {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Finansal Gelirler</h4>
                      <div className="space-y-2">
                        {incomeByCurrency().map((item) => (
                          <div key={item.name} className="flex justify-between">
                            <span>{item.name}:</span>
                            <span className="font-medium">
                              {item.value.toFixed(2)} {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Finansal Giderler</h4>
                      <div className="space-y-2">
                        {expenseByCurrency().map((item) => (
                          <div key={item.name} className="flex justify-between">
                            <span>{item.name}:</span>
                            <span className="font-medium">
                              {item.value.toFixed(2)} {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

