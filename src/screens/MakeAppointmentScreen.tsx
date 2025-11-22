// src/screens/MakeAppointmentScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { apiService, Friend } from '../services/api';

export default function MakeAppointmentScreen() {
  const navigation = useNavigation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 친구 목록 조회
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getFriends({
        page: 0,
        size: 50,
      });

      if (response.code === 200 && response.data) {
        // ACCEPTED 상태인 친구만 표시
        const acceptedFriends = response.data.content.filter(
          (friend) => friend.status === 'ACCEPTED'
        );
        setFriends(acceptedFriends);
      } else {
        const errorMessage = response.message || '친구 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('친구 목록 조회 실패:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // 친구 선택/해제 토글
  const toggleFriendSelection = useCallback((userId: number) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // 선택 완료 버튼 핸들러
  const handleCompleteSelection = useCallback(() => {
    console.log('✅ [MakeAppointmentScreen] 선택 완료 버튼 클릭됨');
    console.log('   - 선택된 친구:', Array.from(selectedFriends));
    console.log('   - navigation 객체 존재:', navigation !== null);
    
    try {
      // SearchScreen으로 화면 전환
      (navigation as any).navigate('SearchScreen');
      console.log('   ✅ SearchScreen으로 화면 전환 시도 완료');
    } catch (error) {
      console.error('❌ [MakeAppointmentScreen] 화면 전환 실패:', error);
    }
  }, [selectedFriends, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 상단 네비게이션 바 */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Ionicons name="calendar" size={24} color="#000000" style={styles.calendarIcon} />
          <Text style={styles.title}>약속 잡기</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>약속 인원 선택</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>친구 목록을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFriends}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>친구가 없습니다</Text>
          </View>
        ) : (
          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {friends.map((friend) => {
              const isSelected = selectedFriends.has(friend.userId);
              return (
                <TouchableOpacity
                  key={friend.userId}
                  style={styles.friendItem}
                  onPress={() => toggleFriendSelection(friend.userId)}
                  activeOpacity={0.7}
                >
                  {/* 프로필 이미지 */}
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitial}>
                      {friend.nickname.charAt(0)}
                    </Text>
                  </View>

                  {/* 친구 이름 */}
                  <Text style={styles.friendName}>{friend.nickname}</Text>

                  {/* 체크마크 */}
                  <View style={styles.checkmarkContainer}>
                    <Ionicons
                      name="checkmark"
                      size={14.3}
                      color={isSelected ? '#007AFF' : '#B3B3B3'}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 하단 버튼 영역 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteSelection}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.completeButtonText}>선택 완료</Text>
        </TouchableOpacity>
        
        {/* Home Indicator (iOS) */}
        <View style={styles.homeIndicator} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  calendarIcon: {
    marginRight: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    fontFamily: 'Inter',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 19,
    color: '#000000',
    fontFamily: 'Noto Sans KR',
    paddingHorizontal: 21,
    marginBottom: 16,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 21,
    height: 52,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 19,
    color: '#000000',
    fontFamily: 'Noto Sans KR',
  },
  checkmarkContainer: {
    width: 14.3,
    height: 14.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  footer: {
    paddingTop: 14,
    paddingBottom: 34,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 8,
  },
});

