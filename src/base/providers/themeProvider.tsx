import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native'
import { MD3DarkTheme, MD3LightTheme, Theme as PaperTheme } from 'react-native-paper'
import { DEFAULT_THEME_ID, LightColors, ThemeCatalog, type ThemeColors, type ThemeId } from '../constants/theme'

type AppThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: AppThemeMode
  setMode: (mode: AppThemeMode) => Promise<void>
  themeId: ThemeId
  setThemeId: (themeId: ThemeId) => Promise<void>
  isReady: boolean
  colors: ThemeColors
  navigationTheme: NavigationTheme
  paperTheme: PaperTheme
}

const STORAGE_KEY = 'app_theme_mode'
const STORAGE_KEY_THEME_ID = 'app_theme_id'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(themeId: ThemeId, mode: AppThemeMode) {
  const theme = ThemeCatalog[themeId]
  const source = mode === 'dark' ? theme.dark : theme.light
  Object.assign(LightColors, source)
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>('light')
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(STORAGE_KEY)
        const storedThemeId = await AsyncStorage.getItem(STORAGE_KEY_THEME_ID)
        const nextMode: AppThemeMode = storedMode === 'dark' ? 'dark' : 'light'
        const nextThemeId: ThemeId = storedThemeId && storedThemeId in ThemeCatalog ? (storedThemeId as ThemeId) : DEFAULT_THEME_ID
        if (!mounted) return
        setModeState(nextMode)
        setThemeIdState(nextThemeId)
        applyTheme(nextThemeId, nextMode)
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
    applyTheme(themeId, nextMode)
    await AsyncStorage.setItem(STORAGE_KEY, nextMode)
  }

  const setThemeId = async (nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId)
    applyTheme(nextThemeId, mode)
    await AsyncStorage.setItem(STORAGE_KEY_THEME_ID, nextThemeId)
  }

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const isDark = mode === 'dark'
    const background = LightColors.white
    const card = isDark ? LightColors.lightGrey : LightColors.white
    const text = LightColors.black
    const primary = LightColors.primary
    const border = isDark ? LightColors.darkBorder : LightColors.cardBorder

    const base = isDark ? NavigationDarkTheme : NavigationDefaultTheme
    return {
      ...base,
      colors: {
        ...base.colors,
        background,
        card,
        text,
        primary,
        border,
      },
    }
  }, [mode, themeId])

  const paperTheme = useMemo<PaperTheme>(() => {
    const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: LightColors.primary,
        secondary: LightColors.secondary,
        background: LightColors.white,
        surface: LightColors.lightGrey,
        onSurface: LightColors.black,
      },
    }
  }, [mode, themeId])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, themeId, setThemeId, isReady, colors: LightColors, navigationTheme, paperTheme }),
    [mode, themeId, isReady, navigationTheme, paperTheme],
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
