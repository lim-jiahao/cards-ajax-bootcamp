import db from './models/index.mjs';

import initGamesController from './controllers/games.mjs';
import initUsersController from './controllers/users.mjs';

export default function bindRoutes(app) {
  const GamesController = initGamesController(db);
  const UsersController = initUsersController(db);

  // main page
  app.get('/', GamesController.index);
  // create a new game
  app.post('/games', GamesController.create);
  // update a game with new cards
  app.put('/games/:gameId/:playerId/deal', GamesController.deal);
  app.get('/games/:gameId', GamesController.show);

  app.post('/login', UsersController.login);
  app.post('/register', UsersController.create);

  app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('loggedIn');
    res.send('success');
  });
}
