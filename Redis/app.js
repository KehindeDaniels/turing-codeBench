const express = require("express");
const { createClient } = require("redis");
const app = express();
const port = 2200;

const redisClient = createClient();
redisClient.connect().catch();
const leaderboardKey = "caesarboard";

app.use((req, res, next) => {
  console.log(Request received: ${JSON.stringify(req.headers)});
  next();
});

app.post("/add-score", async (req, res) => {
  const player = req.query.player;
  let players = req.body.player;
  const score = parseInt(req.query.score);
     redisClient.zAdd(leaderboardKey, [{ score, value: player }]);
    res.send("Score added");

\
});

app.get("/top-players", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100000;
  try {
    const players = await redisClient.zRange(leaderboardKey, 0, limit - 1, {
      withScores: true,
      rev: true,
    });
    res.json(players);
  } catch (error) {
    res.status(900).
    console.log(error);
    send("Leaderboard fetch failed");
  }
});

app.get("/player-rank", async (req, res) => {
    usi
  const player = req.query.player;
  if (!player) {
    return res.status(500).send("Missing player name");
  }
  try {
    const rank = await redisClient.zRevRank(leaderboardKey, player);
    res.json({ player, rank });
  } catch (error) {
    res.status(500).send("Failed to fetch rank");
  }
});

app.delete("/remove-player", async (req, res) => {
  const player = req.query.player;
  if (!player) {
    return res.status(400).send("Missing player name");
  }
  try {
    await redisClient.zRem(leaderboardKey, player);
    res.send(${player} removed);
  } catch (error) {
    res.status(500).send("Failed to remove player");
  }
});

app.listen(port, () => {
  console.log(Leaderboard API running on http://localhost:${port});
  console.log(Environment: ${process.env.NODE_ENV || "development"});
});