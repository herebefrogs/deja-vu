import rand from './util';
import { gamepad, gamepadConnected, gamepadDisconnected, gamepadPollData } from './gamepad';

document.title = "CGA Jam";

// global variables
const HEIGHT = 300;
const WIDTH = 400;
const SPRITE_SIZE = 16;
const CHARSET_SIZE = 8; // width & height in pixel of each letter in charset image
const atlas = {
  hero: {
    speed: 30,
    sprites: {
      initial: { x: 0, y: 0 }
    }
  }
};
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789.:!-%';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const buffer = document.createElement('canvas');
const buffer_ctx = buffer.getContext('2d');
let charset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUgAAAAICAYAAACbO2brAAAB5klEQVR42uVa2YrDMAw07Fvf9v8/tqWwhTZY18zI9tJAWlLHiqJjPHI1fm8/d/Qcf4c3js6t6JAdUz0T1eeqR1WX2RxLTsY3nh7s/BPP7DspZGbsw+iS0bUSi6gt0Pcf4oOR7+bX88M6Xjd1jL87cNXzo2vF8yP5M4DMzp9dWzaM7HsNCPX8Dv/svq7YSGXfyng2NqJ7Mr5Vvb8SIBHZr3mWPUc1gLsB5P33bwRIhf3+6/gOgNs1v0IQojzxYgPJrysDVfqPAUmPHXoAmWHY5kLR4WDPAYoEt+RbhsisgDM5MwMrAJQByJMZWHeCIfMzMVqNj4h9VfMnC4CI/hkZWYC24r9iX5bpWfMigIwYrJmnqxlEJ4NEACwCSFS+l0AewF+/T2VAEYBUFjJFfFl2VJSAlg8rDBBlcSiAov7PgoiVH0j8ZBgiM474F2IwihK1k0Eie3irtxgY+yifn9njUpSI0QrP7nGx9mf1W72FU8kDRfwp7OPlsYIhsiW2t+iPXQ5mAvyEAGZLLBQgmT9pvH/Su/bY0BKoAyAt+50M4Ih9WYas8F9Fv26ArJbuHxUI0+aws82nugnLtHFU2xtWtqlU2zSybRJM6wjS5sG0kTD+725z6Y6FqI1I1YbTPd5ZYmfbg2ZyHuewlwnHUW0vAAAAAElFTkSuQmCC';
let currentTime;
let entities;
let hero;
let lastTime;
let requestId;
let running;
let tileset = 'data:image/png;base64,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';

// implicit window.
addEventListener('load', init);

// global functions

// copy backbuffer onto visible canvas, scaling it to screen dimensions
function blit() {
  ctx.drawImage(
    buffer,
    0, 0, buffer.width, buffer.height,
    0, 0, canvas.width, canvas.height
  );
};

function changeVisibility(e) {
  // event target is document object
  if (e.target.hidden && gamepad) {
    // ¯\_(ツ)_/¯ Chrome also stop sending data for the cached gamepad after changing tab
    // so clear the cached gamepad
    gamepadDisconnected({ gamepad: { index: gamepad.index, connected: false }});
  }

  toggleLoop(!event.target.hidden);
};

function constrainEntityToViewport(entity) {
  if (entity.x <= 0) {
    entity.x = 0;
  } else if (entity.x + SPRITE_SIZE >= WIDTH) {
    entity.x = WIDTH - SPRITE_SIZE;
  }
  // skip one tile vertically for title and inventory
  if (entity.y <= SPRITE_SIZE) {
    entity.y = SPRITE_SIZE;
  } else if (entity.y >= HEIGHT - SPRITE_SIZE) {
    entity.y = HEIGHT - SPRITE_SIZE;
  }
};

function createHero() {
  return {
    moveDown: 0,
    moveLeft: 0,
    moveRight: 0,
    moveUp: 0,
    inventory: {
      current: {
        key: 1,
        hammer: 0
      },
      max: {
        key: 1,
        hammer: 0
      }
    },
    speed: atlas.hero.speed,
    state: 'initial',
    type: 'hero',
    x: SPRITE_SIZE,
    y: SPRITE_SIZE
  }
};

function init() {
  // implicit window.
  addEventListener('resize', resize);

  // set back buffer canvas size
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  // scale to fit visible canvas
  resize();

  // load assets
  loadTileset(tileset)
  .then(function(img) { tileset = img; })
  .then(function() { return loadTileset(charset); })
  .then(function(img) { charset = img; })
  // start game
  .then(loadGame);
};

function keyPressed(keyEvent) {
  // Left arrow / A / Q
  if (keyEvent.which === 37 || keyEvent.which === 65 ||keyEvent.which === 81) { hero.moveLeft = -1; }
  // Up arrow / W / Z
  if (keyEvent.which === 38 || keyEvent.which === 90 || keyEvent.which === 87) { hero.moveUp = -1; }
  // Right arrow / D
  if (keyEvent.which === 39 || keyEvent.which === 68) { hero.moveRight = 1; }
  // Down arrow / S
  if (keyEvent.which === 40 || keyEvent.which === 83) { hero.moveDown = 1; }

  // P
  if (keyEvent.which === 80) {
    toggleLoop(!running);
  }
};

function keyReleased(keyEvent) {
  // Left arrow / A / Q
  if (keyEvent.which === 37 || keyEvent.which === 65 || keyEvent.which === 81) { hero.moveLeft = 0; }
  // Up arrow / W / Z
  if (keyEvent.which === 38 || keyEvent.which === 90 || keyEvent.which === 87) { hero.moveUp = 0; }
  // Right arrow / D
  if (keyEvent.which === 39 || keyEvent.which === 68) { hero.moveRight = 0; }
  // Down arrow / S
  if (keyEvent.which === 40 || keyEvent.which === 83) { hero.moveDown = 0; }
};

function loadGame() {
  // implicit window.
  addEventListener('keydown', keyPressed);
  addEventListener('keyup', keyReleased);
  addEventListener('gamepadconnected', gamepadConnected);
  addEventListener('gamepaddisconnected', gamepadDisconnected);
  document.addEventListener('visibilitychange', changeVisibility);

  hero = createHero();
  entities = [ hero ];

  toggleLoop(true);
};

function loadTileset(tileset) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.addEventListener('load', function() {
      resolve(img);
    })
    img.src = tileset;
  });
};

function loop() {
  if (running) {
    requestId = requestAnimationFrame(loop);
    render();
    currentTime = Date.now();
    update((currentTime - lastTime) / 1000);
    lastTime = currentTime;
  }
};

function render() {
  // clear buffer
  buffer_ctx.fillStyle = "#000";
  buffer_ctx.fillRect(0, 0, buffer.width, buffer.height);

  // render active entities
  for (let entity of entities) {
    renderEntity(entity);
  }

  blit();
};

// render an entity onto the backbuffer at 1:1 scale
function renderEntity(entity) {
  const sprite = atlas[entity.type].sprites[entity.state];
  buffer_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    Math.round(entity.x), Math.round(entity.y), SPRITE_SIZE, SPRITE_SIZE
  );
};

function renderText(text, x, y) {
  for (let i = 0; i < text.length; i++) {
    buffer_ctx.drawImage(
      charset,
      // TODO could memoize the characters index or hardcode a lookup table
      alphabet.indexOf(text[i])*CHARSET_SIZE, 0, CHARSET_SIZE, CHARSET_SIZE,
      x + i*(CHARSET_SIZE + 1), y, CHARSET_SIZE, CHARSET_SIZE
    );
  }
};

function resize() {
  // implicit window.
  const scaleToFit = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  canvas.width = WIDTH * scaleToFit;
  canvas.height = HEIGHT * scaleToFit;

  // disable smoothing on scaling
  buffer_ctx.mozImageSmoothingEnabled = ctx.mozImageSmoothingEnabled = false;
  buffer_ctx.msImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;
  buffer_ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
};

function setEntityPosition(entity, elapsedTime) {
  const distance = entity.speed * elapsedTime;
  entity.x += distance * (entity.moveLeft + entity.moveRight);
  entity.y += distance * (entity.moveUp + entity.moveDown);
};

function toggleLoop(value) {
  running = value;
  if (running) {
    lastTime = Date.now();
    loop();
  } else {
    cancelAnimationFrame(requestId);
  }
};

function unloadGame() {
  // implicit window.
  removeEventListener('keydown', keyPressed);
  removeEventListener('keyup', keyReleased);
  removeEventListener('gamepadconnected', gamepadConnected);
  removeEventListener('gamepaddisconnected', gamepadDisconnected);
  document.removeEventListener('visibilitychange', changeVisibility);

  toggleLoop(false);
};

function update(elapsedTime) {
  // TODO extract that into a function
  const gamepadData = gamepadPollData();
  if (gamepadData) {
    // once connected, gamepad overrides keyboard inputs
    if (gamepadData.leftX <= 0) {
      // TODO maybe this would be simpler if moveLeft & moveRight
      // were merged into a single value [-1, 1]
      hero.moveLeft = gamepadData.leftX;
      hero.moveRight = 0;
    } else {
      hero.moveLeft = 0;
      hero.moveRight = gamepadData.leftX;
    }
    if (gamepadData.leftY <= 0) {
      hero.moveUp = gamepadData.leftY;
      hero.moveDown = 0;
    } else {
      hero.moveUp = 0;
      hero.moveDown = gamepadData.leftY;
    }
  }

  // collision test between ninja and all the veggies's previous positions
  for (let entity of entities) {
    if (entity === hero) continue;

    // AABB collision test
    // TODO use bounding box rather than sprite size
    if (hero.x < entity.x + SPRITE_SIZE &&
        hero.x + SPRITE_SIZE > entity.x &&
        hero.y < entity.y + SPRITE_SIZE &&
        hero.y + SPRITE_SIZE > entity.y) {
      // collision!
    }
  }

  setEntityPosition(hero, elapsedTime);
  constrainEntityToViewport(hero);
};
