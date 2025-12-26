// 侧边栏脚本 - 显示统计数据

// 格式化时间（秒转换为易读格式）
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

// 获取今天的日期字符串
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 获取格式化的日期显示
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[today.getDay()];
  
  return `${year}年${month}月${day}日 ${weekday}`;
}

// 加载并显示数据
async function loadData() {
  const todayKey = getTodayKey();
  const result = await chrome.storage.local.get([todayKey]);
  let todayData = result[todayKey];
  
  // 如果没有数据，初始化默认数据
  if (!todayData) {
    todayData = {
      date: todayKey,
      chatgpt: { time: 0, questions: 0 },
      gemini: { time: 0, questions: 0 },
      claude: { time: 0, questions: 0 },
      total: { time: 0, questions: 0 }
    };
  }
  
  // 更新显示
  updateDisplay(todayData);
}

// 更新显示
function updateDisplay(data) {
  // 更新日期
  document.getElementById('currentDate').textContent = getFormattedDate();
  
  // 更新总计
  document.getElementById('totalTime').textContent = formatTime(data.total.time);
  document.getElementById('totalQuestions').textContent = `${data.total.questions}次`;
  
  // 更新 ChatGPT
  document.getElementById('chatgptTime').textContent = formatTime(data.chatgpt.time);
  document.getElementById('chatgptQuestions').textContent = `${data.chatgpt.questions}次`;
  
  // 更新 Gemini
  document.getElementById('geminiTime').textContent = formatTime(data.gemini.time);
  document.getElementById('geminiQuestions').textContent = `${data.gemini.questions}次`;
  
  // 更新 Claude
  document.getElementById('claudeTime').textContent = formatTime(data.claude.time);
  document.getElementById('claudeQuestions').textContent = `${data.claude.questions}次`;
  
  // 更新进度条
  updateProgressBars(data);
  
  // 更新条形图
  updateBarChart(data);
  
  // 添加高亮效果到使用最多的平台
  highlightMostUsed(data);
}

// 更新进度条
function updateProgressBars(data) {
  const maxTime = Math.max(data.chatgpt.time, data.gemini.time, data.claude.time, 1);
  
  const chatgptPercent = (data.chatgpt.time / maxTime) * 100;
  const geminiPercent = (data.gemini.time / maxTime) * 100;
  const claudePercent = (data.claude.time / maxTime) * 100;
  
  document.getElementById('chatgptProgress').style.width = `${chatgptPercent}%`;
  document.getElementById('geminiProgress').style.width = `${geminiPercent}%`;
  document.getElementById('claudeProgress').style.width = `${claudePercent}%`;
}

// 更新条形图
function updateBarChart(data) {
  const chartContainer = document.getElementById('barChart');
  chartContainer.innerHTML = '';
  
    const platforms = [
      { name: 'CHATGPT', time: data.chatgpt.time, questions: data.chatgpt.questions, color: '#10a37f' },
      { name: 'GEMINI', time: data.gemini.time, questions: data.gemini.questions, color: '#4285f4' },
      { name: 'CLAUDE', time: data.claude.time, questions: data.claude.questions, color: '#d97706' }
    ];
  
  const maxTime = Math.max(...platforms.map(p => p.time), 1);
  
  platforms.forEach(platform => {
    const barItem = document.createElement('div');
    barItem.className = 'bar-item';
    
    const barLabel = document.createElement('div');
    barLabel.className = 'bar-label';
    barLabel.textContent = platform.name;
    
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    const barFill = document.createElement('div');
    barFill.className = 'bar-fill';
    barFill.style.width = `${(platform.time / maxTime) * 100}%`;
    barFill.style.backgroundColor = platform.color;
    
    const barValue = document.createElement('div');
    barValue.className = 'bar-value';
    barValue.textContent = formatTime(platform.time);
    
    barContainer.appendChild(barFill);
    barItem.appendChild(barLabel);
    barItem.appendChild(barContainer);
    barItem.appendChild(barValue);
    
    chartContainer.appendChild(barItem);
  });
}

// 高亮使用最多的平台
function highlightMostUsed(data) {
  // 移除所有高亮
  document.querySelectorAll('.platform-card').forEach(card => {
    card.classList.remove('most-used');
  });
  
  // 找出使用时间最长的平台
  let maxTime = 0;
  let mostUsedPlatform = null;
  
  ['chatgpt', 'gemini', 'claude'].forEach(platform => {
    if (data[platform].time > maxTime) {
      maxTime = data[platform].time;
      mostUsedPlatform = platform;
    }
  });
  
  // 添加高亮
  if (mostUsedPlatform && maxTime > 0) {
    const card = document.querySelector(`.platform-card.${mostUsedPlatform}`);
    if (card) {
      card.classList.add('most-used');
    }
  }
}

// 重置今日数据
async function resetTodayData() {
  const confirmed = confirm('确定要重置今日的所有统计数据吗？此操作无法撤销。');
  
  if (confirmed) {
    const todayKey = getTodayKey();
    const todayData = {
      date: todayKey,
      chatgpt: { time: 0, questions: 0 },
      gemini: { time: 0, questions: 0 },
      claude: { time: 0, questions: 0 },
      total: { time: 0, questions: 0 }
    };
    
    await chrome.storage.local.set({ [todayKey]: todayData });
    updateDisplay(todayData);
    
    // 显示成功消息
    showNotification('✅ 数据已重置');
  }
}

// 显示通知
function showNotification(message) {
  // 移除旧的通知
  const oldNotification = document.querySelector('.notification');
  if (oldNotification) oldNotification.remove();

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = `> ${message}`;
  document.body.appendChild(notification);
  
  // 显示动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadData();
    showNotification('🔄 数据已刷新');
  });
  
  // 重置按钮
  document.getElementById('resetBtn').addEventListener('click', resetTodayData);
  
  // 监听存储变化，实时更新
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      const todayKey = getTodayKey();
      if (changes[todayKey]) {
        updateDisplay(changes[todayKey].newValue);
      }
    }
  });
  
  // 每秒自动刷新一次
  setInterval(loadData, 1000);
});

