"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { Toast, type ToastType } from "@/components/ui/toast"

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState("")
  const [type, setType] = useState<ToastType>("success")
  const [duration, setDuration] = useState(3000)

  const showToast = (message: string, type: ToastType = "success", duration = 3000) => {
    setMessage(message)
    setType(type)
    setDuration(duration)
    setVisible(true)
  }

  const hideToast = () => {
    setVisible(false)
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast visible={visible} message={message} type={type} duration={duration} onDismiss={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
