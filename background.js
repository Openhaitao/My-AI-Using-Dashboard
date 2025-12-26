// 后台服务脚本 - 处理计时和数据存储

let activeTimers = {}; // 存储每个标签页的计时器
let tabStates = {}; // 存储每个标签页的状态

// AI 网站匹配规则
const AI_SITES = {
  'chatgpt': ['chat.openai.com', 'chatgpt.com'],
  'gemini': ['gemini.google.com'],
  'claude': ['claude.ai']
};

// 识别 AI 网站类型
function getAISiteType(url) {
  if (!url) return null;
  
  for (const [type, domains] of Object.entries(AI_SITES)) {
    if (domains.some(domain => url.includes(domain))) {
      return type;
    }
  }
  return null;
}

// 获取今天的日期字符串
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 初始化今天的数据
async function initTodayData() {
  const todayKey = getTodayKey();
  const result = await chrome.storage.local.get([todayKey]);
  
  if (!result[todayKey]) {
    const todayData = {
      date: todayKey,
      chatgpt: { time: 0, questions: 0 },
      gemini: { time: 0, questions: 0 },
      claude: { time: 0, questions: 0 },
      total: { time: 0, questions: 0 }
    };
    await chrome.storage.local.set({ [todayKey]: todayData });
    return todayData;
  }
  
  return result[todayKey];
}

// 开始计时
function startTimer(tabId, aiType) {
  if (activeTimers[tabId]) {
    return; // 已经在计时了
  }
  
  tabStates[tabId] = {
    aiType: aiType,
    startTime: Date.now()
  };
  
  // 每秒更新一次时间
  activeTimers[tabId] = setInterval(async () => {
    const todayKey = getTodayKey();
    const result = await chrome.storage.local.get([todayKey]);
    let todayData = result[todayKey];
    
    if (!todayData) {
      todayData = await initTodayData();
    }
    
    // 增加1秒
    todayData[aiType].time += 1;
    todayData.total.time += 1;
    
    await chrome.storage.local.set({ [todayKey]: todayData });
  }, 1000);
  
  console.log(`Started timer for ${aiType} on tab ${tabId}`);
}

// 停止计时
function stopTimer(tabId) {
  if (activeTimers[tabId]) {
    clearInterval(activeTimers[tabId]);
    delete activeTimers[tabId];
    delete tabStates[tabId];
    console.log(`Stopped timer for tab ${tabId}`);
  }
}

// 监听标签页激活
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  handleTabChange(tab);
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    handleTabChange(tab);
  }
});

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId) => {
  stopTimer(tabId);
});

// 处理标签页变化
async function handleTabChange(tab) {
  // 停止所有其他标签页的计时器
  for (const [tabId] of Object.entries(activeTimers)) {
    if (parseInt(tabId) !== tab.id) {
      stopTimer(parseInt(tabId));
    }
  }
  
  // 检查当前标签页是否是 AI 网站
  const aiType = getAISiteType(tab.url);
  
  if (aiType && tab.active) {
    // 开始计时
    startTimer(tab.id, aiType);
  } else {
    // 停止计时
    stopTimer(tab.id);
  }
}

// 防重复计数机制
let lastQuestionTime = {};
const QUESTION_DEBOUNCE_TIME = 2000; // 2秒内的重复请求将被忽略

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'QUESTION_ASKED') {
    const aiType = message.aiType;
    const currentTime = Date.now();
    
    // 检查是否在防抖时间内
    if (lastQuestionTime[aiType] && (currentTime - lastQuestionTime[aiType]) < QUESTION_DEBOUNCE_TIME) {
      console.log(`Question on ${aiType} ignored (debounced)`);
      return;
    }
    
    // 更新最后提问时间
    lastQuestionTime[aiType] = currentTime;
    
    const todayKey = getTodayKey();
    const result = await chrome.storage.local.get([todayKey]);
    let todayData = result[todayKey];
    
    if (!todayData) {
      todayData = await initTodayData();
    }
    
    // 增加提问次数
    todayData[aiType].questions += 1;
    todayData.total.questions += 1;
    
    await chrome.storage.local.set({ [todayKey]: todayData });
    
    console.log(`Question asked on ${aiType}, total: ${todayData[aiType].questions}`);
  }
});

// 点击插件图标时打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// 初始化
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI Usage Meter installed');
  await initTodayData();
  
  // 检查当前活动标签页
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    handleTabChange(tabs[0]);
  }
});

// 当浏览器启动时，检查当前标签页
chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    handleTabChange(tabs[0]);
  }
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 失去焦点，停止所有计时器
    for (const tabId of Object.keys(activeTimers)) {
      stopTimer(parseInt(tabId));
    }
  } else {
    // 获得焦点，检查当前活动标签页
    const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tabs[0]) {
      handleTabChange(tabs[0]);
    }
  }
});

