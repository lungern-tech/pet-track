import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#FFFFFF',
} as const;

export const NUMBERED_MARKER_SIZE = 28;
export const NUMBERED_MARKER_SIZE_ACTIVE = 36;

type NumberedMapMarkerProps = {
  index: number;
  active?: boolean;
};

export function NumberedMapMarker({ index, active = false }: NumberedMapMarkerProps) {
  const size = active ? NUMBERED_MARKER_SIZE_ACTIVE : NUMBERED_MARKER_SIZE;

  return (
    <View style={styles.host}>
      <View
        style={[
          styles.marker,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: active ? 3 : 2,
          },
          active && styles.markerActive,
        ]}
      >
        <Text style={[styles.label, active && styles.labelActive]}>{index}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    width: NUMBERED_MARKER_SIZE_ACTIVE,
    height: NUMBERED_MARKER_SIZE_ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderColor: COLORS.surface,
  },
  markerActive: {
    backgroundColor: '#2F7048',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  labelActive: {
    fontSize: 15,
  },
});
