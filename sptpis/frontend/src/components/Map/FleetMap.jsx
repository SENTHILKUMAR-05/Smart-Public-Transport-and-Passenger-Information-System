import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const FleetMap = ({ buses = [], districtName = 'Tamil Nadu' }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef({});
  const borderLayerRef = useRef(null);
  const activePathLayerRef = useRef(null);

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
      // We don't want to destroy the map on every re-render of district, just unmount
    };
  }, []);

  // Update District Border
  useEffect(() => {
    if (!mapRef.current) return;
    let isCancelled = false;

    const cleanName = districtName.replace(' District', '');
    const aliasMap = {
        'Kanyakumari': 'Kanniyakumari District, Tamil Nadu',
        'Chennai': 'Chennai District, Tamil Nadu'
    };
    
    const queryName = aliasMap[cleanName] || `${cleanName} District, Tamil Nadu`;
    
    const url = cleanName === 'Tamil Nadu' 
        ? 'https://nominatim.openstreetmap.org/search?q=Tamil+Nadu,+India&polygon_geojson=1&format=json'
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryName)}&polygon_geojson=1&format=json`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
          if (isCancelled) return;
          if (borderLayerRef.current) mapRef.current.removeLayer(borderLayerRef.current);
          if (activePathLayerRef.current) mapRef.current.removeLayer(activePathLayerRef.current);
          
          if (data && data.length > 0 && mapRef.current) {
              const boundaryData = data.find(d => d.geojson && (d.geojson.type === 'Polygon' || d.geojson.type === 'MultiPolygon'));
              
              if (boundaryData) {
                  const geojsonLayer1 = L.geoJSON(boundaryData.geojson, {
                      style: {
                          color: '#0ea5e9',
                          weight: 8,
                          opacity: 0.4,
                          fillColor: '#0ea5e9',
                          fillOpacity: 0.05,
                      }
                  }).addTo(mapRef.current);
                  borderLayerRef.current = geojsonLayer1;

                  const geojsonLayer2 = L.geoJSON(boundaryData.geojson, {
                      style: {
                          color: '#00f6ff',
                          weight: 3.5,
                          opacity: 1,
                          fillOpacity: 0,
                          className: 'tn-ant-path'
                      }
                  }).addTo(mapRef.current);
                  activePathLayerRef.current = geojsonLayer2;

                  if (cleanName !== 'Tamil Nadu') {
                      mapRef.current.fitBounds(geojsonLayer1.getBounds(), { padding: [50, 50] });
                  } else {
                      mapRef.current.setView([11.1271, 78.6569], 7);
                  }
              }
          }
      }).catch(err => console.error("Error fetching boundaries:", err));

      return () => { isCancelled = true; };
  }, [districtName]);

  // Update Fleet Markers
  useEffect(() => {
    // We removed the generic bus marker circles from the global overview maps per user request
    // This provides a much cleaner, un-cluttered boundary view
  }, [buses]);

  return (
    <>
        <style dangerouslySetInnerHTML={{__html: `
            .tn-ant-path {
                stroke-dasharray: 12, 12;
                animation: antFlow 30s linear infinite;
                filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.9));
            }
            @keyframes antFlow {
                to { stroke-dashoffset: 1000; }
            }
        `}} />
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-white/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
    </>
  );
};

export default FleetMap;
