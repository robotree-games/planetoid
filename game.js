// the game itself
var game;
var currentScore = 0;
var topScore = 0;

// global object with all customizable options
var gameOptions = {

    // radius of the big circle - the "planet" - in pixels
    bigCircleRadius: 250,

    // radius of the small circle, in pixels
    playerRadius: 25,

    // player speed, in degrees per frame
    playerSpeed: 1,

    // world gravity
    worldGravity: 0.85,

    // jump force. First element is the first jump, second element - if any -  the double jump, third element - if any - the triple jump and so on
    jumpForce: [12, 9, 6],

    // spike size - width, height - in pixels
    spikeSize: [25, 60],

    // distance needed to consider the player close to a spike, in degrees
    closeToSpike: 10,

    // distance needed to consider the player far from a spike, in degrees
    farFromSpike: 35
}


window.onload = function() {

    // game configuration object
    var gameConfig = {
        thpe: Phaser.CANVAS,
        width: 800,
        height: 800,
        scene: [menu, playGame]
    }
    game = new Phaser.Game(gameConfig);
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
}
class menu extends Phaser.Scene{
    constructor(){
        super("Menu");
    }
    create(){
        let best = localStorage.getItem("topScore")==null?0:localStorage.getItem("topScore");
       // game.stage.backgroundColor = '#3763d4';
        // skyBackground = this.game.add.tileSprite(0,
        //     game.height - this.game.cache.getImage('sky-background').height,
        //     game.width,
        //     game.cache.getImage('sky-background').height,
        //     'sky-background'
        // );

        this.add.text(80,80, 'Planetoid',
        {font: '70px VT323', fill: '#fff'});


        this.add.text(80, 250, 'single/double/triple jump with your jetpack' + '\n' + 'avoid the spikes' + '\n' + 'tap/click to start', {
            font: '25px VT323', fill: '#fff'
        });

        this.add.text(80, 550, 'Top Score: '+best, {
            font: '25px VT323', fill: '#fff'
        });

        //scoreLabel.anchor.y = 0.5;
        
        // var startLabel = game.add.text(80, game.world.height-300, 'Press To Start',
        // {font: '35px VT323', fill: '#fff'});

        
        this.input.on("pointerdown", this.start);
       
    }
    start() {
        this.scene.start("PlayGame");
    }
    update(){}
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("bigcircle", "planet.png");
        // this.load.spritesheet("robot", "robot.png", { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet("player", "robot.png", { frameWidth: 64, frameHeight: 32 });
        this.load.image("spike", "spike.png");
        this.load.image("mask", "mask.png");
        this.load.image("particle", "particle.png");
    }
    create(){

        // uhh... why isn't this working!?

        this.hiScore = localStorage.getItem('topScore');
        console.log(this.hiScore)

        if(this.hiScore) {
            topScore = this.hiScore;
        }

        // flag to see if it's game over
        this.gameOver = false;

        // adding a group which will contain all spikes
        this.spikeGroup = this.add.group();

        // adding the big circle, the "planet", placed in the middle of the canvas
        this.bigCircle = this.add.sprite(game.config.width / 2, game.config.height / 2, "bigcircle");
        this.bigCircle.displayWidth = gameOptions.bigCircleRadius * 2;
        this.bigCircle.displayHeight = gameOptions.bigCircleRadius * 2;

        // placing the player, just above the top of the "planet"
        this.player = this.add.sprite(game.config.width / 2, game.config.height / 2 - gameOptions.bigCircleRadius - gameOptions.playerRadius, "player");
        this.player.displayWidth = gameOptions.playerRadius * 2;
        this.player.displayHeight = gameOptions.playerRadius * 2;
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'player',frame:1 },
                { key: 'player',frame:3 },
                { key: 'player',frame:2 },
                // { key: 'player',frame:1 },
                // { key: 'player',frame:3 },
                // { key: 'player',frame:2 },
                // { key: 'player',frame:1 },
                // { key: 'player',frame:3 },
            ],
            frameRate: 16,
            repeat: -1
        });
        this.player.play('walk');

        // a few custom properties: currentAngle is the angle of the player
        
        this.player.currentAngle = -80;
       

        // jumpOffset is the amount of pixels to be added to player position when it jumps
        this.player.jumpOffset = 0;

        // how many jumps is the player doing?
        this.player.jumps = 0;

        // current jump force
        this.player.jumpForce = 0;


        // when the player clicks/taps on the canvas...
        this.input.on("pointerdown", function(e){

            // can the player jump?
            if(this.player.jumps < gameOptions.jumpForce.length){

                // player is jumping once more
                this.player.jumps ++;

                // adding the proper jump force to player's jumpForce property
                this.player.jumpForce = gameOptions.jumpForce[this.player.jumps - 1];
            
            } 
        }, this);

        // we are going to place nine spikes
        for(var i = 0; i < 9; i ++){

            // adding the spike on the canvas
            var spike = this.add.sprite(0, 0, "spike");

            // set spike origin point to left and horizontal middle
            spike.setOrigin(0, 0.5);

            // adding the spike to spike group
            this.spikeGroup.add(spike);

            // place the spike. Arguments are the spike itself and the quadrant of the big circle
            this.placeSpike(spike, Math.floor(i / 3));
        }

        // adding the mask image which will act like a "fog" to hide and show spikes
        this.maskImage = this.add.sprite(game.config.width / 2, game.config.height / 2, "mask");

        // creating a particle system uising "particle" image
        var particles = this.add.particles("particle");

        // trail emitter configuration
        this.emitter = particles.createEmitter({

            // particle speed - particles do not move
            speed: 0,

            // particle scale: from 1 to zero
            scale: {
                start: 0.35,
                end: 0
            },

            // particle alpha: from opaque to transparent
            alpha: {
                start: 0.75,
                end: 0
            },

            // particle frequency: one particle every 20 milliseconds
            frequency: 25,

            // particle lifespan: .3 second
            lifespan: 430
        });

        // making the emitter follow the player
        // this.emitter.startFollow(this.player);
        scoreTimer();
    }

    // method to randomly place a spike into a quadrant
    placeSpike(spike, quadrant){

        // choosing a random angle
        var randomAngle = Phaser.Math.Angle.WrapDegrees(Phaser.Math.Between(quadrant * 90, (quadrant + 1) * 90));

        // this is the same random angle converted in radians
        var randomAngleRadians = Phaser.Math.DegToRad(randomAngle);

        // determining spike position according to its angle
        var spikeX = this.bigCircle.x + (gameOptions.bigCircleRadius - Phaser.Math.Between(4, 25)) * Math.cos(randomAngleRadians);
        var spikeY = this.bigCircle.y + (gameOptions.bigCircleRadius - Phaser.Math.Between(4, 25)) * Math.sin(randomAngleRadians);
        spike.x = spikeX;
        spike.y = spikeY;

        // saving spike's quadrant in a custom property
        spike.quadrant = quadrant;

        // setting spike angke
        spike.angle = randomAngle;

        // saving the three spike vertices in custom properties
        spike.top = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[1] * Math.cos(randomAngleRadians), spikeY + gameOptions.spikeSize[1] * Math.sin(randomAngleRadians));
        spike.base1 = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[0] / 2 * Math.cos(randomAngleRadians + Math.PI / 2), spikeY + gameOptions.spikeSize[0] / 2 * Math.sin(randomAngleRadians + Math.PI / 2));
        spike.base2 = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[0] / 2 * Math.cos(randomAngleRadians - Math.PI / 2), spikeY + gameOptions.spikeSize[0] / 2 * Math.sin(randomAngleRadians - Math.PI / 2));

        // is the player approaching to the spike?
        spike.approaching = false;
    }

    // method to be executed at each frame
    update(dt){
        // are we playing?
        if(!this.gameOver){

            // is the player jumping?
            if(this.player.jumps > 0){
                this.emitter.startFollow(this.player);
                // adjusting player jump offset
                this.player.jumpOffset += this.player.jumpForce;

                // decreasing jump force due to gravity
                this.player.jumpForce -= gameOptions.worldGravity;

                // if jumpOffset is less than zero, it means the player touched the ground
                if(this.player.jumpOffset < 0){
                    this.emitter.stopFollow(this.player);
                
                    // setting jump offset to zero
                    this.player.jumpOffset = 0;

                    // player is not jumping anymore
                    this.player.jumps = 0;

                    // there is no jump force
                    this.player.jumpForce = 0;
                }
            }
          

            // setting new player current angle according to current position and speed
            this.player.currentAngle = Phaser.Math.Angle.WrapDegrees(this.player.currentAngle + gameOptions.playerSpeed);

            // moving the mask image accordingly
            this.maskImage.angle = this.player.currentAngle + 90;

            // getting the same angle in radians
            var radians = Phaser.Math.DegToRad(this.player.currentAngle);

            // determining the distance from the center according to planet radius, player radius and jump offset
            var distanceFromCenter = (gameOptions.bigCircleRadius * 2 + gameOptions.playerRadius * 2) / 2 + this.player.jumpOffset;

            // position the player using trigonometry
            this.player.x = this.bigCircle.x + distanceFromCenter * Math.cos(radians);
            this.player.y = this.bigCircle.y + distanceFromCenter * Math.sin(radians);

            // determining the number of revolutions the player has to do move according to planet and player size
            var revolutions = (gameOptions.bigCircleRadius * 2) / (gameOptions.playerRadius * 2) + 1;

            // ** FIGURE OUT HOW TO KEEP SCORE... MAYBE ADD POINTS ON A TIMER??? IDK
            
            // let deltaTime = 0;
            // deltaTime = dt/1000; 
            // console.log('delta', deltaTime)
            // console.log('score', deltaTime/10)
            
            // set player rotation according to current angle and the number of revolutions needed
            this.player.angle = this.player.currentAngle * revolutions / 10;

            // looping through each spike, as child of spikeGroup
            this.spikeGroup.children.iterate(function(spike){

                // getting angle difference between the spike and the player
                var angleDiff = this.getAngleDifference(spike.angle, this.player.currentAngle);

                // if the player is not approaching the spike and it's close enough...
                if(!spike.approaching && angleDiff < gameOptions.closeToSpike){

                    // player is approaching the spike
                    spike.approaching = true;
                }

                // if the player is approaching the spike...
                if(spike.approaching){

                    // checking for collision between the player and the two triangle sizes
                    if(this.distToSegmentSquared(new Phaser.Math.Vector2(this.player.x, this.player.y), gameOptions.playerRadius, spike.top, spike.base1) || this.distToSegmentSquared(new Phaser.Math.Vector2(this.player.x, this.player.y), gameOptions.playerRadius, spike.top, spike.base2)){

                        // game over man...
                        this.gameOver = true;

                        // stop leaving a trail
                        
                        this.emitter.stop();

                        // shaking the camera
                        this.cameras.main.shake(800, 0.01);

                        currentScore = 0;

                        // waiting 2 seconds
                        this.time.addEvent({

                            // delay, in milliseconds
                            delay: 2000,

                            // callback function, to restart the scene
                            callback: function(){
                                this.scene.start("PlayGame");
                            },

                            // callback scope
                            callbackScope: this
                        });

                        // let's make an explosion, first we define the particle...
                        var particles = this.add.particles("particle");

                        // ... then the emitter
                        var emitter = particles.createEmitter({

                            // particle speed
                            speed: {
                                min: -50,
                                max: 50
                            },

                            // particle size
                            scale: {
                                start: 0.1,
                                end: 0.15
                            },

                            // particle alpha
                            alpha: {
                                start: 0.5,
                                end: 0
                            },

                            // particle lifespan, in milliseconds
                            lifespan: 2000
                        })

                        // create an explosion with 70 particles at player position
                        emitter.explode(70, this.player.x, this.player.y);

                        // hide the player
                        this.player.visible = false;
                    }

                    // if we are getting too far from the spike...
                    if(angleDiff > gameOptions.farFromSpike){

                        // recycle the spike and move it in a random position three quadrants further
                        this.placeSpike(spike, (spike.quadrant + 3) % 4);
                    }
                }
            }, this);
        }
    }

    // function to get the minimum difference between two angles a1 and a2
    getAngleDifference(a1, a2){
        var angleDifference = a1 - a2
        angleDifference += (angleDifference > 180) ? -360 : (angleDifference < -180) ? 360 : 0
        return Math.abs(angleDifference);
    }

    // function to get the distance between two points p1 and p2
    getDistance(p1, p2){
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }

    // function to determine if a circle is touching a line segment given the circle center, the radius and the points defining the segment
    distToSegmentSquared(circleCenter, circleRadius, segmentStart, segmentEnd){
        var l2 = this.getDistance(segmentStart, segmentEnd);
        var t = ((circleCenter.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) + (circleCenter.y - segmentStart.y) * (segmentEnd.y - segmentStart.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        var tX = segmentStart.x + t * (segmentEnd.x - segmentStart.x);
        var tY = segmentStart.y + t * (segmentEnd.y - segmentStart.y);
        var tPoint = {
            x: tX,
            y: tY
        }
        return this.getDistance(circleCenter, tPoint) < circleRadius * circleRadius;
    }
}

// pure javascript to scale the game
function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
function scoreTimer() {

    currentScore = currentScore + 1;
    console.log('score', currentScore)
    console.log('top score', topScore)
    if(currentScore > topScore) {
        topScore = currentScore;
        localStorage.setItem('topScore', topScore)
    }

    setTimeout(scoreTimer, 10000);
}


