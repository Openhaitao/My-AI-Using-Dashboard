// Popup 脚本 - 显示统计数据

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
  
  // 添加高亮效果到使用最多的平台
  highlightMostUsed(data);
}

// 高亮使用最多的平台
function highlightMostUsed(data) {
  // 移除所有高亮
  document.querySelectorAll('.ai-card').forEach(card => {
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
    const card = document.querySelector(`.ai-card.${mostUsedPlatform}`);
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
    showNotification('数据已重置');
  }
}

// 显示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadData();
    showNotification('数据已刷新');
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

