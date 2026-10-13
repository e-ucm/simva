// Mock for keycloak-public-key module
module.exports = jest.fn().mockImplementation(() => ({
  fetch: jest.fn()
}));