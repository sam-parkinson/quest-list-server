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
  })


module.exports = questRouter;