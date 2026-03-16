import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type BoxProps = {
  children: ReactNode;
};

export function Box({ children }: BoxProps) {
  return <View style={styles.box}>{children}</View>;
}

const styles = StyleSheet.create({
  box: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
});
