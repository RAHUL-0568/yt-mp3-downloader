#!/bin/bash
set -e # Exit immediately if any command fails

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

# Make executable
chmod +x yt-dlp

# Install Node.js dependencies
npm install