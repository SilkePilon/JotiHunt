// components/Map.js
"use client";
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  FeatureGroup,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import "@/components/leaflet.draw.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditControl } from "react-leaflet-draw";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { L } from "leaflet";
const FormSchema = z.object({
  email: z
    .string({
      required_error: "Nothing selected",
    })
    .email(),
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
});

const Map = ({ initialPosition }) => {
  const [groups, setGroups] = useState([]);
  const [jotihuntGroups, setJotihuntGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userName, setUserName] = useState("");
  const [isUserNameSubmitted, setIsUserNameSubmitted] = useState(false);
  const [inputName, setInputName] = useState("");
  const [foxLocation, setFoxLocation] = useState(null);
  const [isFoxLocationSubmitted, setIsFoxLocationSubmitted] = useState(false);
  const [foxLocationDialogOpen, setFoxLocationDialogOpen] = useState(false);
  const [foxLocationDeleted, setfoxLocationDeleted] = useState(false);
  const centerOfNetherlands = [52.2858356, 5.6549385899207];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const mapRef = useRef();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      area: "",
      description: "",
    },
  });

  // onSubmit function
  const onSubmit = (data) => {
    console.log("Form submitted with data:", data); // Debugging log to see the submitted data

    // Set the fox location data
    setFoxLocation(data);

    // Show toast with the submitted data
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });

    // Additional actions (e.g., API submission)
    setFoxLocationDialogOpen(false); // Close dialog after submission
  };

  const fetchAllLocations = () => {
    fetch("https://192.168.2.14:5000/api/get-locations")
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
      fetch("https://192.168.2.14:5000/api/save-location", {
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
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 21) + 80; // 80-100%
    const lightness = Math.floor(Math.random() * 11) + 45; // 45-55%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(
          searchQuery
        )}&api_key=66ca693174165807352697gay65c011`
      );
      const data = await response.json();

      console.log(data);

      if (data && data.length > 0) {
        const result = data[0];
        setSearchResult({
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          display_name: result.display_name,
        });

        // Fit the map to the search result
        const map = mapRef.current.leafletElement;
        // map.setView([result.lat, result.lon], 15);
      } else {
        toast({
          title: "No results found",
          description: "Please try a different search query.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      toast({
        title: "Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    }
  };

  const SearchResultCircle = () => {
    const map = useMap();

    useEffect(() => {
      if (searchResult) {
        map.setView([searchResult.lat, searchResult.lon], 15);
      }
    }, [searchResult, map]);

    return searchResult ? (
      <Circle
        center={[searchResult.lat, searchResult.lon]}
        radius={50}
        pathOptions={{ fillColor: "red", color: "red" }}
      >
        <Popup>
          <p>{searchResult.display_name}</p>
        </Popup>
      </Circle>
    ) : null;
  };

  const THUNDERFOREST_API_KEY = "130d9bc1e10a476c9db594341f4d5579";

  return (
    <div>
      <AlertDialog
        open={foxLocationDialogOpen}
        onOpenChange={setFoxLocationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Your Details</AlertDialogTitle>
            <AlertDialogDescription>
              Please fill out the form below to submit your details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <Form {...form}>
              <Form {...form}>
                {/* Notice the use of form.handleSubmit(onSubmit) to handle the form submission */}
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            placeholder="Enter your name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What is in this area?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="What is in this area..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="alpha">
                              Fox team Alpha
                            </SelectItem>
                            <SelectItem value="bravo">
                              Fox team Bravo
                            </SelectItem>
                            <SelectItem value="charlie">
                              Fox team Charlie
                            </SelectItem>
                            <SelectItem value="delta">
                              Fox team Delta
                            </SelectItem>
                            <SelectItem value="echo">Fox team Echo</SelectItem>
                            <SelectItem value="foxtrot">
                              Fox team Foxtrot
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter a description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={(e) => {
                        e.preventDefault();
                        setfoxLocationDeleted(true);
                        setFoxLocationDialogOpen(false);
                        setfoxLocationDeleted(true);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    {/* The submit button type is submit to ensure form submission is triggered */}
                    <Button type="submit">Submit</Button>
                  </AlertDialogFooter>
                </form>
              </Form>
            </Form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
      <div className="relative">
        <MapContainer
          center={centerOfNetherlands}
          zoom={10}
          ref={mapRef}
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

          <FeatureGroup classname="bg-primary text-primary-foreground">
            <EditControl
              position="topright"
              // onEdited={this._onEditPath}
              onCreated={(e) => {
                console.log(e);
                let isLocationConfirmed = false;
                let shouldDeleteLocation = false;

                const openDialog = () => {
                  setFoxLocationDialogOpen(true);
                };

                const handleDialogClose = (confirmed) => {
                  isLocationConfirmed = confirmed;
                  shouldDeleteLocation = !confirmed;
                  setFoxLocationDialogOpen(false);
                };

                const checkStatusAndUpdateLayer = () => {
                  const intervalId = setInterval(() => {
                    if (shouldDeleteLocation) {
                      e.layer.remove();
                      clearInterval(intervalId);
                    } else if (!foxLocationDialogOpen && isLocationConfirmed) {
                      e.layer.bindTooltip(`Fox location`, { permanent: true });
                      clearInterval(intervalId);
                    }
                  }, 100);
                };

                openDialog();
                checkStatusAndUpdateLayer();

                // Update the AlertDialogCancel onClick handler
                const cancelButton =
                  document.querySelector(".AlertDialogCancel");
                if (cancelButton) {
                  cancelButton.onclick = (event) => {
                    event.preventDefault();
                    handleDialogClose(false);
                  };
                }

                // Update the submit button onClick handler
                const submitButton = document.querySelector(
                  'button[type="submit"]'
                );
                if (submitButton) {
                  submitButton.onclick = (event) => {
                    event.preventDefault();
                    handleDialogClose(true);
                    form.handleSubmit(onSubmit)(event);
                  };
                }
              }}
              // onDeleted={this._onDeleted}
              draw={{
                rectangle: false,
                marker: false,
                circlemarker: false,
                polygon: false,
                polyline: false,
                circle: {
                  metric: true,
                  showArea: true,
                  allowIntersection: false, // Restricts shapes to simple polygons

                  drawError: {
                    color: "#FF5733", // Color the shape will turn when intersects
                    message:
                      "<strong>Polygon!<strong> (allowIntersection: false)", // Message that will show when intersect
                  },
                  shapeOptions: {
                    color: "black",
                  },
                },
              }}
              edit={{
                edit: false,
                remove: true,
              }}
              classname="bg-primary text-primary-foreground"
            />
          </FeatureGroup>

          <SearchResultCircle />

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
            <>
              <Circle
                key={index}
                center={[parseFloat(group.lat), parseFloat(group.long)]}
                radius={1000}
                pathOptions={{ fillColor: getRandomColor(), color: "black" }}
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
              <Circle
                key={index * 2}
                center={[parseFloat(group.lat), parseFloat(group.long)]}
                radius={49}
                pathOptions={{ fillColor: getRandomColor(), color: "black" }}
              >
                <Popup className="request-popup">
                  <h1>
                    This circle area is within 50 meters of the main clubhouse
                  </h1>
                </Popup>
              </Circle>
            </>
          ))}
        </MapContainer>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 z-[1] flex items-center space-x-2"
          style={{ marginTop: "-78vh" }}
        >
          <Input
            className="w-64"
            placeholder="Search for location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch} variant="secondary" className="w-20">
            Search
          </Button>
        </div>
      </div>

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
