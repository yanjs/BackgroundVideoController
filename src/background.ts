import { Message } from "./types";

const messageFrom = (s: string): Message => {
  return { action: s };
};

const getCurrentTab = () => {
  const queryOptions = { active: true, lastFocusedWindow: true };
  return chrome.tabs.query(queryOptions).then((tabs) => tabs[0]);
};

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["toggle.js"],
  });
});
chrome.commands.onCommand.addListener((command) => {
  getCurrentTab().then((tab) => {
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, messageFrom(command));
  });
});
