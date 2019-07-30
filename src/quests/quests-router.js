const express = require('express');
const xss = require('xss');
const path = require('path');
const QuestsService = require('./quests-service');
const { requireAuth } = require('../middleware/jwt-auth');

const questRouter = express.Router();
const jsonBodyParser = express.json();

/*
  TODO

  Get all quests matching user ID
  Get all tasks matching quest ID and user ID
  Post new quests

*/

questRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    QuestsService.getAllUserQuests(
      req.app.get('db'),
      req.user.id
    )
      .then(quests => {
        res.json(quests.map(QuestsService.scrubQuest))
      })
      .catch(next)
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { quest_name, quest_desc } = req.body;
    const newQuest = { 
      quest_name: xss(quest_name), 
      quest_desc: xss(quest_desc) 
    }

    for (const [key, value] of Object.entries(newQuest))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })   
        
    newQuest.user_id = req.user.id

    QuestsService.insertQuest(
      req.app.get('db'),
      newQuest
    )
      .then(quest => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${quest.id}`))
          .json(QuestsService.scrubQuest(quest))
      })      
  })

questRouter
  .route('/:quest_id')
  .all(requireAuth)
  .all(checkQuestExists)
  .get((req, res, next) => {
    QuestsService.getTasksByQuestId(
      req.app.get('db'),
      req.params.quest_id,
    )
      .then(tasks => {
        res.json({
          quest: res.quest,
          tasks: tasks.map(task => QuestsService.scrubTask(task))
        })
      })
      .catch(next)
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { quest_name, quest_desc, completed } = req.body;
    const questToUpdate = {
      quest_name: xss(quest_name), 
      quest_desc: xss(quest_desc), 
      completed 
    };

    const numberOfValues = Object.values(questToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `No values submitted for update`
        }
      })
    }

    QuestsService.updateQuest(
      req.app.get('db'),
      req.params.quest_id,
      questToUpdate
    )
      .then(num => {
        res.status(204).end()
      })
      .catch(next)
  }) 

async function checkQuestExists(req, res, next) {
  try{
    const rawQuest = await QuestsService.getQuestById(
      req.app.get('db'),
      req.user.id,
      req.params.quest_id,
    )

    if (!rawQuest)
      return res.status(404).json({
        error: `Quest not found`
      })

    const quest = QuestsService.scrubQuest(rawQuest)

    res.quest = quest
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = questRouter;