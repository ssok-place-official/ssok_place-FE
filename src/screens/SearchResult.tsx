import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchPlace } from '../services/api';

const RECENT_SEARCH_PLACES_KEY = 'recent_search_places';
const MAX_RECENT_PLACES = 10;

interface SearchResultRouteParams {
  places: SearchPlace[];
  searchParams: {
    mood?: string;
    review?: string;
    color?: string;
  };
}

// 해시태그 추출 함수 (place의 mood, review, color 텍스트에서 키워드 추출)
const extractHashtags = (mood?: string, review?: string, color?: string): string[] => {
  const hashtags: string[] = [];
  
  // 텍스트에서 키워드 추출 (간단한 키워드 매칭)
  const keywords = ['따뜻한', '디저트', '크림톤', '조용한', '차가 맛있는', '사진 찍기 좋은', '친절', '커피', '인테리어', '대화하기'];
  
  const allText = [mood, review, color].filter(Boolean).join(' ');
  
  keywords.forEach(keyword => {
    if (allText.includes(keyword) && !hashtags.includes(keyword)) {
      hashtags.push(keyword);
    }
  });
  
  // 기본 해시태그 (키워드가 없을 경우)
  if (hashtags.length === 0) {
    return ['따뜻한', '디저트', '조용한'];
  }
  
  return hashtags.slice(0, 4); // 최대 4개
};

export default function SearchResult() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { places, searchParams } = (route.params as SearchResultRouteParams) || { places: [], searchParams: {} };

  // 검색 결과를 AsyncStorage에 저장
  useEffect(() => {
    const saveSearchResults = async () => {
      if (places.length === 0) return;

      try {
        // 기존 검색 결과 불러오기
        const existingData = await AsyncStorage.getItem(RECENT_SEARCH_PLACES_KEY);
        let recentPlaces: SearchPlace[] = existingData ? JSON.parse(existingData) : [];

        // 새로운 검색 결과 추가 (중복 제거)
        places.forEach(place => {
          const exists = recentPlaces.some(p => p.id === place.id);
          if (!exists) {
            recentPlaces.unshift(place); // 최신순으로 앞에 추가
          }
        });

        // 최대 개수 제한
        recentPlaces = recentPlaces.slice(0, MAX_RECENT_PLACES);

        // 저장
        await AsyncStorage.setItem(RECENT_SEARCH_PLACES_KEY, JSON.stringify(recentPlaces));

        if (__DEV__) {
          console.log('✅ [SearchResult] 검색 결과 저장 완료:', recentPlaces.length, '개');
        }
      } catch (error) {
        console.error('❌ [SearchResult] 검색 결과 저장 실패:', error);
      }
    };

    saveSearchResults();
  }, [places]);

  // 카테고리별로 장소 분류
  const categorizedPlaces = React.useMemo(() => {
    const categories: Array<{ title: string; place: SearchPlace | null; emoji: string }> = [];
    
    // mood 기반 카테고리
    if (searchParams.mood && places.length > 0) {
      categories.push({
        title: '따뜻한 조명과 디저트가 맛있는 장소:',
        place: places[0] || null,
        emoji: '🍰',
      });
    }
    
    // color 기반 카테고리
    if (searchParams.color && places.length > 1) {
      categories.push({
        title: '따뜻한 색감과 우드톤 장소:',
        place: places[1] || null,
        emoji: '🖼',
      });
    }
    
    // review 기반 카테고리
    if (searchParams.review && places.length > 2) {
      categories.push({
        title: '따뜻한 갈색 톤의 커피가 맛있는 장소:',
        place: places[2] || null,
        emoji: '🌻',
      });
    }
    
    // 검색 파라미터가 없거나 장소가 부족한 경우, 모든 장소를 표시
    if (categories.length === 0 && places.length > 0) {
      places.forEach((place, index) => {
        const emojis = ['🍰', '🖼', '🌻'];
        categories.push({
          title: `추천 장소 ${index + 1}:`,
          place: place,
          emoji: emojis[index % emojis.length],
        });
      });
    }
    
    return categories;
  }, [places, searchParams]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categorizedPlaces.map((category, categoryIndex) => {
          if (!category.place) return null;
          
          const place = category.place;
          // 해시태그는 place의 mood, review, color에서 추출하거나 기본값 사용
          const hashtags = extractHashtags(place.mood, place.review, place.color);
          
          return (
            <View key={categoryIndex} style={styles.categorySection}>
              {/* Category Title */}
              <Text style={styles.categoryTitle}>
                {category.title}
              </Text>

              {/* Place Card */}
              <View style={styles.placeCard}>
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
                    <Text style={styles.placeEmoji}>{category.emoji}</Text>
                    <Text style={styles.placeName}>{place.name}</Text>
                  </View>

                  {/* Hashtags */}
                  <Text style={styles.hashtags} numberOfLines={2}>
                    {hashtags.map(tag => `#${tag}`).join(' ')}
                  </Text>

                  {/* Review with Icon */}
                  <View style={styles.reviewRow}>
                    <Image
                      source={require('../../assets/ssoklogo-removebg-preview.png')}
                      style={styles.reviewIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.reviewText} numberOfLines={1}>
                      {place.review || '좋은 장소입니다'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {places.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontFamily: 'Noto Sans KR',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    marginBottom: 16,
  },
  placeCard: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  placeImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  placeName: {
    fontFamily: 'Noto Sans KR',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    color: '#000000',
  },
  hashtags: {
    fontFamily: 'Noto Sans KR',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    color: '#939396',
    marginBottom: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewIcon: {
    width: 29,
    height: 29,
    borderRadius: 11,
    marginRight: 8,
  },
  reviewText: {
    fontFamily: 'Noto Sans KR',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    color: '#000000',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Noto Sans KR',
    fontSize: 16,
    color: '#939396',
  },
});

