const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Quest Endpoints', function() {
  let db;

  const {
    testUsers,
    testQuests,
    testTasks,
  } = helpers.makeQuestsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  })

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`GET /api/quests`, () => {
    context(`Given no quests`, () => {
      beforeEach(() => 
        helpers.seedUsers(db, testUsers)
      )

      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/quests')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context('Given that there are quests in the database', () => {
      beforeEach('insert quests', () => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks,
        )
      )
    })
  });
});