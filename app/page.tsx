"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuAudio } from "../lib/menu-audio";
import GameShell from "./game-shell";
import HandheldControls from "./handheld-controls";
import styles from "./hub.module.css";

const gameCatalog = [
  {
    href: "/eggswiper",
    name: "Eggswiper",
    genre: "EGG-HUNTING PUZZLE",
    description: "Crack the eggs. Dodge the ducks. Trust your tiger.",
    instruction: "OPEN · FLAG · OUTSMART",
    className: styles.eggswiper,
  },
  {
    href: "/survival",
    name: "Survival",
    genre: "SURVIVAL ROGUELITE",
    description: "Small paws. Big trouble. Take on the flock.",
    instruction: "DODGE · UPGRADE · SURVIVE",
    className: styles.survival,
  },
  {
    href: "/flappy",
    name: "Flight",
    genre: "ONE-TAP ARCADE",
    description: "Find your wings. Try not to find a tree.",
    instruction: "TAP · FLY · TRY AGAIN",
    className: styles.flight,
  },
  {
    href: "/runner",
    name: "Dash",
    genre: "ENDLESS RUNNER",
    description: "Small paws. No brakes. Chase the horizon.",
    instruction: "JUMP · DUCK · KEEP RUNNING",
    className: styles.dash,
  },
];

function PixelTiger({
  x,
  y,
  flying = false,
}: {
  x: number;
  y: number;
  flying?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {flying && (
        <path
          d="M-8 19h-12v-7h-8v-7h18v7H0v15h-8Zm40 0h12v-7h8v-7H34v7H24v15h8Z"
          fill="#fff2ce"
        />
      )}
      <path
        d="M3 30h26v14H3zM-2 41h12v6H-2zm24 0h12v6H22zM29 29h12v-9h6v15H29z"
        fill="#ed983e"
      />
      <path d="M-5 0H5v8h20V0h10v9h5v24h-5v6H-5v-6h-5V9h5Z" fill="#ffb64d" />
      <path
        d="M-5 0H5v6H-5zm30 0h10v6H25zM11 7h7v11h-7zM-10 14H0v5h-10zm0 11H0v5h-10zm40-11h10v5H30zm0 11h10v5H30zM3 34h5v7H3zm18 0h5v7h-5z"
        fill="#493331"
      />
      <path d="M0 25h30v9H0zM5 21h20v13H5z" fill="#fff0c9" />
      <path d="M1 17h5v6H1zm23 0h5v6h-5zm-12 8h6v5h-6z" fill="#342e35" />
      <path d="M1 16h2v2H1zm23 0h2v2h-2z" fill="#fff" />
    </g>
  );
}

function PixelDuck({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 12h20V0h12v5h5v20h-5v5H0v-5h-5V12Z" fill="#fff1c3" />
      <path d="M32 9h12v6H32zM2 30h9v4H2zm17 0h9v4h-9z" fill="#e5a13e" />
      <path d="M26 5h4v4h-4z" fill="#263938" />
      <path d="M0 17h15v6H0z" fill="#ddcf9c" />
    </g>
  );
}

function GameArtwork({ flight, dash, eggs, background = false }: {
  flight: boolean;
  dash: boolean;
  eggs: boolean;
  background?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 320 190"
      preserveAspectRatio={background ? "xMidYMid slice" : "xMidYMid meet"}
      className={styles.artwork}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <rect width="320" height="190" fill={flight ? "#152f42" : "#26372e"} />
      <path
        d="M0 0h320v18H0zM0 18h20v20H0zm40 0h20v10H40zm52 0h30v16H92zm72 0h16v11h-16zm67 0h32v18h-32zm65 0h24v24h-24Z"
        fill={flight ? "#1a4550" : "#385342"}
      />
      {eggs ? (
        <>
          <path d="M0 0h320v190H0Z" fill="#5b754f" />
          <path d="M0 0h320v20H0zm0 20h28v25H0zm285 0h35v48h-35Z" fill="#3c5b42" />
          <path d="M0 145h320v45H0Z" fill="#799064" />
          <path d="M0 173h320v17H0Z" fill="#425f43" />
          <path d="M87 23h170v133H87Z" fill="#354e3b" />
          <path d="M91 27h162v125H91Z" fill="#a5b184" />
          {[0, 1, 2, 3, 4, 5].map((cell) => (
            <g key={cell} transform={`translate(${98 + (cell % 3) * 50} ${34 + Math.floor(cell / 3) * 57})`}>
              <path d="M0 0h43v50H0Z" fill={cell === 1 ? "#dce0b9" : "#bbc797"} />
              <path d="M0 0h43v3H0Z" fill="#e8edc3" />
              <path d="M0 47h43v3H0Z" fill="#819264" />
              {cell === 1 ? (
                <path d="M13 12h15v5h5v9h-5v5H18v5h15v5H12V29h5v-5h10v-7H13Z" fill="#467747" />
              ) : (
                <>
                  <path d="M17 9h9v5h5v8h4v14h-5v5H13v-5H8V22h4v-8h5Z" fill="#faf0ce" />
                  <path d="M30 22h5v14h-5v5H13v-5h13v-5h4Z" fill="#cecca4" />
                  <path d="M17 16h5v10h-5Z" fill="#fffaf0" />
                </>
              )}
            </g>
          ))}
          <path d="M24 159h59v8H24zm227 7h54v7h-54Z" fill="#344e3b" />
          <PixelTiger x={41} y={110} />
          <PixelDuck x={263} y={127} />
          <path d="M30 60h5v-6h4v6h6v4H30zm235 22h5v-7h4v7h7v4h-16zM9 176h12v3H9zm274 7h18v3h-18Z" fill="#b2c28d" />
          <path d="M62 81h4v5h5v4h-5v5h-4v-5h-5v-4h5Z" fill="#f4d388" />
        </>
      ) : dash ? (
        <>
          <path d="M0 0h320v190H0z" fill="#ebd2a0" />
          <circle cx="259" cy="48" r="25" fill="#fff0c9" />
          <path d="M0 146 64 67l61 72 58-49 83 58 54-38v80H0Z" fill="#b4bc92" />
          <path d="M0 151 77 127l61 28 63-29 119 36v28H0Z" fill="#8fa17a" />
          <path d="M0 168h320v22H0Z" fill="#4d6a4c" />
          <path d="M0 166h320v3H0z" fill="#d0dbaa" />
          <path
            d="M231 117h11v51h-11zm-14 13h7v15h11v7h-18zm25 12h10v-13h6v20h-16z"
            fill="#335c49"
          />
          <PixelTiger x={86} y={94} />
          <path
            d="M38 139h19v3H38zm-8 9h29v3H30zm16 9h13v3H46zM29 178h32v3H29zm144 5h21v3h-21z"
            fill="#e8d7a4"
          />
          <path d="M146 47h58v7h-58zm14-8h30v8h-30z" fill="#fff0c9" />
        </>
      ) : flight ? (
        <>
          <circle cx="258" cy="53" r="27" fill="#e5d5a1" />
          <path
            d="M0 123h23v-13h19v-12h18v27h25v-15h24v30h34v-19h26v-13h16v20h24v-16h30v17h28v-22h21v-17h15v32h17v68H0Z"
            fill="#205154"
          />
          <path
            d="M0 151h28v-11h24v16h25v-9h20v12h32v-13h17v-12h23v19h25v-10h25v12h27v-16h26v12h26v-9h22v48H0Z"
            fill="#2d6a63"
          />
          <path
            d="M70 0h23v48h12v12H59V48h11zm152 121h23v69h-23zm-11-12h45v12h-45z"
            fill="#739879"
          />
          <path
            d="M74 0h6v48h-6zm152 121h6v69h-6zM63 49h38v4H63zm152 61h37v4h-37z"
            fill="#b4c997"
          />
          <path
            d="M56 109h18v3H56zm-9 9h27v3H47zm13 9h14v3H60z"
            fill="#90baad"
          />
          <PixelTiger x={128} y={79} flying />
          <path
            d="M191 62h4v4h4v4h-4v4h-4v-4h-4v-4h4zm-98 83h3v3h3v3h-3v3h-3v-3h-3v-3h3z"
            fill="#d9edc3"
          />
        </>
      ) : (
        <>
          <path
            d="M0 135h33v-15h40v-18h53v-9h66v12h48v18h47v20h33v47H0Z"
            fill="#46573b"
          />
          <path
            d="M0 168h29v-24h35v-13h47v-12h82v15h44v16h38v20h45v20H0Z"
            fill="#5c6542"
          />
          <path
            d="M0 0h15v135H0zm304 0h16v139h-16zM0 35h43v10H0zm274 23h46v12h-46z"
            fill="#1b2927"
          />
          <path
            d="M0 0h69v15H53v17H15v18H0zm241 0h79v37h-23V24h-35V13h-21z"
            fill="#547146"
          />
          <path
            d="M15 160h7v-7h4v7h8v4H15zm63 12h5v-6h4v6h7v4H78zm166-7h6v-6h4v6h7v4h-17z"
            fill="#879360"
          />
          <ellipse cx="160" cy="144" rx="29" ry="7" fill="#2e3c2d" />
          <PixelTiger x={146} y={91} />
          <PixelDuck x={53} y={89} />
          <PixelDuck x={237} y={116} />
          <PixelDuck x={228} y={49} />
          <path
            d="M118 77h4v4h4v4h-4v4h-4v-4h-4v-4h4zm89 64h3v3h3v3h-3v3h-3v-3h-3v-3h3z"
            fill="#f2c76f"
          />
        </>
      )}
      <path
        d="M0 183h320v7H0z"
        fill={eggs ? "#354e3b" : dash ? "#3b543d" : flight ? "#102a32" : "#1b2c25"}
      />
    </svg>
  );
}

export default function Page() {
  const [selected, setSelected] = useState(0);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const recentGame = gameCatalog.find((game) => game.href === lastPlayed);
  const games = recentGame
    ? [recentGame, ...gameCatalog.filter((game) => game !== recentGame)]
    : gameCatalog;
  const selection = useRef(0);
  const audio = useRef<MenuAudio | null>(null);
  const direction = useRef(0);
  const pointerSelection = useRef(0);
  const rail = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      setLastPlayed(localStorage.getItem("arcade-last-played"));
    } catch {
      setLastPlayed(null);
    }
  }, []);

  useEffect(() => {
    const container = rail.current;
    const tile = tiles.current[selected];
    if (!container || !tile) return;
    const reveal = () => {
      container.scrollTo({
        left:
          container.scrollLeft + tile.getBoundingClientRect().left
          - container.getBoundingClientRect().left
          - (container.clientWidth - tile.offsetWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(container);
    return () => observer.disconnect();
  }, [selected, lastPlayed]);

  useEffect(() => () => {
    audio.current?.dispose();
    audio.current = null;
  }, []);

  function selectGame(index: number) {
    const next = Math.max(0, Math.min(games.length - 1, index));
    if (next === selection.current) return;
    selection.current = next;
    setSelected(next);
    audio.current ??= new MenuAudio();
    audio.current.play();
  }

  function select(offset: number) {
    selectGame(selection.current + offset);
  }

  function move(x: number, y: number) {
    const axis = Math.abs(x) >= Math.abs(y) ? x : y;
    const next = Math.abs(axis) < 0.4 ? 0 : Math.sign(axis);
    if (next !== 0 && next !== direction.current) select(next);
    direction.current = next;
  }

  function play() {
    router.push(games[selected].href);
  }

  return (
    <GameShell
      status="SELECT YOUR GAME"
      statusRight={
        <span aria-live="polite" aria-atomic="true">
          {String(selected + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")} ·{" "}
          {games[selected].name}
        </span>
      }
      hint="Pick a machine and make yourself at home."
      controls={
        <HandheldControls
          dpad
          menu
          phase="ready"
          dashCooldown={0}
          roarCooldown={0}
          onMove={move}
          onDash={play}
          onRoar={() => select(-1)}
          onStart={play}
          onPause={() => select(1)}
        />
      }
    >
      <section className={styles.homeScreen} aria-label="Choose a game">
        <div className={styles.backdrop} aria-hidden="true">
          {gameCatalog.map((game) => (
            <div
              key={game.href}
              className={styles.backdropLayer}
              data-active={game.href === games[selected].href}
            >
              <GameArtwork
                background
                flight={game.name === "Flight"}
                dash={game.name === "Dash"}
                eggs={game.name === "Eggswiper"}
              />
            </div>
          ))}
        </div>
        <div className={styles.selection}>
          <p>{games[selected].genre}</p>
          <h1>TwisWua {games[selected].name}</h1>
        </div>
        <div className={styles.carousel}>
          <button
            type="button"
            className={`${styles.browse} ${styles.previous}`}
            aria-label="Previous game"
            hidden={selected === 0}
            onClick={() => select(-1)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            className={styles.games}
            ref={rail}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight") next = Math.min(games.length - 1, selected + 1);
              else if (event.key === "ArrowLeft") {
                next = Math.max(0, selected - 1);
              } else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = games.length - 1;
              else return;
              event.preventDefault();
              tiles.current[next]?.focus({ preventScroll: true });
            }}
          >
            {games.map((game, index) => (
              <button
                key={game.href}
                ref={(element) => {
                  tiles.current[index] = element;
                }}
                type="button"
                className={`${styles.game} ${game.className}`}
                aria-label={`TwisWua ${game.name}`}
                aria-pressed={index === selected}
                onFocus={() => selectGame(index)}
                onPointerDown={() => {
                  pointerSelection.current = selected;
                }}
                onClick={(event) => {
                  if (event.detail === 0 || index === pointerSelection.current) {
                    router.push(game.href);
                  } else selectGame(index);
                }}
              >
                <span className={styles.coverTitle}>
                  <small>TWISWUA</small>
                  <strong>{game.name}</strong>
                </span>
                <GameArtwork
                  flight={game.name === "Flight"}
                  dash={game.name === "Dash"}
                  eggs={game.name === "Eggswiper"}
                />
                <span className={styles.coverCaption}>{game.instruction}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.browse} ${styles.next}`}
            aria-label="Next game"
            hidden={selected === games.length - 1}
            onClick={() => select(1)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className={styles.details}>
          <p>{games[selected].description}</p>
          <button type="button" onClick={play} className={styles.play}>
            <span aria-hidden="true">A</span> Start
          </button>
        </div>
      </section>
    </GameShell>
  );
}
