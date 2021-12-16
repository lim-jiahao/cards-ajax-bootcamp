import pkg from 'sequelize';

const { Op } = pkg;

export default function initUsersController(db) {
  const login = async (req, res) => {
    try {
      const user = await db.User.findOne({
        where: {
          name: req.body.name,
          email: req.body.email,
        },
      });
      if (!user || user.password !== req.body.password) {
        res.send('Invalid credentials!');
        return;
      }

      const game = await user.getGames({
        where: {
          is_game_over: false,
        },
      });
      const activeGame = game[0];
      const players = await activeGame?.getUsers();

      res.cookie('username', user.name);
      res.cookie('loggedIn', true);
      res.send({
        user,
        id: activeGame?.id,
        player1Cards: activeGame?.gameState.player1Cards,
        player2Cards: activeGame?.gameState.player2Cards,
        gameInProgress: activeGame?.gameState.gameInProgress,
        player1: players?.[0],
        player2: players?.[1],
      });
    } catch (err) {
      res.status(500).send(err);
    }
  };

  const create = async (req, res) => {
    try {
      const userCheck = await db.User.findAll({
        where: {
          [Op.or]: [{ name: req.body.name }, { email: req.body.email }],
        },
      });

      if (userCheck.length > 0) {
        console.log('here');
        res.send('User exists');
        return;
      }

      const user = await db.User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });
      res.cookie('username', user.name);
      res.cookie('loggedIn', true);
      res.send({ user });
    } catch (err) {
      res.status(500).send(err);
    }
  };

  return {
    login, create,
  };
}
