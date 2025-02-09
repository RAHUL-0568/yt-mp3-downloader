# Use a lightweight official Node.js image
FROM node:18-bullseye

# Install yt-dlp
RUN apt-get update && apt-get install -y yt-dlp

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the port (Render will use this)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
