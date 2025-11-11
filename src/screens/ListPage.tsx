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
    { label: "카페", count: 165, color: "rgba(255,72,72,0.31)" },
    { label: "음식점", count: 113, color: "#FFE26E" },
    { label: "놀거리", count: 77, color: "rgba(36,29,232,0.42)" },
    { label: "숙소", count: 13, color: "rgba(86,142,81,0.63)" },
    { label: "장소대여", count: 3, color: "rgba(74,144,157,0.67)" },
    { label: "미용실", count: 6, color: "rgba(255,120,221,0.67)" },
    { label: "꽃집", count: 22, color: "rgba(255,39,86,0.53)" },
    { label: "옷", count: 15, color: "#A2796A" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}> 
      {/* Header */}
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>전체 리스트 14</Text>
        <TouchableOpacity>
          <Text style={styles.sortText}>최신순</Text>
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
          <View key={idx} style={styles.row}> 
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
          </View>
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
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#000" },
  sortText: { fontSize: 16, fontWeight: "600", color: "#828282" },
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
    width: 37,
    height: 37,
    borderRadius: 18.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#DADADA",
  },
  rowTitle: { fontSize: 18, fontWeight: "500", color: "#222225" },
  rowSub: { marginLeft: 6, fontSize: 14, color: "#828282" },
});


