
export const getVideo = () => {
  const availableVideos =  Array.from(document.getElementsByTagName("video"))
    .filter((e) => e.readyState)
    .filter((e) => !e.disablePictureInPicture);
  if (availableVideos.length === 0) throw new Error("No video found");

  const getSize = (v: HTMLVideoElement) => {
    const bound = v.getBoundingClientRect();
    return bound.width * bound.height;
  };
  return availableVideos.reduce((v1, v2) => {
    if (getSize(v1) > getSize(v2)) {
      return v1;
    }
    return v2;
  });
};
export const isInPIP = () => {
  if (document.pictureInPictureElement) {
    return true;
  }
  return false;
};
export const isPIPAvailable = () => {
  if (document.pictureInPictureEnabled) {
    return true;
  }
  return false;
};
