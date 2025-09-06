import "dotenv/config"; // Load environment variables
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// MongoDB connection
// ---------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// ---------------------
// Video Schema
// ---------------------
const videoSchema = new mongoose.Schema(
  {
    videoId: String,
  },
  { collection: "videos" }
);

const Video = mongoose.model("Video", videoSchema, "videos");

// ---------------------
// Helper: fetch YouTube metadata + channel logos
// ---------------------
const getYouTubeData = async (videoIds) => {
  // Remove quotes and trim spaces
  const cleanIds = videoIds.map((id) => id.replace(/"/g, "").trim());

  if (cleanIds.length === 0) return [];

  // Fetch video metadata
  const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${cleanIds.join(
    ","
  )}&key=${process.env.YOUTUBE_API_KEY}`;
  const videoRes = await axios.get(videoUrl);
  const videoItems = videoRes.data.items || [];
  console.log("YouTube API returned:", videoItems.length, "videos");

  // Fetch channel logos
  const channelIds = [...new Set(videoItems.map((item) => item.snippet.channelId))];
  let channelMap = {};
  if (channelIds.length > 0) {
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(
      ","
    )}&key=${process.env.YOUTUBE_API_KEY}`;
    const channelRes = await axios.get(channelUrl);
    channelRes.data.items.forEach((ch) => {
      channelMap[ch.id] = ch.snippet.thumbnails.default.url;
    });
  }

  // Map videoId → enriched metadata, fallback placeholders for unavailable videos
  return cleanIds.map((id) => {
    const video = videoItems.find((v) => v.id === id);
    if (video) {
      return {
        videoId: video.id,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high.url,
        channelLogo: channelMap[video.snippet.channelId] || null,
        duration: video.contentDetails.duration,
      };
    } else {
      return {
        videoId: id,
        title: "Video unavailable",
        channelTitle: "-",
        thumbnail: "https://via.placeholder.com/320x180?text=No+Thumbnail",
        channelLogo: "https://via.placeholder.com/50?text=Logo",
        duration: "0",
      };
    }
  });
};

// ---------------------
// Routes
// ---------------------

// Get all videos
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find({});
    const videoIds = videos.map((v) => v.videoId);
    const enrichedVideos = await getYouTubeData(videoIds);
    res.json(enrichedVideos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific video by ID
app.get("/api/videos/:videoId", async (req, res) => {
  try {
    const videoIdParam = req.params.videoId.replace(/"/g, "").trim();
    const video = await Video.findOne({ videoId: videoIdParam });
    if (!video) return res.status(404).json({ error: "Video not found" });

    const enrichedVideo = await getYouTubeData([video.videoId]);
    res.json(enrichedVideo[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------
// Start server
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
