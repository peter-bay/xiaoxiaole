// 主题配置
const themes = {
    cereals: {
        name: '谷薯主题',
        emojis: ['🌾', '🌽', '🥔', '🥖', '🥨', '🥯', '🥞', '🧇', '🥪', '🌰', '🥜', '🍚', '🥡', '🥟', '🥠', '🥮', '🍙', '🍘', '🍥', '🥗', '🥐', '🥖', '🥯', '🥨', '🥪', '🥙', '🧀', '🥫', '🥘', '🥣', '🥧', '🥨', '🥐', '🥖', '🥯', '🥨', '🥪', '🥙', '🧀', '🥫', '🥘', '🥣', '🥧', '🥨', '🥐', '🥖', '🥯', '🥨', '🥪', '🥙'],
        status: 'new'
    },
    fruits: {
        name: '水果主题',
        emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🍎', '🥑', '🍆', '🥔', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🍎', '🥑', '🍆', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐'],
        status: 'new'
    },
    vegetables: {
        name: '蔬菜主题',
        emojis: ['🥬', '🥦', '🥒', '🌶️', '🫑', '🥕', '🧅', '🧄', '🥜', '🌰', '🥗', '🥙', '🥪', '🌯', '🌮', '🥫', '🥬', '🥦', '🥒', '🌶️', '🫑', '🥕', '🧅', '🧄', '🥜', '🌰', '🥗', '🥙', '🥪', '🌯', '🌮', '🥫', '🥬', '🥦', '🥒', '🌶️', '🫑', '🥕', '🧅', '🧄', '🥜', '🌰', '🥗', '🥙', '🥪', '🌯', '🌮', '🥫', '🥬', '🥦'],
        status: 'closed'
    },
    seasonings: {
        name: '调味主题',
        emojis: ['🧂', '🌶️', '🧄', '🧅', '🥄', '🍯', '🫘', '🥜', '🌰', '🍶', '🫗', '🧉', '🧊', '🥃', '🍸', '🍹', '🍺', '🍻', '🥂', '🍷', '🧂', '🌶️', '🧄', '🧅', '🥄', '🍯', '🫘', '🥜', '🌰', '🍶', '🫗', '🧉', '🧊', '🥃', '🍸', '🍹', '🍺', '🍻', '🥂', '🍷', '🧂', '🌶️', '🧄', '🧅', '🥄', '🍯', '🫘', '🥜', '🌰', '🍶'],
        status: 'new'
    },
    animals: {
        name: '动物主题',
        emojis: ['🐱', '🐶', '🐰', '🐼', '🐨', '🦊', '🐯', '🦁', '🐘', '🦒', '🦘', '🦥', '🦦', '🦝', '🦡', '🦫', '🦙', '🦣', '🦛', '🦬', '🦏', '🦒', '🦘', '🦬', '🦛', '🦏', '🐪', '🐫', '🦙', '🦒', '🦊', '🦝', '🐺', '🦊', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗'],
        status: 'passed'
    }
};

// 创建主题卡片
function createThemeCard(key, theme) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.innerHTML = `
        <div class="theme-name">${theme.name}</div>
        <div class="theme-preview">
            ${theme.emojis.slice(0, 3).join(' ')}
        </div>
        <div class="theme-status ${theme.status}">
            ${theme.status === 'new' ? '开始游戏' : 
              theme.status === 'passed' ? '已通关' : 
              theme.status === 'closed' ? '未解锁' : '继续游戏'}
        </div>
    `;

    card.addEventListener('click', () => {
        if (theme.status !== 'closed') {
            localStorage.setItem('currentTheme', key);
            window.location.href = 'game.html';
        }
    });

    return card;
}

// 初始化首页
function initHomePage() {
    const container = document.createElement('div');
    container.className = 'home-container';
    container.innerHTML = '<h1>消消乐</h1>';

    const themeContainer = document.createElement('div');
    themeContainer.className = 'theme-container';

    Object.entries(themes).forEach(([key, theme]) => {
        themeContainer.appendChild(createThemeCard(key, theme));
    });

    container.appendChild(themeContainer);
    document.body.appendChild(container);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initHomePage);