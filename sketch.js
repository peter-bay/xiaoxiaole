// Matter.js 模块别名
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Query } = Matter;

// 音效系统
const sounds = {
    '🐱': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/cat--_gb_1.mp3'] }),  // cat
    '🐶': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/dog--_gb_1.mp3'] }),  // dog
    '🐰': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/rabbit--_gb_1.mp3'] }),  // rabbit
    '🐼': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/panda--_gb_1.mp3'] }),  // panda
    '🐨': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/koala--_gb_1.mp3'] }),  // koala
    '🦊': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/fox--_gb_1.mp3'] }),  // fox
    '🐯': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/tiger--_gb_1.mp3'] }),  // tiger
    '🦁': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/lion--_gb_1.mp3'] }),  // lion
    '🐘': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/elephant--_gb_1.mp3'] }),  // elephant
    '🦒': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/giraffe--_gb_1.mp3'] }),  // giraffe
    '🦘': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/kangaroo--_gb_1.mp3'] }),  // kangaroo
    '🦥': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/sloth--_gb_1.mp3'] }),  // sloth
    '🦦': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/otter--_gb_1.mp3'] }),  // otter
    '🦝': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/raccoon--_gb_1.mp3'] }),  // raccoon
    '🦡': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/badger--_gb_1.mp3'] }),  // badger
    '🦫': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/beaver--_gb_1.mp3'] }),  // beaver
    '🦙': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/llama--_gb_1.mp3'] }),  // llama
    '🦣': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/mammoth--_gb_1.mp3'] }),  // mammoth
    '🦛': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/hippopotamus--_gb_1.mp3'] }),  // hippopotamus
    '🦬': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/bison--_gb_1.mp3'] }),  // bison
    'default': new Howl({ src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/pop--_gb_1.mp3'] })  // 默认消除音效
};

// 播放音效函数
function playSound(emoji) {
    const sound = sounds[emoji] || sounds['default'];
    sound.play();
}

// 创建引擎
const engine = Engine.create();
const world = engine.world;

// 游戏状态
let score = 0;
let level = 1;
let targetScore = 1000;

// 游戏尺寸
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

// 关卡配置
const levelConfig = {
    getTargetScore: (level) => Math.floor(level * 1000 * (1 + level * 0.2)),
    getShapeInterval: (level) => Math.max(2000 - (level - 1) * 150, 500),
    getEmojis: (level) => {
        const baseEmojis = ['🐱', '🐶', '🐰', '🐼', '🐨', '🦊', '🐯', '🦁', '🐘', '🦒', '🦘', '🦥', '🦦', '🦝', '🦡', '🦫', '🦙', '🦣', '🦛', '🦬'];
        return baseEmojis.slice(0, Math.min(3 + Math.floor((level - 1) * 0.5), baseEmojis.length));
    },
    getSpecialProbability: (level) => Math.min((level - 1) * 0.08, 0.4),
    getDifficulty: (level) => ({
        gravity: 1 + level * 0.1,
        friction: Math.max(0.1, 0.5 - level * 0.05),
        restitution: Math.min(0.8, 0.5 + level * 0.05)
    })
};

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
    // 移除旧的墙
    walls.forEach(wall => Composite.remove(world, wall));
    walls = [];

    const wallOptions = {
        isStatic: true,
        render: {
            fillStyle: '#333'
        }
    };

    // 创建新的墙
    const ground = Bodies.rectangle(gameWidth / 2, gameHeight - 10, gameWidth + 20, 20, wallOptions);
    const leftWall = Bodies.rectangle(10, gameHeight / 2, 20, gameHeight, wallOptions);
    const rightWall = Bodies.rectangle(gameWidth - 10, gameHeight / 2, 20, gameHeight, wallOptions);
    const ceiling = Bodies.rectangle(gameWidth / 2, 10, gameWidth + 20, 20, wallOptions);

    walls = [ground, leftWall, rightWall, ceiling];
    Composite.add(world, walls);
}

// 初始化墙
createWalls();

// 监听窗口大小变化
window.addEventListener('resize', () => {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;

    // 更新渲染器尺寸
    render.canvas.width = gameWidth;
    render.canvas.height = gameHeight;
    render.options.width = gameWidth;
    render.options.height = gameHeight;

    // 重新创建墙
    createWalls();
});

// 创建一些有趣的形状
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
    const emojis = levelConfig.getEmojis(level);
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// 创建emoji纹理
function createEmojiTexture(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 25, 25);
    return canvas.toDataURL();
}

// 检查相邻的相同颜色物体
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
        // 更新分数
        score += matches.size * 100;
        // 移除匹配的物体
        matches.forEach(body => {
            Composite.remove(world, body);
            createExplosion(body.position.x, body.position.y, body.gameEmoji);
            playSound(body.gameEmoji);  // 播放对应的音效
        });

        // 检查是否达到目标分数
        if (score >= targetScore) {
            const oldEmojis = levelConfig.getEmojis(level);
            level++;
            const newEmojis = levelConfig.getEmojis(level);
            targetScore = levelConfig.getTargetScore(level);
            // 更新形状生成间隔
            updateShapeInterval();
            
            // 找出新增的动物
            const newAnimals = newEmojis.filter(emoji => !oldEmojis.includes(emoji));
            
            // 创建欢迎语音
            const welcomeSound = new Howl({
                src: ['https://ssl.gstatic.com/dictionary/static/sounds/oxford/congratulations--_gb_1.mp3'],
                onend: function() {
                    // 依次播放新增动物的音效
                    let index = 0;
                    const playNext = () => {
                        if (index < newAnimals.length) {
                            const sound = sounds[newAnimals[index]];
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
            
            // 播放欢迎语音
            welcomeSound.play();
            
            alert(`恭喜！进入第${level}关！\n目标分数：${targetScore}\n新增动物：${newAnimals.join(' ')}\n特殊道具概率：${Math.floor(levelConfig.getSpecialProbability(level) * 100)}%`);
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

// 定期添加新的形状
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

// 初始化形状生成间隔
updateShapeInterval();

// 定期检查匹配
setInterval(() => {
    checkMatches();
}, 500);

// 清理爆炸粒子
Events.on(engine, 'beforeUpdate', () => {
    const particles = Composite.allBodies(world).filter(body => body.label === 'particle');
    particles.forEach(particle => {
        if (Date.now() - particle.timeCreated > 1000) {
            Composite.remove(world, particle);
        }
    });
});

// 添加分数显示
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '20px';
scoreDisplay.style.left = '20px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontFamily = 'Arial';
scoreDisplay.style.fontSize = '20px';
document.body.appendChild(scoreDisplay);

// 更新分数显示
Events.on(engine, 'beforeUpdate', () => {
    scoreDisplay.textContent = `分数: ${score} / ${targetScore}\n关卡: ${level}`;
});

// 运行引擎
Runner.run(engine);
Render.run(render);