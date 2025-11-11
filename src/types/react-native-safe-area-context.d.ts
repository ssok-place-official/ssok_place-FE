declare module 'react-native-safe-area-context' {
  import { Component } from 'react';
  import { ViewProps, ViewStyle } from 'react-native';

  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Metrics {
    insets: EdgeInsets;
    frame: Rect;
  }

  export interface SafeAreaProviderProps {
    children?: React.ReactNode;
    initialMetrics?: Metrics;
    initialWindowMetrics?: Metrics;
  }

  export class SafeAreaProvider extends Component<SafeAreaProviderProps> {}

  export function useSafeAreaInsets(): EdgeInsets;
  export function useSafeAreaFrame(): Rect;

  export interface SafeAreaViewProps extends ViewProps {
    children?: React.ReactNode;
    edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
    mode?: 'padding' | 'margin';
  }

  export class SafeAreaView extends Component<SafeAreaViewProps> {}
}


