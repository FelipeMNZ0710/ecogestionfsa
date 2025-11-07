import React, { forwardRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import type { MapRef, MarkerDragEvent } from 'react-map-gl/maplibre';
import type { LocationStatus, ReportReason } from '../types';
// FIX: The FillLayer type is exported from 'maplibre-gl', not 'react-map-gl/maplibre'.
// Fix: The type for a fill layer from maplibre-gl is `FillLayerSpecification`.
import type { FillLayerSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Polygon } from 'geojson';

export interface LocationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: LocationStatus;
  latestReportReason?: ReportReason;
}

interface InteractiveMapProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  hoveredLocationId: string | null;
  userLocation: { lat: number; lng: number; accuracy: number; } | null;
  isAdminMode: boolean;
  onPinClick: (location: LocationData) => void;
  onPinMouseEnter: (id: string) => void;
  onPinMouseLeave: () => void;
  onMarkerDragEnd: (id: string, newCoords: {lng: number, lat: number}) => void;
  isCreatingMode?: boolean;
  newLocationCoords?: { lat: number; lng: number } | null;
  onNewLocationCoordsChange?: (coords: { lng: number; lat: number }) => void;
}

const Pin: React.FC<{ status: LocationStatus; isSelected: boolean; isHovered: boolean; latestReportReason?: ReportReason; }> = ({ status, isSelected, isHovered, latestReportReason }) => {
    const getPinInfo = () => {
        if (status === 'reported') {
            switch (latestReportReason) {
                case 'damaged': return { color: '#ef4444', text: 'Dañado' };
                case 'dirty': return { color: '#3b82f6', text: 'Sucio' };
                case 'full': return { color: '#f59e0b', text: 'Lleno' };
                case 'other': return { color: '#6b7280', text: 'Otro' };
                default: return { color: '#f59e0b', text: 'Reportado' };
            }
        }
        switch (status) {
            case 'ok': return { color: '#34d399', text: 'Operativo' };
            case 'maintenance': return { color: '#60a5fa', text: 'En Mantenimiento' };
            case 'serviced': return { color: '#22d3ee', text: 'Servicio Reciente' };
            default: return { color: '#A0A0A0', text: 'Desconocido' };
        }
    };

    const { color: statusColor, text: statusText } = getPinInfo();
    const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;
    const title = `Estado: ${statusText}`;

    return (
        <div 
            className="relative cursor-pointer transition-transform duration-200"
            style={{ transform: `scale(${scale})` }}
            aria-hidden="true"
            title={title}
        >
            {(isSelected || isHovered) && (
                <div 
                    className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full bg-primary opacity-30 animate-pulse"
                    style={{ transform: 'translate(-50%, -65%)' }}
                ></div>
            )}
            <svg height="35" viewBox="0 0 48 48" className="drop-shadow-lg" style={{ transformOrigin: 'bottom center' }}>
                <path 
                    fill={statusColor} 
                    stroke={isSelected ? '#10B981' : '#181818'} 
                    strokeWidth="3"
                    d="M24 4C15.163 4 8 11.163 8 20c0 8.836 16 24 16 24s16-15.164 16-24C40 11.163 32.837 4 24 4z" 
                />
                <circle cx="24" cy="18" r="5" fill="white" />
            </svg>
        </div>
    );
};

const NewLocationPin: React.FC = () => (
    <div className="relative cursor-move animate-pulse" style={{ transform: `scale(1.2)` }}>
        <svg height="40" viewBox="0 0 48 48" className="drop-shadow-lg">
            <path 
                fill="#f59e0b" // Amber color for new pin
                stroke="#181818"
                strokeWidth="3"
                d="M24 4C15.163 4 8 11.163 8 20c0 8.836 16 24 16 24s16-15.164 16-24C40 11.163 32.837 4 24 4z" 
            />
            <path fill="white" d="M22 13h2v5h5v2h-5v5h-2v-5h-5v-2h5z"/> {/* Plus sign */}
        </svg>
    </div>
);

// FIX: Added 'source' property to satisfy the FillLayerSpecification type.
// The type from maplibre-gl requires it, but react-map-gl provides it
// implicitly when a <Layer> is a child of a <Source>. This fixes the TypeScript error.
const accuracyCircleLayer: FillLayerSpecification = {
    id: 'user-accuracy-circle-fill',
    type: 'fill',
    source: 'user-accuracy-circle',
    paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
    }
};

// Helper to create a GeoJSON circle
const createGeoJSONCircle = (center: [number, number], radiusInMeters: number, points = 64): Feature<Polygon> => {
    const coords = {
        latitude: center[1],
        longitude: center[0]
    };

    const km = radiusInMeters / 1000;
    const ret: number[][] = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    let theta, x, y;
    for (let i = 0; i < points; i++) {
        theta = (i / points) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [ret]
        },
        properties: {}
    };
};


const InteractiveMap = forwardRef<MapRef, InteractiveMapProps>((
    { locations, selectedLocation, hoveredLocationId, userLocation, isAdminMode, onPinClick, onPinMouseEnter, onPinMouseLeave, onMarkerDragEnd, isCreatingMode, newLocationCoords, onNewLocationCoordsChange }, 
    ref
) => {
    
    const handleDragEnd = (evt: MarkerDragEvent, locationId: string) => {
        if (!isAdminMode) return;
        onMarkerDragEnd(locationId, { lng: evt.lngLat.lng, lat: evt.lngLat.lat });
    };

    const accuracyCircle = useMemo((): FeatureCollection | null => {
        if (!userLocation || !userLocation.accuracy) return null;
        return {
            type: 'FeatureCollection',
            features: [createGeoJSONCircle([userLocation.lng, userLocation.lat], userLocation.accuracy)]
        };
    }, [userLocation]);


    return (
        <div className="map-container rounded-lg border border-white/10 shadow-inner">
            <Map
                ref={ref}
                initialViewState={{
                    longitude: -58.1741,
                    latitude: -26.1775,
                    zoom: 12.5
                }}
                mapLib={maplibregl}
                style={{width: '100%', height: '100%'}}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                attributionControl={false}
            >
                <NavigationControl position="top-right" />
                {locations.map(location => (
                    <Marker
                        key={location.id}
                        longitude={location.lng}
                        latitude={location.lat}
                        anchor="bottom"
                        draggable={isAdminMode}
                        onDragEnd={evt => handleDragEnd(evt, location.id)}
                        onClick={e => { e.originalEvent.stopPropagation(); onPinClick(location); }}
                    >
                        <div
                            onMouseEnter={() => onPinMouseEnter(location.id)}
                            onMouseLeave={onPinMouseLeave}
                        >
                            <Pin 
                                isSelected={selectedLocation?.id === location.id} 
                                isHovered={hoveredLocationId === location.id}
                                status={location.status}
                                latestReportReason={location.latestReportReason}
                            />
                        </div>
                    </Marker>
                ))}
                {isCreatingMode && newLocationCoords && onNewLocationCoordsChange && (
                    <Marker
                        longitude={newLocationCoords.lng}
                        latitude={newLocationCoords.lat}
                        anchor="bottom"
                        draggable={true}
                        onDragEnd={(evt: MarkerDragEvent) => onNewLocationCoordsChange({lng: evt.lngLat.lng, lat: evt.lngLat.lat})}
                    >
                        <NewLocationPin />
                    </Marker>
                )}
                
                {accuracyCircle && (
                    <Source id="user-accuracy-circle" type="geojson" data={accuracyCircle}>
                        <Layer {...accuracyCircleLayer} />
                    </Source>
                )}

                {userLocation && (
                    <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                        <div className="user-location-marker" title="Tu ubicación">
                            <div className="pulse-ring"></div>
                            <div className="dot"></div>
                        </div>
                    </Marker>
                )}
            </Map>
        </div>
    );
});

InteractiveMap.displayName = 'InteractiveMap';
export default InteractiveMap;