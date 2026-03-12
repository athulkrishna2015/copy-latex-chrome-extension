import './settings.js';

const MENU_ID = 'copy-selection-with-addon';
const COMMAND_ID = 'copy-selection-with-addon';
let menuRefresh = Promise.resolve();

async function getStoredSettings() {
  const stored = await chrome.storage.local.get(CopyLatexSettings.storageKeys);
  return CopyLatexSettings.merge(stored);
}

async function ensureContextMenu() {
  const settings = await getStoredSettings();

  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: CopyLatexSettings.getSelectionMenuTitle(settings),
    contexts: ['selection']
  });
}

function scheduleContextMenuRefresh() {
  menuRefresh = menuRefresh
    .catch(() => {})
    .then(() => ensureContextMenu());
  return menuRefresh;
}

async function requestSelectionCopy(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'copy-selection-with-addon'
    });

    if (!response?.ok) {
      console.error('[Copy LaTeX] Copy failed:', response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('[Copy LaTeX] Failed to message content script:', error);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await scheduleContextMenuRefresh();
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleContextMenuRefresh();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  const changedKeys = Object.keys(changes);
  if (changedKeys.some((key) => CopyLatexSettings.storageKeys.includes(key))) {
    scheduleContextMenuRefresh();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) {
    return;
  }

  await requestSelectionCopy(tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_ID) {
    return;
  }

  const settings = await getStoredSettings();
  if (!settings.enableCustomCopyShortcut) {
    return;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (tab?.id) {
    await requestSelectionCopy(tab.id);
  }
});
