"use client"

import { useState, useCallback } from "react"

interface ValidationRule<T> {
  validate: (value: string, formValues: T) => boolean
  message: string
}

interface UseAuthFormOptions<T> {
  initialValues: T
  validation: {
    [K in keyof T]?: ValidationRule<T>[]
  }
  onSubmit: (values: T) => Promise<void>
}

export function useAuthForm<T extends Record<string, string>>({
  initialValues,
  validation,
  onSubmit,
}: UseAuthFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (field: keyof T) => (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }))

      // Clear error when user types
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }))

      // Validate on blur
      const fieldRules = validation[field]
      if (fieldRules) {
        for (const rule of fieldRules) {
          if (!rule.validate(values[field] as string, values)) {
            setErrors((prev) => ({ ...prev, [field]: rule.message }))
            break
          } else {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
          }
        }
      }
    },
    [validation, values],
  )

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {}
    Object.keys(values).forEach((key) => {
      allTouched[key as keyof T] = true
    })
    setTouched(allTouched)

    // Validate all fields
    Object.entries(validation).forEach(([field, rules]) => {
      if (rules) {
        for (const rule of rules) {
          if (!rule.validate(values[field as keyof T] as string, values)) {
            newErrors[field as keyof T] = rule.message
            isValid = false
            break
          }
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validation, values])

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        console.error("Form submission error:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [validateForm, onSubmit, values])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  }
}
