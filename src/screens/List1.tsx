// src/screens/List1.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiService, ActivityPlace, PlaceDetail } from "../services/api";

export default function List1() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { listName = "아늑함", count = 30 } = (route.params as any) || {};

  const [places, setPlaces] = useState<PlaceDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API로 장소 목록 불러오기 (MapScreen과 동일한 방식)
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      setIsLoading(true);
      
      // 1. getMyActivity()를 사용하여 ActivityPlace 목록 불러오기 (MapScreen과 동일)
      const activityResponse = await apiService.getMyActivity();
      
      if (activityResponse.code === 200 && activityResponse.data) {
        // 자주 방문한 장소와 뜸한 장소를 합쳐서 최대 30개까지만 표시
        const allActivityPlaces = [...activityResponse.data.frequent, ...activityResponse.data.dormant];
        const activityPlacesList = allActivityPlaces.slice(0, 30);
        
        if (__DEV__) {
          console.log(`✅ [List1] ActivityPlace 목록 로드 성공: ${activityPlacesList.length}개`);
        }
        
        // 2. 각 placeId로 상세 정보 가져오기 (GET /places/{placeId}) - MapScreen과 동일
        const startTime = Date.now();
        const detailPromises = activityPlacesList.map(async (activityPlace) => {
          try {
            if (__DEV__) {
              console.log(`   🔄 [List1] 장소 상세 정보 로드 중: GET /places/${activityPlace.placeId}`);
            }

            const response = await apiService.getPlaceDetail(String(activityPlace.placeId), true); // includeInsight=true
            if (response.code === 200 && response.data) {
              const detail = response.data;
              
              // 원본 placeId를 명시적으로 저장 (MapScreen과 동일)
              const detailWithPlaceId: PlaceDetail = {
                ...detail,
                placeId: detail.placeId || activityPlace.placeId,
              };

              if (__DEV__) {
                console.log(`   ✅ [List1] 장소 상세 정보 로드 성공: ${detail.name} (placeId: ${activityPlace.placeId})`);
              }
              
              return detailWithPlaceId;
            } else {
              if (__DEV__) {
                console.warn(`   ⚠️  [List1] 장소 상세 정보 로드 실패: ID ${activityPlace.placeId} - ${response.message}`);
              }
              return null;
            }
          } catch (error) {
            if (__DEV__) {
              console.error(`   ❌ [List1] 장소 상세 정보 로드 에러: ID ${activityPlace.placeId}`, error);
            }
            return null;
          }
        });

        const details = await Promise.all(detailPromises);
        // null 제거
        const validDetails = details.filter((detail): detail is PlaceDetail => detail !== null);
        
        const responseTime = Date.now() - startTime;
        
        if (__DEV__) {
          console.log(`⏱️  [List1] 장소 상세 정보 로드 완료: ${responseTime}ms`);
          console.log(`   - 유효한 장소: ${validDetails.length}개`);
        }
        
        setPlaces(validDetails);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error('❌ [List1] 장소 목록 로드 실패:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 장소 클릭 시 MapScreen으로 이동하고 지도에 표시 (MapScreen과 동일한 형식)
  const handlePlacePress = (place: PlaceDetail) => {
    if (__DEV__) {
      console.log(`📍 [List1] 장소 클릭: ${place.name} (placeId: ${place.placeId})`);
    }
    
    // MapScreen으로 이동하면서 선택된 장소 정보 전달 (MapScreen에서 사용하는 형식과 동일)
    (navigation as any).navigate('Map', {
      selectedPlaceId: place.placeId,
      selectedPlaceName: place.name,
      selectedPlaceLat: place.lat,
      selectedPlaceLng: place.lng,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>나의 저장 장소</Text>
        </View>
        <TouchableOpacity style={styles.sortButton}>
          <View style={styles.sortContainer}>
            <Text style={styles.sortText}>최신순</Text>
            <View style={styles.sortIcon} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 장소 목록 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FAA770" />
            <Text style={styles.loadingText}>장소를 불러오는 중...</Text>
          </View>
        ) : places.length > 0 ? (
          places.map((place, index) => (
            <TouchableOpacity 
              key={place.placeId || place.id || index} 
              style={styles.placeRow}
              onPress={() => handlePlacePress(place)}
              activeOpacity={0.7}
            >
              <View style={styles.placeIconContainer}>
                <Image
                  source={require('../../assets/map_static.png')}
                  style={styles.placeIcon}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={18} color="#8C8C8C" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>저장된 장소가 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: -0.02,
  },
  sortButton: {
    width: 60,
    alignItems: "flex-end",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#828282",
    letterSpacing: -0.02,
  },
  sortIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#828282",
    marginLeft: 4,
    transform: [{ rotate: "180deg" }],
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderColor: "#DADADA",
  },
  placeIconContainer: {
    width: 33.91,
    height: 34.8,
    borderRadius: 11,
    marginRight: 12,
    overflow: "hidden",
  },
  placeIcon: {
    width: "100%",
    height: "100%",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#222225",
    letterSpacing: -0.02,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    fontWeight: "400",
    color: "#828282",
    letterSpacing: -0.02,
  },
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#828282",
  },
});

