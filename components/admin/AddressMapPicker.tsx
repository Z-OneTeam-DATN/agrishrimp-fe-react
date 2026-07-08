"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

type AddressMapPickerProps = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  displayName?: string;
};

type MapRecenterProps = {
  position: [number, number] | null;
};

const DEFAULT_CENTER: [number, number] = [10.0452, 105.7469];

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 9999px;
      background: #059669;
      border: 3px solid #ffffff;
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; border-radius: 9999px; background: #ffffff;"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

function MapRecenter({ position }: MapRecenterProps) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 17, { animate: true });
    }
  }, [map, position]);

  return null;
}

export default function AddressMapPicker({
  latitude,
  longitude,
  displayName,
}: AddressMapPickerProps) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPosition = Number.isFinite(lat) && Number.isFinite(lng);
  const position: [number, number] | null = hasPosition ? [lat, lng] : null;

  return (
    <div className="xl:col-span-12">
      <div className="h-[350px] overflow-hidden border border-slate-200 bg-slate-50">
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 17 : 12}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter position={position} />
          {position && (
            <Marker position={position} icon={markerIcon}>
              <Popup>{displayName || "Vi tri chi nhanh"}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {displayName ? (
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {displayName}
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          Chon goi y dia chi de hien thi marker tren ban do.
        </p>
      )}
    </div>
  );
}
