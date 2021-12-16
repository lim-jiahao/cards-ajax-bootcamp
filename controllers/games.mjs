import pkg from 'sequelize';

const { Op } = pkg;

// Shuffle an array of cards
const shuffleCards = (cards) => {
  // Loop over the card deck array once
  for (let currentIndex = 0; currentIndex < cards.length; currentIndex += 1) {
    // Select a random index in the deck
    const randomIndex = Math.floor(Math.random() * cards.length);
    // Select the card that corresponds to randomIndex
    const randomCard = cards[randomIndex];
    // Select the card that corresponds to currentIndex
    const currentCard = cards[currentIndex];
    // Swap positions of randomCard and currentCard in the deck
    cards[currentIndex] = randomCard;
    cards[randomIndex] = currentCard;
  }
  // Return the shuffled deck
  return cards;
};

const makeDeck = () => {
  // Initialise an empty deck array
  const newDeck = [];
  // Initialise an array of the 4 suits in our deck. We will loop over this array.
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const suitSymbols = ['♥️', '♦', '♣️', '♠️'];

  // Loop over the suits array
  for (let suitIndex = 0; suitIndex < suits.length; suitIndex += 1) {
    // Store the current suit in a variable
    const currentSuit = suits[suitIndex];
    const currentSymbol = suitSymbols[suitIndex];

    // Loop from 1 to 13 to create all cards for a given suit
    for (let rankCounter = 1; rankCounter <= 13; rankCounter += 1) {
      // By default, the card name is the same as rankCounter
      let cardName = `${rankCounter}`;
      let displayName = cardName;
      const colour = suitIndex <= 1 ? 'red' : 'black';

      // If rank is 1, 11, 12, or 13, set cardName to the ace or face card's name
      if (cardName === '1') {
        cardName = 'Ace';
        displayName = 'A';
      } else if (cardName === '11') {
        cardName = 'Jack';
        displayName = 'J';
      } else if (cardName === '12') {
        cardName = 'Queen';
        displayName = 'Q';
      } else if (cardName === '13') {
        cardName = 'King';
        displayName = 'K';
      }

      // Create a new card with the current name, suit, and rank
      const card = {
        name: cardName,
        suit: currentSuit,
        rank: rankCounter,
        suitSymbol: currentSymbol,
        displayName,
        colour,
      };

      // Add the new card to the deck
      newDeck.push(card);
    }
  }

  // Return the completed card deck
  return newDeck;
};

export default function initGamesController(db) {
  // render the main page
  const index = (req, res) => {
    res.render('games/index');
  };

  // create a new game. Insert a new row in the DB.
  const create = async (req, res) => {
    // deal out a new shuffled deck for this game.
    const cardDeck = shuffleCards(makeDeck());
    const player1Cards = [];
    const player2Cards = [];
    const gameInProgress = false;

    const newGame = {
      gameState: {
        cardDeck,
        player1Cards,
        player2Cards,
        gameInProgress,
      },
      isGameOver: false,
    };

    try {
      // run the DB INSERT query
      const game = await db.Game.create(newGame);
      const user1 = await db.User.findOne({
        where: {
          name: req.body.user,
        },
      });
      const [usersInGame] = await db.sequelize.query('SELECT DISTINCT user_id FROM games_users gu INNER JOIN games g ON gu.game_id = g.id WHERE NOT g.is_game_over;');
      const list = usersInGame.map((user) => user.user_id);
      const user2 = await db.User.findAll({
        where: {
          id: { [Op.notIn]: list, [Op.ne]: user1.id },
        },
        order: db.sequelize.random(),
        limit: 1,
      });

      await game.addUser(user1.id);
      await game.addUser(user2[0].id);

      // send the new game back to the user.
      // dont include the deck so the user can't cheat
      res.send({
        id: game.id,
        gameInProgress: game.gameInProgress,
        player1: user1,
        player2: user2[0],
      });
    } catch (error) {
      res.status(500).send(error);
    }
  };

  // deal two new cards from the deck.
  const deal = async (req, res) => {
    try {
      // get the game by the ID passed in the request
      const { gameId, playerId } = req.params;
      const game = await db.Game.findByPk(gameId);
      const player1Cards = [...game.gameState.player1Cards];
      const player2Cards = [...game.gameState.player2Cards];

      if (Number(playerId) === 1) {
        player1Cards.push(game.gameState.cardDeck.pop());
      } else {
        player2Cards.push(game.gameState.cardDeck.pop());
      }

      const players = await game.getUsers();
      let isGameOver = false;

      if (player1Cards.length === 5 && player2Cards.length === 5) isGameOver = true;

      // update the game with the new info
      // console.log('here');
      // console.log(req.body);
      await game.update({
        gameState: {
          cardDeck: game.gameState.cardDeck,
          player1Cards,
          player2Cards,
          gameInProgress: true,
        },
        isGameOver,
      });
      // console.log(game);

      // send the updated game back to the user.
      // dont include the deck so the user can't cheat
      res.send({
        id: game.id,
        player1Cards: game.gameState.player1Cards,
        player2Cards: game.gameState.player2Cards,
        gameInProgress: game.gameState.gameInProgress,
        player1: players[0],
        player2: players[1],
      });
    } catch (error) {
      console.log('error');
      res.status(500).send(error);
    }
  };

  const show = async (req, res) => {
    const { gameId } = req.params;
    try {
      const game = await db.Game.findByPk(gameId);
      const players = await game.getUsers();

      res.send({
        id: game.id,
        player1Cards: game.gameState.player1Cards,
        player2Cards: game.gameState.player2Cards,
        gameInProgress: game.gameState.gameInProgress,
        player1: players[0],
        player2: players[1],
      });
    } catch (error) {
      console.log('error');
      res.status(500).send(error);
    }
  };

  // return all functions we define in an object
  // refer to the routes file above to see this used
  return {
    deal,
    create,
    index,
    show,
  };
}
