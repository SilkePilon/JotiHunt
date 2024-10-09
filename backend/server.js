const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const SqliteToJson = require("sqlite-to-json");
const { OpenAI } = require("openai");
const cheerio = require("cheerio");
const { performance } = require("perf_hooks");
const { promisify } = require("util");
const stringSimilarity = require("string-similarity");
const cluster = require("cluster");
const os = require("os");
const term = require("terminal-kit").terminal;
const cokieParser = require("cookie-parser");
const fs = require("fs").promises;
const { checkBackupSettings } = require("./backupUtils");

// load .env file
require("dotenv").config();

// get total available cpu cores
const numCPUs = os.cpus().length;

// path to the main database file
const MAIN_DB_PATH = path.join(__dirname, "main.db");

console.clear();

let mainDb;

async function runQuery(query, params = []) {
  if (!mainDb) {
    throw new Error("Database not initialized");
  }
  let retries = 25;
  while (retries > 0) {
    try {
      return await mainDb.run(query, params);
    } catch (error) {
      if (error.code === "SQLITE_BUSY" && retries > 1) {
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

(async function initDatabase() {
  mainDb = await open({
    filename: MAIN_DB_PATH,
    driver: sqlite3.Database,
  });

  // Enable WAL mode for better concurrency
  await mainDb.run("PRAGMA journal_mode = WAL;");

  // Increase the busy timeout
  await mainDb.run("PRAGMA busy_timeout = 5000;");

  // Create each table and update the progress bar
  await mainDb.run(`
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

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY,
    message TEXT
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    timestamp TEXT
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS jotihunt_api_response_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    response_time_ms REAL
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS our_api_response_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT,
    timestamp TEXT,
    response_time_ms REAL
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    item_title TEXT,
    plan_content TEXT,
    created_at TEXT,
    FOREIGN KEY (item_id) REFERENCES items (id)
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS current_area_statuses (
    name TEXT PRIMARY KEY,
    status TEXT,
    last_updated TEXT
  )
`);

  await mainDb.run(`
  CREATE TABLE IF NOT EXISTS area_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id TEXT,
    status TEXT,
    timestamp TEXT
  )
`);
})();

async function selectCores() {
  const items = [
    "Use all cores (default)",
    "Select number of cores",
    "Use single core",
  ];

  const menuOptions = {
    selectedStyle: term.bgGray,
    cancelable: true,
    exitOnUnexpectedKey: false,
  };

  try {
    const response = await term.singleColumnMenu(items, menuOptions).promise;
    await term.clear(); // Clear the screen after selection

    let selectedCores;

    if (response.selectedIndex === 0) {
      selectedCores = numCPUs;
    } else if (response.selectedIndex === 1) {
      const input = await term.inputField({
        prompt: `Enter number of cores (1-${numCPUs}): `,
        cancelable: true,
        keyBindings: { CTRL_C: "cancel" },
      }).promise;
      await term.clear(); // Clear the screen after input
      const parsedInput = parseInt(input);
      if (isNaN(parsedInput) || parsedInput < 1 || parsedInput > numCPUs) {
        await term.red(
          `Invalid input. Please enter a number between 1 and ${numCPUs}.\n`
        );
        return selectCores();
      }
      selectedCores = parsedInput;
    } else if (response.selectedIndex === 2) {
      selectedCores = 1;
    }

    await updateEnvFile("NUM_CORES", selectedCores.toString());
    return selectedCores;
  } catch (error) {
    if (error.message === "Canceled") {
      await term.yellow("\nOperation canceled.\n");
      await term.processExit(0);
    } else {
      throw error;
    }
  }
}

async function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, ".env");
  let envContent = await fs.readFile(envPath, "utf8").catch(() => "");

  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine);
  } else {
    envContent += `\n${newLine}`;
  }

  await fs.writeFile(envPath, envContent.trim() + "\n");
  await term.green(`Updated .env file with ${key}=${value}\n`);
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMaster() {
  console.log("Starting master process...");

  try {
    if (!process.env.NUM_CORES) {
      var selectedCores = await selectCores();
    } else {
      var selectedCores = process.env.NUM_CORES;
    }
    console.log(`Using ${selectedCores} core${selectedCores === 1 ? "" : "s"}`);

    await checkBackupSettings(); // Assume this is a predefined function
    // await initDatabase(); // If you need to initialize a database, uncomment this.

    // Create a progress bar
    const progressBar = term.progressBar({
      width: 80,
      title: `Creating workers (${selectedCores}): `,
      eta: true,
      percent: true,
      items: selectedCores,
    });

    // Fork workers with a delay between creation
    for (let i = 0; i < selectedCores; i++) {
      await new Promise((resolve) => {
        const worker = cluster.fork();
        worker.on("online", () => {
          progressBar.update((i + 1) / selectedCores); // Update based on the completed fraction
          resolve();
        });
      });

      await delay(500); // Delay for 0.5 second between creating workers
    }

    progressBar.stop(); // Stop the progress bar after all workers are created
    term("\n"); // Move to the next line after the progress bar

    // Handle worker exit and replacement
    cluster.on("exit", async (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
      // Replace the dead worker
      await new Promise((resolve) => {
        const newWorker = cluster.fork();
        newWorker.on("online", () => {
          console.log(`New worker ${newWorker.process.pid} started`);
          resolve();
        });
      });
    });

    term(`Server is running on http://localhost:${process.env.PORT}\n`);
  } catch (error) {
    console.error("Error in master process:", error);
    process.exit(1);
  }
}

async function runWorker() {
  let openai;

  async function initializeAI() {
    if (process.env.NVIDIA_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
    } else {
      await term.yellow(
        "NVIDIA_API_KEY not provided. AI features will be disabled.\n"
      );
    }
  }

  initializeAI();
  const app = express();
  const PORT = process.env.PORT || 5000;
  const DELAY = process.env.DELAY || 60000;

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  function isOriginAllowed(origin) {
    if (!origin) return false;
    return allowedOrigins.some((allowedOrigin) => {
      // Convert to URL objects for easier comparison
      const allowedUrl = new URL(allowedOrigin);
      const originUrl = new URL(origin);

      // Check if domains match (including subdomains)
      return originUrl.hostname.endsWith(allowedUrl.hostname);
    });
  }

  // Configure CORS
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(cokieParser());

  // Fetch data from Jotihunt API
  async function fetchJotihuntData() {
    try {
      const startTime = performance.now();
      const response = await axios.get("https://jotihunt.nl/api/2.0/articles");
      const endTime = performance.now();
      const responseTimeMs = endTime - startTime;

      // Record the response time in milliseconds
      await runQuery(
        `INSERT INTO jotihunt_api_response_times (timestamp, response_time_ms) VALUES (?, ?)`,
        [new Date().toISOString(), responseTimeMs]
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching Jotihunt data:", error);
      return [];
    }
  }

  // Add this new function to fetch and update area statuses
  async function updateAreaStatuses() {
    try {
      const response = await axios.get("https://jotihunt.nl/api/2.0/areas");
      const areas = response.data.data;

      for (const area of areas) {
        // Get current status
        const currentStatus = await mainDb.get(
          "SELECT status FROM current_area_statuses WHERE name = ?",
          area.name
        );

        // Update current_area_statuses
        const result = await runQuery(
          `
        INSERT OR REPLACE INTO current_area_statuses (name, status, last_updated)
        VALUES (?, ?, ?)
      `,
          [area.name, area.status, area.updated_at]
        );

        // If status has changed, add to area_status_history
        if (!currentStatus || currentStatus.status !== area.status) {
          const historyResult = await runQuery(
            `
          INSERT INTO area_status_history (area_id, status, timestamp)
          VALUES (?, ?, ?)
        `,
            [area.name, area.status, area.updated_at]
          );
        }
      }

      // Verify the data in the database
      const verificationResult = await mainDb.all(
        "SELECT * FROM current_area_statuses"
      );
    } catch (error) {
      console.error("Error updating area statuses:", error);
    }
  }

  // Middleware to measure API response time
  function measureResponseTime(req, res, next) {
    // Check if the request origin is allowed

    const origin = req.get("Origin");
    const isAllowedOrigin = isOriginAllowed(origin);

    if (!isAllowedOrigin) {
      return res
        .status(401)
        .json({ error: "Authentication required or origin not allowed" });
    }

    next();
  }

  // Apply the middleware to all routes
  app.use(measureResponseTime);

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
      await runQuery(
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
      await runQuery(
        "INSERT OR REPLACE INTO content (id, message) VALUES (?, ?)",
        [item.id, JSON.stringify(item.message)]
      );
    }
  }

  // API endpoints

  app.get("/api/area-statuses", async (req, res) => {
    try {
      const currentStatuses = await mainDb.all(
        "SELECT * FROM current_area_statuses"
      );

      res.json(currentStatuses);
    } catch (error) {
      console.error("Error retrieving area statuses:", error);
      res.status(500).json({
        error: "Failed to retrieve area statuses",
        details: error.message,
      });
    }
  });

  app.get("/api/area-status-history/:areaName", async (req, res) => {
    const { areaName } = req.params;
    try {
      const history = await mainDb.all(
        "SELECT * FROM area_status_history WHERE area_id = ? ORDER BY timestamp DESC LIMIT 100",
        areaName
      );
      res.json(history);
    } catch (error) {
      console.error("Error retrieving area status history:", error);
      res.status(500).json({ error: "Failed to retrieve area status history" });
    }
  });

  app.get("/api/generate-plan/:id", async (req, res) => {
    if (!process.env.NVIDIA_API_KEY) {
      return res.status(400).json({ error: "API key not provided" });
    }
    const { id } = req.params;

    try {
      // Fetch item from items table
      const item = await mainDb.get("SELECT * FROM items WHERE id = ?", id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Fetch content from content table
      const content = await mainDb.get(
        "SELECT message FROM content WHERE id = ?",
        id
      );
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      const itemContent = JSON.parse(content.message);

      console.log("Generating plan for", item.type, item.title);

      // Generate AI plan
      const prompt = `Create a plan to solve the following ${item.type}:\n\nTitle: ${item.title}\n\nContent: ${itemContent.content}\n\nProvide a step-by-step plan to address this ${item.type}. We cant ask the ones who assigned us this for help or clarification its a race for who finishes this first. write it so it does not look like your responding to this message. dont make use of markdown use HTML instead. USE HTML AS RESPONSE FORMAT RESPOND IN DUTCH (netherlands)`;

      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-405b-instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
        stream: false,
      });
      const plan = completion.choices[0].message.content;
      console.log("Generated plan!");

      // Save plan to database
      const timestamp = new Date().toISOString();
      await runQuery(
        "INSERT INTO plans (item_id, item_title, plan_content, created_at) VALUES (?, ?, ?, ?)",
        [id, item.title, plan, timestamp]
      );

      res.json({
        message: "Plan generated and saved successfully",
        plan: plan,
      });
    } catch (error) {
      console.error("Error generating plan:", error);
      res
        .status(500)
        .json({ error: "Failed to generate plan", details: error.message });
    }
  });

  // New endpoint to get API response times
  app.get("/api/response-times", async (req, res) => {
    try {
      const jotihuntTimes = await mainDb.all(
        "SELECT * FROM jotihunt_api_response_times ORDER BY timestamp DESC LIMIT 100"
      );
      const ourApiTimes = await mainDb.all(
        "SELECT * FROM our_api_response_times ORDER BY timestamp DESC LIMIT 100"
      );

      res.json({
        jotihuntApiTimes: jotihuntTimes,
        ourApiTimes: ourApiTimes,
      });
    } catch (error) {
      console.error("Error retrieving response times:", error);
      res.status(500).json({ error: "Failed to retrieve response times" });
    }
  });

  app.get("/api/leaderboard/:groupName?", async (req, res) => {
    try {
      // test url: https://web.archive.org/web/20230327175840/https://jotihunt.nl/scorelijst
      const response = await axios.get(
        "https://web.archive.org/web/20230327175840/https://jotihunt.nl/scorelijst"
      );
      const html = response.data;
      const $ = cheerio.load(html);

      const leaderboard = [];
      let currentArea = "";
      let areaPosition = 1;
      let isCurrentAreaLeader = false;

      $("tbody.divide-y.divide-gray-200.bg-white > tr").each(
        (index, element) => {
          const tds = $(element).find(
            "td.whitespace-nowrap.px-3.py-4.text-sm.text-gray-500"
          );

          // Check if this row represents a new area
          const areaHeader = $(element).prev().find("th");
          if (areaHeader.length > 0) {
            currentArea = areaHeader.text().trim();
            areaPosition = 1;
            // Check if the area has the specific leader icon
            isCurrentAreaLeader =
              areaHeader.find(
                'svg.h-6.w-6.inline.text-green-500[viewBox="0 0 24 24"]'
              ).length > 0;
          }

          if (tds.length === 3) {
            const position = $(tds[0]).text().trim();
            const groupName = $(tds[1]).text().trim();
            const points = $(tds[2]).text().trim();

            leaderboard.push({
              position: parseInt(position),
              groupName,
              points: parseInt(points),
              area: currentArea,
              areaPosition: areaPosition,
              isAreaLeader: isCurrentAreaLeader,
            });

            areaPosition++;
          }
        }
      );

      const requestedGroupName = req.params.groupName;
      // If no group name is provided, return the full leaderboard
      if (!requestedGroupName) {
        if (leaderboard.length > 0) {
          return res.json(leaderboard);
        } else {
          return res
            .status(404)
            .json({ error: "No leaderboard data available" });
        }
      }

      // Ensure groupNames is an array of strings
      const groupNames = leaderboard.map((entry) => entry.groupName);

      if (groupNames.length === 0) {
        return res
          .status(404)
          .json({ error: "No groups found in leaderboard" });
      }

      // Find the best matching group name
      const match = stringSimilarity.findBestMatch(
        requestedGroupName,
        groupNames
      );
      const bestMatch = match.bestMatch.target;

      // Find the matching leaderboard entry
      const matchingEntry = leaderboard.find(
        (entry) => entry.groupName === bestMatch
      );

      if (matchingEntry) {
        res.json(matchingEntry);
      } else {
        res.status(404).json({ error: "Group not found" });
      }
    } catch (error) {
      console.error("Error scraping leaderboard:", error);
      res.status(500).json({
        error: "Failed to scrape leaderboard",
        details: error.message,
      });
    }
  });

  app.get("/api/response-time-graph", async (req, res) => {
    try {
      // Fetch unique dates where data exists for both APIs
      const jotihuntDates = await mainDb.all(
        "SELECT DISTINCT DATE(timestamp) as date FROM jotihunt_api_response_times ORDER BY date"
      );
      const ourApiDates = await mainDb.all(
        "SELECT DISTINCT DATE(timestamp) as date FROM our_api_response_times ORDER BY date"
      );

      // Extract just the date strings in 'YYYY-MM-DD' format
      const validDates = [
        ...new Set([
          ...jotihuntDates.map((d) => d.date),
          ...ourApiDates.map((d) => d.date),
        ]),
      ].sort();

      const { selectedDate, timeframe } = req.query;

      // Define available timeframes for the dropdown (hours)
      const availableTimeframes = [1, 2, 4, 5, 7, 24]; // In hours

      let startTime, endTime;

      if (selectedDate && timeframe) {
        const hours = parseInt(timeframe, 10);

        if (hours === 24) {
          // Full day (24 hours)
          startTime = new Date(selectedDate + "T00:00:00.000Z").toISOString();
          endTime = new Date(selectedDate + "T23:59:59.999Z").toISOString();
        } else {
          // End time is always the last second of the selected date (23:59:59)
          endTime = new Date(selectedDate + "T23:59:59.999Z").toISOString();

          // Start time is calculated as X hours before the end of the day
          const endOfDayTimestamp = new Date(
            selectedDate + "T23:59:59.999Z"
          ).getTime();
          const startOfDayTimestamp =
            endOfDayTimestamp - hours * 60 * 60 * 1000;
          startTime = new Date(startOfDayTimestamp).toISOString();
        }
      } else {
        // Default to last 4 hours from the current time if no date is selected
        startTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        endTime = new Date().toISOString();
      }

      // Fetch data from the database for the selected timeframe
      const jotihuntTimes = await mainDb.all(
        "SELECT timestamp, response_time_ms FROM jotihunt_api_response_times WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
        [startTime, endTime]
      );
      const ourApiTimes = await mainDb.all(
        "SELECT timestamp, response_time_ms FROM our_api_response_times WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
        [startTime, endTime]
      );

      // Render the HTML page with the graph and form
      res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Response Times Graph</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            color: #333;
          }
          form {
            margin-bottom: 20px;
          }
          label {
            margin-right: 10px;
          }
          input, button, select {
            padding: 10px;
            margin-right: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          button {
            background-color: #28a745;
            color: white;
            cursor: pointer;
          }
          button:hover {
            background-color: #218838;
          }
          canvas {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <h1>API Response Times Graph</h1>
        <form id="timeFrameForm">
          <label for="selectedDate">Select Date:</label>
          <input type="date" id="selectedDate" name="selectedDate" 
                 value="${selectedDate || ""}" 
                 min="${validDates[0]}" 
                 max="${validDates[validDates.length - 1]}" 
                 list="valid-dates">

          <datalist id="valid-dates">
            ${validDates
              .map((date) => `<option value="${date}"></option>`)
              .join("")}
          </datalist>

          <label for="timeframe">Select Timeframe:</label>
          <select id="timeframe" name="timeframe">
            ${availableTimeframes
              .map(
                (hour) => `
              <option value="${hour}" ${
                  timeframe === String(hour) ? "selected" : ""
                }>
                ${hour === 24 ? "Full 24 hours" : `Last ${hour} hours`}
              </option>
            `
              )
              .join("")}
          </select>

          <button type="submit">Update Graph</button>
        </form>

        <canvas id="responseTimeChart" width="800" height="400"></canvas>

        <script>
          document.getElementById('timeFrameForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const selectedDate = document.getElementById('selectedDate').value;
            const timeframe = document.getElementById('timeframe').value;
            let queryParams = \`?selectedDate=\${selectedDate}&timeframe=\${timeframe}\`;
            window.location.href = \`/api/response-time-graph\${queryParams}\`;
          });

          const jotihuntTimes = ${JSON.stringify(jotihuntTimes)};
          const ourApiTimes = ${JSON.stringify(ourApiTimes)};

          const ctx = document.getElementById('responseTimeChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              datasets: [
                {
                  label: 'Jotihunt API',
                  data: jotihuntTimes.map(item => ({
                    x: item.timestamp,
                    y: item.response_time_ms
                  })),
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                },
                {
                  label: 'Our API',
                  data: ourApiTimes.map(item => ({
                    x: item.timestamp,
                    y: item.response_time_ms
                  })),
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1
                }
              ]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'minute'
                  },
                  title: {
                    display: true,
                    text: 'Time'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Response Time (ms)'
                  }
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `);
    } catch (error) {
      console.error("Error generating response time graph:", error);
      res.status(500).json({ error: "Failed to generate response time graph" });
    }
  });

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
        await runQuery(
          `
        INSERT INTO locations (id, name, description, latitude, longitude, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
          [id, name, description, latitude, longitude, timestamp]
        );

        return res
          .status(200)
          .json({ message: "Location created successfully" });
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
      await runQuery(
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
        areaStatusEndpoints: {
          getCurrentStatuses: null,
          getStatusHistory: null,
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

      // Test area status endpoints
      const currentStatusesResponse = await axios.get(
        `http://localhost:${PORT}/api/area-statuses`
      );
      testResults.areaStatusEndpoints.getCurrentStatuses = {
        status: currentStatusesResponse.status,
        dataReceived: currentStatusesResponse.data.length > 0,
      };

      // Test get area status history
      if (currentStatusesResponse.data.length > 0) {
        const randomArea =
          currentStatusesResponse.data[
            Math.floor(Math.random() * currentStatusesResponse.data.length)
          ];
        const historyResponse = await axios.get(
          `http://localhost:${PORT}/api/area-status-history/${randomArea.name}`
        );
        testResults.areaStatusEndpoints.getStatusHistory = {
          status: historyResponse.status,
          dataReceived: historyResponse.data.length > 0,
          areaName: randomArea.name,
          randomHistoryEntry:
            historyResponse.data.length > 0
              ? historyResponse.data[
                  Math.floor(Math.random() * historyResponse.data.length)
                ]
              : null,
        };
      }

      // Test content endpoint
      const allItems = await mainDb.all("SELECT * FROM items");
      if (allItems.length > 0) {
        const randomItem =
          allItems[Math.floor(Math.random() * allItems.length)];
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
      const statsResponse = await axios.get(
        `http://localhost:${PORT}/api/stats`
      );
      testResults.statsEndpoint = {
        status: statsResponse.status,
        data: statsResponse.data,
      };

      // Test update endpoint
      if (allItems.length > 0) {
        const randomItem =
          allItems[Math.floor(Math.random() * allItems.length)];
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
          await runQuery(
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
          await runQuery(
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

        // Filter out unwanted tables
        const filteredData = Object.fromEntries(
          Object.entries(all).filter(
            ([key]) =>
              ![
                "our_api_response_times",
                "jotihunt_api_response_times",
              ].includes(key)
          )
        );

        // Send HTML response with embedded JSON data
        res.send(`
        <section>
          <!-- JSON Crack iframe embed goes here -->
          <iframe style="position: absolute;top: 0;left:0;overflow:hidden" id="jsoncrackEmbed" src="https://jsoncrack.com/widget" width="100%" height="100%"></iframe>
        </section>
        
        <!-- Define the script in the response -->
        <script>
          const jsonCrackEmbed = document.querySelector("#jsoncrackEmbed");

          // Convert the filtered database data to JSON
          const json = JSON.stringify(${JSON.stringify(filteredData)});
          
          // Wait for the window to load before posting the message
          const options = {
            theme: "dark", // "light" or "dark"
            direction: "RIGHT", // "UP", "DOWN", "LEFT", "RIGHT"
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
      await runQuery(
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
  async function startServer() {
    while (!mainDb) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Initialize databases and start server

    // Hide cursor
    await term("\x1B[?25l");

    app.listen(PORT, "0.0.0.0", async () => {
      updateDatabase(); // Initial data fetch
      updateAreaStatuses(); // Initial area status fetch

      // Set up periodic updates
      setInterval(updateDatabase, DELAY); // Fetch every minute
      setInterval(updateAreaStatuses, DELAY); // Update area statuses every minute

      // await term.drawImage(
      //   "https://github.com/SilkePilon/JotiHunt/blob/main/assets/dwa.png?raw=true",
      //   {
      //     shrink: { width: term.width, height: term.height * 1 },
      //   }
      // );

      // await term("     Yes this is a fox....");
    });
  }

  process.on("SIGINT", async () => {
    console.log(`Worker ${process.pid} is shutting down...`);
    if (mainDb) {
      await mainDb.close();
    }
    process.exit();
  });

  // Call the async function to start the server
  startServer().catch(term.red);
}

if (cluster.isMaster) {
  runMaster().catch(console.error);
} else {
  runWorker().catch(console.error);
}
