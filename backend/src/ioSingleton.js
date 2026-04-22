let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

export function getIo() {
  return ioRef;
}
