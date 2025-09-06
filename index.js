import "dotenv/config"; // Load environment variables
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Video Schema (collection: videos)
const videoSchema = new mongoose.Schema(
  {
    videoId: String,
  },
  { collection: "videos" }
); // explicitly set collection

const Video = mongoose.model("Video", videoSchema, "videos"); // model for 'videos' collection

// Helper: fetch YouTube metadata + channel logos
const getYouTubeData = async (videoIds) => {
  const ids = videoIds.join(",");
  console.log("Requesting YouTube API for IDs:", ids); // <-- Add this
  const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`;
  const videoRes = await axios.get(videoUrl);
  console.log("YouTube API returned:", videoRes.data.items.length, "videos"); // <-- Add this

  // Get unique channel IDs
  const channelIds = [
    ...new Set(videoRes.data.items.map((item) => item.snippet.channelId)),
  ].join(",");
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${process.env.YOUTUBE_API_KEY}`;
  const channelRes = await axios.get(channelUrl);

  // Map channelId → channelLogo
  const channelMap = {};
  channelRes.data.items.forEach((ch) => {
    channelMap[ch.id] = ch.snippet.thumbnails.default.url; // small logo
  });

  return videoRes.data.items.map((item) => ({
    videoId: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.high.url,
    channelLogo: channelMap[item.snippet.channelId] || null,
    duration: item.contentDetails.duration,
  }));
};

// Route: Get all videos
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

// Route: Get a specific video by videoId
app.get("/api/videos/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findOne({ videoId });
    if (!video) return res.status(404).json({ error: "Video not found" });

    const enrichedVideo = await getYouTubeData([video.videoId]);
    res.json(enrichedVideo[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
