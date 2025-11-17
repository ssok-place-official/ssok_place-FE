// src/screens/Login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

export default function Login() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 입력 유효성 검사
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }
    
    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return;
    }

    // 이메일 형식 간단 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("알림", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 데모 버전: 입력만 있으면 로그인 성공 처리
    // 약간의 딜레이를 주어 실제 로그인처럼 보이게 함
    setTimeout(() => {
      setIsLoading(false);
      // 로그인 성공 - MapScreen으로 이동
      navigation.reset({
        index: 0,
        routes: [{ name: "Map" as never }],
      });
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 앱 타이틀 및 로고 */}
        <View style={styles.header}>
          <Text style={styles.title}>Ssok Place</Text>
          <Text style={styles.logo}>📍</Text>
        </View>

        {/* E-MAIL 입력 필드 */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#FAA770" />
          <TextInput
            style={styles.input}
            placeholder="E-MAIL"
            placeholderTextColor="#FAA770"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        {/* PASSWORD 입력 필드 */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#FAA770" />
          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor="#FAA770"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#FAA770"
            />
          </TouchableOpacity>
        </View>

        {/* LOGIN 버튼 */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FAA770" />
          ) : (
            <Text style={styles.loginButtonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        {/* Register? / Forgot Password? 링크 */}
        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => {
              // TODO: 회원가입 화면으로 이동
              Alert.alert("알림", "회원가입 기능은 준비 중입니다.");
            }}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Register?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // TODO: 비밀번호 찾기 화면으로 이동
              Alert.alert("알림", "비밀번호 찾기 기능은 준비 중입니다.");
            }}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  logo: {
    fontSize: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FAA770",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
    // 그림자 효과
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAA770",
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 14,
    color: "#FAA770",
    textDecorationLine: "underline",
  },
});

