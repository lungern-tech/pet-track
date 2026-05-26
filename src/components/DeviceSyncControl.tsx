import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 48;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 17;
const STROKE = 2.5;
const CIRC = 2 * Math.PI * R;

const COLORS = {
  primary: '#3D8A5A',
  track: '#E5E4E1',
};

type Phase = 'idle' | 'syncing' | 'success';

type Props = {
  onSync: () => Promise<void>;
};

export function DeviceSyncControl({ onSync }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const idleSpin = useRef(new Animated.Value(0)).current;
  const syncSpin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const idleLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const syncLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  const idleRotate = idleSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const syncRotate = syncSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'idle') {
      idleLoopRef.current?.stop();
      idleLoopRef.current = null;
      return;
    }
    idleSpin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(idleSpin, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    idleLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
      idleLoopRef.current = null;
    };
  }, [phase, idleSpin]);

  const runSync = () => {
    if (phase !== 'idle') return;
    setPhase('syncing');
    progress.setValue(0);
    syncSpin.setValue(0);

    const fastLoop = Animated.loop(
      Animated.timing(syncSpin, {
        toValue: 1,
        duration: 650,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    syncLoopRef.current = fastLoop;
    fastLoop.start();

    const progressAnim = Animated.timing(progress, {
      toValue: 0.88,
      duration: 2200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    progressAnim.start();

    void (async () => {
      try {
        await onSync();
        progressAnim.stop();
        syncLoopRef.current?.stop();
        syncLoopRef.current = null;
        syncSpin.setValue(0);

        await new Promise<void>((resolve) => {
          Animated.timing(progress, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => resolve());
        });

        setPhase('success');
        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null;
          progress.setValue(0);
          setPhase('idle');
        }, 1400);
      } catch {
        progressAnim.stop();
        syncLoopRef.current?.stop();
        syncLoopRef.current = null;
        syncSpin.setValue(0);
        Animated.timing(progress, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }).start(() => setPhase('idle'));
      }
    })();
  };

  const iconRotate = phase === 'syncing' ? syncRotate : idleRotate;

  return (
    <Pressable
      onPress={runSync}
      disabled={phase !== 'idle'}
      style={({ pressed }) => [
        styles.hit,
        pressed && phase === 'idle' && styles.hitPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="同步项圈数据"
    >
      <View style={styles.wrap}>
        {phase === 'syncing' ? (
          <Svg width={SIZE} height={SIZE} style={styles.svg}>
            <Circle
              cx={CX}
              cy={CY}
              r={R}
              stroke={COLORS.track}
              strokeWidth={STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={CX}
              cy={CY}
              r={R}
              stroke={COLORS.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          </Svg>
        ) : null}

        {phase === 'success' ? (
          <View style={styles.successBadge}>
            <Feather name="check" size={22} color="#FFFFFF" />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.iconLayer,
              { transform: [{ rotate: iconRotate }] },
            ]}
          >
            <Feather name="refresh-cw" size={20} color={COLORS.primary} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    padding: 4,
    borderRadius: 999,
  },
  hitPressed: {
    opacity: 0.85,
  },
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  iconLayer: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE - 6,
    height: SIZE - 6,
  },
  successBadge: {
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
