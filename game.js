// 游戏核心逻辑
import { themes, getCurrentTheme, levelConfig, initSoundSystem } from './config.js';

// Matter.js 模块别名
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Query } = Matter;

// 游戏状态
let score = 0;
let level = 1;
let targetScore = 1000;
let currentTheme = null;
let sounds = {};

// 游戏尺寸
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

// 初始化主题
function initTheme() {
    currentTheme = getCurrentTheme();
}

// 初始化音效
function initSounds() {
    sounds = initSoundSystem(currentTheme);
}

// 播放音效
function playSound(emoji) {
    const sound = sounds[emoji];
    if (sound) {
        sound.play();
    }
}

// 使用从config.js导入的levelConfig

// 创建引擎
const engine = Engine.create();
const world = engine.world;

// 创建渲染器
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: gameWidth,
        height: gameHeight,
        wireframes: false,
        background: '#1a1a1a'
    }
});

// 创建边界墙
let walls = [];

function createWalls() {
    walls.forEach(wall => Composite.remove(world, wall));
    walls = [];

    const wallOptions = {
        isStatic: true,
        render: {
            fillStyle: '#333'
        }
    };

    const ground = Bodies.rectangle(gameWidth / 2, gameHeight - 10, gameWidth + 20, 20, wallOptions);
    const leftWall = Bodies.rectangle(10, gameHeight / 2, 20, gameHeight, wallOptions);
    const rightWall = Bodies.rectangle(gameWidth - 10, gameHeight / 2, 20, gameHeight, wallOptions);
    const ceiling = Bodies.rectangle(gameWidth / 2, 10, gameWidth + 20, 20, wallOptions);

    walls = [ground, leftWall, rightWall, ceiling];
    Composite.add(world, walls);
}

// 创建随机形状
function createRandomShape(x, y) {
    const emoji = getRandomEmoji();
    const shape = Bodies.circle(x, y, 25, {
        render: {
            sprite: {
                texture: createEmojiTexture(emoji),
                xScale: 1,
                yScale: 1
            }
        },
        label: 'game-piece',
        gameEmoji: emoji,
        ...levelConfig.getDifficulty(level)
    });
    return shape;
}

// 生成随机emoji
function getRandomEmoji() {
    const emojis = levelConfig.getEmojis(level, currentTheme.emojis);
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// 创建emoji纹理
function createEmojiTexture(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 25, 25);
    return canvas.toDataURL();
}

// 检查匹配
function checkMatches() {
    const bodies = Composite.allBodies(world).filter(body => body.label === 'game-piece');
    const matches = new Set();

    bodies.forEach(body => {
        const nearby = Query.region(bodies, {
            min: { x: body.position.x - 55, y: body.position.y - 55 },
            max: { x: body.position.x + 55, y: body.position.y + 55 }
        });

        const sameEmojiNearby = nearby.filter(other => 
            other.gameEmoji === body.gameEmoji && 
            other.id !== body.id &&
            Matter.Vector.magnitude(Matter.Vector.sub(body.position, other.position)) < 55
        );

        if (sameEmojiNearby.length >= 2) {
            matches.add(body);
            sameEmojiNearby.forEach(match => matches.add(match));
        }
    });

    if (matches.size >= 3) {
        score += matches.size * 100;
        matches.forEach(body => {
            Composite.remove(world, body);
            createExplosion(body.position.x, body.position.y, body.gameEmoji);
            playSound(body.gameEmoji);
            showWord(body.gameEmoji);
        });

        if (score >= targetScore) {
            const oldEmojis = levelConfig.getEmojis(level, currentTheme.emojis);
            level++;
            const newEmojis = levelConfig.getEmojis(level, currentTheme.emojis);
            targetScore = levelConfig.getTargetScore(level);
            updateShapeInterval();
            
            const newItems = newEmojis.filter(emoji => !oldEmojis.includes(emoji));
            
            const welcomeSound = new Howl({
                src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/congratulations--_gb_1.mp3'],
                onend: function() {
                    let index = 0;
                    const playNext = () => {
                        if (index < newItems.length) {
                            const sound = sounds[newItems[index]];
                            sound.once('end', () => {
                                index++;
                                playNext();
                            });
                            sound.play();
                        }
                    };
                    playNext();
                }
            });
            
            welcomeSound.play();
            
            alert(`恭喜！进入第${level}关！\n目标分数：${targetScore}\n新增项目：${newItems.join(' ')}\n特殊道具概率：${Math.floor(levelConfig.getSpecialProbability(level) * 100)}%`);
        }
        return true;
    }
    return false;
}

// 创建爆炸效果
function createExplosion(x, y, emoji) {
    for (let i = 0; i < 8; i++) {
        const particle = Bodies.circle(x, y, 5, {
            render: {
                sprite: {
                    texture: createEmojiTexture(emoji),
                    xScale: 0.3,
                    yScale: 0.3
                }
            },
            frictionAir: 0.1,
            label: 'particle',
            timeCreated: Date.now()
        });

        const angle = (Math.PI * 2 / 8) * i;
        Body.setVelocity(particle, {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        });

        Composite.add(world, particle);
    }
}

// 显示单词
function showWord(emoji) {
    const word = currentTheme.words[emoji];
    if (word) {
        wordDisplay.textContent = word;
        wordDisplay.style.opacity = '1';
        setTimeout(() => {
            wordDisplay.style.opacity = '0';
        }, 2000);
    }
}

// 初始化游戏
function initGame() {
    initTheme();
    initSounds();
    createWalls();

    // 添加鼠标控制
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    // 点击事件监听
    Events.on(mouseConstraint, 'mousedown', function(event) {
        const mousePosition = event.mouse.position;
        const shape = createRandomShape(
            mousePosition.x,
            mousePosition.y
        );
        Composite.add(world, shape);
    });

    // 创建UI元素
    createUI();

    // 启动游戏循环
    Runner.run(engine);
    Render.run(render);

    // 初始化形状生成间隔
    updateShapeInterval();

    // 定期检查匹配
    setInterval(checkMatches, 500);

    // 清理爆炸粒子
    Events.on(engine, 'beforeUpdate', () => {
        const particles = Composite.allBodies(world).filter(body => body.label === 'particle');
        particles.forEach(particle => {
            if (Date.now() - particle.timeCreated > 1000) {
                Composite.remove(world, particle);
            }
        });
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        gameWidth = window.innerWidth;
        gameHeight = window.innerHeight;

        render.canvas.width = gameWidth;
        render.canvas.height = gameHeight;
        render.options.width = gameWidth;
        render.options.height = gameHeight;

        createWalls();
    });
}

// 创建UI
function createUI() {
    const scoreDisplay = document.createElement('div');
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.left = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontFamily = 'Arial';
    scoreDisplay.style.fontSize = '20px';
    scoreDisplay.style.display = 'flex';
    scoreDisplay.style.flexDirection = 'column';
    scoreDisplay.style.alignItems = 'flex-start';
    scoreDisplay.style.gap = '10px';

    const titleDisplay = document.createElement('div');
    titleDisplay.textContent = currentTheme.name;
    titleDisplay.style.fontSize = '24px';
    titleDisplay.style.fontWeight = 'bold';
    titleDisplay.style.marginBottom = '10px';
    scoreDisplay.appendChild(titleDisplay);

    const wordDisplay = document.createElement('div');
    wordDisplay.style.color = 'white';
    wordDisplay.style.fontFamily = 'Arial';
    wordDisplay.style.fontSize = '18px';
    wordDisplay.style.opacity = '0';
    wordDisplay.style.transition = 'opacity 0.3s';
    scoreDisplay.appendChild(wordDisplay);

    document.body.appendChild(scoreDisplay);

    // 更新分数显示
    Events.on(engine, 'beforeUpdate', () => {
        titleDisplay.textContent = currentTheme.name;
        const scoreText = document.createElement('div');
        scoreText.textContent = `分数: ${score} / ${targetScore}`;
        const levelText = document.createElement('div');
        levelText.textContent = `关卡: ${level}`;
        
        while (scoreDisplay.children.length > 2) {
            scoreDisplay.removeChild(scoreDisplay.lastChild);
        }
        
        scoreDisplay.appendChild(scoreText);
        scoreDisplay.appendChild(levelText);
    });

    window.wordDisplay = wordDisplay;
}

// 更新形状生成间隔
let shapeInterval;
function updateShapeInterval() {
    if (shapeInterval) clearInterval(shapeInterval);
    shapeInterval = setInterval(() => {
        if (Composite.allBodies(world).length < 50) {
            const shape = createRandomShape(
                Math.random() * (gameWidth - 100) + 50,
                50
            );
            Composite.add(world, shape);
        }
    }, levelConfig.getShapeInterval(level));
}

// 当页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);