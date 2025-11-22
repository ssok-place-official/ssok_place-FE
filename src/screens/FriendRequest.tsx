// src/screens/FriendRequest.tsx
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
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { apiService, FriendRequest as FriendRequestType } from '../services/api';

export default function FriendRequest() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<FriendRequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // 친구 요청 목록 조회
  const fetchFriendRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getFriendRequests();

      if (response.code === 200 && response.data) {
        setRequests(response.data);
      } else {
        const errorMessage = response.message || '친구 요청 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('친구 요청 목록 조회 실패:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 화면 포커스 시 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchFriendRequests();
    }, [fetchFriendRequests])
  );

  // 친구 요청 수락
  const handleAccept = useCallback(async (friendUserId: number) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(friendUserId));

      const response = await apiService.respondToFriendRequest(friendUserId, true);

      if (response.code === 200) {
        Alert.alert('성공', '친구 요청을 수락했습니다.');
        // 목록에서 제거
        setRequests((prev) => prev.filter((req) => req.userId !== friendUserId));
      } else {
        Alert.alert('실패', response.message || '친구 요청 수락에 실패했습니다.');
      }
    } catch (err) {
      console.error('친구 요청 수락 실패:', err);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendUserId);
        return newSet;
      });
    }
  }, []);

  // 친구 요청 거절
  const handleReject = useCallback(async (friendUserId: number) => {
    Alert.alert(
      '친구 요청 거절',
      '정말 거절하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingIds((prev) => new Set(prev).add(friendUserId));

              const response = await apiService.respondToFriendRequest(friendUserId, false);

              if (response.code === 200) {
                Alert.alert('완료', '친구 요청을 거절했습니다.');
                // 목록에서 제거
                setRequests((prev) => prev.filter((req) => req.userId !== friendUserId));
              } else {
                Alert.alert('실패', response.message || '친구 요청 거절에 실패했습니다.');
              }
            } catch (err) {
              console.error('친구 요청 거절 실패:', err);
              Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            } finally {
              setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(friendUserId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  }, []);

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
        
        <Text style={styles.title}>친구 요청</Text>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            // TODO: 더보기 메뉴
            console.log('더보기');
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#444447" />
        </TouchableOpacity>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>친구 요청 목록을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFriendRequests}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>받은 친구 요청이 없습니다</Text>
          </View>
        ) : (
          <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
            {requests.map((request) => {
              const isProcessing = processingIds.has(request.userId);
              return (
                <View key={request.userId} style={styles.requestItem}>
                  {/* 프로필 이미지 */}
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitial}>
                      {request.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* 친구 정보 */}
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendNickname}>{request.nickname}</Text>
                    <Text style={styles.friendId}>ID: {request.userId}</Text>
                  </View>

                  {/* 액션 버튼 */}
                  <View style={styles.actionButtons}>
                    {/* 수락 버튼 */}
                    <TouchableOpacity
                      style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => handleAccept(request.userId)}
                      disabled={isProcessing}
                      activeOpacity={0.7}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>

                    {/* 거절 버튼 */}
                    <TouchableOpacity
                      style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => handleReject(request.userId)}
                      disabled={isProcessing}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color="#222225" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Home Indicator (iOS) */}
      <View style={styles.homeIndicator} />
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    fontFamily: 'Inter',
    position: 'absolute',
    left: '50%',
    marginLeft: -31.5, // 약 63px / 2
  },
  moreButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  requestsList: {
    flex: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 36,
    minHeight: 55,
  },
  profileImage: {
    width: 40,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  friendNickname: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#000000',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  friendId: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: '#828282',
    fontFamily: 'Inter',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  acceptButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
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
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 10,
  },
});

