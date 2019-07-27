const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: 'testuser1',
      password: 'password',
      date_created: new Date('2018-01-01T12:12:12.123Z')
    },
    {
      id: 2,
      user_name: 'testuser2',
      password: 'password',
      date_created: new Date('2018-02-01T12:12:12.123Z')
    },
    {
      id: 3,
      user_name: 'testuser3',
      password: 'password',
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
  ];
}

function makeQuestsArray(users) {
  return [
    {
      id: 1,
      quest_name: 'testquest1',
      quest_desc: 'description',
      completed: true,
      date_created: new Date('2019-01-05T12:12:12.123Z'),
      user_id: users[0].id
    },
    {
      id: 2,
      quest_name: 'testquest2',
      quest_desc: 'description',
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z'),
      user_id: users[1].id
    },
    {
      id: 3,
      quest_name: 'testquest3',
      quest_desc: 'description',
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z'),
      user_id: users[2].id
    },
  ];
} 

function makeTasksArray(users, quests) {
  return [
    {
      id: 1,
      task_name: 'task 1',
      task_desc: 'description',
      user_id: users[0].id,
      quest_id: quests[0].id,
      completed: true,
      date_created: new Date('2019-01-05T12:12:12.123Z'),
      date_modified: new Date('2019-02-05T12:12:12.123Z')
    },
    {
      id: 2,
      task_name: 'task 2',
      task_desc: 'description',
      user_id: users[1].id,
      quest_id: quests[1].id,
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
    {
      id: 3,
      task_name: 'task 3',
      task_desc: 'description',
      user_id: users[1].id,
      quest_id: quests[1].id,
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
    {
      id: 4,
      task_name: 'task 4',
      task_desc: 'description',
      user_id: users[2].id,
      quest_id: quests[2].id,
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
    {
      id: 5,
      task_name: 'task 5',
      task_desc: 'description',
      user_id: users[2].id,
      quest_id: quests[2].id,
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
    {
      id: 6,
      task_name: 'task 6',
      task_desc: 'description',
      user_id: users[0].id,
      quest_id: quests[0].id,
      completed: false,
      date_created: new Date('2019-01-05T12:12:12.123Z')
    },
  ]
}

function makeExpectedQuest(userId, quest, tasks=[]) {
  const total_tasks = tasks
    .filter(task => task.quest_id === quest.id)
    .length;

  return {
    id: quest.id,
    quest_name: quest.quest_name,
    quest_desc: quest.quest_desc,
    completed: quest.completed,
    date_created: quest.date_created.toISOString(),
    date_modified: quest.date_modified ? quest.date_modified : null,
    total_tasks: total_tasks
  }
}

function makeQuestsFixtures() {
  const testUsers = makeUsersArray();
  const testQuests = makeQuestsArray(testUsers);
  const testTasks = makeTasksArray(testUsers, testQuests);
  return { testUsers, testQuests, testTasks }
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
        questify_users,
        questify_quests,
        questify_tasks
      `
    )
    .then(() => 
      Promise.all([
        trx.raw(`ALTER SEQUENCE questify_users_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE questify_quests_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE questify_tasks_id_seq minvalue 0 START WITH 1`),
        trx.raw(`SELECT setval('questify_users_id_seq', 0)`),
        trx.raw(`SELECT setval('questify_quests_id_seq', 0)`),
        trx.raw(`SELECT setval('questify_tasks_id_seq', 0)`),
      ])
    )
  )
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('questify_users').insert(preppedUsers)
    .then(() =>
      db.raw(
        `SELECT setval('questify_users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function seedQuests(db, users, quests, tasks=[]) {
  return db.transaction(async trx => {
    await seedUsers(trx, users)
    await trx.into('questify_quests').insert(quests)
    await trx.raw(
      `SELECT setval('questify_quests_id_seq', ?)`,
      [quests[quests.length - 1].id],
    )
    if (tasks.length) {
      await trx.into('questify_tasks').insert(tasks)
      await trx.raw(
        `SELECT setval('questify_tasks_id_seq', ?)`,
        [tasks[tasks.length - 1].id],
      )
    }
  })
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256',
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeQuestsArray,
  makeTasksArray,
  makeExpectedQuest,

  makeQuestsFixtures,
  cleanTables,
  makeAuthHeader,
  seedUsers,
  seedQuests,
}