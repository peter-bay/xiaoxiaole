// Matter.js 模块别名
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Query } = Matter;

// 创建引擎
const engine = Engine.create();
const world = engine.world;

// 游戏状态
let score = 0;
let level = 1;
let targetScore = 1000;

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
        width: 800,
        height: 600,
        wireframes: false,
        background: '#1a1a1a'
    }
});

// 创建边界墙
const wallOptions = {
    isStatic: true,
    render: {
        fillStyle: '#333'
    }
};

const ground = Bodies.rectangle(400, 590, 810, 20, wallOptions);
const leftWall = Bodies.rectangle(0, 300, 20, 600, wallOptions);
const rightWall = Bodies.rectangle(800, 300, 20, 600, wallOptions);
const ceiling = Bodies.rectangle(400, 10, 810, 20, wallOptions);

// 添加所有边界墙到世界
Composite.add(world, [ground, leftWall, rightWall, ceiling]);

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
        });

        // 检查是否达到目标分数
        if (score >= targetScore) {
            level++;
            targetScore = levelConfig.getTargetScore(level);
            // 更新形状生成间隔
            updateShapeInterval();
            alert(`恭喜！进入第${level}关！\n目标分数：${targetScore}\n新增颜色数：${levelConfig.getEmojis(level).length}\n特殊道具概率：${Math.floor(levelConfig.getSpecialProbability(level) * 100)}%`);
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
                Math.random() * 700 + 50,
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