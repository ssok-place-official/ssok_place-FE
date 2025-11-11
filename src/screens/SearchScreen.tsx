import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={insets.top + 44}
    >
      <View style={{ flex: 1 }} />
      <View style={[styles.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          ref={inputRef}
          placeholder="원하는 장소를 문장으로 편하게 물어보세요."
          placeholderTextColor="#BDBDBD"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={({ nativeEvent }) => {
            const q = nativeEvent.text?.trim();
            if (!q) return;
            // TODO: 검색 실행
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  inputWrap: { paddingHorizontal: 20 },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
});