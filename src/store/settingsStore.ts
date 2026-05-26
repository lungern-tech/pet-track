import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DeviceRecord } from '../services/devicesApi';
import type { PetRecord as ApiPetRecord } from '../services/petsApi';
import type { FenceRecord } from '../types/fence';
import { mmkvStorage } from '../storage/mmkv';

export type UnitSystem = 'metric' | 'imperial';

export type PetOnboardingDraft = {
  petType?: string;
  petName: string;
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  weight: string;
};

export type PetRecord = ApiPetRecord;

export type SettingsState = {
  notificationsEnabled: boolean;
  unitSystem: UnitSystem;
  /** 当前主设备头像（上传接口返回的公开 URL） */
  deviceAvatarUrl: string | null;
  /** 最近一次添加设备接口返回的项圈档案 */
  primaryDevice: DeviceRecord | null;
  /** GET /devices 同步后的项圈列表 */
  devices: DeviceRecord[];
  /** GET /pets 同步后的宠物列表 */
  pets: PetRecord[];
  /** 当前选中的宠物（首页按宠物维度展示） */
  primaryPet: PetRecord | null;
  /** 宠物信息录入流程中的临时草稿 */
  petOnboardingDraft: PetOnboardingDraft | null;
  /** GET /geofences 同步后的围栏列表 */
  fences: FenceRecord[];
  hydrated: boolean;

  setNotificationsEnabled: (enabled: boolean) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setDeviceAvatarUrl: (url: string | null) => void;
  setPrimaryDevice: (device: DeviceRecord | null) => void;
  /** 用服务端列表覆盖本地列表，并同步 hasPairedDevice / primaryDevice */
  setDevicesFromServer: (list: DeviceRecord[]) => void;
  /** 注册成功后写入并选中该设备 */
  upsertDeviceAndSelect: (record: DeviceRecord) => void;
  /** 用服务端列表覆盖本地宠物列表，并同步 primaryPet */
  setPetsFromServer: (list: PetRecord[]) => void;
  /** 新增/更新宠物，并选中为 primaryPet */
  upsertPetAndSelect: (pet: PetRecord) => void;
  setPetOnboardingDraft: (draft: PetOnboardingDraft | null) => void;
  setPrimaryPet: (pet: PetRecord | null) => void;
  setFencesFromServer: (list: FenceRecord[]) => void;
  upsertFence: (fence: FenceRecord) => void;
  removeFence: (id: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      unitSystem: 'metric',
      deviceAvatarUrl: null,
      primaryDevice: null,
      devices: [],
      pets: [],
      primaryPet: null,
      petOnboardingDraft: null,
      fences: [],
      hydrated: false,

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setDeviceAvatarUrl: (url) => set({ deviceAvatarUrl: url }),
      setPrimaryDevice: (device) => set({ primaryDevice: device }),
      setDevicesFromServer: (list) =>
        set((state) => ({
          devices: list,
          primaryDevice:
            list.length === 0
              ? null
              : list.find((d) => d.id === state.primaryDevice?.id) ?? list[0],
        })),
      upsertDeviceAndSelect: (record) =>
        set((state) => ({
          devices: [record, ...state.devices.filter((d) => d.id !== record.id)],
          primaryDevice: record,
        })),
      setPetsFromServer: (list) =>
        set((state) => ({
          pets: list,
          primaryPet:
            list.length === 0
              ? null
              : list.find((p) => p.id === state.primaryPet?.id) ?? list[0],
        })),
      upsertPetAndSelect: (pet) =>
        set((state) => ({
          pets: [pet, ...state.pets.filter((p) => p.id !== pet.id)],
          primaryPet: pet,
        })),
      setPetOnboardingDraft: (draft) => set({ petOnboardingDraft: draft }),
      setPrimaryPet: (pet) => set({ primaryPet: pet }),
      setFencesFromServer: (list) => set({ fences: list }),
      upsertFence: (fence) =>
        set((state) => ({
          fences: [fence, ...state.fences.filter((f) => f.id !== fence.id)],
        })),
      removeFence: (id) =>
        set((state) => ({
          fences: state.fences.filter((f) => f.id !== id),
        })),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        notificationsEnabled: s.notificationsEnabled,
        unitSystem: s.unitSystem,
        deviceAvatarUrl: s.deviceAvatarUrl,
        primaryDevice: s.primaryDevice,
        devices: s.devices,
        pets: s.pets,
        primaryPet: s.primaryPet,
        petOnboardingDraft: s.petOnboardingDraft,
        fences: s.fences,
      }),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hydrated: true });
      },
    },
  ),
);

