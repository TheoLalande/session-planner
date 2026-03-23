import React from 'react'
import { View, Text } from 'react-native'
import { ExerciseTimerTest } from '../components/ExerciseTimerTest'

export default function Test() {
  return (
    <View>
      <ExerciseTimerTest initialSeconds={10} autoStart={true} />
    </View>
  )
}
