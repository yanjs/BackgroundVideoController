const getInput = (id: string) => {
  return document.getElementById(id) as HTMLInputElement;
};
const getPrevInput = () => {
  return getInput('prev-secs');
};
const getNextInput = () => {
  return getInput('next-secs');
};

const saveOptions = () => {
  const prevSecs = parseInt(getPrevInput().value);
  const nextSecs = parseInt(getNextInput().value);

  chrome.storage.sync.set(
    { prevSecs, nextSecs },
    () => {
      const status = document.getElementById('status') as HTMLDivElement;
      status.style.display = 'block';
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  );
};

const restoreOptions = () => {
  chrome.storage.sync.get({prevSecs: 10, nextSecs: 10}).then((res) => {
    getPrevInput().value = res.prevSecs;
    getNextInput().value = res.nextSecs;
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
getInput('save').addEventListener('click', saveOptions);
