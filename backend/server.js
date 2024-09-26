const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const SqliteToJson = require("sqlite-to-json");
const { stringify } = require("querystring");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

const MAIN_DB_PATH = path.join(__dirname, "main.db");
const CONTENT_DB_PATH = path.join(__dirname, "content.db");

let mainDb, contentDb;

// Initialize databases
async function initDatabase() {
  mainDb = await open({
    filename: MAIN_DB_PATH,
    driver: sqlite3.Database,
  });

  await mainDb.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      title TEXT,
      type TEXT,
      publish_at TEXT,
      retrieved_at TEXT,
      assignedTo TEXT,
      completed INTEGER,
      reviewed INTEGER,
      points INTEGER
    )
  `);

  await mainDb.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY,
      message TEXT
    )
  `);

  await mainDb.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      timestamp TEXT
    )
  `);
}

// Fetch data from Jotihunt API
async function fetchJotihuntData() {
  try {
    const response = await axios.get("https://jotihunt.nl/api/2.0/articles");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Jotihunt data:", error);
    return [];
  }
}

// Update database with new data
async function updateDatabase() {
  const jotihuntData = await fetchJotihuntData();
  const timestamp = new Date().toISOString();

  for (const item of jotihuntData) {
    // Check if the item type is valid
    const validTypes = ["news", "hint", "assignment"];
    if (!validTypes.includes(item.type)) {
      console.warn(`Skipping item with invalid type: ${item.type}`);
      continue;
    }

    // Check if the item already exists
    const existingItem = await mainDb.get(
      "SELECT * FROM items WHERE id = ?",
      item.id
    );

    const newItem = {
      id: item.id,
      title: item.title,
      type: item.type,
      publish_at: item.publish_at,
      retrieved_at: timestamp,
      assignedTo: existingItem ? existingItem.assignedTo : null,
      completed: existingItem ? existingItem.completed : 0,
      reviewed: existingItem ? existingItem.reviewed : 0,
      points: existingItem ? existingItem.points : 0,
    };

    // Insert or update item in main database
    await mainDb.run(
      `
      INSERT OR REPLACE INTO items 
      (id, title, type, publish_at, retrieved_at, assignedTo, completed, reviewed, points) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newItem.id,
        newItem.title,
        newItem.type,
        newItem.publish_at,
        newItem.retrieved_at,
        newItem.assignedTo,
        newItem.completed,
        newItem.reviewed,
        newItem.points,
      ]
    );

    // Store message content in content table
    await mainDb.run(
      "INSERT OR REPLACE INTO content (id, message) VALUES (?, ?)",
      [item.id, JSON.stringify(item.message)]
    );
  }
}

// Set up periodic data fetching
setInterval(updateDatabase, 60000); // Fetch every minute

// API endpoints

// Get data by type
app.get("/api/data/:type", async (req, res) => {
  const { type } = req.params;

  if (!["news", "hints", "assignments"].includes(type)) {
    return res.status(400).json({ error: "Invalid data type" });
  }

  try {
    const data = await mainDb.all(
      "SELECT * FROM items WHERE type = ?",
      type === "hints" ? "hint" : type === "assignments" ? "assignment" : type
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving data" });
  }
});

app.post("/api/save-location", async (req, res) => {
  const { id, name, description, latitude, longitude } = req.body;
  const timestamp = new Date().toISOString();

  if (latitude === "your-latitude") {
    return res.status(400).json({ error: "Invalid latitude or longitude" });
  }

  try {
    // Check if the location with the given id exists
    const currentLocation = await mainDb.get(
      "SELECT * FROM locations WHERE id = ?",
      [id]
    );

    if (!currentLocation) {
      // If the location doesn't exist, insert a new one
      await mainDb.run(
        `
        INSERT INTO locations (id, name, description, latitude, longitude, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [id, name, description, latitude, longitude, timestamp]
      );

      return res.status(200).json({ message: "Location created successfully" });
    }

    // Only update values if they are not empty strings
    const updatedName = name !== "" ? name : currentLocation.name;
    const updatedDescription =
      description !== "" ? description : currentLocation.description;
    const updatedLatitude =
      latitude !== "" ? latitude : currentLocation.latitude;
    const updatedLongitude =
      longitude !== "" ? longitude : currentLocation.longitude;

    // Update the existing location
    await mainDb.run(
      `
      UPDATE locations
      SET name = ?, description = ?, latitude = ?, longitude = ?, timestamp = ?
      WHERE id = ?
    `,
      [
        updatedName,
        updatedDescription,
        updatedLatitude,
        updatedLongitude,
        timestamp,
        id,
      ]
    );

    res.status(200).json({ message: "Location updated successfully" });
    console.log(
      "Location saved:",
      {
        id,
        name: updatedName,
        description: updatedDescription,
        latitude: updatedLatitude,
        longitude: updatedLongitude,
      },
      Math.random(100, 1000)
    );
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).json({ error: "Failed to save location" });
  }
});

// New API endpoint to get all locations
app.get("/api/get-locations", async (req, res) => {
  try {
    const locations = await mainDb.all("SELECT * FROM locations");
    res.status(200).json(locations);
    console.log("Locations retrieved:", locations);
  } catch (error) {
    console.error("Error retrieving locations:", error);
    res.status(500).json({ error: "Failed to retrieve locations" });
  }
});

// Get content by ID
app.get("/api/content/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await mainDb.get(
      "SELECT message FROM content WHERE id = ?",
      id
    );
    if (result) {
      res.json(JSON.parse(result.message));
    } else {
      res.status(404).json({ error: "Content not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error retrieving content" });
  }
});

// Stats API
app.get("/api/stats", async (req, res) => {
  try {
    const stats = {
      totalItems: 0,
      itemsByType: {},
      completedItems: 0,
      reviewedItems: 0,
      totalPoints: 0,
    };

    const types = ["news", "hint", "assignment"];
    for (const type of types) {
      const items = await mainDb.all(
        "SELECT * FROM items WHERE type = ?",
        type
      );
      stats.totalItems += items.length;
      stats.itemsByType[type] = items.length;
      stats.completedItems += items.filter((item) => item.completed).length;
      stats.reviewedItems += items.filter((item) => item.reviewed).length;
      stats.totalPoints += items.reduce((sum, item) => sum + item.points, 0);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stats" });
  }
});

// Updated test endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const stats = {
      totalItems: 0,
      itemsByType: {},
      completedItems: 0,
      reviewedItems: 0,
      totalPoints: 0,
    };

    const types = ["news", "hint", "assignment"];
    for (const type of types) {
      const items = await mainDb.all(
        "SELECT * FROM items WHERE type = ?",
        type
      );
      stats.totalItems += items.length;
      stats.itemsByType[type] = items.length;
      stats.completedItems += items.filter((item) => item.completed).length;
      stats.reviewedItems += items.filter((item) => item.reviewed).length;
      stats.totalPoints += items.reduce((sum, item) => sum + item.points, 0);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stats" });
  }
});

// Updated test endpoint
app.get("/api/test", async (req, res) => {
  let originalItem = null;
  let createdLocationId = null;

  try {
    const testResults = {
      dataEndpoints: {},
      contentEndpoint: null,
      statsEndpoint: null,
      updateEndpoint: null,
      locationEndpoints: {
        saveLocation: null,
        getLocations: null,
      },
    };

    // Test data endpoints
    for (const type of ["news", "hints", "assignments"]) {
      const response = await axios.get(
        `http://localhost:${PORT}/api/data/${type}`
      );
      const items = response.data;
      testResults.dataEndpoints[type] = {
        status: response.status,
        dataReceived: items.length > 0,
        randomItem:
          items.length > 0
            ? items[Math.floor(Math.random() * items.length)]
            : null,
      };
    }

    // Test content endpoint
    const allItems = await mainDb.all("SELECT * FROM items");
    if (allItems.length > 0) {
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      const response = await axios.get(
        `http://localhost:${PORT}/api/content/${randomItem.id}`
      );
      testResults.contentEndpoint = {
        status: response.status,
        dataReceived: response.status === 200 && response.data !== null,
        randomItemId: randomItem.id,
        content: response.data,
      };
    }

    // Test stats endpoint
    const statsResponse = await axios.get(`http://localhost:${PORT}/api/stats`);
    testResults.statsEndpoint = {
      status: statsResponse.status,
      data: statsResponse.data,
    };

    // Test update endpoint
    if (allItems.length > 0) {
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      originalItem = { ...randomItem };
      const updateData = {
        assignedTo: "Test User",
        points: 5,
        reviewed: 1,
        completed: 0,
      };
      const updateResponse = await axios.put(
        `http://localhost:${PORT}/api/update/${randomItem.id}`,
        updateData
      );
      testResults.updateEndpoint = {
        status: updateResponse.status,
        dataReceived:
          updateResponse.status === 200 && updateResponse.data !== null,
        updatedItem: updateResponse.data.item,
      };
    }

    // Test save location endpoint
    const locationData = {
      id: `test-location-${Date.now()}`,
      name: "Test Location",
      description: "This is a test location",
      latitude: 52.3676,
      longitude: 4.9041,
    };
    const saveLocationResponse = await axios.post(
      `http://localhost:${PORT}/api/save-location`,
      locationData
    );
    testResults.locationEndpoints.saveLocation = {
      status: saveLocationResponse.status,
      message: saveLocationResponse.data.message,
    };
    createdLocationId = locationData.id;

    // Test get locations endpoint
    const getLocationsResponse = await axios.get(
      `http://localhost:${PORT}/api/get-locations`
    );
    testResults.locationEndpoints.getLocations = {
      status: getLocationsResponse.status,
      dataReceived: getLocationsResponse.data.length > 0,
      randomLocation:
        getLocationsResponse.data.length > 0
          ? getLocationsResponse.data[
              Math.floor(Math.random() * getLocationsResponse.data.length)
            ]
          : null,
    };

    res.json({
      message: "All endpoints tested",
      results: testResults,
    });
  } catch (error) {
    console.error("Error during test:", error);
    res.status(500).json({ error: "Test failed", details: error.message });
  } finally {
    // Cleanup operations
    try {
      // Revert changes made to the item
      if (originalItem) {
        await mainDb.run(
          `
          UPDATE items
          SET assignedTo = ?, points = ?, reviewed = ?, completed = ?
          WHERE id = ?
        `,
          [
            originalItem.assignedTo,
            originalItem.points,
            originalItem.reviewed,
            originalItem.completed,
            originalItem.id,
          ]
        );
      }

      // Delete the test location
      if (createdLocationId) {
        await mainDb.run(
          "DELETE FROM locations WHERE id = ?",
          createdLocationId
        );
      }

      console.log("Test cleanup completed successfully");
    } catch (cleanupError) {
      console.error("Error during test cleanup:", cleanupError);
    }
  }
});

// Server-side code (Express route)
app.get("/database", async (req, res) => {
  try {
    const exporter = new SqliteToJson({
      client: new sqlite3.Database(MAIN_DB_PATH),
    });

    exporter.all(function (err, all) {
      if (err) {
        console.error("Error exporting database:", err);
        res
          .status(500)
          .json({ error: "Failed to export database", details: err.message });
        return;
      }

      // Send HTML response with embedded JSON data
      res.send(`
        <section>
          <!-- JSON Crack iframe embed goes here -->
          <iframe style="position: absolute;top: 0;left:0;overflow:hidden" id="jsoncrackEmbed" src="https://jsoncrack.com/widget" width="100%" height="100%"></iframe>
        </section>
        
        <!-- Define the script in the response -->
        <script>
          const jsonCrackEmbed = document.querySelector("#jsoncrackEmbed");

          // Convert the database data to JSON
          const json = JSON.stringify(${JSON.stringify(all)});
          
          // Wait for the window to load before posting the message
          const options = {
            theme: "dark", // "light" or "dark"
            direction: "UP", // "UP", "DOWN", "LEFT", "RIGHT"
          };
          window.addEventListener("load", () => {
            jsonCrackEmbed.contentWindow.postMessage({ json, options }, "*");
          });
        </script>
      `);
    });
  } catch (error) {
    console.error("Error during database export:", error);
    res
      .status(500)
      .json({ error: "Database export failed", details: error.message });
  }
});

app.put("/api/update/:id", async (req, res) => {
  const { id } = req.params;
  const { assignedTo, points, reviewed, completed } = req.body;

  try {
    // Validate input
    if (typeof assignedTo !== "string" && assignedTo !== null) {
      return res.status(400).json({ error: "Invalid assignedTo value" });
    }
    if (!Number.isInteger(points) || points < 0) {
      return res.status(400).json({ error: "Invalid points value" });
    }
    if (![0, 1].includes(reviewed)) {
      return res.status(400).json({ error: "Invalid reviewed value" });
    }
    if (![0, 1].includes(completed)) {
      return res.status(400).json({ error: "Invalid completed value" });
    }

    // Check if the item exists
    const item = await mainDb.get("SELECT * FROM items WHERE id = ?", id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Update the item
    await mainDb.run(
      `
      UPDATE items
      SET assignedTo = ?, points = ?, reviewed = ?, completed = ?
      WHERE id = ?
    `,
      [assignedTo, points, reviewed, completed, id]
    );

    // Fetch the updated item
    const updatedItem = await mainDb.get(
      "SELECT * FROM items WHERE id = ?",
      id
    );

    res.json({
      message: "Item updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res
      .status(500)
      .json({ error: "Failed to update item", details: error.message });
  }
});

// Initialize databases and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    updateDatabase(); // Initial data fetch
  });
});
