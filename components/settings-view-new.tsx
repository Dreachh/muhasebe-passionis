"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function SettingsView({ onClose }) {
  const { toast } = useToast()
  
  useEffect(() => {
    toast({
      title: "Bilgi",
      description: "Ayarlar kısmı sadeleştirilmiştir. Sistem tur satışında girdiğiniz bilgilerle çalışacaktır.",
      duration: 5000,
    })
  }, [toast])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Ayarlar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium mb-4">Sadeleştirilmiş Ayarlar</h3>
          <p className="text-muted-foreground mb-6">
            Ayarlar kısmı sadeleştirilmiştir. Sistem sadece tur satışında girdiğiniz bilgilerle çalışacaktır.
          </p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </CardContent>
    </Card>
  )
}
