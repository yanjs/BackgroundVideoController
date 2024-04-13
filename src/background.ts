import { Message, ToggleResult } from "./types";
import { isPIPAvailable, getVideo, isInPIP as getIsInPIP } from "./video";

const actionMessage = (s: string): Message => {
  return { action: s };
};

const getCurrentTab = async () => {
  const result = await chrome.storage.sync.get("lastActiveTab");
  if (result.lastActiveTab) {
    const tab = await chrome.tabs.get(result.lastActiveTab.id);
    if (tab) {
      return tab;
    }
  }
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  if (!tab) {
    throw new Error("No tab found");
  }
  return tab;
};

const setIcon = async (isInPIP: boolean) => {
  await chrome.action.setIcon({ path: isInPIP ? "icon_pip.png" : "icon.png" });
};

const toggle = async (): Promise<ToggleResult> => {
  let isInPIP = false;
  let isSuccessful = false;
  if (!isPIPAvailable()) {
    return { isInPIP, isSuccessful };
  }
  let v: HTMLVideoElement;
  try {
    v = getVideo();
  } catch {
    return { isInPIP, isSuccessful };
  }

  if (getIsInPIP()) {
    isInPIP = true;
    try {
      await document.exitPictureInPicture();
      isInPIP = false;
      isSuccessful = true;
      return { isInPIP, isSuccessful };
    } catch {
      return { isInPIP, isSuccessful };
    }
  } else {
    try {
      await v.requestPictureInPicture();
      isInPIP = true;
      isSuccessful = true;
      return { isInPIP, isSuccessful };
    } catch {
      return { isInPIP, isSuccessful };
    }
  }
};

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const tabId = tab.id;
  const [injectionResult] = await chrome.scripting.executeScript({
    target: { tabId },
    func: toggle,
  });

  const result: ToggleResult | undefined = injectionResult.result;
  if (!result) {
    console.error(
      "Failed to execute script, injection result: ",
      injectionResult
    );
    return;
  }
  const isInPIP = result.isInPIP;

  const setIconPromise = setIcon(isInPIP);
  const saveLastActiveTabPromise = chrome.storage.sync.set({
    lastActiveTab: tab,
  });
  await Promise.all([setIconPromise, saveLastActiveTabPromise]);
});

chrome.commands.onCommand.addListener(async (command) => {
  const tab = await getCurrentTab();
  if (!tab.id) return;
  await chrome.tabs.sendMessage(tab.id, actionMessage(command));
});
