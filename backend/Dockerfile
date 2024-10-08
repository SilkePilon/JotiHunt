# Use an official Node.js runtime as the base image
FROM --platform=$BUILDPLATFORM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Install SQLite3
RUN apk add --no-cache sqlite

# Expose the port the app runs on
EXPOSE 5000

LABEL org.opencontainers.image.description "An fully open-source backend with a database made by Scouting Alexandergroep for the jotihunt IRL game"

# Define the command to run the app
CMD ["node", "index.js"]