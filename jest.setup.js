module.exports = () => {
  globalThis.currentTime = Date.now();
  globalThis.currentTimeString = new Date().toUTCString();
  globalThis.timeCurrent = Date.now();
  globalThis.isTester = () => true;
  globalThis.tms = () => Date.now();
  globalThis.close = () => jest.fn();
};
