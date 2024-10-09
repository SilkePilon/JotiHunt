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
import { MdAccessTimeFilled } from "react-icons/md";
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
import { Bar, BarChart, Rectangle, XAxis } from "recharts";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { EditControl } from "react-leaflet-draw";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { L, Map } from "leaflet";
const FormSchema = z.object({
  email: z
    .string({
      required_error: "Nothing selected",
    })
    .email(),
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
});
import { FaLocationDot } from "react-icons/fa6";
import { FaMapMarkedAlt } from "react-icons/fa";
import { MdPhotoCamera } from "react-icons/md";
import { SiGooglemaps } from "react-icons/si";

const Map = ({ initialPosition }) => {
  const [users, setUsers] = useState([]);
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
  const [map, setMap] = useState<Map | null>(null);
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
    fetch("https://api.jotiboard.nl/api/get-locations")
      .then((response) => response.json())
      .then((data) => {
        setUsers(
          Object.entries(data).map(([name, location]) => ({
            name: location.name,
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            description: location.description || "",
            timestamp: location.timestamp,
          }))
        );
      })
      .catch((error) => console.error("Error fetching user locations:", error));
  };

  useEffect(() => {
    fetchAllLocations();
    const interval = setInterval(fetchAllLocations, 30000);
    return () => clearInterval(interval);
  }, []);

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
      fetch("https://localhost:5000/api/save-location", {
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);

    // Format the date (you can adjust this to your liking)
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return date.toLocaleString("en-US", options);
  };

  const handleSearch = async () => {
    // Regular expression to match latitude and longitude coordinates
    const coordRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = searchQuery.match(coordRegex);

    if (match) {
      // If the input matches the coordinate pattern, use these coordinates directly
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[3]);

      setSearchResult({
        lat,
        lon,
        display_name: `${lat}, ${lon} - radius: 1m`,
        radius: 1,
      });
    } else {
      // If not coordinates, proceed with the geocoding lookup
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
            radius: 50,
          });

          // Fit the map to the search result
          const mapd = map.current.leafletElement;
          mapd.setView([result.lat, result.lon], 15);
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
        radius={searchResult.radius}
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
        <AlertDialogContent style={{ borderRadius: "0.76rem" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Area Notice!</AlertDialogTitle>
            <AlertDialogDescription>
              Have you seen something in this area?
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
                              <SelectValue placeholder="For example: Alpha team" />
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
                            <SelectItem value="unknown">
                              Unknown fox team
                            </SelectItem>
                            <SelectItem value="group">
                              Other scouting group
                            </SelectItem>
                            <SelectItem value="other">
                              other (please specify in description)
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Last seen at..." />
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
          ref={setMap}
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
                polyline: {
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

          {users.map((user, index) => (
            <React.Fragment key={index}>
              <Circle
                center={[parseFloat(user.latitude), parseFloat(user.longitude)]}
                radius={200}
                pathOptions={{ fillColor: "black", color: "black" }}
              >
                <Popup className="request-popup" minWidth={280} maxWidth={280}>
                  <Card className="w-full h-full shadow-none">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle>{user.name || "Unregistered user"}</CardTitle>
                      {/* latitude: parseFloat(location.latitude), longitude:
                      parseFloat(location.longitude), description:
                      location.description || "", */}
                      <CardDescription>
                        <div className="space-y-2">
                          {user.name && (
                            <>
                              <strong>
                                {user.name || "Unregistered user"}
                                {""} is sharing his/her location.<br></br>This
                                location is acuate between 20 and 400m.
                              </strong>
                              <br></br>
                              <br></br>
                              <strong>
                                {user.name || "Unregistered user"}&apos;s
                                description:
                              </strong>
                              <br></br>
                              {user.description || "No description provided."}
                              <br></br>
                            </>
                          )}

                          <ul className="space-y-2">
                            <li className="flex items-center">
                              <FaLocationDot className="mr-2" />
                              <span>
                                {user.latitude}, {user.longitude}
                              </span>
                            </li>
                            <li className="flex items-center">
                              <MdAccessTimeFilled className="mr-2" />
                              <span>{formatDate(user.timestamp)}</span>
                            </li>
                            {/* {group.area && (
                              <li className="flex items-center">
                                <FaMapMarkedAlt className="mr-2" />
                                <span>{group.area}</span>
                              </li>
                            )} */}
                            {/* <li className="flex items-center">
                              <MdPhotoCamera className="mr-2" />
                              <span>
                                {group.photo_assignment_points ? 0 : 0} photo
                                assignment points
                              </span>
                            </li> */}
                          </ul>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      style={{ marginTop: "10px" }}
                      className="flex flex-row items-baseline gap-4 p-4 pt-2"
                    >
                      <Button className="w-full">
                        <a
                          style={{ color: "inherit" }}
                          target="_blank"
                          href={`https://www.google.nl/maps/place/${user.latitude},${user.longitude}`}
                        >
                          <div className="flex items-center">
                            <SiGooglemaps className="mr-2" />
                            <span>View on Maps</span>
                          </div>
                        </a>
                      </Button>
                      <Button
                        onClick={() => {
                          map && map.closePopup();
                        }}
                        className="w-full"
                        style={{ backgroundColor: "#ff6961" }}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}

          {jotihuntGroups.map((group, index) => (
            <React.Fragment key={index}>
              <Circle
                center={[parseFloat(group.lat), parseFloat(group.long)]}
                radius={1000}
                pathOptions={{ fillColor: getRandomColor(), color: "black" }}
              >
                <Popup className="request-popup" minWidth={280} maxWidth={280}>
                  <Card className="w-full h-full shadow-none">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle>{group.name}</CardTitle>

                      <CardDescription>
                        <div className="space-y-2">
                          {group.accomodation} -{" "}
                          <a
                            target="_blank"
                            className="underline"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${
                              group.street
                            }+${group.housenumber}${
                              group.housenumber_addition
                                ? group.housenumber_addition
                                : ""
                            }+${group.city}&travelmode=driving`}
                          >
                            {group.street} {group.housenumber}
                            {group.housenumber_addition} {group.city}
                          </a>
                          <ul className="space-y-2">
                            <li className="flex items-center">
                              <FaLocationDot className="mr-2" />
                              <span>
                                {group.lat}, {group.long}
                              </span>
                            </li>
                            {group.area && (
                              <li className="flex items-center">
                                <FaMapMarkedAlt className="mr-2" />
                                <span>{group.area}</span>
                              </li>
                            )}
                            {/* <li className="flex items-center">
                              <MdPhotoCamera className="mr-2" />
                              <span>
                                {group.photo_assignment_points ? 0 : 0} photo
                                assignment points
                              </span>
                            </li> */}
                          </ul>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      style={{ marginTop: "10px" }}
                      className="flex flex-row items-baseline gap-4 p-4 pt-2"
                    >
                      <Button className="w-full">
                        <a
                          style={{ color: "inherit" }}
                          target="_blank"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${
                            group.street
                          }+${group.housenumber}${
                            group.housenumber_addition
                              ? group.housenumber_addition
                              : ""
                          }+${group.city}&travelmode=driving`}
                        >
                          <div className="flex items-center">
                            <SiGooglemaps className="mr-2" />
                            <span>Get directions</span>
                          </div>
                        </a>
                      </Button>
                      <Button
                        onClick={() => {
                          map && map.closePopup();
                        }}
                        className="w-full"
                        style={{ backgroundColor: "#ff6961" }}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </Popup>
              </Circle>
              <Circle
                center={[parseFloat(group.lat), parseFloat(group.long)]}
                radius={499}
                pathOptions={{ fillColor: getRandomColor(), color: "black" }}
              >
                <Popup className="request-popup" minWidth={280} maxWidth={280}>
                  <Card className="w-full h-full shadow-none">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        <div className="space-y-2">
                          Inside this area you can place your counter hunt!
                          <ul
                            style={{ paddingTop: "10px" }}
                            className="space-y-2"
                          >
                            <li className="flex items-center">
                              <FaLocationDot className="mr-2" />
                              <span>Within 50 meters</span>
                            </li>
                          </ul>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      style={{ marginTop: "10px" }}
                      className="flex flex-row items-baseline gap-4 p-4 pt-2"
                    >
                      <Button
                        onClick={() => {
                          map && map.closePopup();
                        }}
                        className="w-full"
                        style={{ backgroundColor: "#ff6961" }}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}
        </MapContainer>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 z-[1] flex flex-col items-center space-y-2"
          style={{ marginTop: "-78vh" }}
        >
          <div className="flex items-center space-x-2">
            <Input
              style={{ width: "30vw" }}
              placeholder="location name or lat/long..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch} variant="secondary" className="w-20">
              Search
            </Button>
          </div>
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
