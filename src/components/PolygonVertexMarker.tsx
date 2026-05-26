import React from 'react';
import type { LatLng } from 'expo-gaode-map';
import { Marker } from 'expo-gaode-map';

import {
  NUMBERED_MARKER_SIZE_ACTIVE,
  NumberedMapMarker,
} from './NumberedMapMarker';

export type VertexDragController = {
  onStart: (index: number) => void;
  onDrag: (index: number, point: LatLng) => void;
  onEnd: (index: number, point: LatLng) => void;
};

type PolygonVertexMarkerProps = {
  index: number;
  point: LatLng;
  markerLayerKey: number;
  isDragging: boolean;
  draggable: boolean;
  dragControllerRef: React.RefObject<VertexDragController>;
};

function PolygonVertexMarkerComponent({
  index,
  point,
  markerLayerKey,
  isDragging,
  draggable,
  dragControllerRef,
}: PolygonVertexMarkerProps) {
  return (
    <Marker
      position={point}
      anchor={{ x: 0.5, y: 0.5 }}
      customViewWidth={NUMBERED_MARKER_SIZE_ACTIVE}
      customViewHeight={NUMBERED_MARKER_SIZE_ACTIVE}
      cacheKey={`fence-vertex-${index + 1}-${markerLayerKey}`}
      draggable={draggable}
      zIndex={isDragging ? 100 : 10 + index}
      onMarkerDragStart={() => dragControllerRef.current.onStart(index)}
      onMarkerDrag={(event) => {
        const { latitude, longitude } = event.nativeEvent;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return;
        }
        dragControllerRef.current.onDrag(index, { latitude, longitude });
      }}
      onMarkerDragEnd={(event) => {
        const { latitude, longitude } = event.nativeEvent;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return;
        }
        dragControllerRef.current.onEnd(index, { latitude, longitude });
      }}
    >
      <NumberedMapMarker index={index + 1} active={isDragging} />
    </Marker>
  );
}

function areVertexMarkerPropsEqual(
  prev: PolygonVertexMarkerProps,
  next: PolygonVertexMarkerProps,
): boolean {
  return (
    prev.index === next.index &&
    prev.markerLayerKey === next.markerLayerKey &&
    prev.isDragging === next.isDragging &&
    prev.draggable === next.draggable &&
    prev.dragControllerRef === next.dragControllerRef &&
    prev.point.latitude === next.point.latitude &&
    prev.point.longitude === next.point.longitude
  );
}

export const PolygonVertexMarker = React.memo(
  PolygonVertexMarkerComponent,
  areVertexMarkerPropsEqual,
);
