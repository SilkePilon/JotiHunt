// components/Map.js
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
import "leaflet/dist/leaflet.css";

const Map = ({ initialPosition }) => {
  const [groups, setGroups] = useState([]);
  const [jotihuntGroups, setJotihuntGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userName, setUserName] = useState("");
  const [isUserNameSubmitted, setIsUserNameSubmitted] = useState(false);
  const [inputName, setInputName] = useState("");

  const centerOfNetherlands = [52.2858356, 5.6549385899207];

  const fetchAllLocations = () => {
    fetch("http://192.168.2.14:5000/api/get-locations")
      .then((response) => response.json())
      .then((data) => {
        setGroups(
          Object.entries(data).map(([name, location]) => ({
            name,
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            description: location.description || "",
          }))
        );
      })
      .catch((error) => console.error("Error fetching user locations:", error));
  };

  useEffect(() => {
    fetchAllLocations();
    const interval = setInterval(fetchAllLocations, 120000);
    return () => clearInterval(interval);
  }, [isUserNameSubmitted]);

  useEffect(() => {
    fetch("https://jotihunt.nl/api/2.0/subscriptions")
      .then((response) => response.json())
      .then((data) => setJotihuntGroups(data.data))
      .catch((error) => console.error("Error fetching Jotihunt data:", error));
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => console.error("Error obtaining location", error)
      );
    } else {
      console.error("Geolocation not supported");
    }
  }, []);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName && userLocation) {
      fetch("http://192.168.2.14:5000/api/save-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName,
          latitude: userLocation[0],
          longitude: userLocation[1],
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setIsUserNameSubmitted(true);
        })
        .catch((error) => console.error("Error saving location:", error));
    }
  };

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
    <div>
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
            center={[group.latitude, group.longitude]}
            radius={300}
            pathOptions={{ fillColor: getRandomColor(), color: "black" }}
            eventHandlers={{
              click: () => setSelectedGroup(group),
            }}
          >
            <Popup className="request-popup">
              <p>Name: {group.name}</p>
              <p>Description: {group.description}</p>
              <p>Latitude: {group.latitude}</p>
              <p>Longitude: {group.longitude}</p>
            </Popup>
          </Circle>
        ))}

        {jotihuntGroups.map((group, index) => (
          <Circle
            key={index}
            center={[parseFloat(group.lat), parseFloat(group.long)]}
            radius={1000}
            pathOptions={{ fillColor: getRandomColor(), color: "blue" }}
          >
            <Popup className="request-popup">
              <p>Name: {group.name}</p>
              <p>Accommodation: {group.accomodation}</p>
              <p>
                Address: {group.street} {group.housenumber}
                {group.housenumber_addition}
              </p>
              <p>
                {group.postcode} {group.city}
              </p>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {selectedGroup && (
        <Card className="absolute top-4 right-4 z-[1000] w-64">
          <CardHeader>{selectedGroup.name}</CardHeader>
          <CardContent>
            <p>Latitude: {selectedGroup.latitude}</p>
            <p>Longitude: {selectedGroup.longitude}</p>
            <Button onClick={() => setSelectedGroup(null)}>Close</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Map;
