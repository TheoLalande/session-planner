import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomNavBar, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { router } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { haptic } from '../utils/haptics'

export default function index() {
  const trainings = useTrainingStore((state) => state.trainings)
  const removeTraining = useTrainingStore((state) => state.removeTraining)

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingTop: 30,
          paddingBottom: 30,
        }}
      >
        <View style={{ width: '100%', gap: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: LightColors.primary }}>Mes entrainements</Text>
          {trainings.length === 0 ? (
            <Text style={{ color: LightColors.grey }}>Aucun entrainement pour le moment.</Text>
          ) : (
            trainings.map((training) => (
              <Swipeable
                key={training.id}
                containerStyle={{ width: '100%' }}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => <View style={styles.deleteBackground} />}
                renderRightActions={() => <View style={styles.deleteBackground} />}
                onSwipeableOpen={(direction) => {
                  if (direction === 'left' || direction === 'right') {
                    removeTraining(training.id)
                  }
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    await haptic('tap')
                    router.push({ pathname: '/training-detail', params: { id: String(training.id) } })
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: LightColors.primary,
                    backgroundColor: LightColors.white,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: LightColors.black }}>{training.title}</Text>
                  {training.description ? (
                    <Text style={{ marginTop: 4, color: LightColors.grey }}>{training.description}</Text>
                  ) : null}
                  <Text style={{ marginTop: 8, fontSize: 12, color: LightColors.grey }}>
                    {training.blocs.length} bloc(s) d'exercices
                  </Text>
                </TouchableOpacity>
              </Swipeable>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNavBar onHomePress={() => {}} onCalendarPress={() => {}} onSettingsPress={() => {}} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  deleteBackground: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 12,
  },
})
