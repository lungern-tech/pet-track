import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MainTabRoute, RootStackRoute } from '../navigation/types';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            onPressBell={() => navigation.navigate(RootStackRoute.Notifications)}
          />
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  onPressBell: () => void;
};

function Header({ onPressBell }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>你好，Max</Text>

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
  return (
    <View style={styles.card}>
      <View style={styles.petHeader}>
        <View style={styles.petInfo}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={COLORS.primary} />
          </View>

          <View style={styles.petNameCol}>
            <Text style={styles.petName}>Coco</Text>
            <Text style={styles.petSub}>项圈已连接</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>已连接</Text>
        </View>
      </View>

      <Text style={styles.lastLocation}>
        最后定位：北京市朝阳区三里屯 · 2分钟前
      </Text>

      <View style={styles.statsRow}>
        <StatItem value="2.4" label="公里" />
        <StatItem value="45" label="分钟" />
        <StatItem value="98%" label="电量" />
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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>当前位置</Text>
        <Feather name="map-pin" size={20} color={COLORS.primary} />
      </View>

      <Text style={styles.locationAddress}>北京市朝阳区三里屯</Text>
      <Text style={styles.locationTime}>2分钟前更新</Text>
    </View>
  );
}

function ActivitySection() {
  return (
    <View style={styles.activitySection}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>今日活动</Text>
      </View>

      <View style={styles.activityCardsRow}>
        <View style={styles.activityCard}>
          <Feather name="activity" size={24} color={COLORS.primary} />
          <Text style={styles.activityValue}>8,240</Text>
          <Text style={styles.activityLabel}>步数</Text>
        </View>

        <View style={[styles.activityCard, styles.activityCardSecondary]}>
          <Feather name="clock" size={24} color={COLORS.accent} />
          <Text style={styles.activityValue}>2.4</Text>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
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
