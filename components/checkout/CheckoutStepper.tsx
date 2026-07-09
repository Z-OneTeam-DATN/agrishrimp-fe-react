"use client"

import { Check } from "lucide-react"

const STEPS = [
  { id: 1, label: "Địa chỉ" },
  { id: 2, label: "Xem đơn" },
  { id: 3, label: "Thanh toán" },
]

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = step.id < currentStep
        const isActive = step.id === currentStep

        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isActive
                    ? "bg-white border-blue-600 text-blue-600"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? <Check size={14} /> : step.id}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                  isActive
                    ? "text-blue-600"
                    : isCompleted
                    ? "text-blue-500"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-4 mx-1 transition-colors ${
                  currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

