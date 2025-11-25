import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    try {
      setIsSearching(true);

      if (__DEV__) {
        console.log('🔍 [SearchScreen] 검색 시작...');
        console.log(`   - 검색어: ${trimmedQuery}`);
        console.log(`   - API 엔드포인트: POST /ai/search`);
      }

      const startTime = Date.now();
      const response = await apiService.searchPlaces({
        query: trimmedQuery,
      });
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [SearchScreen] API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [SearchScreen] 응답 코드: ${response.code}`);
        console.log(`📝 [SearchScreen] 응답 메시지: ${response.message}`);
      }

      if (response.code === 200 && response.data) {
        if (__DEV__) {
          console.log(`✅ [SearchScreen] 검색 성공`);
          console.log(`   - 섹션 수: ${response.data.sections.length}`);
          response.data.sections.forEach((section: { title: string; items: Array<{ placeId: number; name: string; reasons: string[]; images: string[] }> }, index: number) => {
            console.log(`   - 섹션 ${index + 1}: ${section.title} (${section.items.length}개 항목)`);
          });
        }
        // TODO: 검색 결과 표시 (다음 단계에서 구현)
      } else if (response.code === 400) {
        Alert.alert('검색 오류', response.message || '검색어를 입력해주세요.');
      } else if (response.code === 503) {
        Alert.alert('서비스 일시 중단', response.message || '현재 검색 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('검색 실패', response.message || '검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('❌ [SearchScreen] 검색 실패:', error);
      if (__DEV__) {
        console.error('   - 에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   - 에러 메시지:', error instanceof Error ? error.message : String(error));
      }
      Alert.alert('오류', '검색 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

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
          placeholder="ex) 휴일에 가기 좋은 아늑한 카페 추천해줘"
          placeholderTextColor="#BDBDBD"
          style={styles.input}
          returnKeyType="search"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          editable={!isSearching}
        />
        {isSearching && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  inputWrap: { 
    paddingHorizontal: 20,
    position: 'relative',
  },
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
  loadingIndicator: {
    position: 'absolute',
    right: 30,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});