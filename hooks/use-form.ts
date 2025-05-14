"use client"

import { useState, useCallback } from "react"

type ValidationRule<T> = {
  validate: (value: any, formValues: T) => boolean
  message: string
}

type FieldValidation<T> = {
  [K in keyof T]?: ValidationRule<T>[]
}

interface UseFormOptions<T> {
  initialValues: T
  validation?: FieldValidation<T>
  onSubmit?: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validation = {} as FieldValidation<T>,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }))

      // Clear error when field is changed
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
      if (validation[field]) {
        const fieldValidation = validation[field]
        if (fieldValidation) {
          for (const rule of fieldValidation) {
            if (!rule.validate(values[field], values)) {
              setErrors((prev) => ({ ...prev, [field]: rule.message }))
              break
            }
          }
        }
      }
    },
    [values, validation],
  )

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    // Check each field with validation rules
    Object.entries(validation).forEach(([field, rules]) => {
      const fieldKey = field as keyof T
      if (rules) {
        for (const rule of rules) {
          if (!rule.validate(values[fieldKey], values)) {
            newErrors[fieldKey] = rule.message
            isValid = false
            break
          }
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validation])

  const handleSubmit = useCallback(async () => {
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Partial<Record<keyof T, boolean>>),
    )

    const isValid = validateForm()
    if (!isValid) return

    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateForm, onSubmit])

  const reset = useCallback(() => {
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
    reset,
    setValues,
  }
}
