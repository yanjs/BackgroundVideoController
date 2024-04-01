import { isPIPAvailable, isInPIP, getVideo } from "./video";
(() => {
  if (!isPIPAvailable()) {
    return;
  }
  const v = getVideo();

  if (!v) return;
  if (isInPIP()) {
    document.exitPictureInPicture();
  } else {
    v.requestPictureInPicture();
  }
})();
