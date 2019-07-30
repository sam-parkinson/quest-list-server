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
      });
    });
  });

  describe(`POST /api/quests`, () => {
    beforeEach(() => helpers.seedUsers(db, testUsers));

    it(`creates a new quest, responding with 201 and the quest`, () => {      
      this.retries(3);
      const testUser = testUsers[0];
      const newQuest = {
        quest_name: 'newQuestName',
        quest_desc: 'new quest description',        
      }

      return supertest(app)
        .post('/api/quests')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .send(newQuest)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.quest_name).to.eql(newQuest.quest_name)
          expect(res.body.quest_desc).to.eql(newQuest.quest_desc)
          expect(res.headers.location).to.eql(`/api/quests/${res.body.id}`)
          const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
          const actualDate = new Date(res.body.date_created).toLocaleString()
          expect(actualDate).to.eql(expectedDate)
        })
        .expect(res =>
          db
            .from('questify_quests')
            .select('*')
            .where({ id: res.body.id })  
            .first()
            .then(row => {
              expect(row.quest_name).to.eql(newQuest.quest_name)
              expect(row.quest_desc).to.eql(newQuest.quest_desc)
              expect(row.user_id).to.eql(testUser.id)
            })
        )
    });
  });

  describe(`PATCH /api/quests/:quest_id`, () => {
    context('Given there are quests in the database', () => {
      beforeEach('insert quests', () => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks
        )
      )

      it(`responds with 204 and updates the quest`, () => {
        const idToUpdate = 2;
        const updateQuest = {
          quest_desc: 'Updated description'
        }
        const expectedQuest = {
          ...testQuests[idToUpdate - 1],
          ...updateQuest
        }
        return supertest(app)
          .patch(`/api/quests/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
          .send(updateQuest)
          .expect(204)
          .expect(res =>
            db
              .from('questify_quests')
              .select('*')
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.quest_name).to.eql(expectedQuest.quest_name)
                expect(row.quest_desc).to.eql(expectedQuest.quest_desc)
              })  
          )
      });

      it(`responds with 400 when no info supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
        .patch(`/api/quests/${idToUpdate}`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
        .send({ random: 'Rover' })
        .expect(400)
      });
    });
  });

  describe(`DELETE /api/quests/:quest_id`, () => {
    context(`Given there are quests in the database`, () => {
      beforeEach('insert quests', () => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
        )
      );

      it('responds with 204 and removes the quest', () => {
        const idToRemove = 2;
        const expectedQuests = testQuests.filter(quest => quest.id !== idToRemove);
        return supertest(app)
          .delete(`/api/quests/${idToRemove}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
          .expect(204)
          .expect(res => 
            db
              .from('questify_quests')
              .select('*')
              .then(table => {             
                console.log(table)
                expect(table).to.eql(expectedQuests)                  
              })  
          )
      });
    });
  });
});