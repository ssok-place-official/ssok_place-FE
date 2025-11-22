// src/screens/MapScreen.tsx
import React, { useRef, useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
// ✅ 새 패키지(Default export)
import Ionicons from '@react-native-vector-icons/ionicons';
//import MaterialIcons from '@react-native-vector-icons/material-icons';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Pressable } from 'react-native';
// @ts-ignore - 타입 정의 문제로 인한 임시 처리
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { apiService, Friend, Place, PlaceDetail } from '../services/api';

export default function MapScreen() {
  const bottomSheetRef = useRef<React.ComponentRef<typeof BottomSheet>>(null);
  const navigation = useNavigation();
  const initialCamera = useMemo(
    () => ({ latitude: 37.2840131, longitude: 127.0141105, zoom: 14 }),
    []
  );
  const [mapKey, setMapKey] = useState(0);
  const [placeIds, setPlaceIds] = useState<string[]>([]); // placeId 목록만 저장
  const [placeDetails, setPlaceDetails] = useState<PlaceDetail[]>([]); // 상세 정보 저장
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);

  // 친구 목록 상태 관리
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [favoriteFriends, setFavoriteFriends] = useState<Set<number>>(new Set());
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [areMarkersVisible, setAreMarkersVisible] = useState(false);

  // placeId 목록 로드 (GET /profile/me/activity로 placeId 추출)
  const loadPlaceIds = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('📍 [MapScreen] placeId 목록 로드 시작...');
        console.log('📍 API 엔드포인트: GET /profile/me/activity');
      }

      const startTime = Date.now();
      const response = await apiService.getMyActivity();
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [MapScreen] API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [MapScreen] 응답 코드: ${response.code}`);
        console.log(`📝 [MapScreen] 응답 메시지: ${response.message}`);
      }

      if (response.code === 200 && response.data) {
        // 자주 방문한 장소와 뜸한 장소에서 placeId 추출
        const allActivityPlaces = [...response.data.frequent, ...response.data.dormant];
        
        // placeId 또는 id 추출
        const ids = allActivityPlaces
          .map((place) => {
            // ActivityPlace 타입은 placeId를 가지고 있음
            const placeId = place.placeId ? String(place.placeId) : null;
            return placeId;
          })
          .filter((id): id is string => id !== null);

        if (__DEV__) {
          console.log(`✅ [MapScreen] placeId 목록 로드 성공`);
          console.log(`   - 자주 방문한 장소: ${response.data.frequent.length}개`);
          console.log(`   - 뜸한 장소: ${response.data.dormant.length}개`);
          console.log(`   - 전체 장소: ${allActivityPlaces.length}개`);
          console.log(`   - 유효한 placeId: ${ids.length}개`);
          console.log(`   - placeId 목록:`, ids);
        }

        setPlaceIds(ids);
        
        // placeId가 있으면 MY 버튼 활성화
        if (ids.length > 0) {
          setIsMyButtonActive(true);
          setPlaceDetails([]);
        }
      } else {
        if (__DEV__) {
          console.warn(`⚠️  [MapScreen] placeId 목록 API 응답 실패`);
          console.warn(`   - 코드: ${response.code}`);
          console.warn(`   - 메시지: ${response.message}`);
        }
        setPlaceIds([]);
      }
    } catch (error) {
      console.error('❌ [MapScreen] placeId 목록 로드 실패:', error);
      if (__DEV__) {
        console.error('   - 에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   - 에러 메시지:', error instanceof Error ? error.message : String(error));
      }
      setPlaceIds([]);
    }
  }, []);

  // 컴포넌트 마운트 시 placeId 목록 로드
  useEffect(() => {
    loadPlaceIds();
  }, [loadPlaceIds]);

  // 카테고리 칩 아래 위치 계산
  // 상단 여백 40px + 검색 바 높이 ~56px + 카테고리 칩 marginTop 12px + 칩 높이 32px = 약 140px
  const topOffset = 40 + 56 + 12 + 32;

  // BottomSheet 높이 설정 - 카테고리 칩 아래부터 화면 끝까지
  const snapPoints = useMemo(() => {
    // 화면 높이에서 topOffset과 하단 바 높이를 뺀 값
    return ["75%", "90%"];
  }, []);

  // 친구 목록 조회
  const fetchFriends = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (__DEV__) {
        console.log('👥 [MapScreen] 친구 목록 조회 시작...');
        console.log('📍 API 엔드포인트: GET /friends');
        if (search) {
          console.log(`   - 검색어: ${search}`);
        }
      }

      const startTime = Date.now();
      const response = await apiService.getFriends({
        search: search || undefined,
        page: 0,
        size: 50,
      });
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [MapScreen] 친구 목록 API 응답 시간: ${responseTime}ms`);
        console.log(`📊 [MapScreen] 응답 코드: ${response.code}`);
        console.log(`📝 [MapScreen] 응답 메시지: ${response.message}`);
      }

      if (response.code === 200 && response.data) {
        if (__DEV__) {
          console.log(`✅ [MapScreen] 친구 목록 로드 성공`);
          console.log(`   - 전체 친구 수: ${response.data.totalElements}개`);
          console.log(`   - 현재 페이지 친구 수: ${response.data.content.length}개`);
          console.log(`   - 페이지 정보: ${response.data.page + 1}/${response.data.totalPages}`);
        }
        setFriends(response.data.content);
      } else {
        const errorMessage = response.message || '친구 목록을 불러오는데 실패했습니다.';
        if (__DEV__) {
          console.warn(`⚠️  [MapScreen] 친구 목록 API 응답 실패`);
          console.warn(`   - 코드: ${response.code}`);
          console.warn(`   - 메시지: ${errorMessage}`);
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ [MapScreen] 친구 목록 조회 실패:', err);
      if (__DEV__) {
        console.error('   - 에러 타입:', err instanceof Error ? err.constructor.name : typeof err);
        console.error('   - 에러 메시지:', err instanceof Error ? err.message : String(err));
        if (err instanceof Error && err.stack) {
          console.error('   - 스택 트레이스:', err.stack);
        }
      }
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 친구 목록 열기/닫기 토글
  const openFriends = useCallback(() => {
    if (isBottomSheetOpen) {
      // BottomSheet가 열려있으면 닫기
      bottomSheetRef.current?.close();
      setIsBottomSheetOpen(false);
    } else {
      // BottomSheet가 닫혀있으면 열기
      if (friends.length === 0) {
        fetchFriends();
      }
      bottomSheetRef.current?.snapToIndex(0);
      setIsBottomSheetOpen(true);
    }
  }, [isBottomSheetOpen, friends.length, fetchFriends]);

  // BottomSheet 위치 변경 핸들러
  const handleSheetChange = useCallback((index: number) => {
    setIsBottomSheetOpen(index >= 0);
  }, []);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // 디바운스 처리 (실제로는 debounce 라이브러리 사용 권장)
    const timeoutId = setTimeout(() => {
      fetchFriends(text);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fetchFriends]);

  // 친구 선택 토글
  const toggleFriendSelection = useCallback((userId: number) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // 친구 즐겨찾기 토글
  const toggleFavorite = useCallback((userId: number) => {
    setFavoriteFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const categories = ["카페", "음식점", "술집", "놀거리", "숙소"];
  const [isMyButtonActive, setIsMyButtonActive] = useState(false);

  // 장소 상세 정보 로드 (MY 버튼 활성화 시) - GET /places/{placeId} 사용
  const loadPlaceDetails = useCallback(async () => {
    if (placeIds.length === 0) {
      if (__DEV__) {
        console.warn('⚠️  [MapScreen] placeId 목록이 비어있습니다.');
      }
      return;
    }

    try {
      setIsLoadingPlaceDetails(true);
      
      if (__DEV__) {
        console.log('📍 [MapScreen] 장소 상세 정보 로드 시작...');
        console.log(`   - 로드할 placeId 수: ${placeIds.length}개`);
        console.log(`   - placeId 목록:`, placeIds);
      }

      const startTime = Date.now();
      
      // 각 placeId로 상세 정보 가져오기 (GET /places/{placeId})
      const detailPromises = placeIds.map(async (placeId) => {
        try {
          if (__DEV__) {
            console.log(`   🔄 장소 상세 정보 로드 중: GET /places/${placeId}`);
          }

          const response = await apiService.getPlaceDetail(placeId);
          if (response.code === 200 && response.data) {
            const detail = response.data;

            if (__DEV__) {
              console.log(`   ✅ 장소 상세 정보 로드 성공: ${detail.name} (ID: ${placeId})`);
              console.log(`      - 전체 데이터:`, JSON.stringify(detail, null, 2));
              console.log(`      - 좌표 확인: lat=${detail.lat}, lng=${detail.lng}`);
              console.log(`      - 좌표 타입: lat=${typeof detail.lat}, lng=${typeof detail.lng}`);
              console.log(`      - 좌표 유효성: lat=${!isNaN(Number(detail.lat))}, lng=${!isNaN(Number(detail.lng))}`);
              console.log(`      - 이모지: ${detail.emoji || '없음'}`);
              if (detail.insight) {
                console.log(`      - 인사이트 이모지: ${detail.insight.emoji}`);
                console.log(`      - 인사이트: ${detail.insight.emoji} ${detail.insight.keywords.map(k => k.term).join(', ')}`);
              }
            }
            
            // 좌표가 없으면 null 반환
            if (detail.lat == null || detail.lng == null || isNaN(Number(detail.lat)) || isNaN(Number(detail.lng))) {
              if (__DEV__) {
                console.warn(`   ⚠️  좌표가 유효하지 않음: lat=${detail.lat}, lng=${detail.lng}`);
              }
              return null;
            }
            
            return detail;
          } else {
            if (__DEV__) {
              console.warn(`   ⚠️  장소 상세 정보 로드 실패: ID ${placeId} - ${response.message}`);
            }
            return null;
          }
        } catch (error) {
          if (__DEV__) {
            console.error(`   ❌ 장소 상세 정보 로드 에러: ID ${placeId}`, error);
          }
          return null;
        }
      });

      const details = await Promise.all(detailPromises);
      // lat, lng가 있는 장소만 필터링
      const validDetails = details.filter((detail): detail is PlaceDetail => {
        if (detail === null) return false;
        const lat = Number(detail.lat);
        const lng = Number(detail.lng);
        const isValid = !isNaN(lat) && !isNaN(lng) && lat != null && lng != null;
        
        if (__DEV__ && !isValid) {
          console.warn(`   ⚠️  유효하지 않은 좌표 필터링:`, detail);
        }
        
        return isValid;
      });
      
      const responseTime = Date.now() - startTime;

      if (__DEV__) {
        console.log(`⏱️  [MapScreen] 장소 상세 정보 로드 완료: ${responseTime}ms`);
        console.log(`   - 성공: ${validDetails.length}개 / 전체: ${placeIds.length}개`);
        console.log(`   - 유효한 장소 상세 정보:`, validDetails.map(p => ({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          id: p.id
        })));
      }

      setPlaceDetails(validDetails);
      
      // 유효한 장소가 있으면 마커 표시 활성화
      if (validDetails.length > 0) {
        setAreMarkersVisible(true);
        if (__DEV__) {
          console.log(`✅ [MapScreen] 마커 표시 활성화: ${validDetails.length}개 마커`);
        }
      } else {
        setAreMarkersVisible(false);
        if (__DEV__) {
          console.warn(`⚠️  [MapScreen] 유효한 장소가 없어 마커를 표시할 수 없습니다.`);
        }
      }
    } catch (error) {
      console.error('❌ [MapScreen] 장소 상세 정보 로드 실패:', error);
      setPlaceDetails([]);
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  }, [placeIds]);

  const toggleMyButton = useCallback(async () => {
    const willBeActive = !isMyButtonActive;
    setIsMyButtonActive(willBeActive);

    if (willBeActive) {
      // MY 버튼을 활성화할 때 장소 상세 정보 로드 (GET /places/{placeId})
      if (placeIds.length > 0) {
        if (placeDetails.length === 0) {
          // 상세 정보가 없으면 로드
          await loadPlaceDetails();
        } else {
          // 이미 로드된 상세 정보가 있으면 바로 표시
          setAreMarkersVisible(true);
          if (__DEV__) {
            console.log(`✅ [MapScreen] 이미 로드된 장소 상세 정보로 마커 표시: ${placeDetails.length}개`);
          }
        }
      } else {
        if (__DEV__) {
          console.warn(`⚠️  [MapScreen] placeId 목록이 비어있어 마커를 표시할 수 없습니다.`);
        }
        setAreMarkersVisible(false);
      }
    } else {
      // MY 버튼 비활성화 시 마커 숨김
      setAreMarkersVisible(false);
    }
  }, [isMyButtonActive, placeIds, placeDetails, loadPlaceDetails]);

  useFocusEffect(
    useCallback(() => {
      setMapKey(prev => prev + 1);
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* 지도 영역: Naver Map - 배경으로 배치 */}
      <NaverMapView
        key={mapKey}
        style={styles.map}
        initialCamera={initialCamera}
        useTextureView
      >
        {areMarkersVisible && placeDetails.length > 0 && (
          <>
            {placeDetails.map((place) => {
              const lat = Number(place.lat);
              const lng = Number(place.lng);
              
              if (__DEV__) {
                console.log(`📍 [MapScreen] 마커 렌더링: ${place.name}`, {
                  lat,
                  lng,
                  isValid: !isNaN(lat) && !isNaN(lng)
                });
              }
              
              // 좌표가 유효한 경우에만 마커 생성
              if (isNaN(lat) || isNaN(lng)) {
                if (__DEV__) {
                  console.warn(`⚠️  [MapScreen] 유효하지 않은 좌표로 마커 생성 스킵: ${place.name}`, { lat, lng });
                }
                return null;
              }
              
              // 장소의 emoji 가져오기 (place.emoji 또는 insight.emoji)
              const placeEmoji = place.emoji || place.insight?.emoji || '📍';
              
              if (__DEV__) {
                console.log(`   - 이모지: ${placeEmoji}`);
                console.log(`   - place.emoji: ${place.emoji}`);
                console.log(`   - place.insight?.emoji: ${place.insight?.emoji}`);
              }
              
              return (
                <NaverMapMarkerOverlay
                  key={place.id || place.placeId || `place-${lat}-${lng}`}
                  latitude={lat}
                  longitude={lng}
                  caption={{ text: place.name }}
                  width={50}
                  height={50}
                >
                  <View 
                    key={`${placeEmoji}-${place.id || place.placeId}`}
                    collapsable={false}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#FAA770',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{placeEmoji}</Text>
                  </View>
                </NaverMapMarkerOverlay>
              );
            })}
          </>
        )}
      </NaverMapView>

      {/* 상단 검색 바 */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="검색어를 입력하세요"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* 카테고리 Chips */}
      <View style={styles.chipRow}>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MY 버튼 */}
      <TouchableOpacity
        style={[styles.myButton, isMyButtonActive && styles.myButtonActive]}
        activeOpacity={0.8}
        onPress={toggleMyButton}
      >
        <Text style={[styles.myButtonLabel, isMyButtonActive && styles.myButtonLabelActive]}>
          MY
        </Text>
      </TouchableOpacity>

      {/* 하단 툴바 */}
      <View style={styles.bottomBar}>
        {/* 왼쪽: 친구 BottomSheet 열기 */}
        <TouchableOpacity style={styles.tabButton} onPress={openFriends}>
          <Ionicons name="people-outline" size={28} color="#000" />
          <Text style={styles.tabLabel}>친구</Text>
        </TouchableOpacity>

        {/* 가운데: 자연어 검색 */}
        <Pressable
          onPress={() => (navigation as any).navigate('SearchScreen')}
          style={({ pressed }: { pressed: boolean }) => [
            styles.tabButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
          android_ripple={{ color: '#e9e9e9' }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="자연어 검색 열기"
        >
          <Ionicons name="search-circle-outline" size={32} color="#000" />
          <Text style={styles.tabLabel}>검색</Text>
        </Pressable>

        {/* 오른쪽: 마이페이지 */}
        <TouchableOpacity style={styles.tabButton} onPress={() => (navigation as any).navigate('MyPage')}>
          <Ionicons name="person-circle-outline" size={30} color="#000" />
          <Text style={styles.tabLabel}>마이페이지</Text>
        </TouchableOpacity>
      </View>

      {/* BottomSheet: 친구 목록 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        topInset={topOffset}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        style={styles.bottomSheet}
        onChange={handleSheetChange}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* 검색 바 */}
          <View style={styles.friendsSearchBar}>
            <Ionicons name="search" size={20} color="#aaa" />
            <TextInput
              style={styles.friendsSearchInput}
              placeholder="이름으로 친구를 검색하세요"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            <TouchableOpacity style={styles.searchActionButton}>
              <Ionicons name="add" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchActionButton}>
              <Ionicons name="mic" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchActionButton}>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 친구 목록 */}
          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>친구 목록을 불러오는 중...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchFriends()}>
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>친구가 없습니다</Text>
                <Text style={styles.emptySubText}>새로운 친구를 추가해보세요</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.userId} style={styles.friendItem}>
                  {/* 즐겨찾기 별 */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(friend.userId)}
                  >
                    <Ionicons
                      name={favoriteFriends.has(friend.userId) ? "star" : "star-outline"}
                      size={20}
                      color={favoriteFriends.has(friend.userId) ? "#FFD700" : "#ccc"}
                    />
                  </TouchableOpacity>

                  {/* 프로필 이미지 */}
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitial}>
                      {friend.nickname.charAt(0)}
                    </Text>
                  </View>

                  {/* 친구 정보 */}
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendNickname}>{friend.nickname}</Text>
                    <Text style={styles.friendStatus}>
                      {friend.status === 'ACCEPTED' ? '친구' : '요청 중'}
                    </Text>
                  </View>

                  {/* 토글 스위치 */}
                  <Switch
                    value={selectedFriends.has(friend.userId)}
                    onValueChange={() => toggleFriendSelection(friend.userId)}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor={selectedFriends.has(friend.userId) ? '#FFFFFF' : '#FFFFFF'}
                  />

                  {/* 더보기 버튼 */}
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: 'relative',
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginHorizontal: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    position: 'relative',
    zIndex: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  chipRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 0,
    paddingHorizontal: 22,
    gap: 10,
    position: 'relative',
    zIndex: 10,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADADA",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 10,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    color: "rgba(0, 0, 0, 0.9)"
  },
  myButton: {
    position: 'absolute',
    top: 150,
    right: 16,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 0.6,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
    elevation: 3,
  },
  myButtonActive: {
    borderColor: '#FAA770',
  },
  myButtonLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D9D9D9',
  },
  myButtonLabelActive: {
    color: '#FAA770',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabButton: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 12, marginTop: 4, color: "#000" },

  // BottomSheet 스타일
  bottomSheet: {
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  bottomSheetHandle: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 48,
    height: 4,
    borderRadius: 100,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // 친구 검색 바
  friendsSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  friendsSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  searchActionButton: {
    marginLeft: 8,
    padding: 4,
  },

  // 친구 목록
  friendsList: {
    flex: 1,
  },

  // 친구 아이템
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  favoriteButton: {
    marginRight: 12,
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  friendInfo: {
    flex: 1,
  },
  friendNickname: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: "#666",
  },
  moreButton: {
    marginLeft: 8,
    padding: 4,
  },

  // 로딩 상태
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },

  // 에러 상태
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // 빈 상태
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 14,
    color: "#999",
  },
});