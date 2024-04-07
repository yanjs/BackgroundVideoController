import { isPIPAvailable, isInPIP, getVideo } from "./video";
(() => {
  if (!isPIPAvailable()) {
    return Promise.reject("Picture in Picture not available");
  }
  const v = getVideo();

  if (!v) {
    return Promise.reject("No video element detected");
  }
  if (isInPIP()) {
    return document.exitPictureInPicture();
  } else {
    return v.requestPictureInPicture();
  }
})();
