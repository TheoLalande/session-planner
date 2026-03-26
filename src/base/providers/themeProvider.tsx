import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native'
import { MD3DarkTheme, MD3LightTheme, Theme as PaperTheme } from 'react-native-paper'
import { DarkThemeColors, LightColors, LightThemeColors } from '../constants/theme'

type AppThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: AppThemeMode
  setMode: (mode: AppThemeMode) => Promise<void>
  isReady: boolean
  colors: typeof LightThemeColors
  navigationTheme: NavigationTheme
  paperTheme: PaperTheme
}

const STORAGE_KEY = 'app_theme_mode'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyThemeToLightColors(mode: AppThemeMode) {
  const source = mode === 'dark' ? DarkThemeColors : LightThemeColors
  Object.assign(LightColors, source)
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>('light')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        const nextMode: AppThemeMode = stored === 'dark' ? 'dark' : 'light'
        if (!mounted) return
        setModeState(nextMode)
        applyThemeToLightColors(nextMode)
      } finally {
        if (!mounted) return
        setIsReady(true)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  const setMode = async (nextMode: AppThemeMode) => {
    setModeState(nextMode)
    applyThemeToLightColors(nextMode)
    await AsyncStorage.setItem(STORAGE_KEY, nextMode)
  }

  const navigationTheme = useMemo<NavigationTheme>(() => {
    if (mode === 'dark') {
      return {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          background: DarkThemeColors.white,
          card: DarkThemeColors.lightGrey,
          text: DarkThemeColors.black,
          primary: DarkThemeColors.primary,
          border: DarkThemeColors.darkBorder,
        },
      }
    }
    return {
      ...NavigationDefaultTheme,
      colors: {
        ...NavigationDefaultTheme.colors,
        background: LightThemeColors.white,
        card: LightThemeColors.white,
        text: LightThemeColors.black,
        primary: LightThemeColors.primary,
        border: LightThemeColors.cardBorder,
      },
    }
  }, [mode])

  const paperTheme = useMemo<PaperTheme>(() => {
    const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme
    const colors = mode === 'dark' ? DarkThemeColors : LightThemeColors
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        secondary: colors.secondary,
        background: colors.white,
        surface: colors.lightGrey,
        onSurface: colors.black,
      },
    }
  }, [mode])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, isReady, colors: mode === 'dark' ? DarkThemeColors : LightThemeColors, navigationTheme, paperTheme }),
    [mode, isReady, navigationTheme, paperTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider')
  }
  return ctx
}
