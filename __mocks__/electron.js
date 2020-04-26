module.exports = {
  require: jest.fn(),
  match: jest.fn(),
  app: jest.fn(),
  remote: {
    app: {
      getVersion: jest.fn()
    }
  },
  dialog: jest.fn(),
  ipcRenderer: {
    on: jest.fn(),
    sendSync: jest.fn()
  }
}
