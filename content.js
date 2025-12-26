// 内容脚本 - 监听用户提问

// 识别当前网站类型
function getCurrentAIType() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  }
  
  return null;
}

// 发送提问消息到后台
function notifyQuestionAsked(aiType) {
  // 检查 chrome.runtime 是否可用
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.log('Extension context invalidated. Please reload the page.');
    return;
  }
  
  try {
    chrome.runtime.sendMessage({
      type: 'QUESTION_ASKED',
      aiType: aiType
    }, (response) => {
      // 检查是否有错误
      if (chrome.runtime.lastError) {
        console.log('Message sending error:', chrome.runtime.lastError.message);
      } else {
        console.log(`Question detected on ${aiType}`);
      }
    });
  } catch (error) {
    console.log('Failed to send message:', error);
  }
}

// 监听 ChatGPT 的提问
function monitorChatGPT() {
  let trackedMessageIds = new Set();
  let isInitialized = false;
  let initializationAttempts = 0;
  let previousCount = 0;
  let debounceTimer = null; // 添加防抖定时器
  
  // 为消息生成唯一ID
  function getMessageId(element) {
    const text = element.textContent?.trim().substring(0, 50) || '';
    const dataTestid = element.getAttribute('data-testid') || '';
    const messageId = element.getAttribute('data-message-id') || '';
    return `${text}-${dataTestid}-${messageId}`;
  }
  
  // 初始化消息追踪
  function initializeMessageTracking() {
    const messages = document.querySelectorAll('[data-message-author-role="user"]');
    const currentCount = messages.length;
    
    initializationAttempts++;
    console.log(`ChatGPT: Initialization attempt ${initializationAttempts}, found ${currentCount} messages`);
    
    // 如果消息数量稳定或已达到最大尝试次数
    if ((currentCount === previousCount && initializationAttempts > 1) || initializationAttempts >= 4) {
      trackedMessageIds.clear();
      messages.forEach(msg => {
        const id = getMessageId(msg);
        trackedMessageIds.add(id);
      });
      
      isInitialized = true;
      console.log(`ChatGPT: Initialization complete with ${trackedMessageIds.size} existing messages`);
    } else {
      previousCount = currentCount;
      setTimeout(initializeMessageTracking, 1000);
    }
  }
  
  // 延迟开始初始化
  setTimeout(initializeMessageTracking, 2000);
  
  const observer = new MutationObserver(() => {
    if (!isInitialized) {
      return;
    }
    
    // 使用防抖，避免频繁触发
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
      
      let newMessageIds = [];
      userMessages.forEach(msg => {
        const id = getMessageId(msg);
        if (!trackedMessageIds.has(id)) {
          console.log(`ChatGPT: New message detected`);
          trackedMessageIds.add(id);
          newMessageIds.push(id);
        }
      });
      
      if (newMessageIds.length > 0) {
        console.log(`ChatGPT: ${newMessageIds.length} new message(s) detected, total tracked: ${trackedMessageIds.size}`);
        notifyQuestionAsked('chatgpt');
      }
    }, 500); // 500ms 防抖延迟
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('ChatGPT monitoring started with advanced message tracking');
}

// 监听 Gemini 的提问 - 监听发送动作而不是DOM变化
function monitorGemini() {
  let lastSentMessage = '';
  let lastSendTime = 0;
  const SEND_DEBOUNCE_TIME = 1000; // 1秒内的重复发送将被忽略
  
  console.log('Gemini: Starting send action monitoring...');
  
  // 监听键盘事件 (Enter 键发送)
  document.addEventListener('keydown', (event) => {
    // 检查是否按下 Enter (不是 Shift+Enter)
    if (event.key === 'Enter' && !event.shiftKey) {
      const target = event.target;
      
      // 检查是否在输入框中
      if (target.tagName === 'TEXTAREA' || 
          target.tagName === 'INPUT' || 
          target.contentEditable === 'true' ||
          target.getAttribute('contenteditable') === 'true') {
        
        const text = (target.value || target.textContent || '').trim();
        
        // 如果有文本内容，认为是一次提问
        if (text.length > 0) {
          const currentTime = Date.now();
          
          // 防止重复计数（1秒内的相同消息）
          if (text !== lastSentMessage || (currentTime - lastSendTime) > SEND_DEBOUNCE_TIME) {
            lastSentMessage = text;
            lastSendTime = currentTime;
            
            console.log(`Gemini: User sent message via Enter key`);
            
            // 延迟通知，确保消息已发送
            setTimeout(() => {
              notifyQuestionAsked('gemini');
            }, 300);
          }
        }
      }
    }
  }, true); // 使用捕获阶段
  
  // 监听鼠标点击事件（发送按钮）
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // 查找是否点击了按钮
    const button = target.closest('button');
    
    if (button) {
      // 尝试查找附近的输入框
      let textarea = document.querySelector('rich-textarea textarea');
      if (!textarea) {
        textarea = document.querySelector('textarea');
      }
      if (!textarea) {
        textarea = document.querySelector('[contenteditable="true"]');
      }
      
      if (textarea) {
        const text = (textarea.value || textarea.textContent || '').trim();
        
        if (text.length > 0) {
          const currentTime = Date.now();
          
          // 防止重复计数
          if (text !== lastSentMessage || (currentTime - lastSendTime) > SEND_DEBOUNCE_TIME) {
            lastSentMessage = text;
            lastSendTime = currentTime;
            
            console.log(`Gemini: User sent message via button click`);
            
            // 延迟通知，确保消息已发送
            setTimeout(() => {
              notifyQuestionAsked('gemini');
            }, 300);
          }
        }
      }
    }
  }, true); // 使用捕获阶段
  
  console.log('Gemini: Send action monitoring started (Enter key + button click)');
}

// 监听 Claude 的提问
function monitorClaude() {
  let trackedMessageIds = new Set();
  let isInitialized = false;
  let initializationAttempts = 0;
  let previousCount = 0;
  let debounceTimer = null; // 添加防抖定时器
  
  // 获取有效的用户消息
  function getUserMessages() {
    const userMessages = document.querySelectorAll('[class*="user"], [data-is-user="true"]');
    return Array.from(userMessages).filter(msg => {
      const text = msg.textContent?.trim();
      return text && text.length > 0;
    });
  }
  
  // 为消息生成唯一ID
  function getMessageId(element) {
    const text = element.textContent?.trim().substring(0, 50) || '';
    const classList = element.className || '';
    const isUser = element.getAttribute('data-is-user') || '';
    return `${text}-${classList}-${isUser}`;
  }
  
  // 初始化消息追踪
  function initializeMessageTracking() {
    const messages = getUserMessages();
    const currentCount = messages.length;
    
    initializationAttempts++;
    console.log(`Claude: Initialization attempt ${initializationAttempts}, found ${currentCount} messages`);
    
    // 如果消息数量稳定或已达到最大尝试次数
    if ((currentCount === previousCount && initializationAttempts > 1) || initializationAttempts >= 4) {
      trackedMessageIds.clear();
      messages.forEach(msg => {
        const id = getMessageId(msg);
        trackedMessageIds.add(id);
      });
      
      isInitialized = true;
      console.log(`Claude: Initialization complete with ${trackedMessageIds.size} existing messages`);
    } else {
      previousCount = currentCount;
      setTimeout(initializeMessageTracking, 1000);
    }
  }
  
  // 延迟开始初始化
  setTimeout(initializeMessageTracking, 2000);
  
  const observer = new MutationObserver(() => {
    if (!isInitialized) {
      return;
    }
    
    // 使用防抖，避免频繁触发
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      const validMessages = getUserMessages();
      
      let newMessageIds = [];
      validMessages.forEach(msg => {
        const id = getMessageId(msg);
        if (!trackedMessageIds.has(id)) {
          console.log(`Claude: New message detected`);
          trackedMessageIds.add(id);
          newMessageIds.push(id);
        }
      });
      
      if (newMessageIds.length > 0) {
        console.log(`Claude: ${newMessageIds.length} new message(s) detected, total tracked: ${trackedMessageIds.size}`);
        notifyQuestionAsked('claude');
      }
    }, 500); // 500ms 防抖延迟
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Claude monitoring started with advanced message tracking');
}

// 通用监听器 - 监听发送按钮点击或回车键
function setupGenericMonitoring(aiType) {
  let questionCount = 0;
  
  // 监听键盘事件 (Enter 键)
  document.addEventListener('keydown', (event) => {
    // 检查是否在输入框中按下 Enter (不是 Shift+Enter)
    if (event.key === 'Enter' && !event.shiftKey) {
      const target = event.target;
      
      // 检查是否是文本输入区域
      if (target.tagName === 'TEXTAREA' || 
          target.tagName === 'INPUT' || 
          target.contentEditable === 'true') {
        
        const text = target.value || target.textContent || '';
        
        // 如果有文本内容，认为是一次提问
        if (text.trim().length > 0) {
          setTimeout(() => {
            notifyQuestionAsked(aiType);
          }, 500); // 延迟一点，确保消息已发送
        }
      }
    }
  });
  
  // 监听发送按钮点击
  document.addEventListener('click', (event) => {
    const target = event.target;
    const button = target.closest('button');
    
    if (button) {
      // 查找附近的输入框
      const form = button.closest('form');
      if (form) {
        const textarea = form.querySelector('textarea');
        const input = form.querySelector('input[type="text"]');
        const contentEditable = form.querySelector('[contenteditable="true"]');
        
        const inputElement = textarea || input || contentEditable;
        
        if (inputElement) {
          const text = inputElement.value || inputElement.textContent || '';
          
          if (text.trim().length > 0) {
            setTimeout(() => {
              notifyQuestionAsked(aiType);
            }, 500);
          }
        }
      }
    }
  });
}

// 初始化监听
function init() {
  // 检查扩展上下文是否有效
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.log('AI Usage Meter: Extension context not available. Please reload the page after enabling the extension.');
    return;
  }
  
  const aiType = getCurrentAIType();
  
  if (!aiType) {
    console.log('Not on a supported AI website');
    return;
  }
  
  console.log(`AI Usage Meter: Monitoring ${aiType}`);
  
  // 根据不同的 AI 网站使用不同的监听策略
  if (aiType === 'chatgpt') {
    monitorChatGPT();
  } else if (aiType === 'gemini') {
    monitorGemini();
  } else if (aiType === 'claude') {
    monitorClaude();
  }
  
  // 移除通用监听，避免重复计数
  // setupGenericMonitoring(aiType);
}

// 等待页面加载完成后初始化
let initRetryCount = 0;
const MAX_INIT_RETRIES = 5;

function safeInit() {
  // 检查扩展上下文，如果不可用就延迟重试
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    initRetryCount++;
    if (initRetryCount < MAX_INIT_RETRIES) {
      console.log(`AI Usage Meter: Waiting for extension context... (attempt ${initRetryCount}/${MAX_INIT_RETRIES})`);
      setTimeout(safeInit, 1000);
    } else {
      console.log('AI Usage Meter: Failed to initialize after multiple attempts. Please reload the page.');
    }
    return;
  }
  
  init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}

