const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

let userLocations = {};

// Endpoint to save user location
app.post("/api/save-location", (req, res) => {
  const { name, description, latitude, longitude } = req.body;
  if (!name || !description || !latitude || !longitude) {
    return res.status(400).json({
      error: "Name, description, latitude, and longitude are required.",
    });
  }

  userLocations[name] = { description, latitude, longitude };
  console.log("New location saved:", name, description, latitude, longitude);
  res.status(200).json({ message: "Location saved successfully." });
});

// Endpoint to get all user locations
app.get("/api/get-locations", (req, res) => {
  console.log(userLocations);
  res.status(200).json(userLocations);
});

// Endpoint to get a single user location by name
app.get("/api/get-location/:name", (req, res) => {
  const name = req.params.name;
  const location = userLocations[name];
  if (!location) {
    return res.status(404).json({ error: "User not found." });
  }
  console.log(userLocations);
  res.status(200).json(location);
});

app.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
