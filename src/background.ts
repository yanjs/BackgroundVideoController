import { Message } from "./types";

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

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabId = tab.id;
  chrome.scripting
    .executeScript({
      target: { tabId },
      files: ["toggle.js"],
    })
    .then((result) => {
      chrome.storage.sync.set({ lastActiveTab: tab });
    });
});
chrome.commands.onCommand.addListener((command) => {
  getCurrentTab().then((tab) => {
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, messageFrom(command));
  });
});
