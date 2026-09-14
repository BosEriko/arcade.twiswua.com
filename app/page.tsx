import Link from "next/link";
import styles from "./hub.module.css";

const games = [
  {
    href: "/survival",
    name: "Survival",
    number: "01",
    genre: "SURVIVAL ROGUELITE",
    description: "Small paws. Big trouble. Take on the flock.",
    instruction: "DODGE · UPGRADE · SURVIVE",
    className: styles.survival,
  },
  {
    href: "/flappy",
    name: "Flight",
    number: "02",
    genre: "ONE-TAP ARCADE",
    description: "Find your wings. Try not to find a tree.",
    instruction: "TAP · FLY · TRY AGAIN",
    className: styles.flight,
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

function GameArtwork({ flight }: { flight: boolean }) {
  return (
    <svg
      viewBox="0 0 320 190"
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
      {flight ? (
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
      <path d="M0 183h320v7H0z" fill={flight ? "#102a32" : "#1b2c25"} />
    </svg>
  );
}

export default function Page() {
  return (
    <main className={styles.launcher}>
      <div className={styles.room} aria-hidden="true">
        <div className={styles.floor} />
      </div>
      <header className={styles.statusBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            🐯
          </span>
          <span>
            TWISWUA&apos;S<small>ARCADE ROOM</small>
          </span>
        </div>
        <span className={styles.openSign}>
          <i /> ALL PLAY. NO PAY.
        </span>
      </header>

      <section className={styles.homeScreen} aria-labelledby="arcade-heading">
        <div className={styles.heading}>
          <p>
            <span /> YOUR NEXT HIGH SCORE STARTS HERE <span />
          </p>
          <h1 id="arcade-heading">
            Small games.
            <br />
            <em>Big “one more try” energy.</em>
          </h1>
          <div>
            Leave the real world at the door. Pick a machine and make yourself
            at home.
          </div>
        </div>

        <div className={styles.selectionLabel}>
          <span>↓ SELECT YOUR GAME</span>
          <span>02 MACHINES · INFINITE CONTINUES</span>
        </div>
        <div className={styles.cabinets}>
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className={`${styles.cabinet} ${game.className}`}
              aria-label={`Play TwisWua ${game.name}`}
            >
              <div className={styles.marquee}>
                <span className={styles.screw} />
                <div>
                  <small>TWISWUA</small>
                  <h2>{game.name}</h2>
                </div>
                <span className={styles.screw} />
              </div>
              <div className={styles.screenHousing}>
                <div className={styles.screen}>
                  <GameArtwork flight={game.name === "Flight"} />
                  <div className={styles.screenOverlay} />
                  <span className={styles.screenPrompt}>PRESS PLAY</span>
                </div>
                <div className={styles.screenCaption}>
                  <span>
                    <i /> READY TO PLAY
                  </span>
                  <span>{game.number}</span>
                </div>
              </div>
              <div className={styles.controlDeck} aria-hidden="true">
                <span className={styles.joystick}>
                  <i />
                </span>
                <span className={styles.deckStripes} />
                <span className={styles.arcadeButton} />
                <span className={styles.arcadeButton} />
              </div>
              <div className={styles.cabinetBody}>
                <div className={styles.gameInfo}>
                  <span>{game.genre}</span>
                  <p>{game.description}</p>
                </div>
                <span className={styles.playButton}>
                  PLAY NOW <span aria-hidden="true">↗</span>
                </span>
                <div className={styles.machineFooter}>
                  <span>{game.instruction}</span>
                  <span className={styles.coinSlot} aria-hidden="true">
                    <i />
                  </span>
                </div>
              </div>
              <span className={styles.cabinetFoot} aria-hidden="true" />
            </Link>
          ))}
        </div>
        <p className={styles.playNote}>
          <span aria-hidden="true">✦</span> No coins. No downloads. Just one
          more round.
        </p>
      </section>
      <footer className={styles.footer}>
        <span>A LITTLE TIGER. A WHOLE LOT OF PLAY.</span>
        <span>
          DESKTOP & MOBILE <i /> ALWAYS OPEN
        </span>
      </footer>
    </main>
  );
}
