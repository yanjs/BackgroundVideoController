import { Message } from "./types";
import { toggle } from "./toggle";

const messageFrom = (s: string): Message => {
  return { action: s };
};

const getCurrentTab = () => {
  return chrome.storage.sync.get("lastActiveTab").then((result) => {
    if (result.lastActiveTab) {
      return chrome.tabs.get(result.lastActiveTab.id);
    }
    const queryOptions = { active: true, lastFocusedWindow: true };
    return chrome.tabs.query(queryOptions).then((tabs) => tabs[0]);
  });
};

const setIcon = (isInPIP: boolean) => {
  const size = 64;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  
  const icon = new Image();
  if (isInPIP) {
    icon.src = chrome.runtime.getURL('icon_pip.svg');
  } else {
    icon.src = chrome.runtime.getURL('icon.svg');
  }

  ctx.drawImage(icon, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  chrome.action.setIcon({imageData: imageData});
};

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabId = tab.id;
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: toggle,
    })
    .then((results) => {
      const [{result}] = results;
      const isInPIP: boolean = result.isInPIP;

      setIcon(isInPIP);

      chrome.storage.sync.set({ lastActiveTab: tab });
    });
});
chrome.commands.onCommand.addListener((command) => {
  getCurrentTab().then((tab) => {
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, messageFrom(command));
  });
});
