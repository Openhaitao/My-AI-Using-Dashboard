// Apple Screen Time 风格侧边栏脚本

// 开发模式：设为 true 使用模拟数据查看样式，设为 false 使用真实数据
const DEV_MODE = false;

// 缓存上次的周数据，避免不必要的重绘
let lastWeekDataHash = '';
let isFirstRender = true;

// 当前选中的日期（默认为今天）
let selectedDateKey = null;

// 生成模拟数据
function getMockData() {
  return {
    chatgpt: { time: 4620, questions: 20 },   // 1小时17分钟
    claude: { time: 2820, questions: 7 },      // 47分钟
    gemini: { time: 5400, questions: 25 },     // 1小时30分钟
    total: { time: 12840, questions: 52 }      // 3小时34分钟
  };
}

// 生成模拟周数据
function getMockWeekData() {
  const days = getLastSevenDays();
  const mockTimes = [7200, 5400, 8100, 3600, 6300, 4500, 12840]; // 模拟每天的秒数

  return days.map((day, index) => ({
    label: day.label,
    time: mockTimes[index],
    date: day.date
  }));
}

// 格式化时间（秒转换为易读格式，以分钟为最小单位）
function formatTime(seconds) {
  const totalMinutes = Math.floor(seconds / 60);

  if (totalMinutes < 1) {
    return '< 1 分钟';
  } else if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
  }
}

// 获取今天的日期字符串
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 获取格式化的日期显示
function getFormattedDate(date = null) {
  const today = new Date();
  const targetDate = date || today;
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  // 判断是否是今天
  if (targetDate.toDateString() === today.toDateString()) {
    return `${month} 月 ${day} 日 今天`;
  }

  // 判断是否是昨天
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (targetDate.toDateString() === yesterday.toDateString()) {
    return `${month} 月 ${day} 日 昨天`;
  }

  // 其他日期显示星期
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month} 月 ${day} 日 ${weekdays[targetDate.getDay()]}`;
}

// 选择日期并加载对应数据
async function selectDate(dateKey, date) {
  selectedDateKey = dateKey;

  // 更新柱状图选中状态（不重绘，只更新样式）
  updateChartSelection(dateKey);

  // 加载选中日期的数据
  const result = await chrome.storage.local.get([dateKey]);
  let dayData = result[dateKey];

  if (!dayData) {
    dayData = {
      date: dateKey,
      chatgpt: { time: 0, questions: 0 },
      gemini: { time: 0, questions: 0 },
      claude: { time: 0, questions: 0 },
      total: { time: 0, questions: 0 }
    };
  }

  // 更新显示（传入日期）
  updateDisplay(dayData, date);
}

// 更新柱状图选中状态（不重绘）
function updateChartSelection(selectedKey) {
  const columns = document.querySelectorAll('.chart-column');
  columns.forEach(col => {
    const barWrapper = col.parentElement;
    const dateKey = barWrapper.dataset.dateKey;

    if (dateKey === selectedKey) {
      col.classList.add('selected');
      col.style.background = 'linear-gradient(180deg, #007AFF 0%, #5856D6 100%)';
    } else {
      col.classList.remove('selected');
      col.style.background = '';
    }
  });
}

// 获取本周的日期（周日到周六）
function getCurrentWeekDays() {
  const days = [];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();

  // 找到本周日（周的起始日）
  const currentDay = today.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDay);

  // 生成周日到周六的7天
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const label = weekdays[i];
    const isFuture = date > today; // 判断是否是未来的日期
    days.push({ key, label, date, isFuture });
  }

  return days;
}

// 加载并显示数据
async function loadData() {
  const todayKey = getTodayKey();

  // 如果没有选中日期或选中的是今天，则显示今天的数据
  const displayKey = selectedDateKey || todayKey;
  const isToday = displayKey === todayKey;

  let displayData;

  if (DEV_MODE) {
    // 开发模式：使用模拟数据
    displayData = getMockData();
  } else {
    // 生产模式：使用真实数据
    const result = await chrome.storage.local.get([displayKey]);
    displayData = result[displayKey];

    // 如果没有数据，初始化默认数据
    if (!displayData) {
      displayData = {
        date: displayKey,
        chatgpt: { time: 0, questions: 0 },
        gemini: { time: 0, questions: 0 },
        claude: { time: 0, questions: 0 },
        total: { time: 0, questions: 0 }
      };
    }
  }

  // 解析日期用于显示
  let displayDate = null;
  if (!isToday && selectedDateKey) {
    const parts = selectedDateKey.split('-');
    displayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  // 更新显示
  updateDisplay(displayData, displayDate);

  // 加载周数据
  loadWeekData();
}

// 加载周数据
async function loadWeekData() {
  let weekData;

  if (DEV_MODE) {
    // 开发模式：使用模拟数据
    weekData = getMockWeekData();
  } else {
    // 生产模式：使用真实数据（周日到周六）
    const days = getCurrentWeekDays();
    const keys = days.map(d => d.key);
    const result = await chrome.storage.local.get(keys);

    weekData = days.map(day => {
      // 未来的日期不显示数据
      if (day.isFuture) {
        return {
          label: day.label,
          time: 0,
          date: day.date,
          isFuture: true
        };
      }

      const data = result[day.key] || {
        total: { time: 0, questions: 0 },
        chatgpt: { time: 0, questions: 0 },
        gemini: { time: 0, questions: 0 },
        claude: { time: 0, questions: 0 }
      };
      return {
        label: day.label,
        time: data.total.time,
        date: day.date,
        isFuture: false
      };
    });
  }

  renderWeeklyChart(weekData);
}

// 渲染周视图柱状图
function renderWeeklyChart(weekData) {
  // 计算数据哈希，检查是否需要重绘
  const dataHash = weekData.map(d => d.time).join(',');
  if (dataHash === lastWeekDataHash) {
    return; // 数据没变化，跳过重绘
  }
  lastWeekDataHash = dataHash;

  const chartContainer = document.getElementById('weeklyChart');
  const shouldAnimate = isFirstRender;
  isFirstRender = false;

  chartContainer.innerHTML = '';

  // 找出最大值用于归一化，并计算合适的时间刻度（只计算非未来日期）
  const pastDays = weekData.filter(d => !d.isFuture);
  const maxTime = Math.max(...pastDays.map(d => d.time), 1);
  const avgTime = pastDays.length > 0
    ? pastDays.reduce((sum, d) => sum + d.time, 0) / pastDays.length
    : 0;

  // 计算时间刻度（向上取整到合适的小时数）
  const maxHours = Math.ceil(maxTime / 3600);
  const scaleMax = Math.max(maxHours, 1); // 至少显示1小时刻度

  // 生成刻度值（0, 1h, 2h, 3h...）
  const ticks = [];
  for (let i = 0; i <= scaleMax; i++) {
    ticks.push(i);
  }

  const chartHeight = 140; // 图表区域高度

  // 创建图表主体容器
  const chartBody = document.createElement('div');
  chartBody.className = 'chart-body';

  // 创建柱状图区域
  const barsArea = document.createElement('div');
  barsArea.className = 'chart-bars-area';

  // 添加水平网格线
  ticks.forEach((tick, index) => {
    if (index === 0) return; // 跳过0刻度的线
    const gridLine = document.createElement('div');
    gridLine.className = 'chart-grid-line';
    const posPercent = (tick / scaleMax) * 100;
    gridLine.style.bottom = `${posPercent}%`;
    barsArea.appendChild(gridLine);
  });

  // 添加平均线
  if (avgTime > 0) {
    const avgLine = document.createElement('div');
    avgLine.className = 'chart-avg-line';
    const avgPercent = (avgTime / (scaleMax * 3600)) * 100;
    avgLine.style.bottom = `${Math.min(avgPercent, 100)}%`;
    barsArea.appendChild(avgLine);
  }

  // 添加柱子
  weekData.forEach(day => {
    const barWrapper = document.createElement('div');
    barWrapper.className = 'chart-bar';

    // 计算日期 key
    const dateKey = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
    barWrapper.dataset.dateKey = dateKey;

    // 未来日期不显示柱子，只显示标签
    if (!day.isFuture) {
      const column = document.createElement('div');
      column.className = shouldAnimate ? 'chart-column animate' : 'chart-column';

      // 计算高度百分比（基于刻度最大值）
      const heightPercent = (day.time / (scaleMax * 3600)) * 100;
      column.style.height = `${Math.max(heightPercent, 2)}%`;

      // 判断是否是今天或选中的日期
      const isToday = day.date.toDateString() === new Date().toDateString();
      const isSelected = selectedDateKey === dateKey || (selectedDateKey === null && isToday);

      if (isSelected) {
        column.style.background = 'linear-gradient(180deg, #007AFF 0%, #5856D6 100%)';
        column.classList.add('selected');
      }

      // 添加点击事件
      barWrapper.style.cursor = 'pointer';
      barWrapper.addEventListener('click', () => {
        selectDate(dateKey, day.date);
      });

      barWrapper.appendChild(column);
    }

    const label = document.createElement('div');
    label.className = day.isFuture ? 'chart-label future' : 'chart-label';
    label.textContent = day.label;

    barWrapper.appendChild(label);
    barsArea.appendChild(barWrapper);
  });

  chartBody.appendChild(barsArea);

  // 创建Y轴刻度
  const yAxis = document.createElement('div');
  yAxis.className = 'chart-y-axis';

  // 从上到下添加刻度标签
  for (let i = ticks.length - 1; i >= 0; i--) {
    const tickLabel = document.createElement('div');
    tickLabel.className = 'chart-tick';
    tickLabel.textContent = ticks[i] === 0 ? '0' : `${ticks[i]}h`;
    yAxis.appendChild(tickLabel);
  }

  chartBody.appendChild(yAxis);
  chartContainer.appendChild(chartBody);

  // 添加平均值说明
  if (avgTime > 0) {
    const avgLabel = document.createElement('div');
    avgLabel.className = 'chart-avg-label';
    avgLabel.textContent = `平均: ${formatTime(Math.round(avgTime))}`;
    chartContainer.appendChild(avgLabel);
  }
}

// 更新显示
function updateDisplay(data, date = null) {
  // 更新日期
  document.getElementById('currentDate').textContent = getFormattedDate(date);

  // 更新总时间
  document.getElementById('totalTime').textContent = formatTime(data.total.time);

  // 更新各平台显示（时间为0则隐藏）
  const platforms = ['chatgpt', 'claude', 'gemini'];
  const usageSections = document.querySelectorAll('.usage-section');
  const timeSection = usageSections[0]; // 第一个是使用时长
  const countSection = usageSections[1]; // 第二个是使用次数

  platforms.forEach(platform => {
    const timeItem = timeSection?.querySelector(`.usage-item.${platform}`);
    const countItem = countSection?.querySelector(`.usage-item.${platform}`);

    // 根据时间是否为0来显示/隐藏使用时长
    if (timeItem) {
      if (data[platform].time > 0) {
        timeItem.style.display = 'flex';
        document.getElementById(`${platform}Time`).textContent = formatTime(data[platform].time);
      } else {
        timeItem.style.display = 'none';
      }
    }

    // 根据次数是否为0来显示/隐藏使用次数
    if (countItem) {
      if (data[platform].questions > 0) {
        countItem.style.display = 'flex';
        document.getElementById(`${platform}Questions`).textContent = `${data[platform].questions} 次`;
      } else {
        countItem.style.display = 'none';
      }
    }
  });

  // 检查是否需要隐藏整个 section（如果所有平台都为0）
  const hasAnyTime = platforms.some(p => data[p].time > 0);
  const hasAnyCount = platforms.some(p => data[p].questions > 0);

  if (timeSection) {
    timeSection.style.display = hasAnyTime ? 'block' : 'none';
  }
  if (countSection) {
    countSection.style.display = hasAnyCount ? 'block' : 'none';
  }

  // 更新进度条
  updateProgressBars(data);
}

// 更新进度条
function updateProgressBars(data) {
  const platforms = ['chatgpt', 'claude', 'gemini'];

  // 使用时长进度条（只计算有数据的平台）
  const maxTime = Math.max(data.chatgpt.time, data.gemini.time, data.claude.time, 1);

  platforms.forEach(platform => {
    const bar = document.getElementById(`${platform}Bar`);
    if (bar && data[platform].time > 0) {
      const percent = (data[platform].time / maxTime) * 100;
      bar.style.width = `${percent}%`;
    }
  });

  // 使用次数进度条（只计算有数据的平台）
  const maxQuestions = Math.max(data.chatgpt.questions, data.gemini.questions, data.claude.questions, 1);

  platforms.forEach(platform => {
    const bar = document.getElementById(`${platform}CountBar`);
    if (bar && data[platform].questions > 0) {
      const percent = (data[platform].questions / maxQuestions) * 100;
      bar.style.width = `${percent}%`;
    }
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载数据
  loadData();

  // 监听存储变化，实时更新
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      const todayKey = getTodayKey();
      if (changes[todayKey]) {
        // 只有在查看今天数据时才更新显示
        if (!selectedDateKey || selectedDateKey === todayKey) {
          updateDisplay(changes[todayKey].newValue);
        }
        // 柱状图始终更新（因为今天的数据在变化）
        loadWeekData();
      }
    }
  });

  // 每秒自动刷新（只刷新今天的数据）
  setInterval(() => {
    const todayKey = getTodayKey();
    // 只有在查看今天数据时才每秒刷新
    if (!selectedDateKey || selectedDateKey === todayKey) {
      loadData();
    }
  }, 1000);
});
