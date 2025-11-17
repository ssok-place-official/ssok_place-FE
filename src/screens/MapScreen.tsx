// src/screens/MapScreen.tsx
import React, { useRef, useMemo, useCallback, useState } from "react";
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
import BottomSheet from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import NaverMapView, { NaverMapMarker as Marker } from '@mj-studio/react-native-naver-map';
import { apiService, Friend } from '../services/api';

export default function MapScreen() {
  const bottomSheetRef = useRef<React.ComponentRef<typeof BottomSheet>>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // 친구 목록 상태 관리
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [favoriteFriends, setFavoriteFriends] = useState<Set<number>>(new Set());
  
  // BottomSheet 높이 설정
  const snapPoints = useMemo(() => ["25%", "50%"], []);

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

  // 친구 목록 열기
  const openFriends = useCallback(() => {
    bottomSheetRef.current?.expand();
    if (friends.length === 0) {
      fetchFriends();
    }
  }, [friends.length, fetchFriends]);

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

  const categories = ["카페", "음식점", "술집", "놀거리", "숙소", "편의시설"];

  return (
    <View style={styles.container}>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 지도 영역: Naver Map */}
      <NaverMapView
        style={styles.map}
        center={{ latitude: 37.5665, longitude: 126.9780, zoom: 14 }}
        useTextureView
      >
        <Marker coordinate={{ latitude: 37.5665, longitude: 126.9780 }} caption={{ text: '서울 시청' }} />
      </NaverMapView>

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
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints}>
        <View style={styles.sheetContent}>
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
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  chipScroll: { marginTop: 12, marginBottom: 8, paddingHorizontal: 10 },
  chip: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: { fontSize: 13, color: "#333" },
  map: { flex: 1, marginTop: 6 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  tabButton: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 12, marginTop: 4, color: "#000" },
  
  // BottomSheet 스타일
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