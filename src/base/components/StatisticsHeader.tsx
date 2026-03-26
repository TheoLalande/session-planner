import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  mode: string
  colors: any
  titleColor: string
  subtitleColor: string
}

export default function StatisticsHeader({ mode, colors, titleColor, subtitleColor }: Props) {
  return (
    <View style={[styles.headerCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
      <Text style={[styles.title, { color: titleColor }]}>Statistiques</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>Analyse tes tentatives de grimpe sur la période choisie.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '400',
  },
})
