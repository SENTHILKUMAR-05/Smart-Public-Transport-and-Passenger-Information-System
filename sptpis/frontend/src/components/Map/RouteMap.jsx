import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const RouteMap = ({ route, stops = [], currentLat, currentLng, busName = 'TN-29-N-1542', speed = 58 }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);
  const busMarkerRef = useRef(null);

  const routeIdRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map centered on Tamil Nadu / Route 1
    const defaultCenter = [11.6643, 78.1460]; // Salem center
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 9,
        zoomControl: true,
      });

      // Google Maps Tile Layer
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline & Stop Markers only when the route source/dest actually changes
  useEffect(() => {
    if (!mapRef.current || !route) return;

    const currentRouteIdent = `${route.source_city}-${route.destination_city}`;
    if (routeIdRef.current === currentRouteIdent) return; // Prevent unnecessary redraws
    routeIdRef.current = currentRouteIdent;

    // Clear existing polyline & markers
    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
    }
    markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    markersRef.current = [];

    const fetchAndDrawProperRoute = async () => {
      // Parse initial given waypoints (usually straight lines from DB)
      let baseCoords = [];
      if (route && route.polyline_coords) {
        baseCoords = typeof route.polyline_coords === 'string'
          ? JSON.parse(route.polyline_coords)
          : route.polyline_coords;
      } else {
        baseCoords = [
          [12.1211, 78.1582], [11.9015, 78.1400], [11.6643, 78.1460], [11.5020, 77.9250], [11.3410, 77.7172], [11.5034, 77.2444]
        ];
      }

      let finalCurvedCoords = baseCoords;

      if (baseCoords && baseCoords.length > 1) {
        try {
          // Leaflet coords are [lat, lng]. OSRM requires lon,lat;lon,lat
          const waypointsStr = baseCoords.map(c => `${c[1]},${c[0]}`).join(';');
          const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            // OSRM returns [lon, lat], convert back to Leaflet [lat, lng]
            finalCurvedCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          }
        } catch (err) {
          console.warn("Failed to fetch accurate HD curved route, falling back to straight lines");
        }

        const baseColor = route.themeColor || '#2563eb'; // Deep blue pops perfectly on Google Maps

        // 1. Glow Layer (Thick, highly transparent)
        const glowLine = L.polyline(finalCurvedCoords, {
          color: baseColor,
          weight: 12,
          opacity: 0.3,
          lineJoin: 'round',
        }).addTo(mapRef.current);

        // 2. Core Solid Layer
        const coreLine = L.polyline(finalCurvedCoords, {
          color: baseColor,
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
        }).addTo(mapRef.current);

        // 3. Flowing Dash Layer (The physical "Direction of travel" animation)
        const flowLine = L.polyline(finalCurvedCoords, {
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          dashArray: '10, 20',
          className: 'flowing-route-line',
        }).addTo(mapRef.current);

        // Save these to markersRef to clear them properly later
        markersRef.current.push(glowLine, coreLine, flowLine);

        // Add beautiful Start and End Pulsing Dots
        if (finalCurvedCoords.length > 0) {
          const startIcon = L.divIcon({ className: 'custom-start-end', html: '<div class="start-dot-pulse"></div>' });
          const endIcon = L.divIcon({ className: 'custom-start-end', html: '<div class="end-dot-pulse"></div>' });
          const startMarker = L.marker(finalCurvedCoords[0], { icon: startIcon }).addTo(mapRef.current);
          const endMarker = L.marker(finalCurvedCoords[finalCurvedCoords.length - 1], { icon: endIcon }).addTo(mapRef.current);
          markersRef.current.push(startMarker, endMarker);
        }

        try {
          mapRef.current.fitBounds(coreLine.getBounds(), { padding: [40, 40] });
        } catch (e) { }

        // --- ADDED: DEMO SIMULATION ANIMATION ---
        if (finalCurvedCoords.length > 2) {
          // Clear any existing animation
          if (window.routeDemoAnim) clearInterval(window.routeDemoAnim);

          let stepIndex = 0;
          // Quickly animate the bus marker along the generated high-def path
          window.routeDemoAnim = setInterval(() => {
            if (!busMarkerRef.current || !mapRef.current) return;
            stepIndex += 2; // skip items for speed
            if (stepIndex >= finalCurvedCoords.length) {
              stepIndex = 0; // loop back to start for demo purposes
            }
            const [lat, lng] = finalCurvedCoords[stepIndex];
            busMarkerRef.current.setLatLng([lat, lng]);
          }, 100);
        }
      }
    };

    fetchAndDrawProperRoute();

    // Add Stop Markers
    const stopList = stops && stops.length > 0 ? stops : [];
    stopList.forEach((stop, index) => {
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="background-color: #0f172a; border: 2px solid #10b981; border-radius: 9999px; width: 26px; height: 26px; display: flex; align-items: center; justify-center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
            ${stop.stop_order || index + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px;">
            <div style="font-weight: bold; color: #10b981; font-size: 13px;">Stop ${stop.stop_order}: ${stop.stop_name}</div>
            <div style="color: #cbd5e1; font-size: 12px; margin-top: 4px;">Distance from source: <b>${stop.distance_from_source_km || 0} km</b></div>
          </div>
        `)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [route, stops]);

  // Update live Bus Marker position
  useEffect(() => {
    if (!mapRef.current) return;

    const lat = currentLat || 11.6643;
    const lng = currentLng || 78.1460;

    const busIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-center;">
          <div class="bus-pulse-ring"></div>
          <div style="background: linear-gradient(135deg, #10b981, #047857); border: 2px solid white; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([lat, lng]);
    } else {
      busMarkerRef.current = L.marker([lat, lng], { icon: busIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 170px;">
            <div style="font-weight: bold; color: #3b82f6; font-size: 14px;">🚌 ${busName}</div>
            <div style="color: #cbd5e1; font-size: 12px; margin-top: 4px;">Speed: <b>${speed} km/h</b></div>
            <div style="color: #10b981; font-size: 12px;">Live Socket.IO GPS Stream</div>
          </div>
        `)
        .addTo(mapRef.current);
    }

    // Removed smooth panning on every position update so users can zoom freely!
  }, [currentLat, currentLng, busName, speed]);

  return (
    <>
      <style>{`
        .flowing-route-line {
          animation: flow-path 1s linear infinite;
        }
        @keyframes flow-path {
          to { stroke-dashoffset: -30; }
        }
        .start-dot-pulse, .end-dot-pulse {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          position: relative;
        }
        .start-dot-pulse { background: #10b981; }
        .end-dot-pulse { background: #ef4444; }
        .start-dot-pulse::after, .end-dot-pulse::after {
           content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px;
           border-radius: 50%; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .start-dot-pulse::after { border: 2px solid #10b981; }
        .end-dot-pulse::after { border: 2px solid #ef4444; }
      `}</style>
      <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner group">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </>
  );
};

export default RouteMap;
