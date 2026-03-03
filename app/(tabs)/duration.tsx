import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { getCurrentDurationMinutes, setCurrentDurationMinutes } from '@/constants/session';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

const isIOS = Platform.OS === 'ios';

export default function DurationScreen() {
  const initialTotalMinutes = getCurrentDurationMinutes();
  const [totalMinutes, setTotalMinutes] = useState<number>(Math.max(0, initialTotalMinutes));

  const initialDate = useMemo(() => {
    const d = new Date();
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    d.setHours(hrs, mins, 0, 0);
    return d;
  }, [totalMinutes]);

  const [pickerDate, setPickerDate] = useState<Date>(initialDate);

  function handleSelect() {
    if (totalMinutes <= 0) {
      router.back();
      return;
    }
    setCurrentDurationMinutes(totalMinutes);
    router.back();
  }

  function handleChange(event: any, date?: Date) {
    if (isIOS) {
      const durationMs = event?.nativeEvent?.duration;
      if (typeof durationMs === 'number') {
        const minsRaw = Math.round(durationMs / 60000);
        const minsClamped = Math.max(0, Math.min(23 * 60 + 59, minsRaw));
        setTotalMinutes(minsClamped);
        return;
      }

      // Fallback for environments where duration is not provided, use date
      if (date) {
        const minsRaw = date.getHours() * 60 + date.getMinutes();
        const minsClamped = Math.max(0, Math.min(23 * 60 + 59, minsRaw));
        setTotalMinutes(minsClamped);
      }
      return;
    }

    if (!date) return;
    setPickerDate(date);
    const mins = date.getHours() * 60 + date.getMinutes();
    setTotalMinutes(Math.max(0, mins));
  }


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSelect}
            style={({ pressed }) => [styles.selectBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.selectText}>Select</Text>
          </Pressable>
        </View>

        <Text style={styles.screenTitle}>Duration</Text>

        <View style={styles.pickerContainer}>
          <DateTimePicker
            mode={isIOS ? 'countdown' : 'countdown'}
            value={pickerDate}
            display={isIOS ? 'spinner' : 'default'}
            onChange={handleChange}
            minuteInterval={1}
            {...(isIOS ? { themeVariant: 'dark', textColor: PALETTE.pale } : {})}
          />
        </View>

       
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.ink,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 32 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 14,
    color: PALETTE.mist,
  },
  screenTitle: {
    fontSize: 42,
    color: PALETTE.pale,
    fontWeight: '700',
    textAlign: 'left',
    marginLeft: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.mist,
    marginBottom: 18,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    marginTop: 16,
  },

  selectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectText: {
    fontSize: 14,
    color: PALETTE.accent,
  },
});

