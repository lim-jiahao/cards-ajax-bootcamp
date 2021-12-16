module.exports = {
  up: async (queryInterface) => {
    const userList = [
      {
        name: 'test',
        email: 'test@test.com',
        password: 'test',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'test2',
        email: 'test2@test.com',
        password: 'test2',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('users', userList);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
