var K = {
    'w': false,
    's': false,
    'a': false,
    'd': false
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
    
    function exitBounce() {
        if (this.x<0 || this.x>W) {
            this.dx*=-1;
        }
        if (this.y<0 || this.y>H) {
            this.dy*=-1;
        }
    }
    
    function exitWrap() {
        if (this.x<0) this.x=W;
        else if (this.x>W) this.x=0;
        if (this.y<0) this.y=H;
        else if (this.y>W) this.y=0;
    }
    
    function exitStick() {
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
    
    function Sprite() {
        var self = this;
        self.x = 0;
        self.y = 0;
        self.dx = 0;
        self.dy = 0;

        self.step = function(){ 
            self.onStep(); 
            this.x += this.dx;
            this.y += this.dy;
            
            if (self.x>W || self.y>H || self.x<0 || self.y<0) {
                self.onExit();
            }
        };
        self.draw = function(){
            self.onDraw();
        };
        
        self.onStep = function(){};
        self.onDraw = function(){};
        self.onExit = function(){};
    }
    
    function initPage() {
        window.W = 700;
        window.H = 700;
        window.canvas = document.getElementById('game-canvas')
        canvas.width = H;
        canvas.height = H;
        window.ctx = canvas.getContext('2d');
        initGame();
    }
    
    function initGame() {
        window.FPS = 45;
        window.score = 0;
        window.objects = [];
        window.map = [];
        window.pc = {};
        window.coinCount = 10;
        
        initMap();
        initCoins(coinCount);
        initBombs(10);
        initPlayerCharacter();
        initHUD();
    }
    
    function initMap() {
        var tileImage = document.createElement('img');
        tileImage.src='stars.png';
        var r = 16;
        
        for (var j = 0; j < W/r; j++) {
            for (var i = 0; i < H/r; i++) {
                var tile = new Sprite();
                tile.x = i;
                tile.y = j;
                tile.sx = r*rnd(4);
                tile.sy = r*rnd(4);
               
                tile.onDraw = function(){
                    ctx.drawImage(tileImage, 
                    this.sx, this.sy, 
                    r,r,
                    this.x*r,this.y*r,
                    r,r);
                };
                map.push(tile);
            }
        }
    }
    
    function initCoins(count) {
        for (var i = 0; i < count; i++) {
            var coin = new Sprite();
            coin.x = rnd(W);
            coin.y = rnd(H);
            coin.dx = rnd(5)-1.5;
            coin.dy = rnd(5)-1.5;
            coin.dead = false;
            coin.onDraw = function(){
                ctx.fillStyle = this.dead?'#ffffff':'#00ff00';
                var r = 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - r);
                ctx.lineTo(this.x - r, this.y);
                ctx.lineTo(this.x, this.y + r);
                ctx.lineTo(this.x + r, this.y);
                ctx.fill();
            };
            coin.onStep = function(){
                if (this.dead) return;
                var dx = Math.abs(this.x-pc.x);
                var dy = Math.abs(this.y-pc.y);
                var d = Math.sqrt(dx*dx+dy*dy);
                if (d < 10) {
                    this.dead = true;
                    this.dx = 0;
                    this.dy = 0;
                    score++;
                }
            };
            coin.onExit = exitBounce;
            objects.push(coin);
        }
    }
    
    function initBombs(count) {
        for (var i = 0; i < count; i++) {
            var bomb = new Sprite();
            bomb.x = rnd(W);
            bomb.y = rnd(H);
            bomb.dx = rnd(5)-1.5;
            bomb.dy = rnd(5)-1.5;
            bomb.dead = false;
            bomb.onDraw = function(){
                if (this.dead) return;
                ctx.fillStyle = '#ff0000';
                var r = 3;
                ctx.fillRect(this.x-r, this.y+r, 2*r, 2*r);
            };
            bomb.onStep = function(){
                if (this.dead) return;
                var dx = Math.abs(this.x-pc.x);
                var dy = Math.abs(this.y-pc.y);
                if (dx<10 && dy<10) {
                    this.dead = true;
                    this.dx = 0;
                    this.dy = 0;
                    pc.hp--;
                }
                if (score >= coinCount) {
                    this.dead = true;
                    this.dx = 0;
                    this.dy = 0;
                }
            };
            bomb.onExit = exitWrap;
            objects.push(bomb);
        }
    }
    
    function initPlayerCharacter() {
        pc = new Sprite();

        pc.onDraw = function(){
            if (this.hp<=0) return;
            var r = 10;
            this.color = {
                r: Math.floor(200+5.5*(10-this.hp)),
                g: Math.floor(200*this.hp/10),
                b: Math.floor(200*this.hp/10)
            };
            ctx.fillStyle = 'rgb('+this.color.r+','+this.color.g+','+this.color.b+')';
            ctx.strokeStyle = '#777777';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x + r, this.y);
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
            
            var force = 0.1;
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
        pc.onExit = exitBounce;
        pc.x = W/2;
        pc.y = H/2;
        pc._hpmax = 10;
        pc.hp = pc._hpmax;
        
        pc.fuelUsed = 0;
        
        objects.push(pc);
    }
    
    function initHUD() {
        var scoreboard = new Sprite();
        scoreboard.x = 10;
        scoreboard.y = 20;
        scoreboard.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "20px monospace";
            ctx.fillText('Score: ' + score,this.x,this.y);
        };
        objects.push(scoreboard);
     
        var healthdisplay = new Sprite();
        healthdisplay.x = 150;
        healthdisplay.y = 20;
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
        objects.push(healthdisplay);
        
        var fuelDisplay = new Sprite();
        fuelDisplay.x = 10;
        fuelDisplay.y = 50;
        fuelDisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "15px monospace";
            ctx.fillText('Fuel Usage: ' + pc.fuelUsed, this.x, this.y);
        };  
        objects.push(fuelDisplay);
        
        var title = new Sprite();
        title.x = W/2;
        title.y = H/2;
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
        objects.push(title);
    }

    function startGame() {
        window.tt = setInterval(function(){
            ctx.clearRect(0,0, W, H);
            //ctx.fillStyle = '#00000022';
            //ctx.fillRect(0, 0, W, H);
            
            var allSprites = objects;//map.concat(objects);
            
            for (var i in allSprites) {
                allSprites[i].step();
                allSprites[i].draw();
            }
        }, Math.floor(1000/FPS) );
    }
    
    function stopGame() {
        clearInterval(window.tt);
    }
    
    $('#stop').click(function(){
        stopGame();
    });
    
    $('#restart').click(function(){
        stopGame();
        initGame();
        startGame();
    });
    
    initPage();
    startGame();
});