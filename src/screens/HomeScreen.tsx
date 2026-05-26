import React, { useCallback } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MainTabRoute, RootStackRoute } from '../navigation/types';
import { DeviceSyncControl } from '../components/DeviceSyncControl';
import { fetchPets } from '../services/petsApi';
import { useAuthStore, useSettingsStore } from '../store';

const EMPTY_MIN_HEIGHT = Math.max(360, Dimensions.get('window').height - 220);

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  accent: '#D89575',
};

type HomeScreenNav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNav>();
  const tabNavigation = useNavigation<any>();
  const displayName = useAuthStore((s) => s.displayName);
  const greetingName = displayName?.trim() ? displayName.trim() : '用户';
  const primaryPet = useSettingsStore((s) => s.primaryPet);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasLinkedDevice = !!primaryPet?.linkedDeviceId;

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      let canceled = false;
      (async () => {
        try {
          const list = await fetchPets();
          if (!canceled) {
            useSettingsStore.getState().setPetsFromServer(list);
          }
        } catch {
          // 网络/鉴权失败时保留本地缓存
        }
      })();
      return () => {
        canceled = true;
      };
    }, [accessToken]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            greetingName={greetingName}
            onPressBell={() => navigation.navigate(RootStackRoute.Notifications)}
          />
          {!primaryPet ? (
            <View style={styles.emptyWrapper}>
              <HomeEmptyState
                title="还没有添加宠物"
                desc="先添加宠物信息，然后继续设备匹配完成绑定。"
                ctaText="添加宠物"
                onPress={() => navigation.navigate(RootStackRoute.PetInfoEntry)}
              />
            </View>
          ) : !hasLinkedDevice ? (
            <View style={styles.emptyWrapper}>
              <HomeEmptyState
                title="还没有绑定设备"
                desc="添加宠物定位项圈后，即可在地图查看位置、活动与健康数据。"
                ctaText="开始匹配"
                onPress={() => navigation.navigate(RootStackRoute.DeviceMatch)}
              />
            </View>
          ) : (
            <>
              <PetCard
                onPressSeek={() => tabNavigation.navigate(MainTabRoute.Map)}
                onPressFence={() => {
                  // TODO: wire to fence list screen when available
                }}
                onPressDevice={() =>
                  navigation.navigate(RootStackRoute.DeviceManagement)
                }
              />
              <LocationCard />
              <ActivitySection />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  greetingName: string;
  onPressBell: () => void;
};

function HomeEmptyState({
  title,
  desc,
  ctaText,
  onPress,
}: {
  title: string;
  desc: string;
  ctaText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="scan-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{desc}</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
        onPress={onPress}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.emptyCtaText}>{ctaText}</Text>
      </Pressable>
    </View>
  );
}

function Header({ greetingName, onPressBell }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>你好，{greetingName}</Text>

      <Pressable style={styles.notifButton} onPress={onPressBell}>
        <Feather name="bell" size={20} color={COLORS.text} />
      </Pressable>
    </View>
  );
}

type PetCardProps = {
  onPressSeek: () => void;
  onPressFence: () => void;
  onPressDevice: () => void;
};

function PetCard({ onPressSeek, onPressFence, onPressDevice }: PetCardProps) {
  const primaryPet = useSettingsStore((s) => s.primaryPet);
  const primaryDevice = useSettingsStore((s) => s.primaryDevice);
  const deviceAvatarUrl = useSettingsStore((s) => s.deviceAvatarUrl);

  const displayName = primaryPet?.name?.trim() || '我的宠物';
  const displaySubtitle = primaryPet?.linkedDeviceId ? '项圈已连接' : '未绑定项圈';
  const avatarUri =
    primaryPet?.avatarUrl?.trim() ||
    deviceAvatarUrl?.trim() ||
    primaryDevice?.avatarUrl?.trim() ||
    '';

  return (
    <View style={styles.card}>
      <View style={styles.petHeader}>
        <View style={styles.petInfo}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Feather name="user" size={28} color={COLORS.primary} />
            )}
          </View>

          <View style={styles.petNameCol}>
            <Text style={styles.petName}>{displayName}</Text>
            <Text style={styles.petSub} numberOfLines={2}>
              {displaySubtitle}
            </Text>
          </View>
        </View>

        {primaryPet?.linkedDeviceId ? (
          <DeviceSyncControl
            onSync={async () => {
              const list = await fetchPets();
              useSettingsStore.getState().setPetsFromServer(list);
            }}
          />
        ) : (
          <Pressable
            onPress={onPressDevice}
            style={styles.bindHint}
            accessibilityRole="button"
            accessibilityLabel="去绑定设备"
          >
            <Text style={styles.bindHintText}>去绑定</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.lastLocation}>
        {primaryPet?.linkedDeviceId
          ? '最后定位：位置待项圈同步'
          : '最后定位：北京市朝阳区三里屯 · 2分钟前'}
      </Text>

      <View style={styles.statsRow}>
        <StatItem
          value={primaryPet?.linkedDeviceId ? '—' : '2.4'}
          label="公里"
        />
        <StatItem
          value={primaryPet?.linkedDeviceId ? '—' : '45'}
          label="分钟"
        />
        <StatItem
          value={primaryPet?.linkedDeviceId ? '—' : '98%'}
          label="电量"
        />
      </View>

      <View style={styles.quickActionsRow}>
        <QuickActionButton
          icon="search"
          label="寻宠"
          onPress={onPressSeek}
        />
        <QuickActionButton
          icon="shield"
          label="围栏"
          onPress={onPressFence}
        />
        <QuickActionButton
          icon="cpu"
          label="设备"
          onPress={onPressDevice}
        />
      </View>
    </View>
  );
}

type StatItemProps = {
  value: string;
  label: string;
};

function StatItem({ value, label }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type QuickActionButtonProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
};

function QuickActionButton({ icon, label, onPress }: QuickActionButtonProps) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Feather name={icon} size={18} color={COLORS.text} />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function LocationCard() {
  const primaryDevice = useSettingsStore((s) => s.primaryDevice);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>当前位置</Text>
        <Feather name="map-pin" size={20} color={COLORS.primary} />
      </View>

      <Text style={styles.locationAddress}>
        {primaryDevice ? '位置待项圈上报' : '北京市朝阳区三里屯'}
      </Text>
      <Text style={styles.locationTime}>
        {primaryDevice ? '可在地图查看实时轨迹' : '2分钟前更新'}
      </Text>
    </View>
  );
}

function ActivitySection() {
  const primaryDevice = useSettingsStore((s) => s.primaryDevice);
  const useReal = !!primaryDevice;

  return (
    <View style={styles.activitySection}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>今日活动</Text>
      </View>

      <View style={styles.activityCardsRow}>
        <View style={styles.activityCard}>
          <Feather name="activity" size={24} color={COLORS.primary} />
          <Text style={styles.activityValue}>{useReal ? '—' : '8,240'}</Text>
          <Text style={styles.activityLabel}>步数</Text>
        </View>

        <View style={[styles.activityCard, styles.activityCardSecondary]}>
          <Feather name="clock" size={24} color={COLORS.accent} />
          <Text style={styles.activityValue}>{useReal ? '—' : '2.4'}</Text>
          <Text style={styles.activityLabel}>小时</Text>
        </View>
      </View>
    </View>
  );
}

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },
  emptyWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: EMPTY_MIN_HEIGHT,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 20,
    padding: 28,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptyDesc: {
    width: 280,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emptyTipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
  },
  emptyCtaPressed: {
    opacity: 0.92,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 20,
    ...shadowCard,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  bindHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  bindHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  petNameCol: {
    gap: 4,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  petSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lastLocation: {
    marginBottom: 12,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quickActionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F4F1',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activitySection: {
    gap: 12,
  },
  activityCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 18,
    alignItems: 'flex-start',
    gap: 8,
    ...shadowCard,
  },
  activityCardSecondary: {},
  activityValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  activityLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
