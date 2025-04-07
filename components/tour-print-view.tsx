"use client"

import { formatCurrency, formatDate } from "@/lib/data-utils"

export function TourPrintView({ tour }) {
  if (!tour) return null

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white print:p-0">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-teal-600">PassionisTravel</h1>
        <p className="text-gray-500">Tur Bilgileri</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Tur Detayları</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Seri No:</p>
            <p className="font-medium">{tour.serialNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Tur Adı:</p>
            <p className="font-medium">{tour.tourName}</p>
          </div>
          <div>
            <p className="text-gray-600">Başlangıç Tarihi:</p>
            <p className="font-medium">{formatDate(tour.tourDate)}</p>
          </div>
          <div>
            <p className="text-gray-600">Bitiş Tarihi:</p>
            <p className="font-medium">{tour.tourEndDate ? formatDate(tour.tourEndDate) : "-"}</p>
          </div>
          <div>
            <p className="text-gray-600">Kişi Sayısı:</p>
            <p className="font-medium">
              {tour.numberOfPeople} Yetişkin, {tour.numberOfChildren} Çocuk
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Müşteri Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Ad Soyad:</p>
            <p className="font-medium">{tour.customerName}</p>
          </div>
          <div>
            <p className="text-gray-600">Telefon:</p>
            <p className="font-medium">{tour.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-600">E-posta:</p>
            <p className="font-medium">{tour.customerEmail}</p>
          </div>
          <div>
            <p className="text-gray-600">TC/Pasaport No:</p>
            <p className="font-medium">{tour.customerIdNumber}</p>
          </div>
        </div>

        {tour.additionalCustomers?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Ek Katılımcılar</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Ad Soyad</th>
                  <th className="border p-2 text-left">Telefon</th>
                  <th className="border p-2 text-left">TC/Pasaport No</th>
                </tr>
              </thead>
              <tbody>
                {tour.additionalCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td className="border p-2">{customer.name}</td>
                    <td className="border p-2">{customer.phone}</td>
                    <td className="border p-2">{customer.idNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aktiviteler - Müşteriye gösterilecek */}
      {tour.activities?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Aktiviteler</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Aktivite</th>
                <th className="border p-2 text-left">Tarih</th>
                <th className="border p-2 text-left">Süre</th>
                <th className="border p-2 text-right">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {tour.activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="border p-2">{activity.name}</td>
                  <td className="border p-2">{activity.date ? formatDate(activity.date) : "-"}</td>
                  <td className="border p-2">{activity.duration}</td>
                  <td className="border p-2 text-right">{formatCurrency(activity.price, activity.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Ödeme Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Kişi Başı Fiyat:</p>
            <p className="font-medium">{formatCurrency(tour.pricePerPerson, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600">Toplam Fiyat:</p>
            <p className="font-bold">{formatCurrency(tour.totalPrice, tour.currency)}</p>
          </div>
          <div>
            <p className="text-gray-600">Ödeme Durumu:</p>
            <p className="font-medium">
              {tour.paymentStatus === "pending"
                ? "Beklemede"
                : tour.paymentStatus === "partial"
                  ? "Kısmi Ödeme"
                  : tour.paymentStatus === "completed"
                    ? "Tamamlandı"
                    : tour.paymentStatus === "refunded"
                      ? "İade Edildi"
                      : "Bilinmiyor"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Ödeme Yöntemi:</p>
            <p className="font-medium">
              {tour.paymentMethod === "cash"
                ? "Nakit"
                : tour.paymentMethod === "creditCard"
                  ? "Kredi Kartı"
                  : tour.paymentMethod === "bankTransfer"
                    ? "Banka Transferi"
                    : tour.paymentMethod === "other"
                      ? "Diğer"
                      : "Bilinmiyor"}
            </p>
          </div>

          {tour.paymentStatus === "partial" && (
            <>
              <div>
                <p className="text-gray-600">Yapılan Ödeme:</p>
                <p className="font-medium">{formatCurrency(tour.partialPaymentAmount, tour.partialPaymentCurrency)}</p>
              </div>
              <div>
                <p className="text-gray-600">Kalan Ödeme:</p>
                <p className="font-bold">
                  {formatCurrency(tour.totalPrice - tour.partialPaymentAmount, tour.currency)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {tour.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Notlar</h2>
          <p className="whitespace-pre-line">{tour.notes}</p>
        </div>
      )}

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Bu belge PassionisTravel tarafından düzenlenmiştir.</p>
        <p>
          İletişim: {tour.companyPhone || "+90 212 123 4567"} | {tour.companyEmail || "info@passionistour.com"}
        </p>
      </div>
    </div>
  )
}

