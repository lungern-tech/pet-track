import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  divider: '#E5E4E1',
  avatarGreen: '#C8F0D8',
  avatarOrange: '#FFE5D9',
  avatarBlue: '#E5F0FF',
  dotActive: '#3D8A5A',
  dotInactive: '#9C9B99',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type DeviceManagementNav = NativeStackNavigationProp<RootStackParamList>;

export function DeviceManagementScreen() {
  const navigation = useNavigation<DeviceManagementNav>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>设备管理</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate(RootStackRoute.BleSearch)}
          >
            <Feather name="plus" size={20} color={COLORS.primary} />
            <Text style={styles.addButtonText}>添加设备</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.deviceRow}>
              <View style={[styles.deviceAvatar, { backgroundColor: COLORS.avatarGreen }]}>
                <Feather name="cpu" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>小白的项圈</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.dotActive }]} />
                  <Text style={styles.statusText}>已连接</Text>
                  <View style={styles.batteryRow}>
                    <Feather
                      name="battery"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.batteryText}>85%</Text>
                  </View>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={COLORS.textSecondary}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.deviceRow}>
              <View style={[styles.deviceAvatar, { backgroundColor: COLORS.avatarOrange }]}>
                <Feather name="cpu" size={24} color="#D89575" />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>小黑的项圈</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.dotInactive }]} />
                  <Text style={styles.statusText}>未连接</Text>
                  <View style={styles.batteryRow}>
                    <Feather
                      name="battery"
                      size={14}
                      color={COLORS.dotInactive}
                    />
                    <Text style={[styles.batteryText, { color: COLORS.dotInactive }]}>
                      45%
                    </Text>
                  </View>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={COLORS.textSecondary}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.deviceRow}>
              <View style={[styles.deviceAvatar, { backgroundColor: COLORS.avatarBlue }]}>
                <Feather name="cpu" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>小花的项圈</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.dotActive }]} />
                  <Text style={styles.statusText}>已连接</Text>
                  <View style={styles.batteryRow}>
                    <Feather
                      name="battery"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.batteryText}>92%</Text>
                  </View>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={COLORS.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 0,
    gap: 16,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadowCard,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  deviceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});
