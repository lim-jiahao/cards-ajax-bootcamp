const loginContainer = document.getElementById('login-container');
const userName = document.getElementById('username');
const password = document.getElementById('password');
const email = document.getElementById('email');
const loginBtn = document.getElementById('login-button');
const registerBtn = document.getElementById('register-button');
const loginWarning = document.getElementById('warning2');

const CARDS_PER_PLAYER = 5;

// global value that holds info about the current hand.
let currentGame = null;
let user = '';

// Helper function to output message
const output = (message) => {
  const gameOutput = document.getElementById('gameOutput');
  gameOutput.innerHTML = message;
};

// Helper function to create the cards UI given an array of cards
const createCards = (cards, player) => {
  const cardContainer = document.getElementById(`cards-player-${player}`);
  cardContainer.innerHTML = '';

  const names = [currentGame.player1.name, currentGame.player2.name];
  if (names.indexOf(user) === player - 1) {
    const playerButton = document.getElementById(`button-player-${player}`);
    playerButton.disabled = true;
    setTimeout(() => {
      if (cards.length < CARDS_PER_PLAYER) playerButton.disabled = false;
    }, 400);
  }
  // Sort player's cards in ascending order based on rank
  // Then get the last (highest) card and put it in front
  const cardsCopy = [...cards].sort((a, b) => a.rank - b.rank);
  if (cardsCopy.length > 0) cardsCopy.unshift(cardsCopy.pop());

  // Creating a card UI for each element in the cards array
  cardsCopy.forEach((card, index) => {
    const suit = document.createElement('div');
    suit.classList.add('suit', card.colour);
    suit.innerText = card.suitSymbol;

    const name = document.createElement('div');
    name.classList.add('name', card.colour);
    name.innerText = card.displayName;

    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    if (cardsCopy.length > 1) {
      // Special styling for the first (highest) and second (lowest) card
      if (index === 0) cardDiv.classList.add('high');
      if (index === 1) cardDiv.classList.add('low');
    }
    cardDiv.appendChild(name);
    cardDiv.appendChild(suit);

    cardContainer.appendChild(cardDiv);
  });
};

// Calculate difference by sorting the cards in ascending order
// And subtract rank of first card from rank of last card
const calculateDifference = (cards) => {
  const sorted = [...cards].sort((a, b) => a.rank - b.rank);
  return sorted[sorted.length - 1].rank - sorted[0].rank;
};

// Determine winner by calculating each player's greatest difference
const determineWinner = (player1Cards, player2Cards) => {
  const names = [currentGame.player1.name, currentGame.player2.name];
  const player1Difference = calculateDifference(player1Cards);
  const player2Difference = calculateDifference(player2Cards);
  let message = `${names[0]} has a greatest difference of ${player1Difference}.<br>`;
  message += `${names[1]} has a greatest difference of ${player2Difference}.<br>`;

  if (player1Difference > player2Difference) {
    message += `${names[0]} wins!`;
  } else if (player1Difference < player2Difference) {
    message += `${names[1]} wins!`;
  } else {
    message += "It's a tie!";
  }
  message += '<br><br>Start a new game by clicking Create Game!';

  output(message);
  document.getElementById('create-game').disabled = false;
};

// make a request to the server
// to change the deck. set 2 new cards into the player hand.
const playerClick = async (player) => {
  if (!currentGame.gameInProgress) {
    // If it is a new game, then empty the opponent's card container
    // And set the gameInProgress flag and the cards per player value
    const oppPlayer = player === 1 ? 2 : 1;
    const oppCardContainer = document.getElementById(`cards-player-${oppPlayer}`);
    oppCardContainer.innerHTML = '';
  }

  try {
    const resp = await axios.put(`/games/${currentGame.id}/${player}/deal`);
    // get the updated hand value
    currentGame = resp.data;
    const { player1Cards, player2Cards } = currentGame;

    const playerCardArr = player === 1 ? player1Cards : player2Cards;

    const newCard = playerCardArr.slice(-1)[0];
    const names = [currentGame.player1.name, currentGame.player2.name];

    output(`${names[player - 1]} drew the ${newCard
      .name} of ${newCard.suit}.`);

    // Create card UIs for the current player
    createCards(playerCardArr, player);

    if (player1Cards.length === CARDS_PER_PLAYER && player2Cards.length === CARDS_PER_PLAYER) {
    // Both players done drawing
      determineWinner(player1Cards, player2Cards);
    }
  } catch (error) {
    // handle error
    console.log(error);
  }
};

const refreshPage = async () => {
  const resp = await axios.get(`/games/${currentGame.id}`);
  currentGame = resp.data;
  const { player1Cards, player2Cards } = currentGame;
  createCards(player1Cards, 1);
  createCards(player2Cards, 2);
  if (player1Cards.length === CARDS_PER_PLAYER && player2Cards.length === CARDS_PER_PLAYER) {
    // Both players done drawing
    determineWinner(player1Cards, player2Cards);
  }
};

// Functions to generate all the HTML elements necessary
const initGameArea = () => {
  const names = [currentGame.player1.name, currentGame.player2.name];
  const gameContainer = document.getElementById('container');
  gameContainer.innerHTML = '';
  for (let i = 1; i <= 2; i += 1) {
    const playerContainer = document.createElement('div');
    playerContainer.id = `player-${i}`;

    const cardContainer = document.createElement('div');
    cardContainer.id = `cards-player-${i}`;
    playerContainer.appendChild(cardContainer);

    if (names[i - 1] === user) {
      const playerButton = document.createElement('button');
      playerButton.id = `button-player-${i}`;
      playerButton.innerText = `${names[i - 1]} Draw`;
      playerButton.addEventListener('click', () => { playerClick(i); });
      playerContainer.appendChild(playerButton);
    }

    gameContainer.appendChild(playerContainer);
  }
};

const initOutputArea = () => {
  const names = [currentGame.player1.name, currentGame.player2.name];
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '';

  const refreshBtn = document.createElement('button');
  refreshBtn.id = 'refresh';
  refreshBtn.innerText = 'Refresh';
  refreshBtn.addEventListener('click', refreshPage);
  outputDiv.appendChild(refreshBtn);
  const gameOutput = document.createElement('p');
  const oppName = names.find((name) => name !== user);
  gameOutput.id = 'gameOutput';
  gameOutput.innerHTML = `You've been matched with ${oppName}!<br>Either player can hit Draw to start the game!`;
  outputDiv.appendChild(gameOutput);
};

const createGame = async () => {
  // Make a request to create a new game
  try {
    const data = { user };
    const resp = await axios.post('/games', data);
    currentGame = resp.data;
    initGameArea();
    initOutputArea();
    document.getElementById('create-game').disabled = true;
  } catch (error) {
    // handle error
    console.log(error);
  }
};

const logoutUser = async () => {
  try {
    const resp = await axios.get('/logout');
    loginContainer.style.display = 'flex';
    document.getElementById('user-div').remove();
    document.getElementById('container').remove();
    document.getElementById('output').remove();
    user = '';
  } catch (error) {
    console.log(error);
  }
};

const createBaseElements = () => {
// create game btn
  const userDiv = document.createElement('div');
  userDiv.id = 'user-div';
  document.body.appendChild(userDiv);
  const createGameBtn = document.createElement('button');
  createGameBtn.innerText = 'Create Game';
  createGameBtn.id = 'create-game';
  createGameBtn.addEventListener('click', createGame);
  userDiv.appendChild(createGameBtn);

  const loggedInAs = document.createElement('span');
  loggedInAs.id = 'logged-in-as';
  userDiv.appendChild(loggedInAs);

  const logout = document.createElement('a');
  logout.id = 'logout';
  logout.href = '#';
  logout.innerText = 'Logout';
  logout.addEventListener('click', logoutUser);
  userDiv.appendChild(logout);

  const gameContainer = document.createElement('div');
  gameContainer.id = 'container';
  document.body.appendChild(gameContainer);

  const outputDiv = document.createElement('div');
  outputDiv.classList.add('output');
  outputDiv.id = 'output';
  document.body.appendChild(outputDiv);
};

const checkCookies = () => {
  const cookieValue = document.cookie.split('; ');
  const loggedIn = cookieValue.find((row) => row.startsWith('loggedIn='))?.split('=')[1];

  if (loggedIn === 'true') {
    // eslint-disable-next-line prefer-destructuring
    user = cookieValue.find((row) => row.startsWith('username='))
      .split('=')[1];
    loginContainer.style.display = 'none';
    createBaseElements();
    const loggedInAs = document.getElementById('logged-in-as');
    loggedInAs.innerText = `Logged in as: ${user}`;
  }
};

loginBtn.addEventListener('click', async () => {
  const data = {
    name: userName.value,
    email: email.value,
    password: password.value,
  };

  try {
    const resp = await axios.post('/login', data);
    if (resp.data !== 'Invalid credentials!') {
      loginContainer.style.display = 'none';
      createBaseElements();
      const loggedInAs = document.getElementById('logged-in-as');
      loggedInAs.innerText = `Logged in as: ${resp.data.user.name}`;
      user = resp.data.user.name;
      userName.value = '';
      email.value = '';
      password.value = '';
      loginWarning.innerText = '';

      if (resp.data.id) {
        currentGame = resp.data;
        document.getElementById('create-game').disabled = true;
        initGameArea();
        initOutputArea();
        createCards(currentGame.player1Cards, 1);
        createCards(currentGame.player2Cards, 2);
      }
    } else {
      loginWarning.innerText = 'Please check your details and try again!';
    }
  } catch (error) {
    console.log(error);
  }
});

registerBtn.addEventListener('click', async () => {
  if (!userName.value || !email.value || !password.value) {
    loginWarning.innerText = 'Please fill in all fields!';
    return;
  }

  const data = {
    name: userName.value,
    email: email.value,
    password: password.value,
  };

  try {
    const resp = await axios.post('/register', data);
    if (resp.data !== 'User exists') {
      loginContainer.style.display = 'none';
      createBaseElements();
      const loggedInAs = document.getElementById('logged-in-as');
      loggedInAs.innerText = `Logged in as: ${resp.data.user.name}`;
      user = resp.data.user.name;
      userName.value = '';
      email.value = '';
      password.value = '';
      loginWarning.innerText = '';
    } else {
      loginWarning.innerText = 'User already exists!';
    }
  } catch (error) {
    console.log(error);
  }
});

checkCookies();
