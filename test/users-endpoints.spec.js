const knex = require('knex');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Users Endpoints', function() {
  let db;

  const { testUsers } = helpers.makeQuestsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () => 
        helpers.seedUsers(
          db,
          testUsers,
        )
      );

      const requiredFields = [ 'user_name', 'password' ]

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          password: 'test password',
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            });
        });
      });

      it(`responds 400 and error when short password`, () => {
        const userShortPW = {
          user_name: 'test user_name',
          password: '132123',
        }
        return supertest(app)
          .post('/api/users')
          .send(userShortPW)
          .expect(400, {
            error: 'Password must be at least eight characters'
          });
      });

      it(`responds 400 and error when long password`, () => {
        const userLongPW = {
          user_name: 'test user_name',
          password: '*'.repeat(73),
        }
        return supertest(app)
          .post('/api/users')
          .send(userLongPW)
          .expect(400, {
            error: 'Password must be no more than 72 characters'
          });
      });

      it(`responds 400 and error when password starts with space`, () => {
        const userPWStartsSpace = {
          user_name: 'test user_name',
          password: ' 1324343123',
        }
        return supertest(app)
          .post('/api/users')
          .send(userPWStartsSpace)
          .expect(400, {
            error: 'Password must not start or end with empty spaces'
          });
      });

      it(`responds 400 and error when password starts with space`, () => {
        const userPWEndsSpace = {
          user_name: 'test user_name',
          password: '432132123 ',
        }
        return supertest(app)
          .post('/api/users')
          .send(userPWEndsSpace)
          .expect(400, {
            error: 'Password must not start or end with empty spaces'
          });
      });
    });
  });
});
