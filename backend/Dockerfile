# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Install SQLite3
RUN apt-get update && apt-get install -y sqlite3

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the app
CMD ["node", "index.js"]