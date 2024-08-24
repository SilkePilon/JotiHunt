// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Circle,
  Popup,
} from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  initialPosition: [number, number];
}

const Map: React.FC<MapProps> = ({ initialPosition }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const centerOfNetherlands = [52.2858356, 5.6549385899207];

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      fetch("https://jotihunt.nl/api/2.0/subscriptions")
        .then((response) => response.json())
        .then((data) => setGroups(data.data))
        .catch((error) => console.error("Error fetching data:", error));
    }
  }, []);

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const THUNDERFOREST_API_KEY = "130d9bc1e10a476c9db594341f4d5579";

  return (
    <MapContainer
      center={centerOfNetherlands}
      zoom={10}
      style={{ height: "80vh", width: "100%", borderRadius: "0.75rem" }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay name="Bike Lanes">
          <TileLayer
            url={`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_API_KEY}`}
            attribution='&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Walking Paths">
          <TileLayer
            url={`https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_API_KEY}`}
            attribution='&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.Overlay>
      </LayersControl>

      {groups.map((group, index) => (
        <Circle
          key={index}
          center={[parseFloat(group.lat), parseFloat(group.long)]}
          radius={1000}
          pathOptions={{ fillColor: getRandomColor(), color: "black" }}
          eventHandlers={{
            click: () => setSelectedGroup(group),
          }}
        >
          <Popup className="request-popup">
            {/* <Card>
              <CardHeader>{group.name}</CardHeader>
              <CardContent>
                <p>Accommodatie: {group.accomodation}</p>
                <p>
                  Adres: {group.street} {group.housenumber}
                  {group.housenumber_addition}
                </p>
                <p>
                  {group.postcode} {group.city}
                </p>
                <Button onClick={() => setSelectedGroup(null)}>Sluiten</Button>
              </CardContent>
            </Card> */}
            <p>Accommodatie: {group.accomodation}</p>
            <p>
              Adres: {group.street} {group.housenumber}
              {group.housenumber_addition}
            </p>
            <p>
              {group.postcode} {group.city}
            </p>
          </Popup>
        </Circle>
      ))}

      {selectedGroup && (
        <Card className="absolute top-4 right-4 z-[1000] w-64">
          <CardHeader>{selectedGroup.name}</CardHeader>
          <CardContent>
            <p>Accommodatie: {selectedGroup.accomodation}</p>
            <p>
              Adres: {selectedGroup.street} {selectedGroup.housenumber}
              {selectedGroup.housenumber_addition}
            </p>
            <p>
              {selectedGroup.postcode} {selectedGroup.city}
            </p>
            <Button onClick={() => setSelectedGroup(null)}>Sluiten</Button>
          </CardContent>
        </Card>
      )}
    </MapContainer>
  );
};

export default JotiHuntMap;
