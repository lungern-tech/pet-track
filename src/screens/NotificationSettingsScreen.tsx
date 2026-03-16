import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  divider: '#E5E4E1',
  iconGreen: '#C8F0D8',
  iconOrange: '#FFE5D9',
  iconBlue: '#E5F0FF',
  iconPurple: '#F0E5FF',
  iconYellow: '#FFF5E5',
  toggleOff: '#E5E4E1',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type NotificationSettingsNav = NativeStackNavigationProp<RootStackParamList>;

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsNav>();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [batteryEnabled, setBatteryEnabled] = useState(true);
  const [healthEnabled, setHealthEnabled] = useState(true);
  const [connectEnabled, setConnectEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

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
          <Text style={styles.headerTitle}>通知设置</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <SettingRow
              iconBg={COLORS.iconGreen}
              iconName="bell"
              title="推送通知"
              desc="接收所有通知消息"
              value={pushEnabled}
              onToggle={() => setPushEnabled((v) => !v)}
            />
            <View style={styles.divider} />
            <SettingRow
              iconBg={COLORS.iconOrange}
              iconName="battery"
              title="电量提醒"
              desc="设备电量低于20%时提醒"
              value={batteryEnabled}
              onToggle={() => setBatteryEnabled((v) => !v)}
            />
            <View style={styles.divider} />
            <SettingRow
              iconBg={COLORS.iconBlue}
              iconName="heart"
              title="健康数据提醒"
              desc="健康数据异常时提醒"
              value={healthEnabled}
              onToggle={() => setHealthEnabled((v) => !v)}
            />
            <View style={styles.divider} />
            <SettingRow
              iconBg={COLORS.iconPurple}
              iconName="bluetooth"
              title="设备连接提醒"
              desc="设备连接或断开时提醒"
              value={connectEnabled}
              onToggle={() => setConnectEnabled((v) => !v)}
            />
            <View style={styles.divider} />
            <SettingRow
              iconBg={COLORS.iconYellow}
              iconName="map-pin"
              title="位置提醒"
              desc="宠物离开安全区域时提醒"
              value={locationEnabled}
              onToggle={() => setLocationEnabled((v) => !v)}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  iconBg: string;
  iconName: React.ComponentProps<typeof Feather>['name'];
  title: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
};

function SettingRow({
  iconBg,
  iconName,
  title,
  desc,
  value,
  onToggle,
}: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Feather name={iconName} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDesc}>{desc}</Text>
        </View>
      </View>
      <Pressable
        style={[
          styles.toggle,
          !value && styles.toggleOff,
          value && styles.toggleOn,
        ]}
        onPress={onToggle}
      >
        <View
          style={[
            styles.toggleThumb,
            value && styles.toggleThumbOn,
            !value && styles.toggleThumbOff,
          ]}
        />
      </Pressable>
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
    padding: 24,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 4,
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
  },
  toggleOff: {
    backgroundColor: COLORS.toggleOff,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 16 + 40 + 12,
  },
});
