# Location Sharing Backend

This is the backend service for the Location Sharing application. It provides API endpoints for saving and retrieving location data using SQLite3 as the database.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [API Documentation](#api-documentation)
  - [Save Location](#save-location)
  - [Get Location](#get-location)
- [Code Examples](#code-examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/location-sharing-backend.git
   ```

2. Install dependencies:

   ```
   cd location-sharing-backend
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:

   ```
   PORT=5000
   DB_PATH=./database.sqlite
   ```

4. Initialize the SQLite database:

   ```
   npm run init-db
   ```

5. Start the server:
   ```
   npm start
   ```

## Usage

The server will start running on `http://localhost:5000` (or the port specified in your environment variables).

## How It Works

The Location Sharing Backend is built using Node.js and Express.js, with SQLite3 as the database. Here's an overview of how it works:

1. **Database Setup**: The application uses SQLite3, a lightweight, file-based relational database. The database file is created and initialized with the necessary table structure when you run the `init-db` script.

2. **User Identification**: Each user is assigned a unique identifier when they first use the application. This identifier is stored in the client's session storage and sent with each location update.

3. **Location Updates**: The frontend application periodically sends the user's current location to the backend using the `/api/save-location` endpoint. This update includes the user's identifier, name, description, and coordinates.

4. **Data Storage**: When a location update is received, the backend saves or updates the information in the SQLite database. If it's a new user, a new row is inserted; otherwise, the existing row is updated with the new location and timestamp.

5. **Location Retrieval**: Other users can fetch the latest location of a specific user by making a GET request to the `/api/get-location/:id` endpoint, where `:id` is the unique identifier of the user whose location they want to retrieve.

6. **Background Sync**: The frontend uses the Background Sync API to ensure that location updates are sent even when the user's device has an unstable internet connection. If an update fails to send, it's queued and retried when the connection is restored.

7. **Real-time Updates**: While not implemented in the current version, the system is designed to be easily extendable to support real-time updates using WebSockets or Server-Sent Events.

8. **Error Handling**: The backend includes robust error handling to manage invalid inputs, database errors, and other potential issues, ensuring a smooth user experience.

9. **Data Persistence**: SQLite3 stores all data in a single file, making it easy to backup, move, or restore the entire database as needed.

## API Documentation

The Location Sharing Backend provides the following API endpoints:

### Save Location

Saves or updates a user's location.

- **URL:** `/api/save-location`
- **Method:** `POST`
- **Content-Type:** `application/json`

#### Request Body

| Field       | Type   | Description                            |
| ----------- | ------ | -------------------------------------- |
| id          | string | Unique identifier for the user         |
| name        | string | Name of the location or user           |
| description | string | Description of the location or purpose |
| latitude    | number | Latitude coordinate                    |
| longitude   | number | Longitude coordinate                   |

#### Example Request

```json
POST /api/save-location
Content-Type: application/json

{
  "id": "user_1234567890",
  "name": "John Doe",
  "description": "Delivery driver en route",
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

#### Success Response

- **Code:** 200 OK
- **Content:**

```json
{
  "message": "Location saved successfully",
  "data": {
    "id": "user_1234567890",
    "name": "John Doe",
    "description": "Delivery driver en route",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2024-09-26T14:30:00.000Z"
  }
}
```

#### Error Response

- **Code:** 400 Bad Request
- **Content:**

```json
{
  "error": "Invalid latitude or longitude"
}
```

### Get Location

Retrieves the latest location for a specific user.

- **URL:** `/api/get-location/:id`
- **Method:** `GET`

#### URL Parameters

| Parameter | Type   | Description                    |
| --------- | ------ | ------------------------------ |
| id        | string | Unique identifier for the user |

#### Example Request

```
GET /api/get-location/user_1234567890
```

#### Success Response

- **Code:** 200 OK
- **Content:**

```json
{
  "id": "user_1234567890",
  "name": "John Doe",
  "description": "Delivery driver en route",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "timestamp": "2024-09-26T14:30:00.000Z"
}
```

#### Error Response

- **Code:** 404 Not Found
- **Content:**

```json
{
  "error": "Location not found for the given id"
}
```

## Code Examples

<details>
<summary>Click to expand: Saving a location</summary>

```javascript
async function saveLocation(userData) {
  try {
    const response = await fetch("http://localhost:5000/api/save-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to save location");
    }

    const data = await response.json();
    console.log("Location saved:", data);
    return data;
  } catch (error) {
    console.error("Error saving location:", error);
    throw error;
  }
}

// Usage
const userData = {
  id: "user_1234567890",
  name: "John Doe",
  description: "Delivery driver en route",
  latitude: 37.7749,
  longitude: -122.4194,
};

saveLocation(userData)
  .then((result) => console.log("Save successful:", result))
  .catch((error) => console.error("Save failed:", error));
```

</details>

<details>
<summary>Click to expand: Retrieving a location</summary>

```javascript
async function getLocation(userId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/get-location/${userId}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Location not found");
      }
      throw new Error("Failed to retrieve location");
    }

    const data = await response.json();
    console.log("Location retrieved:", data);
    return data;
  } catch (error) {
    console.error("Error retrieving location:", error);
    throw error;
  }
}

// Usage
const userId = "user_1234567890";

getLocation(userId)
  .then((location) => console.log("Retrieved location:", location))
  .catch((error) => console.error("Retrieval failed:", error));
```

</details>

<details>
<summary>Click to expand: Continuous location updates</summary>

```javascript
function startLocationUpdates(userId, updateInterval = 120000) {
  let watchId;

  function updateLocation(position) {
    const { latitude, longitude } = position.coords;
    const userData = {
      id: userId,
      name: "John Doe", // This should be stored/retrieved as needed
      description: "Delivery driver en route", // This should be stored/retrieved as needed
      latitude,
      longitude,
    };

    saveLocation(userData)
      .then(() => console.log("Location updated successfully"))
      .catch((error) => console.error("Failed to update location:", error));
  }

  function handleError(error) {
    console.error("Error getting location:", error.message);
  }

  if ("geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
  }

  // Periodically update location even if the device hasn't moved
  const intervalId = setInterval(() => {
    navigator.geolocation.getCurrentPosition(updateLocation, handleError);
  }, updateInterval);

  // Return a function to stop updates
  return () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    clearInterval(intervalId);
  };
}

// Usage
const userId = "user_1234567890";
const stopUpdates = startLocationUpdates(userId);

// To stop updates later:
// stopUpdates();
```

</details>

These code examples demonstrate how to interact with the backend API and implement continuous location updates on the client side. They can be adapted and integrated into your frontend application as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
