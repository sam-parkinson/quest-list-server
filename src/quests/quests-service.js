const xss = require('xss');

const QuestsService = {
  getAllUserQuests(db, user_id) {
    return db
      .from('questify_quests AS quests')
      .where('quests.user_id', user_id)
      .select(
        'quests.id',
        'quests.quest_name',
        'quests.quest_desc',
        'quests.date_created',
        'quests.date_modified',
        'quests.completed',
        db.raw(
          `count(DISTINCT tasks) AS total_tasks` 
        ),
        db.raw(
          `COALESCE(sum(CASE WHEN tasks.completed THEN 1 ELSE 0 END), 0) AS tasks_completed`
        ),
      )
      .leftJoin(
        'questify_tasks AS tasks',
        'quests.id',
        'tasks.quest_id'
      )
      .groupBy('quests.id')
  },

  getById(db, user_id, quest_id) {
    return QuestsService.getAllUserQuests(db, user_id)
      .where('quests.id', quest_id)
      .first()
  },

  insertQuest(db, newQuest) {
    return db
      .insert(newQuest)
      .into('questify_quests')
      .returning('*')
      .then(([quest]) => quest)
      .then(quest => 
        QuestsService.getById(db, quest.user_id, quest.id)  
      )
  },

  scrubQuest(quest) {
    return {
      id: quest.id,
      quest_name: xss(quest.quest_name),
      quest_desc: xss(quest.quest_desc),
      date_created: new Date(quest.date_created),
      date_modified: quest.date_modified ? new Date(quest.date_modified) : null,
      completed: quest.completed,
      total_tasks: Number(quest.total_tasks),
      completed_tasks: quest.completed_tasks
    }
  }
};

module.exports = QuestsService;