// src/screens/ListPage.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ListPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const lists = [
    { label: "아늑함", count: 30, color: "rgba(255,72,72,0.31)" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}> 
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
        {/* 새 리스트 만들기 */}
        <TouchableOpacity style={styles.createRow} activeOpacity={0.8}>
          <View style={[styles.iconCircle, { backgroundColor: "#eee", borderColor: "#C5C5C7" }]}> 
            <Ionicons name="add" size={18} color="#939396" />
          </View>
          <Text style={styles.createText}>새 리스트 만들기</Text>
        </TouchableOpacity>

        {/* 리스트 항목 */}
        {lists.map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.row}
            onPress={() => (navigation as any).navigate('List1', { listName: item.label, count: item.count })}
            activeOpacity={0.7}
          > 
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}> 
              <Ionicons name="star" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Ionicons name="location-outline" size={14} color="#828282" />
                <Text style={styles.rowSub}>{item.count}</Text>
              </View>
            </View>
            <Ionicons name="ellipsis-vertical" size={18} color="#8C8C8C" />
          </TouchableOpacity>
        ))}
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
    paddingBottom: 6,
    marginTop: 10,
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
    color: "#000",
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
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderColor: "#DADADA",
  },
  createText: { marginLeft: 10, fontSize: 18, fontWeight: "500", color: "#828282" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderColor: "#DADADA",
  },
  iconCircle: {
    width: 33.91,
    height: 34.8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 0,
  },
  rowTitle: { fontSize: 18, fontWeight: "500", color: "#222225" },
  rowSub: { marginLeft: 6, fontSize: 14, color: "#828282" },
});


