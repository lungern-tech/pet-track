import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
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
};

type DeviceMatchNav = NativeStackNavigationProp<RootStackParamList>;

export function DeviceMatchScreen() {
  const navigation = useNavigation<DeviceMatchNav>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>设备匹配</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>正在搜索设备</Text>
            <Text style={styles.subtitle}>请确保：</Text>

            <View style={styles.steps}>
              <StepItem index={1} text="打开宠物项圈的电源开关" />
              <StepItem index={2} text="确保手机蓝牙已开启" />
              <StepItem index={3} text="将设备靠近手机（距离小于 1 米）" />
            </View>

            <View style={styles.statusBlock}>
              <Text style={styles.statusText}>搜索中...</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressBar} />
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryText}>取消</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={() => navigation.navigate(RootStackRoute.DeviceMatchSuccess)}
              >
                <Text style={styles.primaryText}>模拟成功</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type StepItemProps = {
  index: number;
  text: string;
};

function StepItem({ index, text }: StepItemProps) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        <Text style={styles.stepIconText}>{index}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  headerRight: {
    width: 24,
    height: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 0,
  },
  card: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 32,
    shadowColor: '#1A1918',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  steps: {
    gap: 16,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  statusBlock: {
    gap: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 100,
    backgroundColor: '#EDECEA',
    overflow: 'hidden',
  },
  progressBar: {
    width: '60%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: COLORS.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.95,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

