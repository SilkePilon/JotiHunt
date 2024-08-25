const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

const DB_PATH = path.join(__dirname, "db.json");

// Initialize database
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(
      DB_PATH,
      JSON.stringify({ news: [], userLocations: {} })
    );
  }
}

async function readDB() {
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Fetch news from Jotihunt API
async function fetchJotihuntNews() {
  try {
    const response = await axios.get("https://jotihunt.nl/api/2.0/articles");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Jotihunt news:", error);
    return [];
  }
}

// Update news in database
async function updateNews() {
  const jotihuntNews = await fetchJotihuntNews();
  const db = await readDB();

  for (const article of jotihuntNews) {
    if (!db.news.some((item) => item.id === article.id)) {
      db.news.push({
        ...article,
        status: "new",
        assignedTo: null,
        completed: false,
        reviewed: false,
        points: 0,
      });
    }
  }

  await writeDB(db);
}

// Set up periodic news fetching
setInterval(updateNews, 60000); // Fetch every minute

// API endpoints

// Get all news
app.get("/api/news", async (req, res) => {
  const db = await readDB();
  res.json(db.news);
});

// Update news status
app.put("/api/news/:id", async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, completed, reviewed, points } = req.body;

  const db = await readDB();
  const newsIndex = db.news.findIndex((item) => item.id === parseInt(id));

  if (newsIndex === -1) {
    return res.status(404).json({ error: "News item not found" });
  }

  db.news[newsIndex] = {
    ...db.news[newsIndex],
    status,
    assignedTo,
    completed,
    reviewed,
    points,
  };

  await writeDB(db);
  res.json(db.news[newsIndex]);
});

// User locations endpoints (keeping the previous functionality)
app.post("/api/save-location", async (req, res) => {
  const { name, description, latitude, longitude } = req.body;
  if (!name || !description || !latitude || !longitude) {
    return res.status(400).json({
      error: "Name, description, latitude, and longitude are required.",
    });
  }

  const db = await readDB();
  db.userLocations[name] = { description, latitude, longitude };
  await writeDB(db);

  res.status(200).json({ message: "Location saved successfully." });
});

app.get("/api/get-locations", async (req, res) => {
  const db = await readDB();
  res.status(200).json(db.userLocations);
});

app.get("/api/get-location/:name", async (req, res) => {
  const name = req.params.name;
  const db = await readDB();
  const location = db.userLocations[name];

  if (!location) {
    return res.status(404).json({ error: "User not found." });
  }

  res.status(200).json(location);
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
