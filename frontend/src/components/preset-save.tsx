"use client";
import React, { useState, useRef, useCallback } from "react";
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
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.description.trim()) {
      await saveLocation(formData.name, formData.description);
      setIsOpen(false);
    }
  };

  const saveLocation = async (name, description) => {
    if (!isSharing) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              "https://192.168.2.14:5000/api/save-location",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
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
            toast({
              title: "Location sharing activated!",
              description: "Don't close this page!",
            });
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
              This will share your current location every 2 minutes.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <LocationForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              formRef={formRef}
            />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
}
