# Questify API

The API for Questify, an app designed to enable users to get things done by taking ordinary items and turning them into quests, much like those one might find in an RPG

## API Documentation

RESTful API featuring the following endpoints:

  - Auth
    Accepts post requests for login and refresh endpoints, returns an auth token

  - Users
    Accepts post requests for register endpoint, adds new user to DB
    
  - Quests
    Accepts get, post, patch, and delete requests, adds new quests, updates information about quests, and deletes quests
    
  - Tasks
    Accepts get, post, patch, and delete requests, adds new tasks, updates information about tasks, and deletes tasks

## Client

Live: https://questify-app.parkinsonsp42.now.sh

Repo: https://github.com/sam-parkinson/questify-client

## Technology Used

Node.js, Express, PostgreSQL
