self.addEventListener("sync", function (event) {
  if (event.tag === "sync-location") {
    event.waitUntil(syncLocation());
  }
});

async function syncLocation() {
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
              await registration.sync.register("sync-location");
              console.log("Background sync registered!");

              // Send location data to the server
              const response = await fetch(
                "https://api.jotiboard.nl/api/save-location",
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
            } catch (error) {
              console.error("Error saving location:", error);
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
  }
}
