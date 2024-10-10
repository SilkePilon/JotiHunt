// components/Map.js
"use client";
import React, { useState, useEffect } from "react";
import { Circle, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import "@/components/leaflet.draw.css";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { FaLocationDot } from "react-icons/fa6";
import { FaMapMarkedAlt } from "react-icons/fa";
import { SiGooglemaps } from "react-icons/si";

import MarkerPinAlpha from "../images/pins/marker-pin-alpha.svg";
import MarkerPinBravo from "../images/pins/marker-pin-bravo.svg";
import MarkerPinCharlie from "../images/pins/marker-pin-charlie.svg";
import MarkerPinDelta from "../images/pins/marker-pin-delta.svg";
import MarkerPinEcho from "../images/pins/marker-pin-echo.svg";
import MarkerPinFoxtrot from "../images/pins/marker-pin-foxtrot.svg";

import { L, Map } from "leaflet";
import { icon } from "leaflet";

type Deelgebied = "alpha" | "bravo" | "charlie" | "delta" | "echo" | "foxtrot";

const MarkerMap: Record<Deelgebied, any> = {
  alpha: icon({
    iconUrl: MarkerPinAlpha.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
  bravo: icon({
    iconUrl: MarkerPinBravo.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
  charlie: icon({
    iconUrl: MarkerPinCharlie.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
  delta: icon({
    iconUrl: MarkerPinDelta.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
  echo: icon({
    iconUrl: MarkerPinEcho.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
  foxtrot: icon({
    iconUrl: MarkerPinFoxtrot.src,
    className: "svg-icon",
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  }),
};

const getScoutingGroupIcon = (gebied: Deelgebied) => {
  const gebieden = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];
  const gebied2 = gebieden[Math.floor(Math.random() * 6)];
  return MarkerMap[gebied2];
};

export default function ScoutingGroupsPositions({
  jotihuntGroups,
}: {
  jotihuntGroups: any[];
}) {
  console.log(jotihuntGroups);
  return (
    <>
      {jotihuntGroups.map((group, index) => (
        <>
          <Marker
            position={[parseFloat(group.lat), parseFloat(group.long)]}
            icon={getScoutingGroupIcon("echo")}
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
          </Marker>
        </>
      ))}
    </>
  );
}
