import { Message } from "./types";
import { getVideo } from "./video";

(() => {
  window.onload = () => {
    chrome.runtime.onMessage.addListener((msg: Message, sender, resp) => {
      const v = getVideo();
      if (!v) return;
      switch (msg.action) {
        case "pause":
          if (v.paused) {
            v.play();
          } else {
            v.pause();
          }
          break;
        case "skipForward":
          chrome.storage.sync.get({"nextSecs": 10}).then((t) => {
            v.currentTime = v.currentTime + t.nextSecs;
          });
          break;
        case "skipBack":
          chrome.storage.sync.get({"prevSecs": 10}).then((t) => {
            v.currentTime = v.currentTime - t.prevSecs;
          });
          break;
        default:
          console.log("Undefined message: ", msg.action);
      }
      return undefined;
    });
  };
})();
