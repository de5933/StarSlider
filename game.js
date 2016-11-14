var K = {
    'w': false,
    's': false,
    'a': false,
    'd': false,
	'z': false
};

$(function(){
    function setKey(key, pressed) {
        K[key] = pressed;
    }
    
    $(document.body).keyup(function(e){
        setKey(e.key, false);
    }).keydown(function(e){
		setKey(e.key, true);
    });
    
    function rnd(s) {
        return Math.random()*s;
    }
    
    function chance(threshold, range) {
        return rnd(range)<=threshold;
    }
    
    function rndChoose(arr) {
        var index = Math.floor(rnd(arr.length));
        return arr[index];
    }
    
    var exit = {
        bounce: function() {
            if (this.x<0 || this.x>W) {
                this.dx*=-1;
            }
            if (this.y<0 || this.y>H) {
                this.dy*=-1;
            }
        },
        
        wrap: function(){
            if (this.x<0) this.x=W;
            else if (this.x>W) this.x=0;
            if (this.y<0) this.y=H;
            else if (this.y>W) this.y=0;
        },
        
        stick: function(){
            if (this.x<0) {
                this.x=0;
                this.dx=0;
            }
            if (this.y<0) {
                this.y=0;
                this.dy=0;
            }
            if (this.x>W) {
                this.x=W;
                this.dx=0;
            }
            if (this.y>H) {
                this.y=H;
                this.dy=0;
            }
        }
    };
    
    class Point {
        constructor(x, y) {
            this.x = x||0;
            this.y = y||0;
        }
        
        static dist(v1, v2) {
            return Math.sqrt(Math.pow(v1.x-v2.x,2) + Math.pow(v1.y-v2.y,2));
        }
    }
    
    class Vector {
        constructor(dx, dy) {
            this.dx = dx||0;
            this.dy = dy||0;
        }
    }
    
    class Sprite extends Point {
        constructor(x, y) {
            super(x, y);
            this.dx = 0;
            this.dy = 0;
            this.dead = false;
        }
        
        step() { 
            if (this.dead) return;
            this.onStep(); 
            this.x += this.dx;
            this.y += this.dy;
            
            if (this.x>W || this.y>H || this.x<0 || this.y<0) {
                this.onExit();
            }
        }
        
        draw() {
            if (this.dead) return;
            this.onDraw();
        }
        
        onStep(){}
        onDraw(){}
        onExit(){}
        
    }
    
    class Npc extends Sprite {
        constructor(x,y,r) {
            super(x,y)
            this.r = r||5;
            this.onExit = exit.wrap;
            this.w = false;
            this.s = false;
            this.a = false;
            this.d = false;
        }
        onDraw() {
            ctx.fillStyle = '#0077ff';
            ctx.strokeStyle = '#0000ff';
            ctx.fillRect(this.x-this.r, this.y-this.r, 2*this.r, 2*this.r);
            ctx.strokeRect(this.x-this.r, this.y-this.r, 2*this.r, 2*this.r);
            
            ctx.fillStyle = '#ff7700';
            
            // Bottom
            if (this.w) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y+this.r+5);
                ctx.lineTo(this.x+3, this.y+this.r+5);
                ctx.lineTo(this.x, this.y+this.r+5+10);
                ctx.fill();
            }
            
            // Top
            if (this.s) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y-this.r-5);
                ctx.lineTo(this.x+3, this.y-this.r-5);
                ctx.lineTo(this.x, this.y-this.r-5-10);
                ctx.fill();
            }
            
            // Left
            if (this.a) {
                ctx.beginPath();
                ctx.moveTo(this.x+this.r+5, this.y-3);
                ctx.lineTo(this.x+this.r+5, this.y+3);
                ctx.lineTo(this.x+this.r+5+10, this.y);
                ctx.fill();
            }
            
            // Right
            if (this.d) {
                ctx.beginPath();
                ctx.moveTo(this.x-this.r-5, this.y-3);
                ctx.lineTo(this.x-this.r-5, this.y+3);
                ctx.lineTo(this.x-this.r-5-10, this.y);
                ctx.fill();
            }
        }
        onStep() {
            var force = 0.5;
            var vmax = 5;
            
            this.w = false;
            this.s = false;
            this.a = false;
            this.d = false;
            
            if (chance(1,50)) {
                var direction = rndChoose(['w','s','a','d']);
                if (direction==='w') {
                    this.dy -= force;
                    this.w = true;
                }
                else if (direction==='s') {
                    this.dy += force;
                    this.s = true;
                }
                else if (direction==='a') {
                    this.dx-=force;
                    this.a = true;
                }
                else if (direction==='d') {
                    this.dx+=force;
                    this.d = true;
                }
            }
            else if (chance(1,50)) {
                if (this.dx/force > vmax) {
                    this.dx -= force;
                }
                else if (this.dx/force < (-1*vmax)) {
                    this.dx += force;
                }
                
                if (this.dy/force > vmax) {
                    this.dy -= force;
                }
                else if (this.dy/force < (-1*vmax)) {
                    this.dy += force;
                }
            }
            
            if (Point.dist(this,pc) < 10 && (pc.hp < pc._hpmax)) {
                var sw = new Shockwave(pc.x, pc.y, 'in', '#0077ff');
                sw.dx = pc.dx;
                sw.dy = pc.dy;
                objects.push(sw);
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
                pc.hp = Math.min(pc.hp+1, pc._hpmax);
            }
        }
    }
    
    class NpcFollow extends Npc {
      constructor(x,y,r) {
         super(x,y,r);
         this.onExit = exit.bounce;
      }
      
      onStep() {
         var vmax = 1;
         this.dx += (pc.x - this.x)/100;
         this.dy += (pc.y - this.y)/100;
         
         this.dx = Math.min(this.dx, vmax);
         this.dy = Math.min(this.dy, vmax);
         
         this.dx = Math.max(this.dx, -vmax);
         this.dy = Math.max(this.dy, -vmax);
      } 
    }
    
    class Coin extends Sprite {
        constructor(x, y) {
            super(x, y);
            this.dx = rnd(5)-1.5;
            this.dy = rnd(5)-1.5;
            this.onExit = exit.bounce;
        }
        
        onDraw(){
            ctx.fillStyle = this.dead?'#ffffff':'#00ff00';
            var r = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, 2*Math.PI);
            ctx.fill();
        }
        
        onStep(){
            if (Point.dist(this,pc) < 10) {
                objects.push(new Shockwave(this.x, this.y, 'in', '#00ff00'));
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
                score++;
            }
        }
    }
    
    class Bomb extends Sprite {
        constructor(x, y) {
            super(x, y);
            this.dx = rnd(5)-1.5;
            this.dy = rnd(5)-1.5;
            this.dead = false;
            this.onExit = exit.wrap;
        }
        
        onDraw(){
            if (this.dead) return;
            ctx.fillStyle = '#ff0000';
            var r = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x + r, this.y);
            ctx.fill();
        }
        
        onStep(){
            if (this.dead) return;
            
            if (Point.dist(this,pc) < 10) {
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
                pc.hp--;
                var ex = new Explosion(this.x, this.y, 10);
                ex.dx = pc.dx;
                ex.dy = pc.dy;
                objects.push(ex);
            }
            if (score >= coinCount) {
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
            }
        }
    }
    
    class Explosion extends Sprite {
        constructor(x, y, size) {
            super(x, y);
            this.size = size;
            this.frame = 0;
            this.lifetime = size;
        }
        
        onDraw(){
            if (this.frame>this.lifetime) return;
            ctx.fillStyle = 'rgba(255,100,0,' + (1 - this.frame/this.lifetime) + ')';
            //ctx.fillStyle = '#ffff0077';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2*this.lifetime*Math.log(this.frame), 0, 2*Math.PI);
            ctx.fill();
        }
        
        onStep(){
            this.frame++;
        }
    }
    
    class Shockwave extends Sprite {
        constructor(x, y, direction, color) {
            super(x, y);
            this.frame = 0;
            this.lifetime = 50;
            this.direction = direction || 'out';
            this.color = color || 'white';
            
            if (this.direction==='out')
                this.r = 0;
            else if (this.direction==='in')
                this.r = this.lifetime;
        }
        
        onDraw(){
            if (this.frame > this.lifetime) {
                this.dead = true;
                return;
            }
            
            ctx.strokeStyle = this.color;
            
            if (this.direction==='out') 
                this.r = 4*this.frame;
            else if (this.direction==='in') 
                this.r = 50 - 4*this.frame;
            
            if (this.r < 0) {
                this.dead = true;
                return;
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
            ctx.stroke();
        }
        
        onStep(){
            this.frame++;
        }
    }
    
    function initPage() {
        window.W = window.innerWidth - 100;
        window.H = window.innerHeight - 100;
        window.canvas = document.getElementById('game-canvas')
        canvas.width = W;
        canvas.height = H;
        window.ctx = canvas.getContext('2d');
        initGame(0);
    }
    
    window.levels = [
        {hp: 5, coins:  5, bombs:  0, npcs: 0},
        {hp: 5, coins:  5, bombs:  3, npcs: 1},
        {hp: 5, coins: 10, bombs: 10, npcs: 2},
        {hp: 3, coins: 10, bombs: 10, npcs: 3},
        {hp: 3, coins: 10, bombs: 20, npcs: 6},
        {hp: 3, coins: 15, bombs: 30, npcs: 10},
        {hp: 3, coins: 15, bombs: 40, npcs: 13},
        {hp: 3, coins: 20, bombs: 50, npcs: 16},
        {hp: 3, coins: 25, bombs: 60, npcs: 20},
        {hp: 3, coins: 30, bombs: 70, npcs: 23},
        {hp: 3, coins: 35, bombs: 80, npcs: 26}
    ];
    window.currentLevel = 0;
    
    function nextLevel() {
        currentLevel++;
        if (currentLevel >= levels.length) {
            currentLevel = 0;
        }
    }
    
    function initGame() {
        level = levels[currentLevel];
        
        window.FPS = 45;
        window.score = 0;
        window.objects = [];
        window.map = [];
        window.pc = {};
        window.coinCount = level.coins;
        
        initPlayerCharacter();
        pc.setHP(level.hp);
        var ui = initHUD();
        var coins = initCoins(coinCount);
        var bombs = initBombs(level.bombs);
        var maps = initMap();
        var npcs = initNpcs(level.npcs);
        
        objects = objects.concat(maps);
        objects = objects.concat(coins);
        objects = objects.concat(bombs);
        objects = objects.concat(npcs);
        objects.push(pc);
        objects = objects.concat(ui);
    }
    
    function initMap() {
        var spritelist = [];
        var tileImage = document.createElement('img');
        tileImage.src='stars-16x16.png';
        var r = 16;
        var tileW = 16;
        var tileH = 16;
        
        for (var j = 0; j < H/r; j++) {
            for (var i = 0; i < W/r; i++) {
                var tile = new Sprite();
                tile.x = i;
                tile.y = j;
                tile.sx = r*rnd(tileW);
                tile.sy = r*rnd(tileH);
               
                tile.onDraw = function(){
                    ctx.drawImage(tileImage, 
                    this.sx, this.sy, 
                    r,r,
                    this.x*r,this.y*r,
                    r,r);
                };
                spritelist.push(tile);
            }
        }
        
        return spritelist;
    }
    
    function initCoins(count) {
        var spritelist = [];
        for (var i = 0; i < count; i++) {
            spritelist.push(new Coin(rnd(W),rnd(H)));
        }
        return spritelist;
    }
    
    function initBombs(count) {
        var spritelist = [];
        for (var i = 0; i < count; i++) {
            spritelist.push(new Bomb(rnd(W),rnd(H)));
        }
        return spritelist;
    }
    
    function initNpcs(count) {
        var spritelist = [];
        for (var i = 0; i < count; i++) {
            spritelist.push(new Npc(rnd(W),rnd(H),2+rnd(5)));
        }
        return spritelist;
    }
    
    function initPlayerCharacter() {
        pc = new Sprite(W/2,H/2);

        pc.onDraw = function(){
            if (this.hp<=0) return;
            var r = 10;
            this.color = {
                r: Math.floor(200+5.5*(this._hpmax-this.hp)),
                g: Math.floor(200*this.hp/this._hpmax),
                b: Math.floor(200*this.hp/this._hpmax)
            };
            ctx.fillStyle = 'rgb('+this.color.r+','+this.color.g+','+this.color.b+')';
            ctx.strokeStyle = '#777777';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x + r, this.y);
            ctx.lineTo(this.x, this.y - r);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ff7700';
           
			
            // Bottom
            if (K['w']) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y+r+5);
                ctx.lineTo(this.x+3, this.y+r+5);
                ctx.lineTo(this.x, this.y+r+5+10);
                ctx.fill();
            }
            
            // Top
            if (K['s']) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y-r-5);
                ctx.lineTo(this.x+3, this.y-r-5);
                ctx.lineTo(this.x, this.y-r-5-10);
                ctx.fill();
            }
            
            // Left
            if (K['a']) {
                ctx.beginPath();
                ctx.moveTo(this.x+r+5, this.y-3);
                ctx.lineTo(this.x+r+5, this.y+3);
                ctx.lineTo(this.x+r+5+10, this.y);
                ctx.fill();
            }
            
            // Right
            if (K['d']) {
                ctx.beginPath();
                ctx.moveTo(this.x-r-5, this.y-3);
                ctx.lineTo(this.x-r-5, this.y+3);
                ctx.lineTo(this.x-r-5-10, this.y);
                ctx.fill();
            }
        };
        pc.onStep = function(){
            if (this.hp<=0) {
                this.x=-W;
                this.y=-H;
                this.dx=0;
                this.dy=0;
            }
            if(K['z'] && pc.warpCoolDown===0){
				this.x = rnd(W);
				this.y = rnd(H);
				pc.warpCoolDown = 100;
				var ex = new Shockwave(this.x, this.y, 'out', '#ff00ff');
                ex.dx = pc.dx;
                ex.dy = pc.dy;
                objects.push(ex);
			}
			if(pc.warpCoolDown > 0){
				pc.warpCoolDown--;
			}
            var force = 0.05;
            if (K['d']) {
                this.dx+= force;
                pc.fuelUsed++;
            }
            if (K['a']) {
                this.dx-= force;
                pc.fuelUsed++;
            }
            if (K['w']) {
                this.dy-= force;
                pc.fuelUsed++;
            }
            if (K['s']) {
                this.dy+= force;
                pc.fuelUsed++;
            }
            
            if (K['x']) {
                this.dx = 0;
                this.dy = 0;
            }
        };
        pc.onExit = exit.bounce;
        
        pc._hpmax = 3;
        pc.hp = pc._hpmax;
        
        pc.setHP = function(hp) {
            pc.hp = hp;
            pc._hpmax = Math.max(pc._hpmax, hp);
        }
        
        pc.fuelUsed = 0;
        pc.warpCoolDown = 0;
        objects.push(pc);
    }
    
    function initHUD() {
        var spritelist = [];
        
        var scoreboard = new Sprite(10, 20);
        scoreboard.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "20px monospace";
            ctx.fillText('Score: ' + score,this.x,this.y);
        };
        spritelist.push(scoreboard);
     
        var healthdisplay = new Sprite(150, 20);
        healthdisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "20px monospace";
            ctx.fillText('HP:', this.x, this.y);
            
            ctx.strokeStyle = '#ffffff';
            
            for (var i = 0; i < pc._hpmax; i++) {
                if (i < pc.hp) {
                    ctx.fillRect(40 + this.x+i*10, this.y-16, 5, 20);
                }
                else {
                    ctx.strokeRect(40 + this.x+i*10, this.y-16, 5, 20);
                }
            }
        };
        spritelist.push(healthdisplay);
        
        var fuelDisplay = new Sprite(10, 50);
        fuelDisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "15px monospace";
            ctx.fillText('Fuel Usage: ' + pc.fuelUsed, this.x, this.y);
        };  
        spritelist.push(fuelDisplay);
        
        var levelDisplay = new Sprite(10, 70);
        levelDisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "15px monospace";
            ctx.fillText('Level ' + currentLevel, this.x, this.y);
        };
        spritelist.push(levelDisplay);
        
        var title = new Sprite(W/2, H/2);
        title.onDraw = function(){
            if (pc.hp<=0) {
                ctx.strokeStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = "50px monospace";
                ctx.strokeText('GAME OVER', this.x, this.y);
            }
            else if (score >= coinCount) {
                ctx.strokeStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = "50px monospace";
                ctx.strokeText('YOU WIN!', this.x, this.y);
            }
        };
        spritelist.push(title);
        
        return spritelist;
    }

    function gameLoop() {
        ctx.clearRect(0,0, W, H);
        //ctx.fillStyle = '#00000011';
        //ctx.fillRect(0, 0, W, H);
        
        var nextLoopObjects = [];
        
        for (var i in objects) {
            objects[i].step();
        }
        
        for (var i in objects) {
            objects[i].draw();
        }
        
        objects = objects.filter(function(sprite){return !sprite.dead;});
    }
    
    function startGame() {
        window.gameLoopTimer = setInterval(gameLoop, Math.floor(1000/FPS) );
    }
    
    function stopGame() {
        gameLoopTimer = clearInterval(gameLoopTimer);
    }
    
    function pause() {
       if (gameLoopTimer)
          stopGame();
      else
          startGame();
    }
    
    function restartGame() {
       stopGame();
       currentLevel = 0;
       initGame();
       startGame();
    }
    
    function restartLevel() {
        stopGame();
        initGame();
        startGame();
    }
    
    function startNextLevel() {
        stopGame();
        nextLevel();
        initGame();
        startGame();
    }
    
    initPage();
    startGame();
    
    var vm = {
          addFn: function(fn) {
             if (fn.name)
                vm[fn.name] = fn;
          }
    };
    vm.addFn(pause);
    vm.addFn(startGame);
    vm.addFn(stopGame);
    vm.addFn(restartLevel);
    vm.addFn(startNextLevel);
    
    ko.applyBindings(vm);
});