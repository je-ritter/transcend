let Game = {
  display: null,
  map: {},
  engine: null,
  player: null,
  enemy: null,
  treasure: null,
  
  init: function() {
      this.display = new ROT.Display({spacing: 1.1});
      document.body.appendChild(this.display.getContainer());
      
      this._generateMap();
      
      let scheduler = new ROT.Scheduler.Simple();
      scheduler.add(this.player, true);
      scheduler.add(this.enemy, true);

      this.engine = new ROT.Engine(scheduler);
      this.engine.start();
  },
  
  _generateMap: function() {
      let digger = new ROT.Map.Digger();
      let freeCells = [];
      
      let digCallback = function(x, y, value) {
          if (value) { return; }
          
          let key = x+","+y;
          this.map[key] = ".";
          freeCells.push(key);
      }
      digger.create(digCallback.bind(this));
      
      this._generateBoxes(freeCells);
      this._drawWholeMap();
      
      this.player = this._createBeing(Player, freeCells);
      this.enemy = this._createBeing(Enemy, freeCells);
  },
  
  _createBeing: function(what, freeCells) {
      let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      let key = freeCells.splice(index, 1)[0];
      let parts = key.split(",");
      let x = parseInt(parts[0]);
      let y = parseInt(parts[1]);
      return new what(x, y);
  },
  
  _generateBoxes: function(freeCells) {
      for (let i=0;i<10;i++) {
          let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
          let key = freeCells.splice(index, 1)[0];
          this.map[key] = "*";
          if (!i) { this.treasure = key; } /* first box contains an treasure */
      }
  },
  
  _drawWholeMap: function() {
      for (let key in this.map) {
          let parts = key.split(",");
          let x = parseInt(parts[0]);
          let y = parseInt(parts[1]);
          this.display.draw(x, y, this.map[key]);
      }
  }
};

let Player = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}
  
Player.prototype.getSpeed = function() { return 100; }
Player.prototype.getX = function() { return this._x; }
Player.prototype.getY = function() { return this._y; }

Player.prototype.act = function() {
  Game.engine.lock();
  window.addEventListener("keydown", this);
}
  
Player.prototype.handleEvent = function(e) {
  let code = e.keyCode;
  if (code == 13 || code == 32) {
      this._checkBox();
      return;
  }

  let keyMap = {};
  keyMap[38] = 0;
  keyMap[33] = 1;
  keyMap[39] = 2;
  keyMap[34] = 3;
  keyMap[40] = 4;
  keyMap[35] = 5;
  keyMap[37] = 6;
  keyMap[36] = 7;

  /* one of numpad directions? */
  if (!(code in keyMap)) { return; }

  /* is there a free space? */
  let dir = ROT.DIRS[8][keyMap[code]];
  let newX = this._x + dir[0];
  let newY = this._y + dir[1];
  let newKey = newX + "," + newY;
  if (!(newKey in Game.map)) { return; }

  Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
  this._x = newX;
  this._y = newY;
  this._draw();
  window.removeEventListener("keydown", this);
  Game.engine.unlock();
}

Player.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "@", "#ff0");
}
  
Player.prototype._checkBox = function() {
  let key = this._x + "," + this._y;
  if (Game.map[key] != "*") {
      alert("There is no box here!");
  } else if (key == Game.treasure) {
      alert("Hooray! You found an treasure and won this game.");
      Game.engine.lock();
      window.removeEventListener("keydown", this);
  } else {
      alert("This box is empty - find another one.");
  }
}
  
let Enemy = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}
  
Enemy.prototype.getSpeed = function() { return 100; }
  
Enemy.prototype.act = function() {
  let x = Game.player.getX();
  let y = Game.player.getY();

  let passableCallback = function(x, y) {
      return (x+","+y in Game.map);
  }
  let astar = new ROT.Path.AStar(x, y, passableCallback, {topology:4});

  let path = [];
  let pathCallback = function(x, y) {
      path.push([x, y]);
  }
  astar.compute(this._x, this._y, pathCallback);

  path.shift();
  if (path.length == 1) {
      Game.engine.lock();
      alert("Game over - you were captured!");
  } else {
      x = path[0][0];
      y = path[0][1];
      Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
      this._x = x;
      this._y = y;
      this._draw();
  }
}
  
Enemy.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "Q", "red");
}    


Game.init();

