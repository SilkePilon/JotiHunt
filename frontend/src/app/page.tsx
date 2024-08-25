"use client";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { CodeViewer } from "@/components/code-viewer";
import { MaxLengthSelector } from "@/components/maxlength-selector";
import { ModelSelector } from "@/components/model-selector";
import { PresetActions } from "@/components/preset-actions";
import { PresetSave } from "@/components/preset-save";
import { PresetSelector } from "@/components/preset-selector";
import { PresetShare } from "@/components/preset-share";
import { TemperatureSelector } from "@/components/temperature-selector";
import { TopPSelector } from "@/components/top-p-selector";
import { models, types } from "./data/models";
import { presets } from "./data/presets";
import { ModeToggle } from "@/components/mode-toggle";
import dynamic from "next/dynamic";
import { useMediaQuery } from "usehooks-ts";
import AreaStatusButtons from "@/components/AreaStatusButtons"; // Import the new component
import { FaGlobeAmericas } from "react-icons/fa";
import { FaCarSide } from "react-icons/fa";
import { IoChatbox } from "react-icons/io5";
import { RiSettings3Fill } from "react-icons/ri";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PlaygroundPage() {
  const [isMounted, setIsMounted] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (isDesktop) {
    return (
      <>
        <div className="h-full flex-col md:flex">
          <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
            <h2 style={{ width: "100%" }} className="text-lg font-semibold">
              JotiHunt Map
            </h2>
            <ModeToggle></ModeToggle>

            <div
              style={{ paddingLeft: "10px" }}
              className="ml-auto flex w-full space-x-2 sm:justify-end"
            >
              <PresetSelector presets={presets} />
              <PresetSave />
              <div className="hidden space-x-2 md:flex">
                <CodeViewer />
                <PresetShare />
              </div>
              <PresetActions />
            </div>
          </div>
          <Separator />
          <Tabs defaultValue="complete" className="flex-1">
            <div className="container h-full py-6">
              <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
                <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                  <div className="grid gap-2">
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Mode
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-[320px] text-sm"
                        side="left"
                      >
                        Choose the interface that best suits your task. You can
                        provide: a simple prompt to complete, starting and
                        ending text to insert a completion within, or some text
                        with instructions to edit it.
                      </HoverCardContent>
                    </HoverCard>
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="complete">
                        <span className="sr-only">Map</span>
                        <FaGlobeAmericas className="size-5" />
                      </TabsTrigger>
                      <TabsTrigger value="insert">
                        <span className="sr-only">Location</span>
                        <FaCarSide className="size-5" />
                      </TabsTrigger>
                      <TabsTrigger value="edit">
                        <span className="sr-only">Chat</span>
                        <IoChatbox className="size-5" />
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <ModelSelector types={types} models={models} />
                  <TemperatureSelector defaultValue={[0.56]} />
                  <MaxLengthSelector defaultValue={[256]} />
                  <TopPSelector defaultValue={[0.9]} />
                  <Separator style={{ height: "2px" }} />
                  <AreaStatusButtons />
                </div>
                <div className="md:order-1">
                  <TabsContent value="complete" className="mt-0 border-0 p-0">
                    <div className="flex h-full flex-col space-y-4">
                      {/* <Textarea placeholder="Write a tagline for an ice cream shop" /> */}
                      {/*  // @ts-ignore */}
                      {/* <MapContainer
                        viewport={{ center: [40.505, -100.09], zoom: 13 }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                        />
                      </MapContainer> */}
                      {/* <MapContainer
                        center={initialPosition}
                        zoom={10}
                        className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Markers />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </MapContainer> */}
                      {isMounted && <MapWithNoSSR />}
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="insert" className="mt-0 border-0 p-0">
                    <div className="flex flex-col space-y-4">
                      <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                        {/* <Textarea
                          placeholder="We're writing to [inset]. Congrats from OpenAI!"
                          className="h-full min-h-[300px] lg:min-h-[700px] xl:min-h-[700px]"
                        /> */}
                        {isMounted && <MapWithNoSSR />}
                        <div className="rounded-md border bg-muted"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="edit" className="mt-0 border-0 p-0">
                    <div className="flex flex-col space-y-4">
                      <div className="grid h-full gap-6 lg:grid-cols-2">
                        <div className="flex flex-col space-y-4">
                          <div className="flex flex-1 flex-col space-y-2">
                            <Label htmlFor="input">Input</Label>
                            <Textarea
                              id="input"
                              placeholder="We is going to the market."
                              className="flex-1 lg:min-h-[580px]"
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="instructions">Instructions</Label>
                            <Textarea
                              id="instructions"
                              placeholder="Fix the grammar."
                            />
                          </div>
                        </div>
                        <div className="mt-[21px] min-h-[400px] rounded-md border bg-muted lg:min-h-[700px]" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="h-full flex-col md:flex">
          <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
            <h2
              style={{ width: "100%" }}
              className="text-lg font-semibold text-center"
            >
              JotiHunt Map
            </h2>
            {/* <ModeToggle></ModeToggle> */}

            <div
              style={{ paddingLeft: "10px" }}
              className="ml-auto flex w-full space-x-2 sm:justify-end"
            >
              <PresetSelector presets={presets} />
              <PresetSave />
              <div className="hidden space-x-2 md:flex">
                <CodeViewer />
                <PresetShare />
              </div>
              <PresetActions />
            </div>
          </div>
          <Separator />
          <Tabs defaultValue="complete" className="flex-1">
            <div className="container h-full py-6">
              <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
                <div className="md:order-1">
                  <TabsContent value="complete" className="mt-0 border-0 p-0">
                    <div className="flex h-full flex-col space-y-4">
                      {/* <Textarea placeholder="Write a tagline for an ice cream shop" /> */}
                      {/*  // @ts-ignore */}
                      {/* <MapContainer
                        viewport={{ center: [40.505, -100.09], zoom: 13 }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                        />
                      </MapContainer> */}
                      {/* <MapContainer
                        center={initialPosition}
                        zoom={10}
                        className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                        style={{ borderRadius: "0.75rem" }}
                      >
                        <Markers />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </MapContainer> */}
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                          >
                            <RiSettings3Fill
                              style={{ marginRight: "7px" }}
                              className="size-5"
                            />
                            Settings
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div className="flex flex-col space-y-4 p-4">
                            <div className="grid gap-2">
                              <HoverCard openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Mode
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  className="w-[280px] text-sm"
                                  side="top"
                                >
                                  Choose the interface that best suits your
                                  task. You can provide: a simple prompt to
                                  complete, starting and ending text to insert a
                                  completion within, or some text with
                                  instructions to edit it.
                                </HoverCardContent>
                              </HoverCard>
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <FaCarSide className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="edit">
                                  <span className="sr-only">Chat</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} /> */}
                            {/* <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Separator className="my-4" />
                            <AreaStatusButtons />
                          </div>
                        </DrawerContent>
                      </Drawer>
                      {isMounted && <MapWithNoSSR classname="max-h-1.5" />}
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="insert" className="mt-0 border-0 p-0">
                    <div className="flex flex-col space-y-4">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                          >
                            <RiSettings3Fill
                              style={{ marginRight: "7px" }}
                              className="size-5"
                            />
                            Settings
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div className="flex flex-col space-y-4 p-4">
                            <div className="grid gap-2">
                              <HoverCard openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Mode
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  className="w-[280px] text-sm"
                                  side="top"
                                >
                                  Choose the interface that best suits your
                                  task. You can provide: a simple prompt to
                                  complete, starting and ending text to insert a
                                  completion within, or some text with
                                  instructions to edit it.
                                </HoverCardContent>
                              </HoverCard>
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <FaCarSide className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="edit">
                                  <span className="sr-only">Chat</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} />
                            <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Separator className="my-4" />
                            <AreaStatusButtons />
                          </div>
                        </DrawerContent>
                      </Drawer>
                      <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                        {/* <Textarea
                          placeholder="We're writing to [inset]. Congrats from OpenAI!"
                          className="h-full min-h-[300px] lg:min-h-[700px] xl:min-h-[700px]"
                        /> */}

                        {isMounted && <MapWithNoSSR />}
                        <div className="rounded-md border bg-muted"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="edit" className="mt-0 border-0 p-0">
                    <div className="flex flex-col space-y-4">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                          >
                            <RiSettings3Fill
                              style={{ marginRight: "7px" }}
                              className="size-5"
                            />
                            Settings
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div className="flex flex-col space-y-4 p-4">
                            <div className="grid gap-2">
                              <HoverCard openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Mode
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  className="w-[280px] text-sm"
                                  side="top"
                                >
                                  Choose the interface that best suits your
                                  task. You can provide: a simple prompt to
                                  complete, starting and ending text to insert a
                                  completion within, or some text with
                                  instructions to edit it.
                                </HoverCardContent>
                              </HoverCard>
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <FaCarSide className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="edit">
                                  <span className="sr-only">Chat</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} />
                            <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Separator className="my-4" />
                            <AreaStatusButtons />
                          </div>
                        </DrawerContent>
                      </Drawer>
                      <div className="grid h-full gap-6 lg:grid-cols-2">
                        <div className="flex flex-col space-y-4">
                          <div className="flex flex-1 flex-col space-y-2">
                            <Label htmlFor="input">Input</Label>
                            <Textarea
                              id="input"
                              placeholder="We is going to the market."
                              className="flex-1 lg:min-h-[580px]"
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="instructions">Instructions</Label>
                            <Textarea
                              id="instructions"
                              placeholder="Fix the grammar."
                            />
                          </div>
                        </div>
                        <div className="mt-[21px] min-h-[400px] rounded-md border bg-muted lg:min-h-[700px]" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button>Submit</Button>
                        <Button variant="secondary">
                          <span className="sr-only">Show history</span>
                          <CounterClockwiseClockIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </>
    );
  }
}
