import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppTheme } from '../providers/themeProvider'
import { getSession } from '../api/authService'
import { getSupabaseClient } from '../api/supabaseClient'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import LoadingIndicator from '../components/LoadingIndicator'
import { TextField } from '../components'

type StoredImageItem = {
  key: string
  name: string
  signedUrl: string | null
}

const STORAGE_BUCKET = 'exercice-images'
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60

export default function MediaLibrary() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const [items, setItems] = useState<StoredImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [renameKey, setRenameKey] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const isRenameVisible = renameKey !== null

  const [userId, setUserId] = useState<string | null>(null)
  const prefix = useMemo(() => (userId ? `users/${userId}/exercises` : null), [userId])
  const toSafeFileName = (value: string) => {
    const trimmed = (value ?? '').trim()
    const base = trimmed.length > 0 ? trimmed : 'image'
    const normalized = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_')
    const name = safe.slice(0, 80) || 'image'
    return name.toLowerCase().endsWith('.jpg') ? name : `${name}.jpg`
  }

  const resolveUser = useCallback(async () => {
    const session = await getSession()
    const uid = session.user?.id
    if (!uid) {
      throw new Error('Utilisateur non connecté')
    }
    setUserId(uid)
  }, [])

  const getSignedUrl = useCallback(async (key: string) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(key, SIGNED_URL_EXPIRES_IN_SECONDS)
    if (error || !data?.signedUrl) {
      return null
    }
    return data.signedUrl
  }, [])

  const refresh = useCallback(async () => {
    if (!prefix) return
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(prefix, { limit: 200, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) {
        throw new Error(error.message)
      }
      const files = (data ?? []).filter((o) => o.name && o.id)
      const next: StoredImageItem[] = await Promise.all(
        files.map(async (o) => {
          const key = `${prefix}/${o.name}`
          const signedUrl = await getSignedUrl(key)
          return { key, name: o.name, signedUrl }
        })
      )
      setItems(next)
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de charger les images')
    } finally {
      setIsLoading(false)
    }
  }, [getSignedUrl, prefix])

  useEffect(() => {
    resolveUser().catch((e) => Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de récupérer la session'))
  }, [resolveUser])

  useEffect(() => {
    if (!prefix) return
    refresh()
  }, [prefix, refresh])

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    })
    if (result.canceled) {
      return null
    }
    const uri = result.assets?.[0]?.uri
    return uri ?? null
  }

  const uploadJpeg = async (objectPath: string, localUri: string, upsert: boolean) => {
    const supabase = getSupabaseClient()
    const manipulated = await ImageManipulator.manipulateAsync(localUri, [{ resize: { width: 1280 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    const response = await fetch(manipulated.uri)
    const arrayBuffer = await response.arrayBuffer()
    const fileBytes = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, fileBytes as any, {
      contentType: 'image/jpeg',
      upsert,
    })
    if (error) {
      throw new Error(error.message)
    }
  }

  const handleAdd = async () => {
    if (!userId) return
    const uri = await pickImage()
    if (!uri) return
    setIsMutating(true)
    try {
      const objectPath = `users/${userId}/exercises/${Date.now()}-custom.jpg`
      await uploadJpeg(objectPath, uri, false)
      await refresh()
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible d'ajouter l'image")
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async (key: string) => {
    setIsMutating(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([key])
      if (error) {
        throw new Error(error.message)
      }
      await refresh()
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible de supprimer l'image")
    } finally {
      setIsMutating(false)
    }
  }

  const handleReplace = async (key: string) => {
    const uri = await pickImage()
    if (!uri) return
    setIsMutating(true)
    try {
      await uploadJpeg(key, uri, true)
      await refresh()
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible de modifier l'image")
    } finally {
      setIsMutating(false)
    }
  }

  const openRename = (key: string, currentName: string) => {
    setRenameKey(key)
    setRenameValue(currentName.replace(/\.jpg$/i, ''))
  }

  const handleRename = async () => {
    if (!renameKey || !prefix) return
    const newFileName = toSafeFileName(renameValue)
    const fromKey = renameKey
    const toKey = `${prefix}/${newFileName}`

    if (fromKey === toKey) {
      setRenameKey(null)
      return
    }

    setIsMutating(true)
    try {
      const supabase = getSupabaseClient()
      const { error: copyError } = await supabase.storage.from(STORAGE_BUCKET).copy(fromKey, toKey)
      if (copyError) {
        throw new Error(copyError.message)
      }
      const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([fromKey])
      if (removeError) {
        throw new Error(removeError.message)
      }
      setRenameKey(null)
      await refresh()
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible de renommer l'image")
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Galerie de photos</Text>
        <Text style={[styles.text, { color: colors.grey }]}>Gère tes images ajoutées (ajouter, modifier, supprimer).</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleAdd}
        disabled={isMutating || isLoading}
        style={[styles.primaryButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
      >
        <Text style={[styles.primaryButtonText, { color: colors.white }]}>Ajouter une image</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <LoadingIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.rowCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
              {item.signedUrl ? (
                <Image source={{ uri: item.signedUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.lightGrey }]} />
              )}
              <View style={styles.rowRight}>
                <Text style={[styles.fileName, { color: colors.black }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openRename(item.key, item.name)}
                    disabled={isMutating}
                    style={[styles.secondaryButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.black }]}>Renommer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleReplace(item.key)}
                    disabled={isMutating}
                    style={[styles.secondaryButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.black }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      Alert.alert('Supprimer', 'Supprimer cette image ?', [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Supprimer', style: 'destructive', onPress: () => handleDelete(item.key) },
                      ])
                    }
                    disabled={isMutating}
                    style={[styles.secondaryButton, { backgroundColor: colors.white, borderColor: colors.softDangerBorder }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
              <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucune image</Text>
              <Text style={[styles.emptyText, { color: colors.grey }]}>Ajoute ta première image avec le bouton ci-dessus.</Text>
            </View>
          }
        />
      )}

      <Modal transparent visible={isRenameVisible} animationType="fade" onRequestClose={() => setRenameKey(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setRenameKey(null)}
          style={[styles.modalBackdrop, { backgroundColor: colors.overlayDark }]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[styles.modalCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.modalTitle, { color: colors.black }]}>Renommer</Text>
            <TextField placeholder="Nom du fichier" value={renameValue} onChangeText={setRenameValue} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setRenameKey(null)}
                disabled={isMutating}
                style={[styles.modalButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.black }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRename}
                disabled={isMutating}
                style={[styles.modalButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Valider</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    header: {
      width: '100%',
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
    },
    text: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
    },
    primaryButton: {
      width: '100%',
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '800',
    },
    loadingBlock: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingBottom: 24,
      gap: 10,
    },
    rowCard: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 16,
      padding: 10,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
    },
    rowRight: {
      flex: 1,
      gap: 8,
    },
    fileName: {
      fontSize: 13,
      fontWeight: '800',
    },
    rowActions: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 13,
      fontWeight: '800',
    },
    emptyCard: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
    },
    emptyText: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 16,
    },
    modalCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '800',
    },
  })
