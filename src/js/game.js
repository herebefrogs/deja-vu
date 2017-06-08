import rand from './util';
import { gamepad, gamepadConnected, gamepadDisconnected, gamepadPollData } from './gamepad';

document.title = "CGA Jam";

// global variables
const HEIGHT = 300;
const WIDTH = 400;
const SPRITE_SIZE = 16;
const CHARSET_SIZE = 8; // width & height in pixel of each letter in charset image
const atlas = {
  block: { sprites: { initial: { x: 48, y: 16 } } },
  chest: {
    sprites: {
      initial: { x: 80, y: 0 },
      altered: { x: 96, y: 0 }
    }
  },
  crate: {
    sprites: {
      initial: { x: 48, y: 0 },
      altered: { x: 64, y: 0 }
    }
  },
  door_east: { sprites: { initial: { x: 32, y: 16 } } },
  door_north: { sprites: { initial: { x: 0, y: 16 } } },
  door_south: { sprites: { initial: { x: 16, y: 16 } } },
  hammer: { sprites: { initial : { x: 32, y: 0 } } },
  hero: {
    speed: 30,
    sprites: { initial: { x: 0, y: 0 } }
  },
  key: { sprites: { initial : { x: 16, y: 0 } } },
  tile: { sprites: { initial: { x: 64, y: 16 } } },
  wall_h: { sprites: { initial: { x: 80, y: 16 } } },
  wall_v: { sprites: { initial: { x: 96, y: 16 } } }
};
const level = [
  [ 'wall_h', 'wall_h', 'wall_h', 'door_north', 'wall_h', 'wall_h', 'wall_h' ],
  [ 'wall_v', 'tile', 'block', 'tile', 'tile', 'chest', 'wall_v' ],
  [ 'wall_v', 'tile', 'tile', 'tile', 'tile', 'tile', 'door_east' ],
  [ 'wall_v', 'tile', 'tile', 'tile', 'tile', 'crate', 'wall_v' ],
  [ 'wall_h', 'wall_h', 'wall_h', 'door_south', 'wall_h', 'wall_h', 'wall_h' ]
];
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789.:!-%';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const buffer = document.createElement('canvas');
const buffer_ctx = buffer.getContext('2d');
const bg = document.createElement('canvas');
const bg_ctx = bg.getContext('2d');
let charset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUgAAAAICAYAAACbO2brAAAB5klEQVR42uVa2YrDMAw07Fvf9v8/tqWwhTZY18zI9tJAWlLHiqJjPHI1fm8/d/Qcf4c3js6t6JAdUz0T1eeqR1WX2RxLTsY3nh7s/BPP7DspZGbsw+iS0bUSi6gt0Pcf4oOR7+bX88M6Xjd1jL87cNXzo2vF8yP5M4DMzp9dWzaM7HsNCPX8Dv/svq7YSGXfyng2NqJ7Mr5Vvb8SIBHZr3mWPUc1gLsB5P33bwRIhf3+6/gOgNs1v0IQojzxYgPJrysDVfqPAUmPHXoAmWHY5kLR4WDPAYoEt+RbhsisgDM5MwMrAJQByJMZWHeCIfMzMVqNj4h9VfMnC4CI/hkZWYC24r9iX5bpWfMigIwYrJmnqxlEJ4NEACwCSFS+l0AewF+/T2VAEYBUFjJFfFl2VJSAlg8rDBBlcSiAov7PgoiVH0j8ZBgiM474F2IwihK1k0Eie3irtxgY+yifn9njUpSI0QrP7nGx9mf1W72FU8kDRfwp7OPlsYIhsiW2t+iPXQ5mAvyEAGZLLBQgmT9pvH/Su/bY0BKoAyAt+50M4Ih9WYas8F9Fv26ArJbuHxUI0+aws82nugnLtHFU2xtWtqlU2zSybRJM6wjS5sG0kTD+725z6Y6FqI1I1YbTPd5ZYmfbg2ZyHuewlwnHUW0vAAAAAElFTkSuQmCC';
let currentTime;
let entryDoor;
let entities;
let hero;
let lastTime;
let requestId;
let resetDoor;
let running;
let tileset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAAAgCAYAAADKbvy8AAACZElEQVR42u2aCY7DIAxFe0nuf5Q/GqnTSY13TAJpI0VqQx1SP7ySx0M+wJzLHQ3AlSeMsdnjIjhOYjZEOA8KMKv93ylH5UcBaPM3x3ivw8PgmQAjenw+yxIARwGUA2SFMB8iIiv3APBpkemzQn6Wi/S47w4eOwPeiMPrAjMAEQTYyOLiPIj0mf5nDhDViSaftbDs4qEWyIMjGpUAwlB0FGArAhgBYFrbFgDxH5wPlqQCBPqHtdZCZ/4FMZACpMrjgEUAWvJXAzQTQcv6aGzyQugCsJ08PCIu9Dh2d4AiRCv2VQCkMD2/5QBK8LwAG3wxMbDm1LPUAqUbNvjiH41hXPyZCdBymxbASFJTBXAQfu/BXg9KvqsQm5HuMyBnWaBmkRYwTl4DqEGmyY+UGGXlqV46WCBmbpYRSqzifjMToKek0ADSz5EYKF2jC0SKkRF5tvcpATyzJ+oFiIHepVWIe+QlZUuxzgvQK98lL86uxTIAV2ylaXWkB2BEXm1kC27ktMPjalfuhVqnVWZ45LfeSvoDOJKGV8hfmoVa3RLonTV8unzVpmKDwyK5LH+oG94Gu+mF8mnlF8z/flNrUv6ael/cHGAUYoO8qqPzR/6PBit7TQQIx9aO9sCj8hkLaBm39wU4HyC8LswLfTWAA3FxG4BYFGDZm1HJuLgUwEjmuAzAaNIipMG3cKHh9H8RgEPjX4A3BZitAzMurEp+Vxc6ywLTdaBHedoDjsp/YhLzLSNWSGKKOzFDAL0v2M6UTxXyjg7+R9SBW7bSAtswq3ViyuvA7ZrZib20W7TSrt6Q3F3+6iTmBwuUWXZpC1bSAAAAAElFTkSuQmCC';

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

function createEntity(type, x, y) {
  return {
    collide: type.indexOf('door') === -1,
    state: 'initial',
    type,
    x: x * SPRITE_SIZE,
    y: y * SPRITE_SIZE
  }
};

function createHero() {
  return {
    moveDown: 0,
    moveLeft: 0,
    moveRight: 0,
    moveUp: 0,
    items: {
      now: {
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

  // set back buffer and background canvas size
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  bg.width = WIDTH;
  bg.height = HEIGHT;
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
  entities = [];
  loadLevel(level);
  entities.push(hero);

  toggleLoop(true);
};

function loadLevel(level) {
  bg_ctx.fillStyle = "#000";
  bg_ctx.fillRect(0, 0, bg.width, bg.height);

  let x, y;
  for (y = 0; y < level.length; y++) {
    for (x = 0; x < level[y].length; x++) {
      let type = level[y][x];

      if (type !== 'tile') {
        const entity = createEntity(type, x, y);
        if (type === 'door_north') {
          entryDoor = entity;
        } else if (type == 'door_south') {
          resetDoor = entity;
        }
        entities.push(entity);
      }

      const sprite = atlas[type].sprites.initial;
      bg_ctx.drawImage(
        tileset,
        sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
        x * SPRITE_SIZE, y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE
      );
    }
  }

  // TODO make that ugly math nicer to look at
  renderText('items', 0, y * (SPRITE_SIZE + 1), bg_ctx);
  let sprite = atlas.key.sprites.initial;
  bg_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    6*CHARSET_SIZE, y*SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE
  );
  renderText(`x${hero.items.now.key}`, 6*CHARSET_SIZE + SPRITE_SIZE, y*(SPRITE_SIZE+1), bg_ctx);
  sprite = atlas.hammer.sprites.initial;
  bg_ctx.drawImage(
    tileset,
    sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE,
    6*CHARSET_SIZE + 2*SPRITE_SIZE, y*SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE
  );
  renderText(`x${hero.items.now.hammer}`, 6*CHARSET_SIZE + 3*SPRITE_SIZE, y*(SPRITE_SIZE+1), bg_ctx);
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
  buffer_ctx.drawImage(bg, 0, 0);

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

function renderText(text, x, y, ctx) {
  for (let i = 0; i < text.length; i++) {
    ctx.drawImage(
      charset,
      // TODO could memoize the characters index or hardcode a lookup table
      alphabet.indexOf(text[i])*CHARSET_SIZE, 0, CHARSET_SIZE, CHARSET_SIZE,
      x + i*(CHARSET_SIZE), y, CHARSET_SIZE, CHARSET_SIZE
    );
  }
};

function resize() {
  // implicit window.
  const scaleToFit = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  canvas.width = WIDTH * scaleToFit;
  canvas.height = HEIGHT * scaleToFit;

  // disable smoothing on scaling
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.mozImageSmoothingEnabled = ctx.mozImageSmoothingEnabled = false;
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.msImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;
  bg_ctx.mozImageSmoothingEnabled = buffer_ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
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

  setEntityPosition(hero, elapsedTime);

  // collision test between hero and all the entities previous positions
  for (let entity of entities) {
    if (entity === hero) continue;

    if (entity === entryDoor) {
      if (hero.y < entryDoor.y) {
        hero.y = entryDoor.y;
      }
      continue;
    }
    if (entity === resetDoor) {
      if (hero.y > resetDoor.y) {
        // history repeats!
        hero.y = entryDoor.y;
      }
      continue;
    }

    // AABB collision test
    if (hero.x < entity.x + SPRITE_SIZE &&
        hero.x + SPRITE_SIZE > entity.x &&
        hero.y < entity.y + SPRITE_SIZE &&
        hero.y + SPRITE_SIZE > entity.y) {
       // collision!
       // FIXME doesn't work for diagonal move :(
       if (hero.moveRight) {
         hero.x -= hero.x + SPRITE_SIZE - entity.x;
       }
       if (hero.moveLeft) {
         hero.x += entity.x + SPRITE_SIZE - hero.x;
       }
       if (hero.moveDown) {
         hero.y -= hero.y + SPRITE_SIZE - entity.y;
       }
       if (hero.moveUp) {
         hero.y += entity.y + SPRITE_SIZE - hero.y;
       }
    }
  }
};
