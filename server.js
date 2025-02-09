const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Download and send the file with the correct title
app.get("/download", (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: "No URL provided" });
    }

    // Get the video title first
    exec(`yt-dlp --print "%(title)s" "${videoUrl}"`, (titleError, titleStdout, titleStderr) => {
        if (titleError) {
            console.error("Error getting title:", titleStderr);
            return res.status(500).json({ error: "Failed to retrieve video title." });
        }

        // Sanitize filename (remove invalid characters)
        let videoTitle = titleStdout.trim().replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "_");
        if (!videoTitle) videoTitle = "Downloaded_Audio"; // Fallback title

        // Define output file path
        const outputFilePath = path.join(__dirname, `${videoTitle}.mp3`);

        // yt-dlp command to download with the correct filename
        exec(`yt-dlp -f bestaudio --extract-audio --audio-format mp3 --output "${videoTitle}.%(ext)s" "${videoUrl}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Download error:", stderr);
                return res.status(500).json({ error: "Download failed. Check the URL or try again later." });
            }

            // Wait for file creation
            const downloadedFilePath = path.join(__dirname, `${videoTitle}.mp3`);
            if (!fs.existsSync(downloadedFilePath)) {
                return res.status(500).json({ error: "Could not find the downloaded file." });
            }

            // Set proper headers to force correct file name
            res.setHeader("Content-Disposition", `attachment; filename="${videoTitle}.mp3"`);
            res.setHeader("Content-Type", "audio/mpeg");

            // Stream the file to the browser
            const fileStream = fs.createReadStream(downloadedFilePath);
            fileStream.pipe(res);

            // Delete the file after sending
            fileStream.on("end", () => {
                fs.unlinkSync(downloadedFilePath);
            });
        });
    });
});

// Serve frontend
app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
