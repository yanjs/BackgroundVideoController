import { Message } from "./types";
import { getVideo } from "./video";

const handleMessage = async (msg: Message) => {
  let v: HTMLVideoElement;
  try {
    v = getVideo();
  } catch (e) {
    console.error("Failed to get video: ", e);
    return;
  }

  switch (msg.action) {
    case "pause":
      if (v.paused) {
        try {
          await v.play();
        } catch (e) {
          console.error("Failed to play: ", e);
        }
        return;
      } else {
        return v.pause();
      }
    case "skipForward": {
      const t = await chrome.storage.sync.get({ nextSecs: 10 });
      v.currentTime = v.currentTime + t.nextSecs;
      return;
    }
    case "skipBack": {
      const t = await chrome.storage.sync.get({ prevSecs: 10 });
      v.currentTime = v.currentTime - t.prevSecs;
      return;
    }
    case "speedUp": {
      v.playbackRate = v.playbackRate + 0.25;
      return;
    }
    case "slowDown": {
      if (v.playbackRate <= 0.25) return;
      v.playbackRate = v.playbackRate - 0.25;
      return;
    }
    default:
      console.error("Undefined message: ", msg.action);
  }
};

(() => {
  window.onload = () => {
    chrome.runtime.onMessage.addListener(
      (msg: Message, _sender, _sendResponse) => {
        handleMessage(msg);
        return undefined;
      }
    );
  };
})();
