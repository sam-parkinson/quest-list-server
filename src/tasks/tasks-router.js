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
  .patch()
  .delete()

module.exports = tasksRouter;