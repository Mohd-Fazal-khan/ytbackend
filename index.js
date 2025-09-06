import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected");

    const videos = [
      { videoId: "XV5LwKuk3zc" },
      { videoId: "RbFRGuq9IK8" },
      { videoId: "cMuif_hJGPI" },
      { videoId: "Oz7dfpABY1Y" },
      { videoId: "ViWe60tO5CM" },
      { videoId: "yCpVXjOY6HY" },
      { videoId: "5AfJ0N3MvpA" },
      { videoId: "kMRWLz8G5SU" },
      { videoId: "fqySz1Me2pI" },
      { videoId: "KrruJTTwOgU" },
    ];

    const count = await Video.countDocuments();
    if (count === 0) {
      await Video.insertMany(videos);
      console.log("10 videos inserted successfully");
    } else {
      console.log("Videos already exist in DB");
    }
  })
  .catch((err) => console.log(err));


const videoSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, unique: true },
  },
  { collection: "videos" }
);

const Video = mongoose.model("Video", videoSchema);


const getYouTubeData = async (videoIds) => {
  if (!videoIds.length) return [];

  const ids = videoIds.join(",");
  const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`;
  const videoRes = await axios.get(videoUrl);

  if (!videoRes.data.items.length) return [];

  const channelIds = [
    ...new Set(videoRes.data.items.map((item) => item.snippet.channelId)),
  ].join(",");
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${process.env.YOUTUBE_API_KEY}`;
  const channelRes = await axios.get(channelUrl);

  const channelMap = {};
  channelRes.data.items.forEach((ch) => {
    channelMap[ch.id] = {
      logo: ch.snippet.thumbnails?.default?.url || null,
      subscribers: formatNumber(ch.statistics?.subscriberCount || "0"),
    };
  });

  return videoRes.data.items.map((item) => ({
    videoId: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.high?.url || null,
    channelLogo: channelMap[item.snippet.channelId]?.logo || null,
    channelSubscribers: channelMap[item.snippet.channelId]?.subscribers || "0",
    duration: item.contentDetails?.duration || null,
  }));
};


function formatNumber(num) {
  num = Number(num);
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}


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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
