"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"

export interface AddressSuggestion {
  label: string
  province: string
  district: string
  ward: string
  lat?: number
  lng?: number
}

interface Props {
  value: string
  onChange: (val: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
  hasError?: boolean
  className?: string
  placeholder?: string
}

export default function AddressSuggestionInput({
  value,
  onChange,
  onSelect,
  hasError = false,
  className = "",
  placeholder = "Số nhà, tên đường...",
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value || value.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/ghn/address-suggestions?input=${encodeURIComponent(value)}`
        )
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data)
          setOpen(true)
        } else {
          setSuggestions([])
          setOpen(false)
        }
      } catch {
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label)
    setSuggestions([])
    setOpen(false)
    onSelect(suggestion)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400 pointer-events-none"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault() // prevent blur before click
                handleSelect(s)
              }}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[#f0fdf9] cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
            >
              <MapPin size={14} className="text-[#1965a2] mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 leading-snug">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

