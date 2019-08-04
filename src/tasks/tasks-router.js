const express = require('express');
const xss = require('xss');
const path = require('path');
const TasksService = require('./tasks-service');
const { requireAuth } = require('../middleware/jwt-auth');

const tasksRouter = express.Router();
const jsonBodyParser = express.json();

tasksRouter
  .route('/')
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { quest_id, task_name, task_desc } = req.body;
    const newTask = {
      quest_id, 
      task_name: xss(task_name), 
      task_desc: xss(task_desc),
    };

    for (const [key, value] of Object.entries(newTask))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });

    newTask.user_id = req.user.id;

    TasksService.insertTask(
      req.app.get('db'),
      newTask
    )
      .then(task => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${task.id}`))
          .json(TasksService.scrubTask(task))
      })
      .catch(next)
  });

tasksRouter
  .route('/:task_id')
  .all(requireAuth)
  .get((req, res, next) => {
    TasksService.getTaskById(
      req.app.get('db'),
      req.params.task_id,
    )
      .then(task => {
        res.json(TasksService.scrubTask(task))
      })
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { task_name, task_desc, completed } = req.body;
    const taskToUpdate = {
      task_name,
      task_desc,
      completed
    };

    const numberOfValues = Object.values(taskToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `No values submitted for update`
        }
      })
    }

    TasksService.updateTask(
      req.app.get('db'),
      req.params.task_id,
      taskToUpdate
    )
      .then(num => {
        res.status(204).end()
      })
      .catch(next)
  })
  .delete((req, res, next) => {
    TasksService.deleteTask(
      req.app.get('db'),
      req.params.task_id
    )
      .then(() => {
        res.status(204).end()
      })
  })

module.exports = tasksRouter;