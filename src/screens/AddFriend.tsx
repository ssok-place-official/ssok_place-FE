// src/screens/AddFriend.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { apiService, UserLookup } from '../services/api';

export default function AddFriend() {
  const navigation = useNavigation();
  const [friendId, setFriendId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<UserLookup | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // 친구 검색 핸들러
  const handleSearch = useCallback(async () => {
    if (!friendId.trim()) {
      Alert.alert('알림', '친구 ID를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setSearchError(null);
      setSearchResult(null);
      
      const userId = parseInt(friendId.trim(), 10);
      
      if (isNaN(userId)) {
        setSearchError('올바른 친구 ID를 입력해주세요.');
        setLoading(false);
        return;
      }

      // 사용자 조회
      const lookupResponse = await apiService.lookupUser(userId);
      
      if (lookupResponse.code === 404) {
        setSearchError('해당 사용자를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      if (lookupResponse.code === 200 && lookupResponse.data) {
        // 자기 자신인지 확인
        if (lookupResponse.data.me) {
          setSearchError('자기 자신은 친구로 추가할 수 없습니다.');
          setLoading(false);
          return;
        }

        // 이미 친구인지 확인
        if (lookupResponse.data.relation === 'FRIEND') {
          setSearchError('이미 친구입니다.');
          setLoading(false);
          return;
        }

        setSearchResult(lookupResponse.data);
      }
    } catch (err) {
      console.error('친구 검색 실패:', err);
      setSearchError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  // 친구 요청 보내기 핸들러
  const handleSendFriendRequest = useCallback(async () => {
    if (!searchResult) {
      return;
    }

    try {
      setSendingRequest(true);

      const response = await apiService.addFriend(searchResult.userId);

      if (response.code === 200) {
        Alert.alert('성공', '친구 요청을 보냈습니다.', [
          {
            text: '확인',
            onPress: () => {
              setFriendId('');
              setSearchResult(null);
              setSearchError(null);
            },
          },
        ]);
      } else if (response.code === 409) {
        // 이미 친구이거나 요청 중복
        Alert.alert('알림', response.message || '이미 친구이거나 요청이 중복되었습니다.');
      } else if (response.code === 404) {
        // 대상 없음
        Alert.alert('알림', response.message || '해당 사용자를 찾을 수 없습니다.');
      } else {
        Alert.alert('실패', response.message || '친구 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error('친구 요청 전송 실패:', err);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setSendingRequest(false);
    }
  }, [searchResult]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 상단 네비게이션 바 */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#222225" />
        </TouchableOpacity>
        
        <Text style={styles.title}>친구 추가</Text>
        
        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={styles.friendRequestButton}
            onPress={() => (navigation as any).navigate('FriendRequest')}
          >
            <Text style={styles.friendRequestText}>친구 요청</Text>
          </TouchableOpacity>
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
      </View>

      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="친구 ID"
          placeholderTextColor="#CACACA"
          value={friendId}
          onChangeText={(text) => {
            setFriendId(text);
            setSearchResult(null);
            setSearchError(null);
          }}
          keyboardType="number-pad"
          autoFocus={true}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#444447" />
          ) : (
            <Ionicons name="search" size={24} color="#444447" />
          )}
        </TouchableOpacity>
      </View>

      {/* 메인 컨텐츠 영역 */}
      <View style={styles.content}>
        {searchError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : searchResult ? (
          <View style={styles.searchResultCard}>
            <Text style={styles.searchResultTitle}>검색 결과</Text>
            
            {/* 프로필 영역 */}
            <View style={styles.profileSection}>
              <View style={styles.profileImage}>
                <Ionicons name="person" size={44} color="#C4C4C4" />
              </View>
              
              <Text style={styles.friendNickname}>{searchResult.nickname}</Text>
              <Text style={styles.friendId}>ID: {searchResult.userId}</Text>
            </View>

            {/* 버튼 영역 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.sendRequestButton}
                onPress={handleSendFriendRequest}
                disabled={sendingRequest}
                activeOpacity={0.8}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendRequestButtonText}>친구 요청 보내기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
    paddingHorizontal: 17,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
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
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendRequestButton: {
    width: 106,
    height: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4E4E4',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendRequestText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 19,
    color: '#000000',
    fontFamily: 'Noto Sans KR',
  },
  moreButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 21,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 19,
    color: '#000000',
    fontFamily: 'Noto Sans KR',
    padding: 0,
    marginRight: 6,
  },
  searchIconButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  searchResultCard: {
    width: 343,
    minHeight: 242,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignSelf: 'center',
    padding: 16,
    marginTop: 16,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 88,
    height: 82,
    borderRadius: 44,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendNickname: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 4,
  },
  friendId: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: '#828282',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  sendRequestButton: {
    width: 148,
    height: 39,
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
  sendRequestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 21,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    fontFamily: 'Noto Sans KR',
  },
});

