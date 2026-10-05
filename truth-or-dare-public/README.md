# Couples Games: Truth or Dare + If you had to choose (public, no sign-in, no API key)

Two players join a room by link/code, pick a level, and play Truth or Dare with chat, a challenge timer, round counter and history. Suggestions come from 3000 premade truths and 3000 premade dares in `public/data.json`, picked at random per level (Lovers: mild / medium / spicy).

## Run locally
    npm install
    npm start        # open http://localhost:3000

## Deploy (Render free tier, or any Node host)
1. Put this folder in a GitHub repo.
2. Render > New > Web Service > pick the repo. Build: `npm install`. Start: `npm start`. No environment variables needed.
3. Share your URL. The host also gets a join link like `https://yourapp.onrender.com/#abc12`.

## Edit the suggestions
The lists are built from 20 sentence frames x 150 topics per kind: English in `generate.py`, Arabic in `ar.py`. Edit them and run `python3 generate.py` to rebuild `public/data.json` (it checks there are exactly 3000 unique items per kind and language).

Notes: the language picker offers English and Arabic; suggestions and interface follow it (Arabic switches the page to right-to-left). Rooms live in memory and reset on restart. Free hosts sleep when idle, so the first load can be slow.

## Games
- **Truth or Dare**: described above.
- **If you had to choose**: the host picks this game on the home screen. Player 1 types two options (or taps "Give me a pair"), player 2 picks one, both chat about why until player 1 hits Done, then the roles swap. Premade options live in `pairs.py` (English + Arabic) and are included in `data.json` after `python3 generate.py`.

## Rooms stay open
Each player gets a private id stored in the browser, so a refresh (or a dropped connection) puts them straight back in their room with the game state, chat and history intact. A room closes only when a player taps "Close room", or after 72 hours with nobody connected (change with the `ROOM_TTL_HOURS` environment variable). A third person cannot enter a full room.
Rooms are kept in the server's memory and saved to `rooms.json` (set another path with `ROOMS_FILE`). On Render's free plan the server sleeps when idle and its disk is wiped on sleep or redeploy, so rooms can disappear then; a paid always-on instance with a persistent disk keeps them.

## Check that an update is live
Open `https://YOUR-APP/version`. It should say `v5`. If it shows an error or an older number, the new `server.js` is not deployed yet. Open the game once as `https://YOUR-APP/?v=5` to skip any cached copy; you should see "v5" at the bottom of the page.
