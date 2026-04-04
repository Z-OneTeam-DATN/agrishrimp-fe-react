"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
const markerIcon = new Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({ onLocationSelect, initialLat, initialLng, searchedLat, searchedLng }: any) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : [10.8231, 106.6837]
  );
  const map = useMap();

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  useMapEvents({
    click: handleMapClick,
  });

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
      map.setView([initialLat, initialLng], 13);
    }
  }, [initialLat, initialLng, map]);

  useEffect(() => {
    if (searchedLat && searchedLng) {
      setPosition([searchedLat, searchedLng]);
      map.setView([searchedLat, searchedLng], 15);
    }
  }, [searchedLat, searchedLng, map]);

  return position === null ? null : (
    <Marker position={position} icon={markerIcon}>
      <Popup>
        <div className="text-xs">
          <p className="font-semibold">Vị trí chọn</p>
          <p>Vĩ độ: {position[0].toFixed(6)}</p>
          <p>Kinh độ: {position[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
}

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  searchedLat?: number;
  searchedLng?: number;
}

export default function MapComponent({ onLocationSelect, initialLat, initialLng, searchedLat, searchedLng }: MapComponentProps) {
  const defaultCenter: [number, number] = initialLat && initialLng ? [initialLat, initialLng] : [10.8231, 106.6837];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker
        onLocationSelect={onLocationSelect}
        initialLat={initialLat}
        initialLng={initialLng}
        searchedLat={searchedLat}
        searchedLng={searchedLng}
      />
    </MapContainer>
  );
}
