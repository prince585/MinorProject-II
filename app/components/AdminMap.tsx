"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Icons setup
const vehicleIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface UserLocation {
    _id: string;
    username: string;
    location?: {
        coordinates: [number, number]; // [lng, lat]
    };
    address?: string;
}

interface AdminMapProps {
    users: UserLocation[];
    vehicleLocation?: [number, number]; // [lat, lng]
    vehicleRadius?: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMapEvents({});
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function AdminMap({ users, vehicleLocation, vehicleRadius = 700 }: AdminMapProps) {
    const defaultCenter: [number, number] = [28.6139, 77.2090]; // New Delhi
    const center = vehicleLocation || (users.length > 0 && users[0].location?.coordinates
        ? [users[0].location.coordinates[1], users[0].location.coordinates[0]] as [number, number]
        : defaultCenter);

    return (
        <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {vehicleLocation && <MapUpdater center={vehicleLocation} />}

            {/* Render All Users */}
            {users.map((user) => {
                if (!user.location?.coordinates) return null;
                // GeoJSON [lng, lat] -> Leaflet [lat, lng]
                const pos: [number, number] = [user.location.coordinates[1], user.location.coordinates[0]];

                return (
                    <Marker key={user._id} position={pos} icon={userIcon}>
                        <Popup>
                            <strong>{user.username}</strong><br />
                            {user.address}
                        </Popup>
                    </Marker>
                );
            })}

            {/* Vehicle Location & Radius */}
            {vehicleLocation && (
                <>
                    <Marker position={vehicleLocation} icon={vehicleIcon}>
                        <Popup>Municipality Vehicle</Popup>
                    </Marker>
                    <Circle
                        center={vehicleLocation}
                        radius={vehicleRadius}
                        pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.1 }}
                    />
                </>
            )}
        </MapContainer>
    );
}
