class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('sky', 'assets/images/sky.png');
    }

    create() {
        this.add.image(400, 300, 'sky');

        this.add.text(400, 200, 'Selecciona la Dificultad', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);

        let easyButton = this.add.text(400, 300, 'Fácil', { fontSize: '32px', fill: '#0f0' }).setOrigin(0.5).setInteractive();
        let mediumButton = this.add.text(400, 350, 'Medio', { fontSize: '32px', fill: '#ff0' }).setOrigin(0.5).setInteractive();
        let hardButton = this.add.text(400, 400, 'Difícil', { fontSize: '32px', fill: '#f00' }).setOrigin(0.5).setInteractive();

        easyButton.on('pointerdown', () => this.startGame('easy'));
        mediumButton.on('pointerdown', () => this.startGame('medium'));
        hardButton.on('pointerdown', () => this.startGame('hard'));
    }

    startGame(difficulty) {
        this.scene.start('GameScene', { difficulty: difficulty });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.difficulty = data.difficulty;
        this.score = 0;
        this.isWalking = false;
        this.gameOver = false;
    }

    preload() {
        this.load.image('sky', 'assets/images/sky.png');
        this.load.image('ground', 'assets/images/platform.png');
        this.load.image('star', 'assets/images/star.png');
        this.load.image('bomb', 'assets/images/bomb.png');
        this.load.image('meteor', 'assets/images/meteor.png');
        this.load.image('powerup', 'assets/images/powerup.png');
        this.load.spritesheet('dude', 'assets/images/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.load.audio('collect', 'assets/sfx/collect.wav');
        this.load.audio('jump', 'assets/sfx/jump.wav');
        this.load.audio('hit', 'assets/sfx/hit.wav');
        this.load.audio('walk', 'assets/sfx/walk.wav');
    }

    create() {
        this.add.image(400, 300, 'sky');
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);
        this.player.canDoubleJump = false;
        this.player.hasDoubleJumped = false;
        this.player.doubleJumpTimer = 0;

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20,
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
        this.doubleJumpTimerText = this.add.text(16, 48, 'Double Jump: 0', { fontSize: '32px', fill: '#000' });
        this.doubleJumpTimerText.setVisible(false);

        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

        this.meteors = this.physics.add.group();
        this.physics.add.collider(this.player, this.meteors, this.hitMeteor, null, this);

        this.powerups = this.physics.add.group();

        this.collectSound = this.sound.add('collect');
        this.jumpSound = this.sound.add('jump');
        this.hitSound = this.sound.add('hit');
        this.walkSound = this.sound.add('walk', { loop: true });

        this.gameOverText = this.add.text(400, 300, '', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5).setVisible(false);
        this.restartButton = this.add.text(400, 400, 'Reiniciar', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive().setVisible(false);
        this.menuButton = this.add.text(400, 450, 'Menú', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive().setVisible(false);

        this.restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        this.menuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        this.doubleJumpBarBg = this.add.graphics();
        this.doubleJumpBarBg.fillStyle(0x000000, 0.5);
        this.doubleJumpBarBg.fillRect(16, 80, 200, 20);
        this.doubleJumpBarBg.setVisible(false);

        this.doubleJumpBar = this.add.graphics();
        this.doubleJumpBar.fillStyle(0x00ff00, 1);
        this.doubleJumpBar.fillRect(16, 80, 200, 20);
        this.doubleJumpBar.setVisible(false);

        this.adjustDifficulty();
    }

    update(time, delta) {
        if (this.gameOver) {
            return;
        }

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
            this.playWalkSound();
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
            this.playWalkSound();
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
            this.stopWalkSound();
        }

        if ((this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.jumpSound.play();
            this.stopWalkSound();
            this.player.hasDoubleJumped = false;
        } else if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) && this.player.canDoubleJump && !this.player.body.touching.down && !this.player.hasDoubleJumped) {
            this.player.setVelocityY(-330);
            this.jumpSound.play();
            this.stopWalkSound();
            this.player.hasDoubleJumped = true;
        }

        if (this.player.canDoubleJump) {
            this.player.doubleJumpTimer -= delta;
            this.doubleJumpTimerText.setText('Double Jump: ' + Math.max(0, Math.ceil(this.player.doubleJumpTimer / 1000)));
            this.doubleJumpBar.scaleX = this.player.doubleJumpTimer / 10000;
            if (this.player.doubleJumpTimer <= 0) {
                this.player.canDoubleJump = false;
                this.doubleJumpBarBg.setVisible(false);
                this.doubleJumpBar.setVisible(false);
                this.doubleJumpTimerText.setVisible(false);
            }
        }

        this.meteors.children.iterate(function (meteor) {
            if (meteor && meteor.y > 600) {
                meteor.destroy();
            }
        });
    }

    playWalkSound() {
        if (!this.isWalking) {
            this.walkSound.play();
            this.isWalking = true;
        }
    }

    stopWalkSound() {
        if (this.isWalking) {
            this.walkSound.stop();
            this.isWalking = false;
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.collectSound.play();

        if (this.stars.countActive(true) === 0 && !this.gameOver) {
            this.stars.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true);
            });

            var x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            var bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

            this.spawnMeteors(5);

            var powerup = this.powerups.create(Phaser.Math.Between(0, 800), 0, 'powerup');
            powerup.setBounce(0.5);
            powerup.setCollideWorldBounds(true);
            this.physics.add.collider(powerup, this.platforms);
            this.physics.add.overlap(this.player, powerup, this.collectPowerup, null, this);
        }
    }

    collectPowerup(player, powerup) {
        powerup.disableBody(true, true);
        this.player.canDoubleJump = true;
        this.player.doubleJumpTimer = 10000;
        this.doubleJumpBarBg.setVisible(true);
        this.doubleJumpBar.setVisible(true);
        this.doubleJumpTimerText.setVisible(true);
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play('turn');
        this.player.setVelocity(0, 0);
        this.gameOver = true;
        this.hitSound.play();
        this.stopWalkSound();
        this.gameOverText.setText('Game Over').setVisible(true);
        this.restartButton.setVisible(true);
        this.menuButton.setVisible(true);
    }

    hitMeteor(player, meteor) {
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play('turn');
        this.player.setVelocity(0, 0);
        this.gameOver = true;
        this.hitSound.play();
        this.stopWalkSound();
        this.gameOverText.setText('Game Over').setVisible(true);
        this.restartButton.setVisible(true);
        this.menuButton.setVisible(true);
    }

    spawnMeteors(count) {
        let delay = 0;
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(delay, () => {
                var x = Phaser.Math.Between(0, 800);
                var meteor = this.meteors.create(x, 0, 'meteor');
                meteor.setBounce(0);
                meteor.setCollideWorldBounds(false);
                meteor.setVelocity(Phaser.Math.Between(-100, 100), 200);
            }, [], this);
            delay += 500;
        }
    }

    adjustDifficulty() {
        let bombCount, meteorCount;
        switch (this.difficulty) {
            case 'easy':
                bombCount = 1;
                meteorCount = 2;
                break;
            case 'medium':
                bombCount = 2;
                meteorCount = 3;
                break;
            case 'hard':
                bombCount = 4;
                meteorCount = 5;
                break;
        }

        for (let i = 0; i < bombCount; i++) {
            var x = Phaser.Math.Between(0, 800);
            var bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }

        this.spawnMeteors(meteorCount);
    }
}

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MainMenu, GameScene]
};

var game = new Phaser.Game(config);