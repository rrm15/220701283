import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { nanoid } from 'nanoid';
import { config } from './config/credentials.js';
import { Log } from './middleware/logger.js';
import Url from './models/Url.js';

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DB Connection
mongoose.connect(config.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    Log("backend", "info", "db", "MongoDB connection established");
  })
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    Log("backend", "fatal", "db", `Connection failed: ${err.message}`);
  });

// Form page
app.get('/', (req, res) => {
  res.render('index', { shortLink: null, error: null });
});

// Shorten a URL
app.post('/shorten', async (req, res) => {
  const { url, shortcode, validity } = req.body;

  if (!url) {
    await Log("backend", "warn", "handler", "Missing URL in request");
    return res.render('index', { shortLink: null, error: "URL required" });
  }

  const shortCode = shortcode || nanoid(6);
  const minutes = validity ? parseInt(validity, 10) : 30;
  const expiresAt = new Date(Date.now() + minutes * 60000);

  try {
    const exists = await Url.findOne({ shortCode });
    if (exists) {
      await Log("backend", "warn", "handler", `Shortcode ${shortCode} already in use`);
      return res.render('index', { shortLink: null, error: "Shortcode already exists" });
    }

    const entry = await Url.create({
      longUrl: url,
      shortCode,
      expiresAt
    });

    await Log("backend", "info", "handler", `Created short URL: ${shortCode}`);
    res.render('index', {
      shortLink: `http://localhost:${config.PORT}/${shortCode}`,
      error: null
    });
  } catch (err) {
    await Log("backend", "error", "handler", `Error shortening: ${err.message}`);
    res.render('index', { shortLink: null, error: "Server error" });
  }
});

// Redirect handler
app.get('/:shortCode', async (req, res) => {
  try {
    const entry = await Url.findOne({ shortCode: req.params.shortCode });

    if (!entry) {
      await Log("backend", "warn", "route", "Shortcode not found");
      return res.status(404).send("Shortcode not found");
    }

    if (entry.expiresAt < new Date()) {
      await Log("backend", "warn", "route", "Shortcode expired");
      return res.status(410).send("Link has expired");
    }

    entry.clicks.push({
      timestamp: new Date(),
      referrer: req.headers.referer || "direct"
    });
    await entry.save();

    await Log("backend", "info", "route", `Redirecting to ${entry.longUrl}`);
    res.redirect(entry.longUrl);
  } catch (err) {
    await Log("backend", "fatal", "route", err.message);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${config.PORT}`);
});
