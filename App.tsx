import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import Login from "./src/screens/Login";
import MapScreen from "./src/screens/MapScreen";
import SearchScreen from "./src/screens/SearchScreen.tsx"; // ⬅️ 추가
import MyPage from "./src/screens/MyPage";
import ListPage from "./src/screens/ListPage";
import MakeAppointmentScreen from "./src/screens/MakeAppointmentScreen";

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
              
              <Stack.Screen name="SearchScreen" component={(SearchScreen)} />
              <Stack.Screen name="MyPage" component={MyPage} options={{ title: "마이페이지" }} />
              <Stack.Screen name="ListPage" component={ListPage} options={{ title: "전체 리스트" }} />
              <Stack.Screen
                name="MakeAppointment"
                component={MakeAppointmentScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
