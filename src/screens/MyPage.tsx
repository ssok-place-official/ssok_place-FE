// src/screens/MyPage.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, Image } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, Place, ActivityPlace, SearchPlace } from "../services/api";
import { ApiTester } from "../utils/apiTest";
import { logServerInfo } from "../config/environment";

const RECENT_SEARCH_PLACES_KEY = 'recent_search_places';

// 네비게이션 타입 정의
type RootStackParamList = {
  ListPage: { category?: string; places?: Place[] };
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

interface UserKeyword {
  label: string;
  tags: string[];
  emoji: string;
}

export default function MyPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityPlaces, setActivityPlaces] = useState<ActivityPlace[]>([]);
  const [recentSearchPlaces, setRecentSearchPlaces] = useState<SearchPlace[]>([]);
  const [userNickname, setUserNickname] = useState('사용자');
  const [userKeywords] = useState<UserKeyword[]>([
    {
      label: '베이커리 카페',
      emoji: '🍞',
      tags: ['따뜻한', '고급스러운', '커피', '인테리어', '디저트']
    },
    {
      label: '점심메뉴',
      emoji: '🥗',
      tags: ['건강식', '샐러드', '가벼운', '간단한', '간편식']
    },
    {
      label: '저녁 간술',
      emoji: '🍺',
      tags: ['안주가 맛있는', '고급스러운', '노포', '편안한', '가성비']
    },
    {
      label: '데이트',
      emoji: '💑',
      tags: ['분위기', '고급스러운', '인테리어', '디저트']
    }
  ]);

  // 사용자 정보 로드
  const loadUserInfo = async () => {
    try {
      if (__DEV__) {
        console.log('👤 [MyPage] 사용자 정보 로드 시작...');
        console.log('📍 API 엔드포인트: /users/me');
      }

      const startTime = Date.now();
      const response = await apiService.getMyInfo();
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [MyPage] 사용자 정보 API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [MyPage] 응답 코드: ${response.code}`);
        console.log(`📝 [MyPage] 응답 메시지: ${response.message}`);
        console.log(`📦 [MyPage] 응답 데이터:`, JSON.stringify(response.data, null, 2));
      }

      if (response.code === 200 && response.data) {
        if (__DEV__) {
          console.log(`✅ [MyPage] 사용자 정보 로드 성공`);
          console.log(`   - 닉네임: ${response.data.nickname}`);
          console.log(`   - 이메일: ${response.data.email}`);
        }
        setUserNickname(response.data.nickname);
      } else {
        if (__DEV__) {
          console.warn(`⚠️  [MyPage] 사용자 정보 API 응답 실패`);
          console.warn(`   - 코드: ${response.code}`);
          console.warn(`   - 메시지: ${response.message}`);
        }
        // 실패해도 기본값 유지
      }
    } catch (error) {
      console.error('❌ [MyPage] 사용자 정보 로드 실패:', error);
      if (__DEV__) {
        console.error('   - 에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   - 에러 메시지:', error instanceof Error ? error.message : String(error));
      }
      // 에러 발생 시 기본값 유지
    }
  };

  // 활동 데이터 로드
  const loadActivity = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      
      if (__DEV__) {
        console.log('🔄 [MyPage] 활동 데이터 로드 시작...');
        console.log('📍 API 엔드포인트: /profile/me/activity');
      }
      
      const startTime = Date.now();
      const response = await apiService.getMyActivity();
      const responseTime = Date.now() - startTime;
      
      if (__DEV__) {
        console.log(`⏱️  [MyPage] API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [MyPage] 응답 코드: ${response.code}`);
        console.log(`📝 [MyPage] 응답 메시지: ${response.message}`);
        console.log(`📦 [MyPage] 응답 데이터:`, JSON.stringify(response.data, null, 2));
      }
      
      if (response.code === 200 && response.data) {
        // 자주 방문한 장소와 뜸한 장소를 합쳐서 최신순으로 정렬
        const allPlaces = [...response.data.frequent, ...response.data.dormant];
        
        if (__DEV__) {
          console.log(`✅ [MyPage] 데이터 로드 성공`);
          console.log(`   - 자주 방문한 장소: ${response.data.frequent.length}개`);
          console.log(`   - 뜸한 장소: ${response.data.dormant.length}개`);
          console.log(`   - 전체 장소: ${allPlaces.length}개`);
        }
        
        setActivityPlaces(allPlaces);
      } else {
        if (__DEV__) {
          console.warn(`⚠️  [MyPage] API 응답 실패 또는 데이터 없음`);
          console.warn(`   - 코드: ${response.code}`);
          console.warn(`   - 메시지: ${response.message}`);
        }
        setActivityPlaces([]);
      }
    } catch (error) {
      console.error('❌ [MyPage] 활동 데이터 로드 실패:', error);
      if (__DEV__) {
        console.error('   - 에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   - 에러 메시지:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
          console.error('   - 스택 트레이스:', error.stack);
        }
      }
      setActivityPlaces([]);
      // 에러가 발생해도 화면을 표시
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 최근 검색 결과 로드
  const loadRecentSearchPlaces = async () => {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCH_PLACES_KEY);
      if (data) {
        const places: SearchPlace[] = JSON.parse(data);
        setRecentSearchPlaces(places);
        if (__DEV__) {
          console.log('✅ [MyPage] 최근 검색 결과 로드 성공:', places.length, '개');
        }
      } else {
        setRecentSearchPlaces([]);
      }
    } catch (error) {
      console.error('❌ [MyPage] 최근 검색 결과 로드 실패:', error);
      setRecentSearchPlaces([]);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadActivity(false);
    loadRecentSearchPlaces();
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // 사용자 정보와 활동 데이터를 병렬로 로드
    const loadData = async () => {
      setIsLoading(true);
      
      // 개발 모드에서 환경 정보 로그
      if (__DEV__) {
        logServerInfo();
        ApiTester.logEnvironmentInfo();
      }

      // 사용자 정보, 활동 데이터, 최근 검색 결과를 병렬로 로드
      await Promise.all([
        loadUserInfo(),
        loadActivity(false),
        loadRecentSearchPlaces(),
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // 화면 포커스 시 최근 검색 결과 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadRecentSearchPlaces();
    }, [])
  );

  // 개발 모드에서 API 테스트 실행
  const runApiTest = async () => {
    if (!__DEV__) return;
    
    Alert.alert('API 테스트', 'API 엔드포인트를 테스트하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '테스트 실행', 
        onPress: async () => {
          try {
            console.log('🧪 [MyPage] API 테스트 시작...');
            
            // 기본 테스트 실행
            const results = await ApiTester.testAllEndpoints();
            
            // MyActivity API 테스트 추가
            const myActivityStartTime = Date.now();
            try {
              const myActivityResponse = await apiService.getMyActivity();
              const myActivityResponseTime = Date.now() - myActivityStartTime;
              
              results.push({
                endpoint: 'GET /profile/me/activity',
                success: myActivityResponse.code === 200,
                responseTime: myActivityResponseTime,
                error: myActivityResponse.code !== 200 ? myActivityResponse.message : undefined,
              });
              
              if (__DEV__) {
                console.log('📊 [MyPage] MyActivity 테스트 결과:');
                console.log(`   - 성공: ${myActivityResponse.code === 200}`);
                console.log(`   - 응답 시간: ${myActivityResponseTime}ms`);
                console.log(`   - 응답 코드: ${myActivityResponse.code}`);
                if (myActivityResponse.data) {
                  console.log(`   - 자주 방문: ${myActivityResponse.data.frequent.length}개`);
                  console.log(`   - 뜸한 장소: ${myActivityResponse.data.dormant.length}개`);
                }
              }
            } catch (error) {
              results.push({
                endpoint: 'GET /profile/me/activity',
                success: false,
                responseTime: Date.now() - myActivityStartTime,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
            
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            
            console.log('✅ [MyPage] API 테스트 완료');
            console.log(`   - 성공: ${successCount}/${totalCount}`);
            results.forEach(r => {
              console.log(`   - ${r.endpoint}: ${r.success ? '✅' : '❌'} (${r.responseTime}ms)`);
              if (r.error) console.log(`     에러: ${r.error}`);
            });
            
            Alert.alert(
              'API 테스트 결과', 
              `성공: ${successCount}/${totalCount}\n\n` +
              results.map(r => 
                `${r.endpoint}: ${r.success ? '✅' : '❌'} (${r.responseTime}ms)${r.error ? `\n  ${r.error}` : ''}`
              ).join('\n\n')
            );
          } catch (error) {
            console.error('❌ [MyPage] API 테스트 중 오류:', error);
            Alert.alert('테스트 실패', `API 테스트 중 오류가 발생했습니다.\n${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}> 
      {/* 상단 헤더 */}
      <View style={styles.header}> 
        <TouchableOpacity 
          accessibilityRole="button" 
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={navigation.goBack}
          style={styles.headerIconButton}
        >
          <Ionicons name="chevron-back" size={26} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>마이페이지</Text>
        {__DEV__ ? (
          <TouchableOpacity onPress={runApiTest} style={styles.headerIconButton}>
            <Ionicons name="bug" size={20} color="#FAA770" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconButton} />
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FAA770']}
            tintColor="#FAA770"
          />
        }
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#ddd" />
            </View>
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="create-outline" size={18} color="#444447" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nicknameRow}>
              <TouchableOpacity style={styles.nicknameLabelPill} activeOpacity={0.8}>
                <Text style={styles.pillButtonText}>닉네임</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nicknameValuePill} activeOpacity={0.8}>
                <Text style={styles.nicknameValueText}>{userNickname}</Text>
                <Ionicons name="create-outline" size={14} color="rgba(0,0,0,0.9)" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileButtons}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
                <Text style={styles.actionButtonText}>저장된 장소 불러오기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                activeOpacity={0.85} 
                onPress={() => navigation.navigate('ListPage')}
              >
                <Text style={styles.actionButtonText}>나의 저장 장소 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* 키워드 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{userNickname} 님의 키워드</Text>
          </View>
          {userKeywords.map((keyword, index) => (
            <View key={index} style={styles.keywordRow}>
              <View style={styles.keywordIcon}>
                <Text style={styles.keywordEmoji}>{keyword.emoji}</Text>
              </View>
              <View style={styles.keywordInfo}>
                <Text style={styles.keywordLabel}>{keyword.label}</Text>
                <Text style={styles.keywordTags}>
                  {keyword.tags.map(tag => `#${tag}`).join(' ')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 최근 추천 장소 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{userNickname} 님의 최근 추천 장소</Text>
          </View>
          {recentSearchPlaces.length > 0 ? (
            recentSearchPlaces.slice(0, 3).map((place, index) => {
              // 해시태그 추출 함수 (SearchResult와 동일)
              const extractHashtags = (mood?: string, review?: string, color?: string): string[] => {
                const hashtags: string[] = [];
                const keywords = ['따뜻한', '디저트', '크림톤', '조용한', '차가 맛있는', '사진 찍기 좋은', '친절', '커피', '인테리어', '대화하기'];
                const allText = [mood, review, color].filter(Boolean).join(' ');
                keywords.forEach(keyword => {
                  if (allText.includes(keyword) && !hashtags.includes(keyword)) {
                    hashtags.push(keyword);
                  }
                });
                if (hashtags.length === 0) {
                  return ['따뜻한', '디저트', '조용한'];
                }
                return hashtags.slice(0, 4);
              };

              const hashtags = extractHashtags(place.mood, place.review, place.color);
              const emojis = ['🍰', '🖼', '🌻'];
              const emoji = emojis[index % emojis.length];

              return (
                <View key={place.id} style={styles.recommendedPlace}>
                  {/* Place Image */}
                  <Image
                    source={{ uri: place.image_url }}
                    style={styles.placeImage}
                    defaultSource={require('../../assets/map_static.png')}
                  />

                  {/* Place Info */}
                  <View style={styles.placeInfo}>
                    {/* Place Name with Emoji */}
                    <View style={styles.placeNameRow}>
                      <Text style={styles.placeEmoji}>{emoji}</Text>
                      <Text style={styles.placeName}>{place.name}</Text>
                    </View>

                    {/* Hashtags */}
                    <Text style={styles.placeHashtags} numberOfLines={2}>
                      {hashtags.map(tag => `#${tag}`).join(' ')}
                    </Text>

                    {/* Review with Icon */}
                    <View style={styles.placeComment}>
                      <Image
                        source={require('../../assets/ssoklogo-removebg-preview.png')}
                        style={styles.commentIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.commentText} numberOfLines={1}>
                        {place.review || '좋은 장소입니다'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : activityPlaces.length > 0 ? (
            activityPlaces.slice(0, 3).map((place, index) => (
              <TouchableOpacity key={index} style={styles.recommendedPlace} activeOpacity={0.7}>
                <View style={styles.placeImage}>
                  <Text style={styles.placeImageText}>📷</Text>
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeIcon}>{place.emoji}</Text>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <View style={styles.placeMeta}>
                    <Text style={styles.placeKeywords}>
                      {place.isClosed ? '#휴업중' : '#영업중'} • {place.distanceM}m
                    </Text>
                  </View>
                  <View style={styles.placeComment}>
                    <Text style={styles.commentEmoji}>😊</Text>
                    <Text style={styles.commentText}>내 키워드</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyActivity}>최근 추천 장소가 없습니다</Text>
          )}
        </View>

        {/* 로딩 상태 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FAA770" />
            <Text style={styles.loadingText}>장소 정보를 불러오는 중...</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "600", color: "#111" },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  
  // 프로필 섹션
  profileSection: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 36,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 147,
    height: 147,
    borderRadius: 30,
    backgroundColor: "#f3f6f8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  editIcon: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#444447",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    paddingTop: 5,
  },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileButtons: {
    marginTop: 14,
    gap: 10,
    width: 203,
  },
  nicknameLabelPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 59,
    height: 32,
    backgroundColor: "#FBE0AD",
    borderWidth: 1,
    borderColor: "#FAA770",
    borderRadius: 6,
  },
  nicknameValuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: "#FAA770",
  },
  nicknameValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(0,0,0,0.9)",
  },
  pillButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,0,0,0.9)",
  },
  actionButton: {
    height: 32,
    paddingHorizontal: 12,
    width: "100%",
    backgroundColor: "#FBE0AD",
    borderWidth: 1,
    borderColor: "#FAA770",
    borderRadius: 6,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,0,0,0.9)",
    textAlign: "center",
    width: "100%",
  },
  newListButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  newListText: { marginLeft: 10, fontSize: 16, color: "#333" },
  
  // 섹션 스타일
  section: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  
  // 키워드 스타일
  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  keywordIcon: {
    width: 34,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  keywordEmoji: {
    fontSize: 20,
  },
  keywordInfo: {
    flex: 1,
  },
  keywordLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  keywordTags: {
    fontSize: 14,
    fontWeight: "500",
    color: "#939396",
    lineHeight: 17,
  },
  
  // 추천 장소 스타일
  recommendedPlace: {
    flexDirection: "row",
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    gap: 18,
  },
  placeImage: {
    width: 110,
    height: 110,
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
    marginRight: 12,
  },
  placeImageText: {
    fontSize: 40,
  },
  placeInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  placeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  placeEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  placeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  placeName: {
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    color: "#000",
  },
  placeHashtags: {
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    color: "#939396",
    marginBottom: 8,
  },
  placeKeywords: {
    fontSize: 14,
    fontWeight: "500",
    color: "#939396",
    marginBottom: 8,
  },
  placeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeComment: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentIcon: {
    width: 29,
    height: 29,
    borderRadius: 11,
    marginRight: 8,
  },
  commentEmoji: {
    fontSize: 20,
    borderWidth: 2,
    borderColor: "#FAA770",
    borderRadius: 11,
    width: 29,
    height: 29,
    textAlign: "center",
    lineHeight: 25,
  },
  commentText: {
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    color: "#000",
    flex: 1,
  },
  emptyActivity: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowTextBox: { flex: 1 },
  rowTitle: { fontSize: 18, color: "#111", fontWeight: "600" },
  rowSub: { marginLeft: 4, fontSize: 13, color: "#888" },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});


