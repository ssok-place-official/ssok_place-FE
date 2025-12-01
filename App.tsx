import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import Login from "./src/screens/Login";
import MapScreen from "./src/screens/MapScreen";
import SearchScreen from "./src/screens/SearchScreen.tsx"; // ⬅️ 추가
import SearchResult from "./src/screens/SearchResult";
import MyPage from "./src/screens/MyPage";
import ListPage from "./src/screens/ListPage";
import List1 from "./src/screens/List1";
import MakeAppointmentScreen from "./src/screens/MakeAppointmentScreen";
import AddFriend from "./src/screens/AddFriend";
import FriendRequest from "./src/screens/FriendRequest";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Map"
                component={MapScreen}
                options={{ headerShown: false }}
              />
              
              <Stack.Screen 
                name="SearchScreen" 
                component={SearchScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="SearchResult" 
                component={SearchResult}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="MyPage" component={MyPage} options={{ title: "마이페이지" }} />
              <Stack.Screen name="ListPage" component={ListPage} options={{ title: "전체 리스트" }} />
              <Stack.Screen name="List1" component={List1} options={{ title: "나의 저장 장소" }} />
              <Stack.Screen
                name="MakeAppointment"
                component={MakeAppointmentScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AddFriend"
                component={AddFriend}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FriendRequest"
                component={FriendRequest}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
