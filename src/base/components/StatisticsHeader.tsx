import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  titleColor: string
  subtitleColor: string
}

export default function StatisticsHeader({ titleColor, subtitleColor }: Props) {
  return (
    <View style={styles.headerBlock}>
      <Text style={[styles.title, { color: titleColor }]}>Statistiques</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>Analyse tes tentatives de grimpe sur la période choisie.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBlock: {
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
