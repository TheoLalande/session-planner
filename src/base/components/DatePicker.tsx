// import DateTimePicker from '@react-native-community/datetimepicker'
// import React, { useEffect, useState } from 'react'
// import { Animated, Modal, Platform, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
// import { Icon, Portal, Text } from 'react-native-paper'
// import { Colors } from '../constants/theme'
// import { IField } from '../types/profileTypes'

// type DateTimePickerEvent = {
//   type: 'set' | 'dismissed' | 'neutralButtonPressed'
//   nativeEvent: {
//     timestamp: number
//   }
// }

// interface DatePickerProps {
//   field: IField
//   value?: Date
//   onChange?: (date: Date) => void
// }

// export function DatePicker({ field, value, onChange }: DatePickerProps) {
//   const [visible, setVisible] = useState(false)
//   const [slideAnim] = useState(new Animated.Value(0))
//   const [selectedDate, setSelectedDate] = useState<Date>(value || new Date())
//   const [showPicker, setShowPicker] = useState(false)

//   // Synchroniser selectedDate avec la prop value si elle change
//   useEffect(() => {
//     if (value) {
//       setSelectedDate(value)
//     }
//   }, [value])

//   const showModal = () => {
//     if (Platform.OS === 'android') {
//       setShowPicker(true)
//     } else {
//       setVisible(true)
//       setShowPicker(true)
//       Animated.spring(slideAnim, {
//         toValue: 1,
//         useNativeDriver: true,
//         tension: 65,
//         friction: 11,
//       }).start()
//     }
//   }

//   const hideModal = () => {
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 250,
//       useNativeDriver: true,
//     }).start(() => {
//       setVisible(false)
//       setShowPicker(false)
//     })
//   }

//   const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
//     if (Platform.OS === 'android') {
//       setShowPicker(false)
//     }

//     if (event.type === 'set' && date) {
//       setSelectedDate(date)
//       onChange?.(date)
//       if (Platform.OS === 'ios') {
//         // Sur iOS, on peut garder le picker ouvert
//       } else {
//         // Sur Android, on ferme après sélection
//         setTimeout(() => {
//           hideModal()
//         }, 100)
//       }
//     } else if (event.type === 'dismissed') {
//       if (Platform.OS === 'android') {
//         hideModal()
//       }
//     }
//   }

//   const formatDate = (date: Date): string => {
//     const day = date.getDate().toString().padStart(2, '0')
//     const month = (date.getMonth() + 1).toString().padStart(2, '0')
//     const year = date.getFullYear()
//     return `${day}/${month}/${year}`
//   }

//   const translateY = slideAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [600, 0],
//   })

//   const displayText = value ? formatDate(value) : field.placeholder

//   return (
//     <>
//       <TouchableOpacity
//         onPress={showModal}
//         style={{
//           flexDirection: 'row',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           padding: 15,
//           backgroundColor: Colors.grey,
//           borderRadius: 17,
//           marginBottom: 10,
//           height: 50,
//         }}
//       >
//         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
//           <Icon source={field.icon} size={24} color={Colors.white} />
//           <Text style={{ color: Colors.white, fontSize: 15 }}>{displayText}</Text>
//         </View>
//         <Icon source="chevron-down" size={24} color={Colors.white} />
//       </TouchableOpacity>

//       {Platform.OS === 'ios' ? (
//         <Portal>
//           <Modal visible={visible} transparent animationType="none" onRequestClose={hideModal}>
//             <TouchableWithoutFeedback onPress={hideModal}>
//               <View style={styles.overlay}>
//                 <TouchableWithoutFeedback>
//                   <Animated.View
//                     style={[
//                       styles.bottomSheet,
//                       {
//                         transform: [{ translateY }],
//                       },
//                     ]}
//                   >
//                     <View style={styles.handle} />
//                     <View style={styles.content}>
//                       <View style={styles.header}>
//                         <TouchableOpacity onPress={hideModal} style={styles.cancelButton}>
//                           <Text style={styles.cancelText}>Annuler</Text>
//                         </TouchableOpacity>
//                         <Text style={styles.title}>{field.placeholder}</Text>
//                         <TouchableOpacity
//                           onPress={() => {
//                             onChange?.(selectedDate)
//                             hideModal()
//                           }}
//                           style={styles.doneButton}
//                         >
//                           <Text style={styles.doneText}>Valider</Text>
//                         </TouchableOpacity>
//                       </View>
//                       {showPicker && (
//                         <DateTimePicker
//                           value={selectedDate}
//                           mode="date"
//                           display="spinner"
//                           onChange={handleDateChange}
//                           textColor={Colors.white}
//                           themeVariant="dark"
//                           maximumDate={new Date()}
//                         />
//                       )}
//                     </View>
//                   </Animated.View>
//                 </TouchableWithoutFeedback>
//               </View>
//             </TouchableWithoutFeedback>
//           </Modal>
//         </Portal>
//       ) : (
//         <>
//           {showPicker && <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />}
//         </>
//       )}
//     </>
//   )
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   bottomSheet: {
//     backgroundColor: Colors.grey,
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     paddingTop: 10,
//     paddingBottom: 30,
//     maxHeight: '50%',
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     backgroundColor: Colors.lightGrey,
//     borderRadius: 2,
//     alignSelf: 'center',
//     marginBottom: 20,
//   },
//   content: {
//     paddingHorizontal: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.white,
//     flex: 1,
//     textAlign: 'center',
//   },
//   cancelButton: {
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//   },
//   cancelText: {
//     fontSize: 16,
//     color: Colors.white,
//   },
//   doneButton: {
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//   },
//   doneText: {
//     fontSize: 16,
//     color: Colors.primary,
//     fontWeight: 'bold',
//   },
// })
