import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const COLORS = {
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  border: '#E5E4E1',
} as const;

export const PET_MARKER_WIDTH = 112;
export const PET_MARKER_HEIGHT = 68;

type PetMapMarkerBubbleProps = {
  name: string;
  avatarUri?: string | null;
};

export function PetMapMarkerBubble({ name, avatarUri }: PetMapMarkerBubbleProps) {
  const displayName = name.trim() || '宠物';
  const uri = avatarUri?.trim();

  return (
    <View style={styles.root}>
      <View style={styles.bubble}>
        <View style={styles.avatarRing}>
          {uri ? (
            <Image source={{ uri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Feather name="smile" size={18} color={COLORS.primary} />
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <View style={styles.pointer} />
    </View>
  );
}

const shadowBubble = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.14,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: {
    width: PET_MARKER_WIDTH,
    alignItems: 'center',
  },
  bubble: {
    minWidth: 88,
    maxWidth: PET_MARKER_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...shadowBubble,
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  name: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: 56,
  },
  pointer: {
    width: 12,
    height: 12,
    marginTop: -7,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: '45deg' }],
  },
});
