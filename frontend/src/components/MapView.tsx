import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from './ui/Button';

// Fix for default marker icons in Leaflet + Vite/React
// Using standard library approach for icon fixing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

interface MapViewProps {
    resources: any[];
    onInitiateTrade: (resource: any) => void;
    currentUserId?: number;
    selectedIds?: number[];
}

// Component to handle auto-fitting the map to markers
const MapInvalidate: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        // Trigger multiple invalidations to be safe during HMR and layout shifts
        map.invalidateSize();
        const timers = [100, 500, 1000].map(delay =>
            setTimeout(() => map.invalidateSize(), delay)
        );

        window.addEventListener('resize', () => map.invalidateSize());

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', () => map.invalidateSize());
        };
    }, [map]);
    return null;
};

const MapAutoCenter: React.FC<{ markers: any[] }> = ({ markers }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [Number(m.latitude), Number(m.longitude)]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
    }, [markers, map]);

    return null;
};

export const MapView: React.FC<MapViewProps> = ({ resources, onInitiateTrade, currentUserId, selectedIds = [] }) => {
    // Filter resources that have valid coordinates (including 0,0)
    const geoResources = resources.filter(r =>
        (r.latitude !== null && r.latitude !== undefined) &&
        (r.longitude !== null && r.longitude !== undefined)
    );

    if (geoResources.length === 0) {
        return (
            <div className="map-container flex flex-col items-center justify-center bg-black/40 border border-glass-surface rounded-md">
                <p className="text-text-muted font-mono mb-2">No geospatial signal detected in this sector</p>
                <p className="text-[0.6rem] text-text-muted uppercase tracking-[0.2em]">Add coordinates to your resources to see them on the map</p>
            </div>
        );
    }

    return (
        <div className="map-container overflow-hidden">
            <MapContainer
                center={[0, 0]}
                zoom={2}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {geoResources.map((res) => (
                    <Marker
                        key={res.id}
                        position={[Number(res.latitude), Number(res.longitude)]}
                    >
                        <Popup>
                            <div className="min-w-[150px]">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[0.6rem] uppercase px-1 py-0.5 rounded border border-current 
                                        ${res.type === 'seed' ? 'text-[#f9e076]' :
                                            res.type === 'compost' ? 'text-[#a97142]' :
                                                res.type === 'harvest' ? 'text-[#ff6b6b]' : 'text-[#74c0fc]'}`}>
                                        {res.type}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold mb-1 text-white">{res.title}</h3>
                                <p className="text-xs text-primary font-bold mb-3">
                                    {res.quantity} {res.unit}
                                </p>
                                <div className="text-[0.6rem] text-text-muted mb-3">
                                    Owner: @{res.ownerUsername || res.ownerId}
                                </div>

                                <Button
                                    size="sm"
                                    variant={selectedIds.includes(res.id) ? "primary" : "secondary"}
                                    className="w-full text-[0.6rem] py-1 h-auto"
                                    onClick={() => onInitiateTrade(res)}
                                    disabled={res.ownerId === currentUserId || res.status !== 'available'}
                                >
                                    {res.ownerId === currentUserId
                                        ? 'My Resource'
                                        : selectedIds.includes(res.id) ? 'Item Added' : 'Add to Bundle'}
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapAutoCenter markers={geoResources} />
                <MapInvalidate />
            </MapContainer>
        </div>
    );
};
