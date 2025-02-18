// 游戏配置文件
import animalTheme from './themes/animals.js';
import fruitTheme from './themes/fruits.js';
import cerealTheme from './themes/cereals.js';
import vegetableTheme from './themes/vegetables.js';

// 主题配置
export const themes = {
    animals: animalTheme,
    fruits: fruitTheme,
    cereals: cerealTheme,
    vegetables: vegetableTheme
};

// 获取当前主题
export function getCurrentTheme() {
    const themeName = localStorage.getItem('currentTheme') || 'animals';
    const currentTheme = themes[themeName];
    if (!currentTheme) {
        console.error('主题未找到:', themeName);
        return themes.animals; // 默认使用动物主题
    }
    return currentTheme;
}

// 关卡配置
export const levelConfig = {
    getTargetScore: (level) => Math.floor(level * 1000 * (1 + level * 0.2)),
    getShapeInterval: (level) => Math.max(2000 - (level - 1) * 150, 500),
    getEmojis: (level, themeEmojis) => {
        return themeEmojis.slice(0, Math.min(3 + Math.floor((level - 1) * 0.5), themeEmojis.length));
    },
    getSpecialProbability: (level) => Math.min((level - 1) * 0.08, 0.4),
    getDifficulty: (level) => ({
        gravity: 1 + level * 0.1,
        friction: Math.max(0.1, 0.5 - level * 0.05),
        restitution: Math.min(0.8, 0.5 + level * 0.05)
    })
};

// 初始化音效系统
export function initSoundSystem(currentTheme) {
    const sounds = {};
    Object.entries(currentTheme.sounds).forEach(([emoji, url]) => {
        sounds[emoji] = new Howl({
            src: [url],
            volume: 0.8
        });
    });
    return sounds;
}