"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceResult } from "@/lib/places";

const defaultCenter: [number, number] = [39.8283, -98.5795];
const defaultZoom = 4;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recenter({ place }: { place: PlaceResult | null }) {
  const map = useMap();
  useEffect(() => {
    if (place) {
      map.setView([place.lat, place.lon], 14, { animate: true });
    } else {
      map.setView(defaultCenter, defaultZoom, { animate: true });
    }
  }, [place, map]);
  return null;
}

export default function VenueMap({ place }: { place: PlaceResult | null }) {
  return (
    <MapContainer
      center={place ? [place.lat, place.lon] : defaultCenter}
      zoom={place ? 14 : defaultZoom}
      scrollWheelZoom={false}
      className="h-56 w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter place={place} />
      {place ? (
        <Marker position={[place.lat, place.lon]} icon={markerIcon}>
          <Popup>
            <strong>{place.name}</strong>
            <br />
            {[place.city, place.state].filter(Boolean).join(", ")}
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
