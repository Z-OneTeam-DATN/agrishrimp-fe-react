"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type AddressMapPickerProps = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  displayName?: string;
  onPositionChange?: (lat: number, lng: number) => void;
};

type MapRecenterProps = {
  position: [number, number] | null;
};

const DEFAULT_CENTER: [number, number] = [10.0452, 105.7469];

const parseCoordinate = (value: number | string | null | undefined) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPositionChange?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function AddressMapPicker({
  latitude,
  longitude,
  displayName,
  onPositionChange,
}: AddressMapPickerProps) {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  const isZeroCoordinate =
    lat !== null &&
    lng !== null &&
    Math.abs(lat) < 0.000001 &&
    Math.abs(lng) < 0.000001;
  const position: [number, number] | null =
    lat !== null && lng !== null && !isZeroCoordinate ? [lat, lng] : null;

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
          <MapClickHandler onPositionChange={onPositionChange} />
          {position && (
            <Marker
              position={position}
              icon={markerIcon}
              draggable={Boolean(onPositionChange)}
              eventHandlers={{
                dragend(event) {
                  const marker = event.target;
                  const nextPosition = marker.getLatLng();
                  onPositionChange?.(nextPosition.lat, nextPosition.lng);
                },
              }}
            >
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
          Nhap dia chi de tu dinh vi, hoac click tren ban do de chon vi tri.
        </p>
      )}
    </div>
  );
}
