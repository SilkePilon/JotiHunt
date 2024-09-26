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
// import { CodeViewer } from "@/components/code-viewer";
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
import { IoChatbox } from "react-icons/io5";
import { RiSettings3Fill } from "react-icons/ri";
import { AiFillNotification } from "react-icons/ai";
import NewsCardList from "@/components/cardlist";
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
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
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
  const [key, setKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prevKey) => prevKey + 1);
    }, 60000); // 60000 milliseconds = 1 minute

    return () => clearInterval(interval);
  }, []);

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

            <div
              style={{ paddingLeft: "10px" }}
              className="ml-auto flex w-full space-x-2 sm:justify-end"
            >
              {/* <PresetSelector presets={presets} /> */}
              <PresetSave />
              <div className="hidden space-x-2 md:flex">
                {/* <CodeViewer /> */}
                {/* <PresetShare /> */}
                <ModeToggle />
              </div>
              {/* <PresetActions /> */}
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
                          Select Page
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
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="complete">
                        <span className="sr-only">Map</span>
                        <FaGlobeAmericas className="size-5" />
                      </TabsTrigger>
                      <TabsTrigger value="insert">
                        <span className="sr-only">Location</span>
                        <IoChatbox className="size-5" />
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <Card className="">
                    <CardContent className="flex gap-4 p-5 pb-2">
                      <ChartContainer
                        config={{
                          move: {
                            label: "Opdrachten",
                            color: "hsl(var(--chart-1))",
                          },
                          stand: {
                            label: "News",
                            color: "hsl(var(--chart-2))",
                          },
                          exercise: {
                            label: "Tips",
                            color: "hsl(var(--chart-3))",
                          },
                        }}
                        className="h-[140px] w-full"
                      >
                        <BarChart
                          margin={{
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 10,
                          }}
                          data={[
                            {
                              activity: "Opdrachten",
                              value: (8 / 12) * 100,
                              label: "1",
                              fill: "var(--color-stand)",
                            },
                            {
                              activity: "News",
                              value: (46 / 60) * 100,
                              label: "1",
                              fill: "var(--color-exercise)",
                            },
                            {
                              activity: "Tips",
                              value: 100,
                              label: "1",
                              fill: "var(--color-move)",
                            },
                          ]}
                          layout="vertical"
                          barSize={32}
                          barGap={2}
                        >
                          <XAxis type="number" dataKey="value" hide />
                          <YAxis
                            dataKey="activity"
                            type="category"
                            tickLine={false}
                            tickMargin={4}
                            axisLine={false}
                            className="capitalize"
                          />
                          <Bar dataKey="value" radius={5}>
                            <LabelList
                              position="insideLeft"
                              dataKey="label"
                              fill="white"
                              offset={8}
                              fontSize={12}
                            />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex flex-row border-t p-4">
                      <div className="flex w-full items-center gap-2">
                        <div className="grid flex-1 auto-rows-min gap-0.5">
                          <div className="text-xs text-muted-foreground">
                            Hunts
                          </div>
                          <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                            0
                            {/* <span className="text-sm font-normal text-muted-foreground">
                              kcal
                            </span> */}
                          </div>
                        </div>
                        <Separator
                          orientation="vertical"
                          className="mx-2 h-10 w-px"
                        />
                        <div className="grid flex-1 auto-rows-min gap-0.5">
                          <div className="text-xs text-muted-foreground">
                            Leaderboard
                          </div>
                          <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                            10
                            {/* <span className="text-sm font-normal text-muted-foreground">
                              position
                            </span> */}
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>

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
                    </div>
                  </TabsContent>
                  <TabsContent value="insert" className="mt-0 border-0 p-0">
                    <div className="flex flex-col space-y-4">
                      <div
                        style={{ maxHeight: "80vh" }}
                        className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1"
                      >
                        <div
                          style={{ overflow: "hidden" }}
                          id="news"
                          className="rounded-md border  bg-muted"
                        >
                          <NewsCardList />
                        </div>
                        <div
                          id="opdrachten"
                          className="rounded-md border w-full bg-muted"
                        ></div>
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
            {/* <p style={{ width: "100%" }} className="text-xs text-center">
              The hunt app for on the move
            </p> */}
            {/* <ModeToggle></ModeToggle> */}

            <div
              style={{ paddingLeft: "10px" }}
              className="ml-auto flex w-full space-x-2 sm:justify-end items-center center-content"
            >
              {/* <PresetSelector presets={presets} /> */}
              {/* <PresetSave /> */}
              <div className="hidden space-x-2 md:flex">
                {/* <CodeViewer /> */}
                {/* <PresetShare /> */}
              </div>
              <ModeToggle />
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
                                    Select Page
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
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} /> */}
                            {/* <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Card className="">
                              <CardContent className="flex gap-4 p-5 pb-2">
                                <ChartContainer
                                  config={{
                                    move: {
                                      label: "Opdrac..",
                                      color: "hsl(var(--chart-1))",
                                    },
                                    stand: {
                                      label: "News",
                                      color: "hsl(var(--chart-2))",
                                    },
                                    exercise: {
                                      label: "Tips",
                                      color: "hsl(var(--chart-3))",
                                    },
                                  }}
                                  className="h-[140px] w-full"
                                >
                                  <BarChart
                                    margin={{
                                      left: 0,
                                      right: 0,
                                      top: 0,
                                      bottom: 10,
                                    }}
                                    data={[
                                      {
                                        activity: "Opdrac..",
                                        value: (8 / 12) * 100,
                                        label: "1",
                                        fill: "var(--color-stand)",
                                      },
                                      {
                                        activity: "News",
                                        value: (46 / 60) * 100,
                                        label: "1",
                                        fill: "var(--color-exercise)",
                                      },
                                      {
                                        activity: "Tips",
                                        value: 100,
                                        label: "1",
                                        fill: "var(--color-move)",
                                      },
                                    ]}
                                    layout="vertical"
                                    barSize={32}
                                    barGap={2}
                                  >
                                    <XAxis type="number" dataKey="value" hide />
                                    <YAxis
                                      dataKey="activity"
                                      type="category"
                                      tickLine={false}
                                      tickMargin={4}
                                      axisLine={false}
                                      className="capitalize"
                                    />
                                    <Bar dataKey="value" radius={5}>
                                      <LabelList
                                        position="insideLeft"
                                        dataKey="label"
                                        fill="white"
                                        offset={8}
                                        fontSize={12}
                                      />
                                    </Bar>
                                  </BarChart>
                                </ChartContainer>
                              </CardContent>
                              <CardFooter className="flex flex-row border-t p-4">
                                <div className="flex w-full items-center gap-2">
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Hunts
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      0
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              kcal
                            </span> */}
                                    </div>
                                  </div>
                                  <Separator
                                    orientation="vertical"
                                    className="mx-2 h-10 w-px"
                                  />
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Leaderboard
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      10
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              position
                            </span> */}
                                    </div>
                                  </div>
                                </div>
                              </CardFooter>
                            </Card>
                            <Separator className="my-4" />
                            <AreaStatusButtons />
                          </div>
                        </DrawerContent>
                      </Drawer>
                      {isMounted && <MapWithNoSSR classname="max-h-1.5" />}
                    </div>
                  </TabsContent>
                  <TabsContent value="de " className="mt-0 border-0 p-0">
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
                                    Select Page
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
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} />
                            <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Card className="">
                              <CardContent className="flex gap-4 p-5 pb-2">
                                <ChartContainer
                                  config={{
                                    move: {
                                      label: "Opdrac..",
                                      color: "hsl(var(--chart-1))",
                                    },
                                    stand: {
                                      label: "News",
                                      color: "hsl(var(--chart-2))",
                                    },
                                    exercise: {
                                      label: "Tips",
                                      color: "hsl(var(--chart-3))",
                                    },
                                  }}
                                  className="h-[140px] w-full"
                                >
                                  <BarChart
                                    margin={{
                                      left: 0,
                                      right: 0,
                                      top: 0,
                                      bottom: 10,
                                    }}
                                    data={[
                                      {
                                        activity: "Opdrac..",
                                        value: (8 / 12) * 100,
                                        label: "1",
                                        fill: "var(--color-stand)",
                                      },
                                      {
                                        activity: "News",
                                        value: (46 / 60) * 100,
                                        label: "1",
                                        fill: "var(--color-exercise)",
                                      },
                                      {
                                        activity: "Tips",
                                        value: 100,
                                        label: "1",
                                        fill: "var(--color-move)",
                                      },
                                    ]}
                                    layout="vertical"
                                    barSize={32}
                                    barGap={2}
                                  >
                                    <XAxis type="number" dataKey="value" hide />
                                    <YAxis
                                      dataKey="activity"
                                      type="category"
                                      tickLine={false}
                                      tickMargin={4}
                                      axisLine={false}
                                      className="capitalize"
                                    />
                                    <Bar dataKey="value" radius={5}>
                                      <LabelList
                                        position="insideLeft"
                                        dataKey="label"
                                        fill="white"
                                        offset={8}
                                        fontSize={12}
                                      />
                                    </Bar>
                                  </BarChart>
                                </ChartContainer>
                              </CardContent>
                              <CardFooter className="flex flex-row border-t p-4">
                                <div className="flex w-full items-center gap-2">
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Hunts
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      0
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              kcal
                            </span> */}
                                    </div>
                                  </div>
                                  <Separator
                                    orientation="vertical"
                                    className="mx-2 h-10 w-px"
                                  />
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Leaderboard
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      10
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              position
                            </span> */}
                                    </div>
                                  </div>
                                </div>
                              </CardFooter>
                            </Card>
                            <Separator className="my-4" />
                            <AreaStatusButtons />
                          </div>
                        </DrawerContent>
                      </Drawer>
                      <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                        <div
                          id="news"
                          className="rounded-md border h-full min-h-[300px] lg:min-h-[700px] xl:min-h-[700px] bg-muted"
                        >
                          <NewsCardList />
                        </div>
                        <div
                          id="opdrachten"
                          className="rounded-md border h-full w-full bg-muted"
                        ></div>
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
                                    Select Page
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
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="complete">
                                  <span className="sr-only">Map</span>
                                  <FaGlobeAmericas className="h-5 w-5" />
                                </TabsTrigger>
                                <TabsTrigger value="insert">
                                  <span className="sr-only">Location</span>
                                  <IoChatbox className="h-5 w-5" />
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            {/* <ModelSelector types={types} models={models} />
                            <TemperatureSelector defaultValue={[0.56]} />
                            <MaxLengthSelector defaultValue={[256]} />
                            <TopPSelector defaultValue={[0.9]} /> */}
                            <Card className="">
                              <CardContent className="flex gap-4 p-5 pb-2">
                                <ChartContainer
                                  config={{
                                    move: {
                                      label: "Opdrac..",
                                      color: "hsl(var(--chart-1))",
                                    },
                                    stand: {
                                      label: "News",
                                      color: "hsl(var(--chart-2))",
                                    },
                                    exercise: {
                                      label: "Tips",
                                      color: "hsl(var(--chart-3))",
                                    },
                                  }}
                                  className="h-[140px] w-full"
                                >
                                  <BarChart
                                    margin={{
                                      left: 0,
                                      right: 0,
                                      top: 0,
                                      bottom: 10,
                                    }}
                                    data={[
                                      {
                                        activity: "Opdrac..",
                                        value: 1,
                                        label: "1",
                                        fill: "var(--color-stand)",
                                      },
                                      {
                                        activity: "News",
                                        value: 1,
                                        label: "1",
                                        fill: "var(--color-exercise)",
                                      },
                                      {
                                        activity: "Tips",
                                        value: 1,
                                        label: "1",
                                        fill: "var(--color-move)",
                                      },
                                    ]}
                                    layout="vertical"
                                    barSize={32}
                                    barGap={2}
                                  >
                                    <XAxis type="number" dataKey="value" hide />
                                    <YAxis
                                      dataKey="activity"
                                      type="category"
                                      tickLine={false}
                                      tickMargin={4}
                                      axisLine={false}
                                      className="capitalize"
                                    />
                                    <Bar dataKey="value" radius={5}>
                                      <LabelList
                                        position="insideLeft"
                                        dataKey="label"
                                        fill="white"
                                        offset={8}
                                        fontSize={12}
                                      />
                                    </Bar>
                                  </BarChart>
                                </ChartContainer>
                              </CardContent>
                              <CardFooter className="flex flex-row border-t p-4">
                                <div className="flex w-full items-center gap-2">
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Hunts
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      0
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              kcal
                            </span> */}
                                    </div>
                                  </div>
                                  <Separator
                                    orientation="vertical"
                                    className="mx-2 h-10 w-px"
                                  />
                                  <div className="grid flex-1 auto-rows-min gap-0.5">
                                    <div className="text-xs text-muted-foreground">
                                      Leaderboard
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                                      10
                                      {/* <span className="text-sm font-normal text-muted-foreground">
                              position
                            </span> */}
                                    </div>
                                  </div>
                                </div>
                              </CardFooter>
                            </Card>
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
