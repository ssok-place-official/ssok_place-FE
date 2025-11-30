import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { apiService, SearchPlace } from '../services/api';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [mood, setMood] = useState('');
  const [review, setReview] = useState('');
  const [color, setColor] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    // 세 필드 중 하나라도 입력되어 있으면 검색 진행
    const trimmedMood = mood.trim();
    const trimmedReview = review.trim();
    const trimmedColor = color.trim();

    if (!trimmedMood && !trimmedReview && !trimmedColor) {
      Alert.alert('입력 필요', '최소 하나의 항목을 입력해주세요.');
      return;
    }

    try {
      setIsSearching(true);

      // 검색어를 조합 (실제 API 요구사항에 맞게 수정 필요)
      const query = [trimmedMood, trimmedReview, trimmedColor]
        .filter(Boolean)
        .join(' ');

      if (__DEV__) {
        console.log('🔍 [SearchScreen] 검색 시작...');
        console.log(`   - 분위기: ${trimmedMood}`);
        console.log(`   - 선호도: ${trimmedReview}`);
        console.log(`   - 색감: ${trimmedColor}`);
        console.log(`   - 조합된 검색어: ${query}`);
        console.log(`   - API 엔드포인트: POST /ai/search`);
      }

      const startTime = Date.now();
      const response = await apiService.searchPlacesNew({
        mood: trimmedMood || undefined,
        review: trimmedReview || undefined,
        color: trimmedColor || undefined,
        top_k: 3,
      });
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [SearchScreen] API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [SearchScreen] 응답 상태: ${response.status}`);
        console.log(`📝 [SearchScreen] 장소 수: ${response.places?.length || 0}`);
      }

      if (response.status === 'success' && response.places && response.places.length > 0) {
        if (__DEV__) {
          console.log(`✅ [SearchScreen] 검색 성공`);
          console.log(`   - 장소 수: ${response.places.length}`);
        }
        // 검색 결과를 result.tsx로 전달하며 화면 전환
        (navigation as any).navigate('SearchResult', {
          places: response.places,
          searchParams: {
            mood: trimmedMood,
            review: trimmedReview,
            color: trimmedColor,
          },
        });
      } else {
        Alert.alert('검색 실패', '검색 결과를 찾을 수 없습니다. 다른 조건으로 검색해주세요.');
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
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Ssok Place</Text>
          <Image
            source={require('../../assets/ssoklogo-removebg-preview.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood (분위기) Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Mood (분위기)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="분위기 문장을 입력해 주세요"
              placeholderTextColor="#CACACA"
              style={styles.input}
              value={mood}
              onChangeText={setMood}
              editable={!isSearching}
            />
          </View>
        </View>

        {/* Review (선호도) Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Review (선호도)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="선호도 문장을 입력해 주세요"
              placeholderTextColor="#CACACA"
              style={styles.input}
              value={review}
              onChangeText={setReview}
              editable={!isSearching}
            />
          </View>
        </View>

        {/* Color (색감) Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Color (색감)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="색감 문장을 입력해 주세요"
              placeholderTextColor="#CACACA"
              style={styles.input}
              value={color}
              onChangeText={setColor}
              editable={!isSearching}
            />
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={isSearching}
          activeOpacity={0.8}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>유사 장소 검색</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Gabarito',
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 41,
    letterSpacing: -0.03,
    color: '#000000',
  },
  headerLogo: {
    width: 38,
    height: 39,
    borderRadius: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 42,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    color: '#FAA770',
    marginBottom: 3,
  },
  inputContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Noto Sans KR',
    color: '#000000',
  },
  searchButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FAA670',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontFamily: 'Gabarito',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.015,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});