import React from 'react'

type OpenParams = {
  value: Date
  mode?: 'date' | 'time' | 'datetime'
  is24Hour?: boolean
  maximumDate?: Date
  minimumDate?: Date
  onChange?: (_: unknown, selectedDate?: Date) => void
}

const toInputDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const parseInputDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

export const DateTimePickerAndroid = {
  open: ({ value, maximumDate, minimumDate, onChange }: OpenParams) => {
    if (typeof window === 'undefined') {
      onChange?.({}, undefined)
      return
    }
    const answer = window.prompt('Date (YYYY-MM-DD)', toInputDate(value))
    if (!answer) {
      onChange?.({}, undefined)
      return
    }
    const parsedDate = parseInputDate(answer)
    if (!parsedDate) {
      onChange?.({}, undefined)
      return
    }
    if (maximumDate && parsedDate.getTime() > maximumDate.getTime()) {
      onChange?.({}, maximumDate)
      return
    }
    if (minimumDate && parsedDate.getTime() < minimumDate.getTime()) {
      onChange?.({}, minimumDate)
      return
    }
    onChange?.({}, parsedDate)
  },
}

export default function AppDatePicker() {
  return null
}
