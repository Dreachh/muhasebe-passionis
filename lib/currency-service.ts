// Döviz kuru API servisi - Güncel veriler

// API anahtarı (gerçek uygulamada .env dosyasında saklanmalı)
const API_KEY = "demo_api_key" // Gerçek uygulamada değiştirilmeli

// Döviz kurlarını getir
export const fetchExchangeRates = async (): Promise<any> => {
  try {
    // Not: Bu demo API'dir, gerçek uygulamada gerçek bir API kullanılmalıdır
    // Örnek: https://api.exchangerate.host/latest?base=TRY
    const response = await fetch(`https://api.exchangerate.host/latest?base=TRY`)

    if (!response.ok) {
      throw new Error("Döviz kurları alınamadı")
    }

    const data = await response.json()

    // API'den gelen verileri uygun formata dönüştür
    const rates = [
      {
        code: "USD",
        name: "Amerikan Doları",
        buying: Number.parseFloat((1 / data.rates.USD).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.USD) * 1.02).toFixed(4)),
      },
      {
        code: "EUR",
        name: "Euro",
        buying: Number.parseFloat((1 / data.rates.EUR).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.EUR) * 1.02).toFixed(4)),
      },
      {
        code: "GBP",
        name: "İngiliz Sterlini",
        buying: Number.parseFloat((1 / data.rates.GBP).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.GBP) * 1.02).toFixed(4)),
      },
      {
        code: "CHF",
        name: "İsviçre Frangı",
        buying: Number.parseFloat((1 / data.rates.CHF).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.CHF) * 1.02).toFixed(4)),
      },
      {
        code: "JPY",
        name: "Japon Yeni",
        buying: Number.parseFloat((1 / data.rates.JPY).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.JPY) * 1.02).toFixed(4)),
      },
      {
        code: "AUD",
        name: "Avustralya Doları",
        buying: Number.parseFloat((1 / data.rates.AUD).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.AUD) * 1.02).toFixed(4)),
      },
      {
        code: "CAD",
        name: "Kanada Doları",
        buying: Number.parseFloat((1 / data.rates.CAD).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.CAD) * 1.02).toFixed(4)),
      },
      {
        code: "SAR",
        name: "Suudi Arabistan Riyali",
        buying: Number.parseFloat((1 / data.rates.SAR).toFixed(4)),
        selling: Number.parseFloat(((1 / data.rates.SAR) * 1.02).toFixed(4)),
      },
    ]

    return {
      rates,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Döviz kurları alınırken hata:", error)

    // Hata durumunda güncel varsayılan değerler
    return {
      rates: [
        { code: "USD", name: "Amerikan Doları", buying: 32.85, selling: 33.05 },
        { code: "EUR", name: "Euro", buying: 35.6, selling: 35.9 },
        { code: "GBP", name: "İngiliz Sterlini", buying: 41.75, selling: 42.15 },
        { code: "CHF", name: "İsviçre Frangı", buying: 36.4, selling: 36.7 },
        { code: "JPY", name: "Japon Yeni", buying: 0.22, selling: 0.23 },
        { code: "SAR", name: "Suudi Arabistan Riyali", buying: 8.75, selling: 8.85 },
        { code: "AUD", name: "Avustralya Doları", buying: 21.9, selling: 22.1 },
        { code: "CAD", name: "Kanada Doları", buying: 24.15, selling: 24.35 },
      ],
      lastUpdated: new Date().toISOString(),
    }
  }
}

// Döviz çevirme
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: any[]): number => {
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (fromCurrency === "TRY" && toCurrency !== "TRY") {
    // TRY'den yabancı para birimine
    const currency = rates.find((r) => r.code === toCurrency)
    if (currency) {
      return amount / currency.selling
    }
    return amount
  }

  if (fromCurrency !== "TRY" && toCurrency === "TRY") {
    // Yabancı para biriminden TRY'ye
    const currency = rates.find((r) => r.code === fromCurrency)
    if (currency) {
      return amount * currency.buying
    }
    return amount
  }

  if (fromCurrency !== "TRY" && toCurrency !== "TRY") {
    // Yabancı para biriminden yabancı para birimine
    const fromRate = rates.find((r) => r.code === fromCurrency)
    const toRate = rates.find((r) => r.code === toCurrency)
    if (fromRate && toRate) {
      // Önce TRY'ye çevir, sonra hedef para birimine
      const tryAmount = amount * fromRate.buying
      return tryAmount / toRate.selling
    }
    return amount
  }

  return amount
}

