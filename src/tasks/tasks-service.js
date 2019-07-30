const xss = require('xss');

const TasksService = {
  getTaskById(db, id) {
    return db
      .from('questify_tasks')
      .select('*')
      .where('id', id)
      .first()
  },
  insertTask(db, newTask) {
    return db
      .insert(newTask)
      .into('questify_tasks')
      .returning('*')
      .then(([task]) => task)
      .then(task => 
        TasksService.getTaskById(db, task.id)  
      )
  },
  updateTask(db, id, newFields) {
    return db
      .from('questify_tasks')
      .where('id', id)
      .update(newFields)
  },
  deleteTask(db, id) {
    return db
      .from('questify_tasks')
      .where('id', id)
      .delete()
  },
  scrubTask(task) {
    return {
      id: task.id,
      task_name: xss(task.task_name),
      task_desc: xss(task.task_desc),
      date_created: new Date(task.date_created),
      date_modified: task.date_modified ? new Date(task.date_modified) : null,
      completed: task.completed,
      quest_id: task.quest_id,
      user_id: task.user_id
    }
  },
}

module.exports = TasksService;