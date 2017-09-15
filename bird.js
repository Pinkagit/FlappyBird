var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");
var dead = document.createElement("audio");
dead.preload="auto";
dead.src = "sounds/dead.wav";
var pass = document.createElement("audio");
pass.preload="auto";
pass.src = "sounds/pass.wav";

function Bird(x, y, image) {
	this.x = x,
	this.y = y,
	this.width = image.width / 2,
	this.height = image.height,
	this.image = image;
	this.draw = function(context, state) {
		if (state === "up")
			context.drawImage(image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
		else{
			context.drawImage(image, this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
		}
	}
};

function Obstacle(x, y, h, image) {
	this.x = x,
	this.y = y,
	this.width = image.width / 2,
	this.height = h,
	this.draw = function(context, state) {
		if (state === "up") {
			context.drawImage(image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
		} else {
			context.drawImage(image, this.width, image.height - this.height, this.width, this.height, this.x, this.y, this.width, this.height);
		}
	}
};

function FlappyBird() {}
FlappyBird.prototype = {
	bird: null, // 小鸟
	bg: null, // 背景图
	obs: null, // 障碍物
	obsList: [],

	mapWidth: 500, // 画布宽度
	mapHeight: 500, // 画布高度
	startX: 90, // 起始位置  
	startY: 225,
	obsDistance: 100, // 上下障碍物距离  
	obsSpeed: 2, // 障碍物移动速度  
	obsInterval: 2500, // 制造障碍物间隔ms  
	upSpeed: 8, // 上升速度  
	downSpeed: 3, // 下降速度  
	line:75, // 地面高度
	score: 0, // 得分  
	touch: false, // 是否触摸
	gameOver: false,
	CreateMap: function() {
		//背景
		this.bg = new Image();
		this.bg.src = "img/1.png";
		var startBg = new Image();
		startBg.src = "img/1.png";
		// 由于Image异步加载, 在加载完成时在绘制图像
		startBg.onload = function(){
			c.drawImage(startBg, 0, 0);
		};

		//小鸟
		var image = new Image();
		image.src = "img/bird.png";		
		image.onload = function(){
			this.bird = new Bird(this.startX, this.startY, image);
			//this.bird.draw(c, "down");
		}.bind(this);

		//障碍物  
		this.obs = new Image();
		this.obs.src = "img/obs.png";
		this.obs.onload = function() {
			var h = 100; // 默认第一障碍物上管道高度为100
			var h2 = this.mapHeight - h - this.obsDistance;
			var obs1 = new Obstacle(this.mapWidth, 0, h, this.obs);
			var obs2 = new Obstacle(this.mapWidth, this.mapHeight - h2, h2 - this.line, this.obs);
			this.obsList.push(obs1);
			this.obsList.push(obs2);
		}.bind(this);
	},
	CreateObs: function() {
		// 随机产生障碍物上管道高度
		var h = Math.floor(Math.random() * (this.mapHeight - this.obsDistance - this.line));
		var h2 = this.mapHeight - h - this.obsDistance;
		var obs1 = new Obstacle(this.mapWidth, 0, h, this.obs);
		var obs2 = new Obstacle(this.mapWidth, this.mapHeight - h2, h2 - this.line, this.obs);
		this.obsList.push(obs1);
		this.obsList.push(obs2);

		// 移除越界障碍物  
		if (this.obsList[0].x < -this.obsList[0].width)
			this.obsList.splice(0, 2);
	},
	DrawObs: function() { //绘制障碍物 
		c.fillStyle = "#00ff00";
		for (var i = 0; i < this.obsList.length; i++) {
			this.obsList[i].x -= this.obsSpeed;
			if (i % 2)
				this.obsList[i].draw(c, "up");
			else
				this.obsList[i].draw(c, "down");
		}
	},
	CountScore: function() { // 计分
		if (this.score == 0 && this.obsList[0].x + this.obsList[0].width < this.startX) {
			pass.play();
			this.score = 1;
			return true;
		}
		return false;
	},
	ShowScore: function() { // 显示分数  
		c.strokeStyle = "#000";
		c.lineWidth = 1;
		c.fillStyle = "#000";
		c.fillText(this.score, 10, 50);
		c.strokeText(this.score, 10, 50);
	},
	CanMove: function() { // 碰撞检测
		if (this.bird.y < 0 || this.bird.y > this.mapHeight - this.bird.height - this.line) {
			dead.play();
			this.gameOver = true;
		} else {
			var boundary = [{
				x: this.bird.x,
				y: this.bird.y
			}, {
				x: this.bird.x + this.bird.width,
				y: this.bird.y
			}, {
				x: this.bird.x,
				y: this.bird.y + this.bird.height
			}, {
				x: this.bird.x + this.bird.width,
				y: this.bird.y + this.bird.height
			}];
			for (var i = 0; i < this.obsList.length; i++) {
				for (var j = 0; j < 4; j++)
					if (boundary[j].x >= this.obsList[i].x && boundary[j].x <= this.obsList[i].x + this.obsList[i].width && boundary[j].y >= this.obsList[i].y && boundary[j].y <= this.obsList[i].y + this.obsList[i].height) {
						this.gameOver = true;
						dead.play();
						break;
					}
				if (this.gameOver)
					break;
			}
		}
	},
	CheckTouch: function() { // 检测触摸       
		if (this.touch) {
			this.bird.y -= this.upSpeed;
			this.bird.draw(c, "up");
		} else {
			this.bird.y += this.downSpeed;
			this.bird.draw(c, "down");
		}
	},
	ClearScreen: function() { // 清屏
		img.style.display='none';
		c.drawImage(this.bg, 0, 0);
	},
	ShowOver: function() {
		var overImg = new Image();
		overImg.src = "img/over.png";
		overImg.onload = function(){
			c.drawImage(overImg, (this.mapWidth - overImg.width) / 2, (this.mapHeight - overImg.height) / 2 - 50);
		}.bind(this);
		document.onkeydown=function(event){
		    var e = event || window.event || arguments.callee.caller.arguments[0];
			    if(e && e.keyCode==32){
			    	open('index.html',true);
		        }
		};
		return;
	}
};

var game = new FlappyBird();
var Speed = 20;
var IsPlay = false;
var GameTime = null;
var btn_start;
window.onload = InitGame;
var img=document.getElementsByTagName('img')[0];
function InitGame() {
	c.font = "3em 微软雅黑";
	game.CreateMap();

	document.onkeydown=function(event){
	    var e = event || window.event || arguments.callee.caller.arguments[0];
		    if (!IsPlay) {
				IsPlay = true;
				GameTime = RunGame(Speed);
			}
	        else if(e && e.keyCode==32){
	            game.touch=true;
	        }
	};
	document.onkeyup=function(){
	    game.touch=false;
	};
}

function RunGame(speed) {
	var updateTimer = setInterval(function() {
		// 若小鸟通过第一个障碍物启动记分器
		if (game.CountScore()) {
			var scoreTimer = setInterval(function() {
				if (game.gameOver) {
					clearInterval(scoreTimer);
					return;
				}
				pass.play();
				game.score++;
			}, game.obsInterval);
		}

		game.CanMove();
		if (game.gameOver) {
			game.ShowOver();
			clearInterval(updateTimer);
			return;
		}
		game.ClearScreen();
		game.DrawObs();
		game.CheckTouch();
		game.ShowScore();
	}, speed);
	var obsTimer = setInterval(function() {
		if (game.gameOver) {
			clearInterval(obsTimer);
			return;
		}
		game.CreateObs();
	}, game.obsInterval);
}