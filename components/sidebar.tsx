"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Home,
  Calendar,
  DollarSign,
  BarChart2,
  Settings,
  Database,
  RefreshCw,
  Globe,
  Save,
  ChevronRight,
  ChevronLeft,
  Brain,
} from "lucide-react"

export function Sidebar({ currentView, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Ana Sayfa", icon: <Home className="h-5 w-5" /> },
    { id: "calendar", label: "Takvim", icon: <Calendar className="h-5 w-5" /> },
    { id: "financial-entry", label: "Finansal Giriş", icon: <DollarSign className="h-5 w-5" /> },
    { id: "tour-sales", label: "Tur Satışı", icon: <Globe className="h-5 w-5" /> },
    { id: "data-view", label: "Veri Görüntüleme", icon: <Database className="h-5 w-5" /> },
    { id: "analytics", label: "Analiz", icon: <BarChart2 className="h-5 w-5" /> },
    { id: "currency", label: "Döviz Kurları", icon: <RefreshCw className="h-5 w-5" /> },
    { id: "settings", label: "Ayarlar", icon: <Settings className="h-5 w-5" /> },
    { id: "backup-restore", label: "Yedekleme", icon: <Save className="h-5 w-5" /> },
    { id: "ai-assistant", label: "AI Asistan", icon: <Brain className="h-5 w-5" /> },
  ]

  return (
    <div
      className={`bg-white text-gray-700 border-r shadow-sm transition-all duration-300 ${collapsed ? "w-20" : "w-64"} flex flex-col`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center justify-center w-full">
          <img
            src="/logo.svg"
            alt="PassionisTravel Logo"
            className="h-8 w-auto"
            onClick={() => onNavigate("dashboard")}
            style={{ cursor: "pointer" }}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-700 hover:bg-gray-100"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Menü Öğeleri */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start mb-1 ${
                currentView === item.id
                  ? "bg-[#00a1c6] text-white hover:bg-[#00a1c6]/90"
                  : "text-gray-700 hover:bg-gray-100"
              } ${collapsed ? "px-3" : "px-4"}`}
              onClick={() => onNavigate(item.id)}
            >
              <div className={`flex items-center ${collapsed ? "justify-center" : ""}`}>
                <span className={`${collapsed ? "mr-0" : "mr-3"}`}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
