import { isPIPAvailable, isInPIP, getVideo } from "./video";
export function toggle() {
  if (!isPIPAvailable()) {
    return Promise.reject({ isInPIP: false });
  }
  const v = getVideo();

  if (!v) {
    return Promise.reject({ isInPIP: false });
  }
  if (isInPIP()) {
    return document.exitPictureInPicture().then(() => {
      return Promise.resolve({ isInPIP: false });
    }).catch(() => {
      return Promise.reject({ isInPIP: false });
    })
  } else {
    return v.requestPictureInPicture().then(() => {
      return Promise.resolve({ isInPIP: true });
    }).catch(() => {
      return Promise.reject({ isInPIP: false });
    });
  }
};