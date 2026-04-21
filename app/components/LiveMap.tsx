"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon issues
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

const deleteIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Custom Icon for Vehicle (Green Truck-like if we had one, but let's use a different hue or just standard)
// Let's use standard for vehicle.
// For User, let's use a CircleMarker in the component, or a different icon.
// I will use a custom red icon for the vehicle to distinguish.
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


interface LiveMapProps {
    userLocation?: [number, number]; // [lat, lng]
    vehicleLocation?: [number, number]; // [lat, lng]
    vehicleRadius?: number; // meters
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMapEvents({});
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function LiveMap({ userLocation, vehicleLocation, vehicleRadius = 700 }: LiveMapProps) {
    const defaultCenter: [number, number] = [28.6139, 77.2090]; // New Delhi fallback
    const center = userLocation || vehicleLocation || defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-center map when user location changes */}
            {userLocation && <MapUpdater center={userLocation} />}

            {/* User Location */}
            {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                    <Popup>Your Location</Popup>
                </Marker>
            )}

            {/* Vehicle Location & Radius */}
            {vehicleLocation && (
                <>
                    <Marker position={vehicleLocation} icon={vehicleIcon}>
                        <Popup>Municipality Vehicle</Popup>
                    </Marker>
                    <Circle
                        center={vehicleLocation}
                        radius={vehicleRadius}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                </>
            )}
        </MapContainer>
    );
}
