// @ts-ignore
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import fetchAllLocations from "@/components/map";
import { useToast } from "@/components/ui/use-toast";
export function PresetSave() {
  const { toast } = useToast();
  const [name, setName] = useState(""); // State for user's name
  const [description, setDescription] = useState(""); // State for description
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility
  const [isSharing, setIsSharing] = useState(false); // State to control location sharing
  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim() && description.trim()) {
      // Call onSave with name and description
      await saveLocation(name, description); // Trigger the save action
      setIsDialogOpen(false); // Close the dialog after submission
    }
  };

  // Function to save location with name and description
  const saveLocation = async (name, description) => {
    if (!isSharing) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              "http://192.168.2.14:5000/api/save-location",
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          style={{ backgroundColor: `${isSharing ? "#90EE90" : "#ff6961"}` }}
        >
          Location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px] w-full">
        <DialogHeader>
          <DialogTitle>Live Location Share</DialogTitle>
          <DialogDescription>
            This will share your current location every 2 minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <DialogDescription>
                This will be displayed to others when they view your location.
              </DialogDescription>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="border rounded p-2 w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <DialogDescription>
                Please specify your purpose for sharing location. Are you a
                driver, passenger, or working on a photo objective?
              </DialogDescription>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="border rounded p-2 w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Start Sharing!</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
