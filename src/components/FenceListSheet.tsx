import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FenceRecord } from '../types/fence';
import { getFenceSummary } from '../types/fence';

const COLORS = {
  surface: '#FFFFFF',
  background: '#F5F4F1',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
} as const;

type FenceListSheetProps = {
  visible: boolean;
  fences: FenceRecord[];
  onClose: () => void;
  onAdd: () => void;
  /** 点击列表项切换启用状态 */
  onToggleFence?: (fence: FenceRecord) => void;
  togglingFenceId?: number | null;
};

export function FenceListSheet({
  visible,
  fences,
  onClose,
  onAdd,
  onToggleFence,
  togglingFenceId = null,
}: FenceListSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="关闭围栏列表"
      />
      <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>围栏列表</Text>
            <Pressable
              style={styles.addButton}
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel="添加围栏"
            >
              <Feather name="plus" size={20} color={COLORS.primary} />
            </Pressable>
          </View>

          <FlatList
            data={fences}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            contentContainerStyle={
              fences.length === 0 ? styles.listEmptyContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="shield" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>暂无围栏</Text>
                <Text style={styles.emptySub}>点击右上角添加第一个围栏</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isToggling = togglingFenceId === item.id;
              const isBusy = togglingFenceId != null;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.fenceItem,
                    item.enabled ? styles.fenceItemActive : null,
                    pressed && !isBusy && styles.fenceItemPressed,
                    isBusy && styles.fenceItemDisabled,
                  ]}
                  onPress={() => onToggleFence?.(item)}
                  disabled={isBusy}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: item.enabled, disabled: isBusy }}
                  accessibilityLabel={`${item.name}，${item.enabled ? '已启用' : '已关闭'}，点击切换`}
                >
                  <View
                    style={[
                      styles.fenceIconWrap,
                      item.enabled ? styles.fenceIconWrapActive : null,
                    ]}
                  >
                    <Feather
                      name={item.type === 'circle' ? 'circle' : 'layers'}
                      size={18}
                      color={item.enabled ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.fenceTextCol}>
                    <Text style={styles.fenceName}>{item.name}</Text>
                    <Text style={styles.fenceSummary} numberOfLines={2}>
                      {getFenceSummary(item)}
                    </Text>
                  </View>
                  {isToggling ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <View
                      style={[
                        styles.togglePill,
                        item.enabled ? styles.togglePillOn : styles.togglePillOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          item.enabled ? styles.togglePillTextOn : styles.togglePillTextOff,
                        ]}
                      >
                        {item.enabled ? '已启用' : '已关闭'}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  sheet: {
    maxHeight: '58%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  listEmptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fenceItemActive: {
    borderColor: COLORS.primarySoft,
  },
  fenceItemPressed: {
    opacity: 0.85,
  },
  fenceItemDisabled: {
    opacity: 0.65,
  },
  fenceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  fenceIconWrapActive: {
    backgroundColor: COLORS.primarySoft,
  },
  fenceTextCol: {
    flex: 1,
    gap: 4,
  },
  fenceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  fenceSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    minWidth: 56,
    alignItems: 'center',
  },
  togglePillOn: {
    backgroundColor: COLORS.primarySoft,
  },
  togglePillOff: {
    backgroundColor: COLORS.surface,
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  togglePillTextOn: {
    color: COLORS.primary,
  },
  togglePillTextOff: {
    color: COLORS.textMuted,
  },
});
