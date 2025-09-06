# YouTube Demo Backend API

This is the backend server for the YouTube Demo App, built with [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), and [MongoDB](https://www.mongodb.com/). It provides RESTful API endpoints to fetch YouTube video and channel data, which is consumed by the client application.

## Features

- Fetches video details from MongoDB and enriches them with YouTube Data API v3
- Returns video metadata, channel information, and subscriber counts
- Automatically seeds the database with demo video IDs if empty
- CORS enabled for cross-origin requests
- Easy configuration via environment variables

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or local MongoDB instance
- [YouTube Data API Key](https://console.developers.google.com/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone <your-repo-url>
   cd server
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the `server` directory with the following content:

   ```
   MONGO_URI=<your-mongodb-uri>
   YOUTUBE_API_KEY=<your-youtube-api-key>
   PORT=5000
   ```

### Running the Server

Start the backend server:

```sh
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### `GET /api/videos`

Returns an array of enriched video objects:

```json
[
  {
    "videoId": "XV5LwKuk3zc",
    "title": "Video Title",
    "channelTitle": "Channel Name",
    "thumbnail": "https://...",
    "channelLogo": "https://...",
    "channelSubscribers": "1.2M",
    "duration": "PT4M13S"
  },
  ...
]
```

## Project Structure

- `index.js` – Main Express server and API logic
- `.env` – Environment variables (not committed)
- `package.json` – Project metadata and dependencies

## Environment Variables

- `MONGO_URI` – MongoDB connection string
- `YOUTUBE_API_KEY` – YouTube Data API v3 key
- `PORT` – Server port (default: 5000)

## License

This project is licensed under the MIT License.

---

**Contact:** For questions or support, please open an issue or reach
