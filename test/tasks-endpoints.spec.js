const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Tasks Endpoints', function() {
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
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`GET /api/tasks/:task_id`, () => {
    context('Given there are tasks in the database', () => {
      beforeEach(() => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks
        )
      )

      it(`responds with the expected task`, () => {
        const expectedTasks = helpers.makeExpectedTasks(1, testTasks);

        return supertest(app)
          .get(`/api/tasks/${testTasks[5].id}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedTasks[1]);
      });
    });
  });

  describe(`POST /api/tasks`, () => {
    beforeEach(() =>
      helpers.seedQuests(
        db,
        testUsers,
        testQuests,
        testTasks
      )
    )

    it(`creates a new task, responding with 201 and the task`, () => {
      this.retries(3);
      const testUser = testUsers[0];
      const newTask = {
        task_name: 'newTask',
        task_desc: 'new task description',
        quest_id: 1,
      }
      return supertest(app)
        .post(`/api/tasks`)
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .send(newTask)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.task_name).to.eql(newTask.task_name)
          expect(res.body.task_desc).to.eql(newTask.task_desc)
          expect(res.headers.location).to.eql(`/api/tasks/${res.body.id}`)
          const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
          const actualDate = new Date(res.body.date_created).toLocaleString()
          expect(actualDate).to.eql(expectedDate)
        })
        .expect(res =>
          db
            .from('questify_tasks')
            .select('*')
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.task_name).to.eql(newTask.task_name)
              expect(row.task_desc).to.eql(newTask.task_desc)
              expect(row.quest_id).to.eql(newTask.quest_id)
              expect(row.user_id).to.eql(testUser.id)
            })  
        )
    })
  });

  describe(`PATCH /api/tasks/:task_id`, () => {
    context('Given there are tasks in the database', () => {
      beforeEach('insert quests', () => 
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks
        )
      )

      it('responds with 204 and updates the task', () => {
        const idToUpdate = 2;
        const updateTask = {
          task_desc: 'Updated description',
          completed: true
        }
        const expectedTask = {
          ...testTasks[idToUpdate - 1],
          ...updateTask
        }
        return supertest(app)
          .patch(`/api/tasks/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
          .send(updateTask)
          .expect(204)
          .expect(res => 
            db
              .from('questify_tasks')
              .select('*')
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.task_name).to.eql(expectedTask.task_name)
                expect(row.task_desc).to.eql(expectedTask.task_desc)
                expect(row.quest_id).to.eql(expectedTask.quest_id)
                expect(row.user_id).to.eql(testUsers[1].id)
                expect(row.completed).to.eql(expectedTask.completed)
              })
          );
      });
    });
  });

  describe(`DELETE /api/tasks/:task_id`, () => {
    context(`Given there are tasks in the database`, () => {
      beforeEach('insert quests', () =>
        helpers.seedQuests(
          db,
          testUsers,
          testQuests,
          testTasks
        )
      );

      it('responds with 204 and removes the task', () => {
        const idToRemove = 2;
        const expectedTasks = testTasks.filter(task => task.id !== idToRemove);
        return supertest(app)
          .delete(`/api/tasks/${idToRemove}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
          .expect(204)
          .expect(res =>
            db
              .from('questify_tasks')
              .select('*') 
              .then(table => {
                console.log(table);
                expect(table).to.eql(expectedTasks);
              }) 
          )
      });
    });
  });
});
