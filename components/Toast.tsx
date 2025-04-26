import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onHide: () => void;
}

export default function Toast({ message, type, onHide }: ToastProps) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
        },
      ]}
    >
      <Ionicons
        name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
        size={20}
        color="white"
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
}); 