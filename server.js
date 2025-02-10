const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Define yt-dlp path (Render & Windows compatibility)
const ytdlpPath = process.platform === "win32" 
    ? path.join(__dirname, "yt-dlp.exe") 
    : path.join(__dirname, "yt-dlp");

console.log("✅ Using yt-dlp path:", ytdlpPath);

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

app.use(cors());
app.use(express.json());

app.get("/download", (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

    // Check if yt-dlp exists before executing
    if (!fs.existsSync(ytdlpPath)) {
        console.error("❌ yt-dlp binary not found!");
        return res.status(500).json({ error: "yt-dlp is missing. Please deploy correctly." });
    }

    // Get video title
    exec(`"${ytdlpPath}" --print "%(title)s" "${videoUrl}"`, (titleError, titleStdout) => {
        if (titleError) {
            console.error("❌ Error getting title:", titleError);
            return res.status(500).json({ error: "Failed to retrieve video title." });
        }

        let videoTitle = titleStdout.trim().replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "_") || "Downloaded_Audio";
        const outputFilePath = path.join(downloadsDir, `${videoTitle}.mp3`);

        console.log(`🔹 Downloading: ${videoTitle}.mp3`);

        // Download audio
        exec(`"${ytdlpPath}" -f bestaudio --extract-audio --audio-format mp3 --output "${outputFilePath}" "${videoUrl}"`, (error) => {
            if (error) {
                console.error("❌ Download error:", error);
                return res.status(500).json({ error: "Download failed." });
            }

            if (!fs.existsSync(outputFilePath)) {
                console.error("❌ File not found after download.");
                return res.status(500).json({ error: "File not found." });
            }

            res.setHeader("Content-Disposition", `attachment; filename="${videoTitle}.mp3"`);
            res.setHeader("Content-Type", "audio/mpeg");

            const fileStream = fs.createReadStream(outputFilePath);
            fileStream.pipe(res);

            fileStream.on("end", () => {
                console.log(`✅ Successfully served: ${videoTitle}.mp3`);
                fs.unlinkSync(outputFilePath);
            });
        });
    });
});

app.use(express.static("public"));

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
