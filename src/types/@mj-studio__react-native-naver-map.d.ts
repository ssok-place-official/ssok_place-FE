declare module '@mj-studio/react-native-naver-map' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface CameraPosition extends LatLng {
    zoom?: number;
    tilt?: number;
    bearing?: number;
  }

  export interface MapProps extends ViewProps {
    camera?: CameraPosition;
    initialCamera?: CameraPosition;
    useTextureView?: boolean;
  }

  export const NaverMapView: React.ComponentType<MapProps>;

  export interface MarkerOverlayProps extends LatLng {
    caption?: { text: string };
    onPress?: () => void;
  }

  export const NaverMapMarkerOverlay: React.ComponentType<MarkerOverlayProps>;
}
