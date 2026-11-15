import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

type WindowId = "gallery" | "messages" | "memories" | "music" | "notes" | "folder" | "help";
type Point = { x: number; y: number };

const photos = Array.from(
  { length: 21 },
  (_, index) => `/photos/memory-${String(index + 1).padStart(2, "0")}.jpg`,
);

const excludedPhotos = new Set(["/photos/memory-02.jpg", "/photos/memory-15.jpg"]);
const galleryPhotos = photos.filter((photo) => !excludedPhotos.has(photo));
// Keep the existing memory spread and Good Days album intact.
const albumPhotos = photos.slice(11).filter((photo) => !excludedPhotos.has(photo));

const sparkleNotes = [
  "Tithi makes everything brighter",
  "a tiny pocket of joy",
  "keep this moment forever",
  "made with so much love",
  "soft hearts, loud laughs",
  "the sweetest soul",
  "you are so loved",
  "a little birthday magic",
  "good days live here",
  "shine on, always",
  "our favorite kind of sparkle",
  "click for extra magic",
];

const sparklePositions = [
  [12, 12],
  [29, 8],
  [54, 14],
  [72, 7],
  [88, 18],
  [7, 57],
  [21, 77],
  [43, 82],
  [64, 72],
  [84, 59],
  [91, 82],
  [52, 48],
];

const backgroundMotifs = [
  ["ribcage", 2, 3, 9, -7],
  ["tomato", 16, 2, 10, 5],
  ["cat-faces", 33, 5, 6, -3],
  ["mind", 47, 1, 9, 5],
  ["eyes", 65, 4, 7, -5],
  ["caterpillar", 82, 2, 6, 11],
  ["papaya", 93, 5, 6, -8],
  ["fish", 4, 28, 9, -4],
  ["star-orange", 19, 27, 6, 9],
  ["star-yellow", 31, 31, 5, -11],
  ["star-blue", 43, 27, 6, 6],
  ["disco-ball", 55, 24, 11, -3],
  ["moth", 76, 25, 9, 7],
  ["pushpin", 91, 29, 7, 12],
  ["moon", 4, 56, 8, -8],
  ["sleepy-cat", 18, 53, 9, 4],
  ["gold-stars", 34, 57, 8, -5],
  ["hibiscus", 48, 51, 7, 8],
  ["disco-strawberry", 62, 57, 6, -7],
  ["pink-starfish", 74, 53, 7, 9],
  ["strawberry-two", 88, 55, 7, -5],
  ["bow", 4, 79, 7, -8],
  ["hibiscus-two", 19, 77, 8, 7],
  ["turtles", 39, 75, 10, -4],
  ["sun", 63, 72, 12, 6],
  ["pink-starfish-two", 87, 77, 8, -9],
] as const;

const initialPositions: Record<WindowId, Point> = {
  gallery: { x: 36, y: 86 },
  music: { x: 430, y: 62 },
  memories: { x: 255, y: 230 },
  messages: { x: 780, y: 138 },
  notes: { x: 735, y: 245 },
  folder: { x: 590, y: 245 },
  help: { x: 620, y: 180 },
};

const windowNames: Record<WindowId, string> = {
  gallery: "Photo Booth",
  messages: "Messages",
  memories: "memories.pages",
  music: "Mixtape",
  notes: "little notes",
  folder: "good days",
  help: "Help",
};

function Icon({ name }: { name: "folder" | "photo" | "message" | "music" | "note" }) {
  const paths = {
    folder: (
      <>
        <path d="M3 7h7l2 2h9v10H3z" />
        <path d="M3 7V5h7l2 2" />
      </>
    ),
    photo: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m4 17 5-4 4 3 3-3 5 4" />
      </>
    ),
    message: <path d="M4 5h16v11H9l-5 4z" />,
    music: (
      <>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    note: (
      <>
        <path d="M5 3h14v18H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function DesktopIcon({
  icon,
  label,
  onClick,
}: {
  icon: "folder" | "photo" | "message" | "music" | "note";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="desktop-icon"
      onDoubleClick={onClick}
      onClick={onClick}
      aria-label={`Open ${label}`}
    >
      <span className={`desktop-icon-art ${icon}`}>
        <Icon name={icon} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function AppWindow({
  id,
  title,
  position,
  zIndex,
  className = "",
  children,
  onClose,
  onFocus,
  onMove,
}: {
  id: WindowId;
  title: string;
  position: Point;
  zIndex: number;
  className?: string;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMove: (position: Point) => void;
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    onFocus();
    drag.current = { dx: event.clientX - position.x, dy: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const maxX = Math.max(12, window.innerWidth - 170);
    const maxY = Math.max(32, window.innerHeight - 90);
    onMove({
      x: Math.min(maxX, Math.max(-40, event.clientX - drag.current.dx)),
      y: Math.min(maxY, Math.max(28, event.clientY - drag.current.dy)),
    });
  };

  return (
    <section
      className={`app-window ${className}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        "--window-x": `${position.x}px`,
        "--window-y": `${position.y}px`,
      } as CSSProperties}
      onPointerDown={onFocus}
      aria-label={title}
      data-window={id}
    >
      <div
        className="titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="traffic-lights">
          <button className="close" onClick={onClose} aria-label={`Close ${title}`} />
          <span className="minimize" />
          <span className="maximize" />
        </div>
        <span className="window-title">{title}</span>
        <span className="titlebar-spacer" />
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [positions, setPositions] = useState(initialPositions);
  const [openWindows, setOpenWindows] = useState<WindowId[]>([
    "gallery",
    "music",
    "memories",
    "messages",
    "notes",
  ]);
  const [stack, setStack] = useState<WindowId[]>([
    "music",
    "gallery",
    "notes",
    "messages",
    "memories",
  ]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sparkling, setSparkling] = useState<number | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const uploadedUrls = useRef<string[]>([]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      uploadedUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const focusWindow = (id: WindowId) =>
    setStack((current) => [...current.filter((item) => item !== id), id]);
  const closeWindow = (id: WindowId) =>
    setOpenWindows((current) => current.filter((item) => item !== id));
  const openWindow = (id: WindowId) => {
    setOpenWindows((current) => (current.includes(id) ? current : [...current, id]));
    focusWindow(id);
  };
  const zIndexFor = (id: WindowId) => 10 + stack.indexOf(id);

  const navigateTo = (id: WindowId) => {
    openWindow(id);
    setMenuOpen(false);
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const newPhotos = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));
    uploadedUrls.current.push(...newPhotos);
    setUploadedPhotos((current) => [...current, ...newPhotos]);
    event.target.value = "";
  };

  const activateSparkle = (index: number) => {
    setSparkling(index);
    window.setTimeout(() => setSparkling((current) => (current === index ? null : current)), 700);
  };

  return (
    <main className="desktop">
      <header className="menu-bar">
        <div className="menu-left">
          <span className="apple-mark">◆</span>
          <strong>Scrapbook</strong>
          <div className="file-menu">
            <button
              className={menuOpen ? "menu-trigger active" : "menu-trigger"}
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
            >
              File
            </button>
            {menuOpen && (
              <>
                <button
                  className="menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close File menu"
                />
                <div className="menu-popover">
                  <button onClick={() => navigateTo("gallery")}>
                    <span>View</span>
                    <kbd>⌘ V</kbd>
                  </button>
                  <button onClick={() => navigateTo("memories")}>
                    <span>Memories</span>
                    <kbd>⌘ M</kbd>
                  </button>
                  <i />
                  <button onClick={() => navigateTo("help")}>
                    <span>Help</span>
                    <kbd>⌘ ?</kbd>
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="menu-link" onClick={() => navigateTo("gallery")}>
            View
          </button>
          <button className="menu-link" onClick={() => navigateTo("memories")}>
            Memories
          </button>
          <button className="menu-link" onClick={() => navigateTo("help")}>
            Help
          </button>
        </div>
        <div className="menu-right">
          <span>◒</span>
          <span>⌁</span>
          <span>Thu 13 Nov</span>
          <strong>6:08 PM</strong>
        </div>
      </header>

      <aside className="desktop-icons icons-left">
        <DesktopIcon icon="folder" label="good days" onClick={() => openWindow("folder")} />
        <DesktopIcon icon="photo" label="all photos" onClick={() => openWindow("gallery")} />
        <DesktopIcon icon="note" label="read me" onClick={() => openWindow("notes")} />
      </aside>

      <div className="background-motifs" aria-hidden="true">
        {backgroundMotifs.map(([name, x, y, size, rotation], index) => (
          <img
            key={name}
            className="background-motif"
            src={`/stickers/${name}.webp`}
            alt=""
            style={
              {
                "--motif-x": `${x}%`,
                "--motif-y": `${y}%`,
                "--motif-size": `${size}vw`,
                "--motif-rotation": `${rotation}deg`,
                "--motif-delay": `${index * -0.31}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="tape tape-one" />
      <div className="flower-sticker sticker" data-note="picked on the way home">
        <span>✿</span>
      </div>
      <div className="sparkle-field" aria-label="Interactive sparkle stickers">
        {sparkleNotes.map((note, index) => (
          <button
            key={note}
            className={`mini-sparkle sparkle-${index % 4} ${sparkling === index ? "sparkle-pop" : ""}`}
            style={{
              left: `${sparklePositions[index][0]}%`,
              top: `${sparklePositions[index][1]}%`,
              animationDelay: `${index * -0.37}s`,
            }}
            data-note={note}
            onClick={() => activateSparkle(index)}
            aria-label={note}
          >
            ✦
          </button>
        ))}
      </div>
      <div className="tiny-label">a little archive of us</div>

      {openWindows.includes("gallery") && (
        <AppWindow
          id="gallery"
          title="Photo Booth — Favorites"
          position={positions.gallery}
          zIndex={zIndexFor("gallery")}
          className="gallery-window"
          onClose={() => closeWindow("gallery")}
          onFocus={() => focusWindow("gallery")}
          onMove={(p) => setPositions((s) => ({ ...s, gallery: p }))}
        >
          <div className="gallery-toolbar">
            <button>All Photos</button>
            <span>{galleryPhotos.length} one-of-a-kind moments</span>
            <button aria-label="Grid view">▦</button>
          </div>
          <div className="gallery-grid">
            {galleryPhotos.map((photo, index) => (
              <button
                key={photo}
                className={`gallery-photo photo-${index}`}
                onClick={() => setLightbox(photo)}
                aria-label={`Open memory ${index + 1}`}
              >
                <img src={photo} alt={`Candid memory ${index + 1}`} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </AppWindow>
      )}

      {openWindows.includes("music") && (
        <AppWindow
          id="music"
          title="Mixtape for good days"
          position={positions.music}
          zIndex={zIndexFor("music")}
          className="music-window"
          onClose={() => closeWindow("music")}
          onFocus={() => focusWindow("music")}
          onMove={(p) => setPositions((s) => ({ ...s, music: p }))}
        >
          <div className="music-inner">
            <div className="album-art">
              <img src="/photos/cassette.jpg" alt="Vintage cassette tape" />
              <span>US, VOL. 01</span>
            </div>
            <div className="now-playing">
              <small>NOW PLAYING</small>
              <strong>Sweet Disposition</strong>
              <span>The Temper Trap</span>
              <div className="track">
                <i className={playing ? "playing" : ""} />
              </div>
              <div className="times">
                <span>1:47</span>
                <span>3:51</span>
              </div>
              <div className="player-controls">
                <button>‹‹</button>
                <button
                  className="play"
                  onClick={() => setPlaying(!playing)}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? "Ⅱ" : "▶"}
                </button>
                <button>››</button>
              </div>
            </div>
          </div>
          <div className="song-list">
            <span>01</span>
            <b>Dreams</b>
            <em>Fleetwood Mac</em>
            <span>4:17</span>
            <span>02</span>
            <b>Friday I’m in Love</b>
            <em>The Cure</em>
            <span>3:35</span>
          </div>
        </AppWindow>
      )}

      {openWindows.includes("memories") && (
        <AppWindow
          id="memories"
          title="memories.pages — Edited"
          position={positions.memories}
          zIndex={zIndexFor("memories")}
          className="memory-window"
          onClose={() => closeWindow("memories")}
          onFocus={() => focusWindow("memories")}
          onMove={(p) => setPositions((s) => ({ ...s, memories: p }))}
        >
          <div className="page-spread">
            <div className="paper-page page-left">
              <p className="scribble">
                You make us all feel like
                <br />
                we're home, Tithi &lt;3
              </p>
              <button className="polaroid polaroid-a" onClick={() => setLightbox(photos[9])}>
                <img src={photos[9]} alt="Friends dressed up together" />
                <span>OMG FREE YUMMMY INDIAN FOOD!</span>
              </button>
              <span className="date-stamp">NOV · 2026</span>
            </div>
            <div className="paper-page page-right">
              <span className="torn-heading">favorite kind of chaos</span>
              <button className="polaroid polaroid-b" onClick={() => setLightbox(photos[10])}>
                <img src={photos[10]} alt="Friends sharing a meal" />
                <span>dinner that became midnight</span>
              </button>
              <p className="margin-note">
                note to self:
                <br />
                say yes more often.
              </p>
              <span className="doodle-arrow">↝</span>
            </div>
          </div>
        </AppWindow>
      )}

      {openWindows.includes("messages") && (
        <AppWindow
          id="messages"
          title="Messages"
          position={positions.messages}
          zIndex={zIndexFor("messages")}
          className="messages-window"
          onClose={() => closeWindow("messages")}
          onFocus={() => focusWindow("messages")}
          onMove={(p) => setPositions((s) => ({ ...s, messages: p }))}
        >
          <div className="contact">
            <div className="avatars">
              <span>B</span>
              <span>15</span>
            </div>
            <strong>blobfish</strong>
            <small>15 people · active now</small>
          </div>
          <div className="chat">
            <span className="timestamp">Today 5:42 PM</span>
            <p className="bubble incoming">lunch at Windsor?</p>
            <p className="bubble outgoing short">yes!</p>
            <p className="bubble incoming">there's grilled cheese sandwich</p>
            <p className="bubble incoming short">yay :D</p>
            <p className="bubble outgoing short">see you there!</p>
            <span className="read-receipt">Read 5:44 PM</span>
          </div>
          <div className="message-input">
            <button>＋</button>
            <span>iMessage</span>
            <button>↑</button>
          </div>
        </AppWindow>
      )}

      {openWindows.includes("notes") && (
        <AppWindow
          id="notes"
          title="Read me — for Tithi"
          position={positions.notes}
          zIndex={zIndexFor("notes")}
          className="notes-window"
          onClose={() => closeWindow("notes")}
          onFocus={() => focusWindow("notes")}
          onMove={(p) => setPositions((s) => ({ ...s, notes: p }))}
        >
          <div className="note-paper">
            <span className="pushpin" />
            <div className="note-content">
            <h2>Dear Tithi,</h2>
            <p>
              You happen to be one of the calmest, kindest, and most beautiful souls any of us have
              ever had the pleasure of knowing. There’s something so special about the way you carry
              yourself, with so much grace, warmth, and maturity, while still being the cutest
              person in the room.
            </p>
            <p>
              You have this beautiful way of making people feel loved. Whether someone needs a hug,
              a shoulder to lean on, someone to laugh with, or simply a little comfort on a
              difficult day, you're always there with open arms and an even bigger heart.
            </p>
            <p>
              There have been so many little moments when you've made us feel special, sometimes
              without even realizing it. And we hope you know that those moments never go unnoticed.
              It's in the little things you do, the way you listen, the way you care, and the way
              you make everyone around you feel like they matter.
            </p>
            <p>
              We love you immensely, Tithi. Your love has always made us feel so safe, special, and
              cared for, and getting to love you back is one of our greatest pleasures.
            </p>
            <p>
              We hope life gives you back every bit of the kindness, warmth, and love that you so
              effortlessly give to everyone around you. And on the days when you need a little extra
              love yourself, we hope you always remember that you have all of us, ready to give you
              the biggest hugs and remind you just how precious you are.
            </p>
            <p>
              The world is a little softer, warmer, and more beautiful because you're in it. And our
              lives are certainly so much lovelier because you're in ours.
            </p>
            <span className="signed">With all our love. ❤️</span>
            </div>
          </div>
        </AppWindow>
      )}

      {openWindows.includes("help") && (
        <AppWindow
          id="help"
          title="Help — for Tithi"
          position={positions.help}
          zIndex={zIndexFor("help")}
          className="notes-window help-window"
          onClose={() => closeWindow("help")}
          onFocus={() => focusWindow("help")}
          onMove={(p) => setPositions((s) => ({ ...s, help: p }))}
        >
          <div className="note-paper">
            <span className="pushpin" />
            <div className="note-content">
              <p>
                Do not fear when your friends are (always) here. We're genuinely always 1 call away, Tithi &lt;3
              </p>
            </div>
          </div>
        </AppWindow>
      )}

      {openWindows.includes("folder") && (
        <AppWindow
          id="folder"
          title="good days"
          position={positions.folder}
          zIndex={zIndexFor("folder")}
          className="folder-window"
          onClose={() => closeWindow("folder")}
          onFocus={() => focusWindow("folder")}
          onMove={(p) => setPositions((s) => ({ ...s, folder: p }))}
        >
          <div className="folder-toolbar">
            <button>‹</button>
            <button>›</button>
            <strong>good days</strong>
            <span>{albumPhotos.length + uploadedPhotos.length} items</span>
            <label className="upload-button">
              <input type="file" accept="image/*" multiple onChange={addPhotos} />＋ Add your photos
            </label>
          </div>
          <div className="folder-grid">
            {[...albumPhotos, ...uploadedPhotos].map((photo, index) => (
              <button key={photo} onClick={() => setLightbox(photo)}>
                <img src={photo} alt={`Good days memory ${index + 1}`} />
                <span>IMG_{String(index + 32).padStart(4, "0")}.JPG</span>
              </button>
            ))}
          </div>
        </AppWindow>
      )}

      <nav className="dock" aria-label="Scrapbook apps">
        {(
          [
            ["gallery", "photo"],
            ["messages", "message"],
            ["memories", "folder"],
            ["music", "music"],
            ["notes", "note"],
          ] as [WindowId, "photo" | "message" | "folder" | "music" | "note"][]
        ).map(([id, icon]) => (
          <button
            key={id}
            className={openWindows.includes(id) ? "is-open" : ""}
            onClick={() => openWindow(id)}
            aria-label={`Open ${windowNames[id]}`}
          >
            <Icon name={icon} />
            <span>{windowNames[id]}</span>
          </button>
        ))}
        <i />
        <button onClick={() => openWindow("folder")} aria-label="Open folder">
          <Icon name="folder" />
          <span>good days</span>
        </button>
      </nav>

      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged photograph"
          onClick={() => setLightbox(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Close photograph"
          >
            ×
          </button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={lightbox} alt="Enlarged scrapbook memory" />
            <figcaption>one for the memory box · click outside to close</figcaption>
          </figure>
        </div>
      )}
    </main>
  );
}
