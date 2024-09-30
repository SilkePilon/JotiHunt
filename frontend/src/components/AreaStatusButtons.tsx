import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const statusColors = {
  red: "#ff6961",
  orange: "#ffa500",
  green: "#77dd77",
  // Add more status colors as needed
};

const AreaStatusButtons = () => {
  const [areaStatuses, setAreaStatuses] = useState([]);

  const fetchAreaStatuses = async () => {
    try {
      const response = await fetch("https://jotihunt.nl/api/2.0/areas");
      const data = await response.json();
      setAreaStatuses(data.data);
    } catch (error) {
      console.error("Error fetching area statuses:", error);
    }
  };

  useEffect(() => {
    fetchAreaStatuses(); // Fetch immediately on component mount

    const intervalId = setInterval(fetchAreaStatuses, 120000); // Fetch every 2 minutes

    return () => clearInterval(intervalId); // Clean up on component unmount
  }, []);

  return (
    <div className="flex gap-1 text-card-foreground">
      {areaStatuses.map(
        (area) =>
          area.status != statusColors.green && (
            <Button
              key={area.name}
              style={{
                backgroundColor: statusColors[area.status] || "#cccccc",
              }}
              variant="outline"
            >
              {area.name}
            </Button>
          )
      )}
    </div>
  );
};

export default AreaStatusButtons;
