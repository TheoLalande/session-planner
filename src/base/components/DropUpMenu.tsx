// import React, { useState } from 'react'
// import { Animated, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
// import { Icon, Portal, Text } from 'react-native-paper'
// import { Colors } from '../constants/theme'
// import { IDropUpMenuProps } from '../types/profileTypes'

// export function DropUpMenu({ field, value, onChange }: IDropUpMenuProps) {
//   const [visible, setVisible] = useState(false)
//   const [slideAnim] = useState(new Animated.Value(0))

//   const showModal = () => {
//     setVisible(true)
//     Animated.spring(slideAnim, {
//       toValue: 1,
//       useNativeDriver: true,
//       tension: 65,
//       friction: 11,
//     }).start()
//   }

//   const hideModal = () => {
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 250,
//       useNativeDriver: true,
//     }).start(() => {
//       setVisible(false)
//     })
//   }

//   const translateY = slideAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [600, 0],
//   })

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
//           <Text style={{ color: Colors.white, fontSize: 15 }}>{value || field.placeholder}</Text>
//         </View>
//         <Icon source="chevron-down" size={24} color={Colors.white} />
//       </TouchableOpacity>

//       <Portal>
//         <Modal visible={visible} transparent animationType="none" onRequestClose={hideModal}>
//           <TouchableWithoutFeedback onPress={hideModal}>
//             <View style={styles.overlay}>
//               <TouchableWithoutFeedback>
//                 <Animated.View
//                   style={[
//                     styles.bottomSheet,
//                     {
//                       transform: [{ translateY }],
//                     },
//                   ]}
//                 >
//                   <View style={styles.handle} />
//                   <View style={styles.content}>
//                     {field.options?.map((option: string) => (
//                       <TouchableOpacity
//                         key={option}
//                         style={styles.option}
//                         onPress={() => {
//                           onChange?.(option)
//                           hideModal()
//                         }}
//                       >
//                         <Text style={styles.optionText}>{option}</Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 </Animated.View>
//               </TouchableWithoutFeedback>
//             </View>
//           </TouchableWithoutFeedback>
//         </Modal>
//       </Portal>
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
//     maxHeight: '70%',
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
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.white,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   option: {
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.lightGrey,
//   },
//   optionText: {
//     fontSize: 16,
//     color: Colors.white,
//   },
// })
