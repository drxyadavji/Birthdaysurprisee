# Bhavuu Doodleverse ❤️

A static, GitHub Pages-ready romantic birthday website built with HTML, CSS and vanilla JavaScript.

## Quick start
1. Unzip the project.
2. Open `index.html` in a browser to preview (some browsers restrict local audio/video; use a local server for best results).
3. Edit `config.js` to change Bhavuuu's name, date, text, seasons, media, music and friends' wishes.
4. Add your own files under `assets/images/`, `assets/videos/` and `assets/music/`.
5. Push the folder contents to a GitHub repository and enable **Settings → Pages → Deploy from a branch → main / root**.

## Add a photo or video
Open `config.js`. Find the season, episode and media slot. Example:
```js
{
  type: "image",
  src: "assets/images/season1/episode1/photo1.jpg",
  caption: "Your beautiful smile ❤️",
  date: "2026-11-18",
  message: "One of my favourite days.",
  song: "assets/music/season1/track1.mp3",
  songTitle: "Our song"
}
```
For video use `type: "video"` and a path under `assets/videos/`. Each media slot has its own `song` and `songTitle`. Empty slots are intentional placeholders.

The three main seasons are: Season 1 (4 episodes), Season 2 (1 episode) and Season 3 (4 episodes: Picture Perfect, All of You, The Most Beautiful Chapter – Bhavuu ❣️ and My Favourite Person, My Safest Place), each with ten media slots per episode. Season 4 has five friend-wish episodes. Existing asset paths (for example `season4/episode1`, `season5/episode5`) were kept as they were, so no files need renaming.

## Add friends' wishes
In `config.js`, add objects to `CONFIG.friends`, e.g.:
```js
CONFIG.friends.push({
  name: "A friend's name",
  message: "Happy birthday, Bhavuuu!",
  photo: "assets/images/friends/friend1.jpg",
  video: "assets/videos/friends/wish1.mp4",
  song: "",
  songTitle: "",
  voice: ""
});
```
For categorised friend episodes, add friend objects to the relevant `CONFIG.friendsSeason.episodes[n].friends` array after the config initialises.

## Music
Set `CONFIG.themeSong` and `CONFIG.proposalSong` to paths. Enable music with the on-screen Music button; browsers require a user gesture before audio playback. A photo/video `song` plays while that memory is open in the viewer (optional; leave `song: ""` to keep the episode song). Priority: photo/video song → episode song → theme song. Videos pause all music while playing.

## Surprise after YES
Edit `CONFIG.proposal.yesSurprise` in `config.js` (title, lines, signature, delayMs, optional song, `enabled`). It appears only after she taps YES, after the YES message.

## Media display guarantee
Original media in the full-screen viewer uses `object-fit: contain` and `max-width/max-height`, preserving the entire image/video without cropping or stretching. Empty space is filled by the dark viewer background. Thumbnails are constrained within their own preview boxes, also using `contain`.

## Countdown note
The birthday target is `2026-11-18T00:00:00+05:30` (midnight IST). The countdown is a client-side presentation gate only. GitHub Pages is static hosting, so this does **not** secure files or prevent visitors from bypassing the screen or changing their device clock.

## Important limitations
- The browser's local file picker cannot silently upload files into a GitHub repository. Add/copy media files into the project folder yourself, then update their paths in `config.js`.
- Use media you own or have permission to use. Audio playback may be blocked until the visitor taps the music control.
- This is a ready-to-personalise starter experience. Replace sample text and empty media slots with your real photos, videos, songs and personal stories before publishing.


## Custom music for each special moment

Put your own MP3 files inside `assets/music/`, then edit the three fields near the top of `config.js`:

```js
birthdaySong: "assets/music/my-birthday-instrumental.mp3",
loveNoteSong: "assets/music/our-romantic-song.mp3",
proposalSong: "assets/music/our-special-song.mp3",
```

- `birthdaySong` plays on the full-screen birthday celebration.
- `loveNoteSong` plays when a love note is opened.
- `proposalSong` plays when the proposal letter is opened.
- Leave any field as `""` to use the built-in instrumental fallback for that moment.
- Use a relative path exactly matching the file name and capitalization.

**Autoplay note:** The website attempts to start the birthday song as soon as the countdown completes. Chrome, Safari and other browsers may block sound that starts without a user gesture. If that happens, the birthday screen shows a **Play birthday music** button; one tap starts the chosen track. Love-note and proposal music starts from the user's tap to open those sections.


## Countdown suspense music

Add an MP3 to `assets/music/` and set `countdownSong` near the top of `config.js`, for example:

```js
countdownSong: "assets/music/countdown-suspense.mp3",
```

The chosen track starts when the visitor enters the correct password and the countdown appears. Browsers may restrict sound in some situations; the countdown includes a music button as a fallback. If `countdownSong` is blank, the site uses a built-in generated suspense-style instrumental.

## Password entry screen

Change `sitePassword` in `config.js` before publishing:

```js
sitePassword: "replace-this-with-your-own-password",
```

Visitors must enter this password before the countdown or birthday website appears. **Important security limitation:** GitHub Pages serves static files. A password check implemented in browser JavaScript is a convenience gate only; the password can be found in the downloaded source code and the page can be bypassed by a technical visitor. It does not protect the underlying photos, videos or other files from direct access. For real access control, host the site behind a server-side authentication service (for example, Cloudflare Access) rather than relying on a password stored in `config.js`.


## Season 4 - friends' messages (video, voice and written)

In `config.js`, `CONFIG.friendsSeason.episodes` holds each friend message as a media item with a `type`:

```js
{ type: "video", src: "assets/videos/friends/classmate-1.mp4", caption: "Name", message: "" }   // video
{ type: "audio", src: "assets/audio/friends/ajay-voice.mp3",   caption: "Ajay", message: "" }    // voice message
{ type: "text",  src: "",                                       caption: "Tejas", message: "Their written message" } // written
```
Voice messages show a player card and pause the background music while playing. Written messages show the text on a card. Use a file format browsers can play (mp3, m4a or wav; some phones save voice notes as .opus/.ogg, which may not play on every device).


## Friends' wishes section (home page)
The "Friends' wishes" section on the home page now lists every message from `CONFIG.friends` **and** from the Season 4 friends' episodes (`CONFIG.friendsSeason`). Each card shows the type (video, voice or written), the sender and a short preview; tapping a card opens the full message in the viewer. Nothing extra needs to be configured: add a message in `config.js` and it appears in both places.
