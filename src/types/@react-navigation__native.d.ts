declare module '@react-navigation/native' {
  import { ComponentType } from 'react';

  export interface NavigationContainerRef {
    navigate(name: string, params?: any): void;
    reset(state: any): void;
    goBack(): void;
    canGoBack(): boolean;
    isReady(): boolean;
  }

  export interface NavigationContainerProps {
    children: React.ReactNode;
    ref?: React.Ref<NavigationContainerRef>;
    onReady?: () => void;
    onStateChange?: (state: any) => void;
  }

  export class NavigationContainer extends React.Component<NavigationContainerProps> {}

  export interface NavigationProp<ParamList, RouteName extends keyof ParamList = keyof ParamList> {
    navigate<RouteName extends keyof ParamList>(
      ...args: RouteName extends unknown
        ? [RouteName] | [screen: RouteName, params: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
    ): void;
    goBack(): void;
    reset(state: any): void;
  }

  export function useNavigation<T = NavigationProp<any>>(): T;
  export function useFocusEffect(callback: () => void | (() => void)): void;
  
  export function useRoute<T = any>(): {
    params: T;
    name: string;
    key: string;
  };
}


