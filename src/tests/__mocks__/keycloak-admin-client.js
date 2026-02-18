class KcAdminClient {
  constructor() {
    this.users = {
      find: async () => [],
      create: async () => ({}),
      del: async () => undefined,
      update: async () => undefined,
      count: async () => 0,
    };
    this.groups = {
      find: async () => [],
      create: async () => ({}),
      del: async () => undefined,
      listMembers: async () => [],
    };
  }

  async auth() {
    return undefined;
  }
}

module.exports = KcAdminClient;
module.exports.default = KcAdminClient;
