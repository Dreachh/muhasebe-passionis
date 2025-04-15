"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/data-utils"

export function CurrencyFinancialSummary({ currency, financialData, toursData }) {
  // Para birimine göre finansal özet hesaplama
  const getFinancialSummaryByCurrency = (currency) => {
    const filterByCurrency = (item) => {
      if (currency === 'all') return true;
      return item && item.currency === currency;
    };

    // Gelirler
    const income = financialData
      .filter(item => item && item.type === "income" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Giderler (tur giderleri dahil)
    const expense = financialData
      .filter(item => item && item.type === "expense" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Tur giderleri (finansal kayıtlarda tur gideri olarak işaretlenenler)
    const tourExpenses = financialData
      .filter(item => item && item.type === "expense" && item.category === "Tur Gideri" && filterByCurrency(item))
      .reduce((sum, item) => sum + (Number.parseFloat(item?.amount?.toString() || '0') || 0), 0);
    
    // Tur gelirleri
    const tourIncome = toursData
      .filter(tour => tour && filterByCurrency(tour))
      .reduce((sum, tour) => sum + (Number.parseFloat(tour?.totalPrice?.toString() || '0') || 0), 0);
    
    return {
      income,
      expense,
      tourIncome,
      tourExpenses,
      profit: income - expense,
      totalIncome: income + tourIncome,
      totalProfit: income + tourIncome - expense,
      balance: income + tourIncome - expense, // Kasa kalan miktar
    };
  };

  const summary = getFinancialSummaryByCurrency(currency);
  const currencySymbol = currency === "all" ? "" : 
    currency === "TRY" ? "₺" : 
    currency === "USD" ? "$" : 
    currency === "EUR" ? "€" : 
    currency === "GBP" ? "£" : currency;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{currency} Para Birimi Finansal Özeti</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Finansal: {formatCurrency(summary.income, currency)} | 
              Tur: {formatCurrency(summary.tourIncome, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.expense, currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.totalProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kasa Bakiyesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(summary.balance, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-medium mb-2">Detaylı Bilgi</h3>
        <table className="w-full">
          <tbody>
            <tr className="border-b">
              <td className="py-2">Finansal Gelirler</td>
              <td className="py-2 text-right">{formatCurrency(summary.income, currency)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Tur Gelirleri</td>
              <td className="py-2 text-right">{formatCurrency(summary.tourIncome, currency)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Toplam Gelir</td>
              <td className="py-2 text-right font-medium">{formatCurrency(summary.totalIncome, currency)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Tur Giderleri</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.tourExpenses, currency)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Diğer Giderler</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.expense - summary.tourExpenses, currency)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Toplam Gider</td>
              <td className="py-2 text-right text-red-600">{formatCurrency(summary.expense, currency)}</td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Net Kar/Zarar</td>
              <td className={`py-2 text-right font-medium ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary.totalProfit, currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
