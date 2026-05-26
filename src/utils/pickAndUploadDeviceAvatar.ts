import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { ApiError } from '../services/RequestManager';
import { uploadPublicImageFromUri } from '../services/uploadApi';
import { useSettingsStore } from '../store/settingsStore';

type Source = 'camera' | 'library';

function chooseSource(): Promise<Source | null> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['拍照', '从相册选择', '取消'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) resolve('camera');
          else if (buttonIndex === 1) resolve('library');
          else resolve(null);
        },
      );
    });
  }

  return new Promise((resolve) => {
    Alert.alert('选择头像来源', '', [
      { text: '拍照', onPress: () => resolve('camera') },
      { text: '从相册选择', onPress: () => resolve('library') },
      { text: '取消', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

async function ensurePermission(source: Source): Promise<boolean> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相机权限', '请在系统设置中允许访问相机，以便拍摄宠物头像。');
      return false;
    }
    return true;
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('需要相册权限', '请在系统设置中允许访问相册，以便选择宠物头像。');
    return false;
  }
  return true;
}

/**
 * 从相册选取方形头像并上传，成功后写入 settingsStore.deviceAvatarUrl。
 * @returns 上传后的公开 URL；取消或失败时返回 null
 */
export async function pickAndUploadDeviceAvatar(): Promise<string | null> {
  const source = await chooseSource();
  if (!source) return null;

  const ok = await ensurePermission(source);
  if (!ok) return null;

  const pick =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await pick({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const name =
    asset.fileName ??
    uri.split('/').pop()?.split('?')[0] ??
    'device-avatar.jpg';
  const type = asset.mimeType ?? 'image/jpeg';

  try {
    const { url } = await uploadPublicImageFromUri({ uri, name, type });
    useSettingsStore.getState().setDeviceAvatarUrl(url);
    return url;
  } catch (e) {
    const message =
      e instanceof ApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : '上传失败，请稍后再试';
    Alert.alert('上传失败', message);
    return null;
  }
}
