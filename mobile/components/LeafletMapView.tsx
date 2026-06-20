import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { CampusCoordinate, RouteSegment } from '@/types/domain';

export interface LeafletMarker {
  id: string;
  coordinate: CampusCoordinate;
  title: string;
  color?: string;
  isUser?: boolean;
  isCluster?: boolean;
  clusterCount?: number;
}

interface LeafletMapViewProps {
  center: CampusCoordinate;
  zoom?: number;
  markers?: LeafletMarker[];
  route?: RouteSegment[];
  userLocation?: CampusCoordinate;
  onMarkerPress?: (markerId: string) => void;
  onMapReady?: () => void;
  style?: object;
}

/** Build the complete Leaflet HTML page injected into WebView. */
function buildLeafletHtml(
  center: CampusCoordinate,
  zoom: number,
  markers: LeafletMarker[],
  route: RouteSegment[],
  userLocation?: CampusCoordinate,
): string {
  const markersJson = JSON.stringify(markers);
  const routeJson = JSON.stringify(route);
  const userJson = userLocation ? JSON.stringify(userLocation) : 'null';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>PathFindr Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #d7f0dd; }
    .custom-marker {
      width: 28px; height: 28px;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; color: #fff;
      font-family: sans-serif;
    }
    .user-marker {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: #2196F3;
      border: 3px solid #fff;
      box-shadow: 0 2px 10px rgba(33,150,243,0.5);
      position: relative;
    }
    .user-marker::after {
      content: '';
      position: absolute;
      top: -8px; left: -8px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(33,150,243,0.15);
    }
    .cluster-marker {
      background: #0D8C60;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .leaflet-popup-content {
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #102418;
      margin: 10px 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function() {
      var center = [${center.latitude}, ${center.longitude}];
      var zoom = ${zoom};
      var markersData = ${markersJson};
      var routeData = ${routeJson};
      var userLocation = ${userJson};

      var map = L.map('map', {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
      });

      // ── Tile Layer: Carto Voyager (clear, modern OSM-based tiles) ──────────
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 2
      }).addTo(map);

      // ── Route polyline ────────────────────────────────────────────────────
      if (routeData && routeData.length > 1) {
        var routeCoords = routeData.map(function(pt) { return [pt.latitude, pt.longitude]; });
        L.polyline(routeCoords, {
          color: '#0D8C60',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        // Route start dot
        L.circleMarker(routeCoords[0], {
          radius: 8,
          color: '#fff',
          weight: 3,
          fillColor: '#066848',
          fillOpacity: 1
        }).addTo(map);

        // Route end dot
        L.circleMarker(routeCoords[routeCoords.length - 1], {
          radius: 8,
          color: '#fff',
          weight: 3,
          fillColor: '#F2B84B',
          fillOpacity: 1
        }).addTo(map);
      }

      // ── Building markers ──────────────────────────────────────────────────
      markersData.forEach(function(m) {
        if (m.isUser) return; // user marker handled separately
        var color = m.color || '#0D8C60';
        var html;
        if (m.isCluster) {
          html = '<div class="custom-marker cluster-marker">' + (m.clusterCount || '') + '</div>';
        } else {
          html = '<div class="custom-marker" style="background:' + color + ';"></div>';
        }
        var icon = L.divIcon({
          html: html,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -18],
          className: ''
        });
        var marker = L.marker([m.coordinate.latitude, m.coordinate.longitude], { icon: icon });
        marker.bindPopup('<b>' + m.title + '</b>');
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
          }
        });
        marker.addTo(map);
      });

      // ── User location marker ───────────────────────────────────────────────
      if (userLocation) {
        var userIcon = L.divIcon({
          html: '<div class="user-marker"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: ''
        });
        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .bindPopup('<b>You are here</b>')
          .addTo(map);
      }

      // ── Fit map to route or markers ───────────────────────────────────────
      if (routeData && routeData.length > 1) {
        var routeBounds = routeData.map(function(pt) { return [pt.latitude, pt.longitude]; });
        map.fitBounds(L.latLngBounds(routeBounds), { padding: [40, 40] });
      } else if (markersData.length > 0) {
        var coords = markersData.map(function(m) { return [m.coordinate.latitude, m.coordinate.longitude]; });
        if (userLocation) coords.push([userLocation.latitude, userLocation.longitude]);
        if (coords.length > 1) {
          map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
        }
      }

      // Notify React Native that map is ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      }
    })();
  </script>
</body>
</html>`;
}

export function LeafletMapView({
  center,
  zoom = 16,
  markers = [],
  route = [],
  userLocation,
  onMarkerPress,
  onMapReady,
  style,
}: LeafletMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const html = buildLeafletHtml(center, zoom, markers, route, userLocation);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          id?: string;
        };
        if (msg.type === 'markerPress' && msg.id && onMarkerPress) {
          onMarkerPress(msg.id);
        }
        if (msg.type === 'mapReady' && onMapReady) {
          onMapReady();
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onMarkerPress, onMapReady],
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        cacheEnabled={!__DEV__}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#d7f0dd',
  },
});
