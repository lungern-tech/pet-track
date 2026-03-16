import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EDECEA',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
} as const;

type MapNav = NativeStackNavigationProp<RootStackParamList>;

export function MapScreen() {
  const navigation = useNavigation<MapNav>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.headerBack}
              onPress={() => navigation.goBack()}
            >
              <Feather name="chevron-left" size={24} color={COLORS.text} />
            </Pressable>

            <Text style={styles.headerTitle}>实时定位</Text>

            <Pressable style={styles.headerMore}>
              <Feather name="more-vertical" size={24} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.entryRow}>
            <QuickEntry
              icon="navigation-2"
              label="轨迹回放"
              onPress={() => {
                // TODO: 导航到轨迹历史页面
              }}
            />
            <QuickEntry
              icon="crosshair"
              label="寻宠模式"
              onPress={() => {
                // TODO: 导航到寻宠模式详情
              }}
            />
          </View>

          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholderContent}>
              <Feather
                name="map"
                size={64}
                color={COLORS.textMuted}
                style={styles.mapIcon}
              />
              <Text style={styles.mapPlaceholderTitle}>地图加载中...</Text>
              <Text style={styles.mapPlaceholderSub}>
                开启定位权限后，将在此显示宠物位置
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type QuickEntryProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
};

function QuickEntry({ icon, label, onPress }: QuickEntryProps) {
  return (
    <Pressable style={styles.entryButton} onPress={onPress}>
      <Feather name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.entryLabel}>{label}</Text>
    </Pressable>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBack: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMore: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  entryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  entryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  entryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  mapContainer: {
    marginHorizontal: 0,
    marginTop: 4,
    height: 600,
    backgroundColor: COLORS.surfaceMuted,
  },
  mapPlaceholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapIcon: {
    marginBottom: 4,
  },
  mapPlaceholderTitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
