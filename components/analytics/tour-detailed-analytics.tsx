"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// Grafik renkleri
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658", "#8dd1e1"]

export function TourDetailedAnalytics({ toursData, selectedCurrency, destinations = [] }) {
  // En çok satılan turlar
  const getMostPopularTours = () => {
    const tourPopularity = {};
    
    toursData.forEach(tour => {
      if (!tour) return;
      const tourName = tour.tourName || "Bilinmeyen Tur";
      
      if (!tourPopularity[tourName]) {
        tourPopularity[tourName] = {
          count: 0,
          customers: 0,
          revenue: 0,
          currency: tour.currency || "TRY",
        };
      }
      
      tourPopularity[tourName].count += 1;
      tourPopularity[tourName].customers += Number.parseInt(tour.numberOfPeople) || 0;
      
      // Eğer seçilen para birimi tüm para birimleri ise veya tur para birimi seçilen para birimine eşitse
      if (selectedCurrency === "all" || tour.currency === selectedCurrency) {
        tourPopularity[tourName].revenue += Number.parseFloat(tour.totalPrice) || 0;
      }
    });
    
    return Object.entries(tourPopularity)
      .map(([name, data]) => ({
        name,
        count: data.count,
        customers: data.customers,
        revenue: data.revenue,
        currency: data.currency,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // En popüler 10 tur
  };

  // Aylara göre tur dağılımı
  const getToursByMonth = () => {
    const monthlyData = {};
    
    // Son 12 ayı hazırla
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      monthlyData[monthKey] = {
        name: month.toLocaleDateString("tr-TR", { month: "short", year: "numeric" }),
        tours: 0,
        customers: 0,
        revenue: 0,
      };
    }
    
    // Tur verilerini ekle
    toursData.forEach(tour => {
      if (!tour || !tour.tourDate) return;
      
      try {
        const date = new Date(tour.tourDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].tours += 1;
          monthlyData[monthKey].customers += Number.parseInt(tour.numberOfPeople) || 0;
          
          // Eğer seçilen para birimi tüm para birimleri ise veya tur para birimi seçilen para birimine eşitse
          if (selectedCurrency === "all" || tour.currency === selectedCurrency) {
            monthlyData[monthKey].revenue += Number.parseFloat(tour.totalPrice) || 0;
          }
        }
      } catch (e) {
        console.error('Tarih dönüştürme hatası:', e);
      }
    });
    
    return Object.values(monthlyData);
  };

  // Destinasyonlara göre tur dağılımı
  const getToursByDestination = () => {
    const destinationData = {};
    
    toursData.forEach(tour => {
      if (!tour) return;
      const destination = tour.destinationId && destinations && destinations.length > 0 ? 
        destinations.find(d => d.id === tour.destinationId)?.name || "Belirtilmemiş" : 
        tour.destinationName || "Belirtilmemiş";
      const customerCount = Number.parseInt(tour.numberOfPeople) || 0;
      
      if (!destinationData[destination]) {
        destinationData[destination] = {
          count: 0,
          customers: 0,
          revenue: 0,
        };
      }
      
      destinationData[destination].count += 1;
      destinationData[destination].customers += customerCount;
      
      // Eğer seçilen para birimi tüm para birimleri ise veya tur para birimi seçilen para birimine eşitse
      if (selectedCurrency === "all" || tour.currency === selectedCurrency) {
        destinationData[destination].revenue += Number.parseFloat(tour.totalPrice) || 0;
      }
    });
    
    return Object.entries(destinationData)
      .map(([name, data]) => ({
        name,
        count: data.count,
        customers: data.customers,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Ödeme durumuna göre tur dağılımı
  const getToursByPaymentStatus = () => {
    const statusLabels = {
      'paid': 'Ödenmiş',
      'pending': 'Beklemede',
      'partial': 'Kısmi Ödeme',
      'cancelled': 'İptal Edilmiş',
      'completed': 'Tamamlandı'
    };
    
    const paymentData = {};
    
    toursData.forEach(tour => {
      if (!tour) return;
      const status = tour.paymentStatus || "pending";
      const statusLabel = statusLabels[status] || status;
      
      if (!paymentData[statusLabel]) {
        paymentData[statusLabel] = {
          count: 0,
          revenue: 0,
        };
      }
      
      paymentData[statusLabel].count += 1;
      
      // Eğer seçilen para birimi tüm para birimleri ise veya tur para birimi seçilen para birimine eşitse
      if (selectedCurrency === "all" || tour.currency === selectedCurrency) {
        paymentData[statusLabel].revenue += Number.parseFloat(tour.totalPrice) || 0;
      }
    });
    
    return Object.entries(paymentData)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }));
  };

  const popularTours = getMostPopularTours();
  const toursByMonth = getToursByMonth();
  const toursByDestination = getToursByDestination();
  const toursByPaymentStatus = getToursByPaymentStatus();

  // Toplam tur sayısı
  const totalTours = toursData.length;
  
  // Toplam müşteri sayısı
  const totalCustomers = toursData.reduce(
    (sum, item) => sum + (Number.parseInt(item?.numberOfPeople?.toString() || '0') || 0),
    0,
  );
  
  // Toplam gelir
  const totalRevenue = toursData
    .filter(tour => selectedCurrency === "all" || tour?.currency === selectedCurrency)
    .reduce(
      (sum, item) => sum + (Number.parseFloat(item?.totalPrice?.toString() || '0') || 0),
      0,
    );
  
  // Ortalama tur fiyatı
  const averageTourPrice =
    totalTours > 0 ? totalRevenue / totalTours : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Detaylı Tur Analizi</h2>
        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          Toplam Tur: {totalTours}
        </div>
      </div>
      
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">En Çok Satılan Turlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {popularTours.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularTours} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Aylara Göre Tur Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={toursByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === "revenue") {
                      return selectedCurrency !== "all"
                        ? `${value.toFixed(2)} ${selectedCurrency}`
                        : formatCurrency(value)
                    }
                    return value
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="tours" name="Tur Sayısı" stroke="#0ea5e9" strokeWidth={2} />
                  <Line type="monotone" dataKey="customers" name="Müşteri Sayısı" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Destinasyonlara Göre Tur Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {toursByDestination.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={toursByDestination}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {toursByDestination.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => {
                      if (name === "count") return [`${value} tur`, "Tur Sayısı"];
                      return [value, name];
                    }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                  <p className="text-muted-foreground">Yeterli veri yok</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Ödeme Durumuna Göre Turlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {toursByPaymentStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={toursByPaymentStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {toursByPaymentStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => {
                      if (name === "count") return [`${value} tur`, "Tur Sayısı"];
                      if (name === "revenue") return [
                        selectedCurrency !== "all"
                          ? `${value.toFixed(2)} ${selectedCurrency}`
                          : formatCurrency(value),
                        "Gelir"
                      ];
                      return [value, name];
                    }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                  <p className="text-muted-foreground">Yeterli veri yok</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-2">En Çok Satılan Turlar</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tur Adı</th>
                <th className="text-right py-2">Satış Sayısı</th>
                <th className="text-right py-2">Müşteri Sayısı</th>
                <th className="text-right py-2">Toplam Gelir</th>
              </tr>
            </thead>
            <tbody>
              {popularTours.slice(0, 5).map((tour, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{tour.name}</td>
                  <td className="py-2 text-right">{tour.count}</td>
                  <td className="py-2 text-right">{tour.customers}</td>
                  <td className="py-2 text-right">
                    {selectedCurrency !== "all"
                      ? `${tour.revenue.toFixed(2)} ${selectedCurrency}`
                      : formatCurrency(tour.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
