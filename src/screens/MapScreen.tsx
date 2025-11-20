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
  Image,
} from "react-native";
// ✅ 새 패키지(Default export)
import Ionicons from '@react-native-vector-icons/ionicons';
//import MaterialIcons from '@react-native-vector-icons/material-icons';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Pressable } from 'react-native';
// @ts-ignore - 타입 정의 문제로 인한 임시 처리
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { apiService, Friend } from '../services/api';
const placesCsv = require('../../places_with_coordinates.csv');

type CsvPlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());

  return cells;
};

const parsePlacesCsv = (csvText: string): CsvPlace[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const [, ...rows] = lines;

  return rows
    .map((row, idx) => {
      const cells = splitCsvLine(row);
      if (cells.length < 4) {
        return null;
      }

      const [name, address, lat, lng] = cells;
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      return {
        id: `${name}-${idx}`,
        name,
        address,
        latitude,
        longitude,
      };
    })
    .filter((place): place is CsvPlace => place !== null);
};

export default function MapScreen() {
  const bottomSheetRef = useRef<React.ComponentRef<typeof BottomSheet>>(null);
  const navigation = useNavigation();
  const initialCamera = useMemo(
    () => ({ latitude: 37.2840131, longitude: 127.0141105, zoom: 14 }),
    []
  );
  const [mapKey, setMapKey] = useState(0);
  const [csvPlaces, setCsvPlaces] = useState<CsvPlace[]>([]);

  // 친구 목록 상태 관리
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [favoriteFriends, setFavoriteFriends] = useState<Set<number>>(new Set());
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [areMarkersVisible, setAreMarkersVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCsvMarkers = async () => {
      try {
        const assetSource = Image.resolveAssetSource(placesCsv);
        if (!assetSource?.uri) {
          throw new Error('CSV asset URI를 찾을 수 없습니다.');
        }

        const response = await fetch(assetSource.uri);
        const text = await response.text();
        const parsed = parsePlacesCsv(text);

        if (isMounted) {
          setCsvPlaces(parsed);
        }
      } catch (err) {
        console.error('CSV 마커 데이터 로드 실패:', err);
      }
    };

    loadCsvMarkers();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const response = await apiService.getFriends({
        search: search || undefined,
        page: 0,
        size: 50,
      });

      if (response.code === 200 && response.data) {
        setFriends(response.data.content);
      } else {
        setError('친구 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('친구 목록 조회 실패:', err);
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

  const toggleMyButton = useCallback(() => {
    setIsMyButtonActive(prev => !prev);
    setAreMarkersVisible(prev => !prev);
  }, []);

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
        {areMarkersVisible &&
          csvPlaces.map((place) => (
            <NaverMapMarkerOverlay
              key={place.id}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{ text: place.name }}
            />
          ))}
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