function downloadMP3() {
    let url = document.getElementById("url").value;
    if (!url) {
        alert("⚠️ Please enter a YouTube URL!");
        return;
    }

    let status = document.getElementById("status");
    status.innerHTML = "⏳ Downloading... Please wait.";
    status.style.color = "#007bff"; // Blue color for progress

    fetch(`/download?url=${encodeURIComponent(url)}`)
        .then(response => {
            if (!response.ok) throw new Error("Download failed");
            let filename = response.headers.get("Content-Disposition")?.split("filename=")[1] || "audio.mp3";
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", filename.replace(/"/g, "")); // Ensure proper filename formatting
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            status.innerHTML = "✅ Download started!";
            status.style.color = "green"; // Success message in green
            document.getElementById("url").value = ""; // Clear input field
        })
        .catch(() => {
            status.innerHTML = "❌ Download failed! Please check the URL.";
            status.style.color = "red"; // Error message in red
        });
}
