"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useMediaQuery } from "usehooks-ts";
import { FaLocationDot } from "react-icons/fa6";

// Move LocationForm outside of PresetSave
const LocationForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  formRef,
}) => (
  <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        onPointerDown={(e) => e.stopPropagation()}
        required
        className="mt-1"
      />
      <p className="text-sm text-muted-foreground mt-1">
        This will be displayed to others when they view your location.
      </p>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        onPointerDown={(e) => e.stopPropagation()}
        required
        className="mt-1"
      />
      <p className="text-sm text-muted-foreground mt-1">
        Please specify your purpose for sharing location. Are you a driver,
        passenger, or working on a photo objective?
      </p>
    </div>
    <Button type="submit" className="w-full">
      Start Sharing!
    </Button>
  </form>
);

export function PresetSave() {
  const [identifier, setIdentifier] = useState(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const formRef = useRef(null);

  useEffect(() => {
    const storedId = sessionStorage.getItem("locationIdentifier");
    if (storedId) {
      setIdentifier(storedId);
    } else {
      const newId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem("locationIdentifier", newId);
      setIdentifier(newId);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.description.trim()) {
      await saveLocation(formData.name, formData.description);
      setIsOpen(false);
    }
  };

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function (registration) {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch(function (error) {
        console.log("Service Worker registration failed:", error);
      });
  }

  const saveLocation = async (name, description) => {
    if (identifier) {
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Check if latitude and longitude are valid numbers
            if (isNaN(latitude) || isNaN(longitude)) {
              console.error(
                "Invalid latitude or longitude values:",
                latitude,
                longitude
              );
              toast({
                title: "Error",
                variant: "destructive",
                description: "Invalid latitude or longitude. Please try again.",
              });
              return;
            }

            // Save location in the background
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(async (registration) => {
                try {
                  // Register a sync event
                  if ("sync" in registration) {
                    await registration.sync.register("sync-location");
                    console.log("Background sync registered!");
                  } else {
                    console.warn(
                      "Background sync is not supported in this browser."
                    );
                  }
                  console.log("Background sync registered!");

                  // Send location data to the server
                  const response = await fetch(
                    "http://localhost:5000/api/save-location",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: identifier,
                        name,
                        description,
                        latitude,
                        longitude,
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error("Failed to save location");
                  }

                  console.log("Location saved successfully!");
                  // toast({
                  //   title: "Location sharing activated!",
                  //   description: "Don't close this page!",
                  // });
                  setIsSharing(true);
                } catch (error) {
                  console.error("Error saving location:", error);
                  toast({
                    title: "Error saving location",
                    variant: "destructive",
                    description: `${error}`,
                  });
                }
              });
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 300000,
            timeout: 8000,
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
        toast({
          title: "Error",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenChange = useCallback(
    (open) => {
      setIsOpen(open);
      if (open && !isDesktop) {
        // Use requestAnimationFrame to ensure the drawer is fully rendered
        requestAnimationFrame(() => {
          if (formRef.current) {
            const firstInput = formRef.current.querySelector("input");
            if (firstInput) {
              firstInput.focus();
            }
          }
        });
      }
    },
    [isDesktop]
  );

  const updateLocation = useCallback(() => {
    if (identifier) {
      saveLocation(formData.name, formData.description);
    }
  }, [identifier, formData]);

  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      updateLocation();
    }
  }, [updateLocation]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = setInterval(updateLocation, 10000); // Update every second
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateLocation, handleVisibilityChange]);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            style={{ backgroundColor: `${isSharing ? "#90EE90" : "#ff6961"}` }}
          >
            Share Location
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Live Location Share</DialogTitle>
            <DialogDescription>
              This will share your current location every 2 minutes.
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            formRef={formRef}
          />
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button
            variant="secondary"
            style={{ backgroundColor: `${isSharing ? "#90EE90" : "#ff6961"}` }}
          >
            Share <FaLocationDot style={{ marginLeft: "7px" }} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Live Location Share</DrawerTitle>
            <DrawerDescription>
              This will share your current location every 2 minutes.{" "}
            </DrawerDescription>{" "}
          </DrawerHeader>{" "}
          <div className="p-4 pb-0">
            {" "}
            <LocationForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              formRef={formRef}
            />{" "}
          </div>{" "}
          <DrawerFooter className="pt-2">
            {" "}
            <DrawerClose asChild>
              {" "}
              <Button variant="outline">Cancel</Button>{" "}
            </DrawerClose>{" "}
          </DrawerFooter>{" "}
        </DrawerContent>{" "}
      </Drawer>
    );
  }
}
