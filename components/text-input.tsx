"use client"

import React, { useState } from "react"
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps as RNTextInputProps,
} from "react-native"
import { useTheme } from "@/providers/theme-provider"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { globalStyles } from "@/constants/Styles"

interface TextInputProps extends RNTextInputProps {
  label?: string
  error?: string
  leftIcon?: string
  rightIcon?: string
  isPassword?: boolean
  onRightIconPress?: () => void
}

const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, leftIcon, rightIcon, isPassword = false, onRightIconPress, style, ...props }, ref) => {
    const { colors } = useTheme()
    const [secureTextEntry, setSecureTextEntry] = useState(isPassword)

    const toggleSecureEntry = () => {
      setSecureTextEntry(!secureTextEntry)
    }

    return (
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

        <View
          style={[
            styles.inputContainer,
            {
              borderColor: error ? colors.error : colors.border,
              backgroundColor: colors.cardBackground,
            },
            error && styles.inputError,
          ]}
        >
          {leftIcon && (
            <MaterialIcons
              name={leftIcon as any}
              size={20}
              color={error ? colors.error : colors.textDim}
              style={styles.leftIcon}
            />
          )}

          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.text },
              leftIcon && styles.inputWithLeftIcon,
              (rightIcon || isPassword) && styles.inputWithRightIcon,
              style,
            ]}
            placeholderTextColor={colors.textDim}
            secureTextEntry={secureTextEntry}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity onPress={toggleSecureEntry} style={styles.rightIcon}>
              <Ionicons name={secureTextEntry ? "eye" : "eye-off"} size={20} color={colors.textDim} />
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} disabled={!onRightIconPress}>
              <MaterialIcons name={rightIcon as any} size={20} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...globalStyles.bodyMedium,
    fontFamily: 'Poppins-Medium',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    padding: 12,
  },
  inputError: {
    borderWidth: 1.5,
  },
  errorText: {
    ...globalStyles.bodySmall,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
})

export default TextInput
