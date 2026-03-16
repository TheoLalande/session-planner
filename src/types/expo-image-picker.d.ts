declare module 'expo-image-picker' {
  export type MediaTypeOptions = {
    Images: 'Images'
  }

  export const MediaTypeOptions: MediaTypeOptions

  export type ImagePickerAsset = {
    uri: string
    width?: number
    height?: number
    fileName?: string
    type?: string
  }

  export type ImagePickerResult =
    | {
        canceled: true
      }
    | {
        canceled: false
        assets: ImagePickerAsset[]
      }

  export function launchImageLibraryAsync(options: {
    mediaTypes?: (typeof MediaTypeOptions)[keyof MediaTypeOptions]
    quality?: number
    allowsEditing?: boolean
    aspect?: [number, number]
  }): Promise<ImagePickerResult>
}

