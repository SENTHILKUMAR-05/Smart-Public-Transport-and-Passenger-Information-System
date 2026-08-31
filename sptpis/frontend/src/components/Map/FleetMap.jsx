import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const FleetMap = ({ buses = [] }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center of Tamil Nadu
    const centerTN = [11.1271, 78.6569];
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: centerTN,
        zoom: 7,
        zoomControl: true,
      });

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

  // Update Fleet Markers
  useEffect(() => {
    if (!mapRef.current) return;

    buses.forEach((bus) => {
      const lat = bus.location?.latitude || bus.latitude || 11.6643;
      const lng = bus.location?.longitude || bus.longitude || 78.1460;
      const isEmergency = bus.status === 'Emergency';
      const color = isEmergency ? '#ef4444' : (bus.status === 'Delayed' ? '#f59e0b' : '#3b82f6');

      const iconHtml = `
        <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-center;">
          ${isEmergency ? '<div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: #ef4444; animation: pulse 1s infinite;"></div>' : ''}
          <div style="background-color: ${color}; border: 2px solid white; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-center; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'custom-fleet-marker',
        html: iconHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="font-weight: bold; color: ${color}; font-size: 14px;">
            🚌 ${bus.registration_number || 'TNSTC Bus'} (${bus.bus_type || 'Express'})
          </div>
          <div style="color: #cbd5e1; font-size: 12px; margin-top: 6px;">
            Route: <b>${bus.route_name || bus.source_city + ' - ' + bus.destination_city}</b>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
            Status: <span style="color: ${color}; font-weight: bold;">${bus.status || 'Active'}</span> | Speed: <b>${bus.speed_kmh || 58} km/h</b>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">
            Next Stop: <b>${bus.next_stop_name || 'Salem Central'}</b>
          </div>
          <div style="color: #10b981; font-size: 12px; margin-top: 4px;">
            Occupancy: <b>${bus.occupancy_percentage || 57}%</b> (${bus.total_occupancy_count || 31}/54 seats)
          </div>
        </div>
      `;

      if (markersRef.current[bus.bus_id]) {
        markersRef.current[bus.bus_id].setLatLng([lat, lng]);
        markersRef.current[bus.bus_id].setPopupContent(popupContent);
      } else {
        const marker = L.marker([lat, lng], { icon: busIcon })
          .bindPopup(popupContent)
          .addTo(mapRef.current);
        markersRef.current[bus.bus_id] = marker;
      }
    });
  }, [buses]);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default FleetMap;
