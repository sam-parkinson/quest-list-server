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
      
      it('responds with 200 and all quests associated with a user ID', () => {
        const expectedQuest = helpers.makeExpectedQuest(
          testQuests[0],
          testTasks
        );
        return supertest(app)
          .get('/api/quests')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, [ expectedQuest ])
      });
    });
  });

  describe(`GET /api/quests/:quest_id`, () => {
    context('Given quest and tasks', () => {
      beforeEach('insert quests', () => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks,
        )
      )

      it(`responds with 200, the given quest, and all associated tasks`, () => {
        const expectedJson = {
          quest: helpers.makeExpectedQuest(
            testQuests[0],
            testTasks,
          ),
          tasks: helpers.makeExpectedTasks(
            testQuests[0].id,
            testTasks
          ),
        }
        return supertest(app)
          .get(`/api/quests/${testQuests[0].id}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedJson)
      })
    })
  })
});