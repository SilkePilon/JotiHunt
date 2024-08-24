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

import { Component } from "react";
import L from "react-leaflet";
import { Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  initialPosition: [number, number];
}

const Map: React.FC<MapProps> = ({ initialPosition }) => {
  const [groups, setGroups] = useState([]); // State for user locations
  const [jotihuntGroups, setJotihuntGroups] = useState([]); // State for Jotihunt locations
  const [selectedGroup, setSelectedGroup] = useState(null); // State for selected group details
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  ); // User's current location
  const [userName, setUserName] = useState(""); // User's name
  const [isUserNameSubmitted, setIsUserNameSubmitted] = useState(false); // Username submission state
  const [inputName, setInputName] = useState(""); // Input field value state

  const centerOfNetherlands = [52.2858356, 5.6549385899207]; // Default map center position

  // Function to fetch all users' locations
  const fetchAllLocations = () => {
    fetch("http://192.168.2.14:5000/api/get-locations")
      .then((response) => response.json())
      .then((data) => {
        setGroups(
          Object.entries(data).map(([name, location]) => ({
            name,
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            description: location.description || "", // Include description
          }))
        );
      })
      .catch((error) => console.error("Error fetching user locations:", error));
  };

  // Fetch user locations initially and every 2 minutes
  useEffect(() => {
    fetchAllLocations(); // Initial fetch
    const interval = setInterval(fetchAllLocations, 120000); // Fetch every 2 minutes

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [isUserNameSubmitted]);

  // Fetch Jotihunt groups' locations
  useEffect(() => {
    fetch("https://jotihunt.nl/api/2.0/subscriptions")
      .then((response) => response.json())
      .then((data) => setJotihuntGroups(data.data))
      .catch((error) => console.error("Error fetching Jotihunt data:", error));
  }, []);

  // Fetch user's current location using Geolocation API
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

  // Handle form submission to save user's location and name
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
          setIsUserNameSubmitted(true); // Hide the username input popup after submission
        })
        .catch((error) => console.error("Error saving location:", error));
    }
  };

  // Function to generate random color for each user's marker
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
      {/* Show the username input form only if the username hasn't been submitted yet */}
      {/* {!isUserNameSubmitted && (
        <Card className="absolute z-[1000] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded">
          <CardHeader>Enter your name</CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit}>
              <label>
                Enter your name:
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="border rounded p-1 ml-2"
                />
              </label>
              <Button type="submit" className="ml-2">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      )} */}

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

        {/* Display user locations */}
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

        {/* Display Jotihunt locations */}
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

        {/* Show selected group's detailed information */}
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
      </MapContainer>
    </div>
  );
};

export default Map;
