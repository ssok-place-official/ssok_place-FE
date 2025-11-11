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
    center?: CameraPosition;
    useTextureView?: boolean;
  }

  export default class NaverMapView extends React.Component<MapProps> {}

  export interface MarkerProps {
    coordinate: LatLng;
    caption?: { text: string };
    onPress?: () => void;
  }
  export class NaverMapMarker extends React.Component<MarkerProps> {}
}


