// -- Initialization & Shuffling --
const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Map rank to value for comparison
const RANK_VALUES = {};
RANKS.forEach((r, i) => RANK_VALUES[r] = i);

function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ suit, rank, id: `${rank}${suit}` });
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// -- Card Dealing --
let players = {
    human: [],
    cpu1: [],
    cpu2: [],
    cpu3: []
};

let finishedPlayers = [];

const playerOrder = ['human', 'cpu1', 'cpu2', 'cpu3'];
let currentTurnIndex = 0;

let table = []; // Cards currently played in the trick: {player, card}
let currentSuit = null; // The suit that was led
let firstTurn = true; // Track if it's the very first turn

function dealCards() {
    let deck = createDeck();
    shuffle(deck);
    
    for (let i = 0; i < deck.length; i++) {
        let p = playerOrder[i % 4];
        players[p].push(deck[i]);
    }
    
    // Sort hands by suit then rank for easier viewing
    for (let p in players) {
        players[p].sort((a, b) => {
            if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
            return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
        });
    }
}

function findStartingPlayer() {
    for (let i = 0; i < playerOrder.length; i++) {
        let p = playerOrder[i];
        if (players[p].find(c => c.id === 'A♠')) {
            return i;
        }
    }
    return 0;
}

// -- DOM Update Module (Renders cards on screen) --
function renderCard(card, isHidden = false) {
    const div = document.createElement('div');
    div.classList.add('card');
    if (isHidden) {
        div.classList.add('card-back');
    } else {
        div.textContent = `${card.rank}${card.suit}`;
    }
    return div;
}

function updateUI() {
    // Update Human Hand
    const humanHandDiv = document.getElementById('hand-human');
    humanHandDiv.innerHTML = '';
    
    // Determine which cards are valid to play
    let validCards = getValidPlays(players.human, currentSuit);
    let isHumanTurn = (playerOrder[currentTurnIndex] === 'human' && !finishedPlayers.includes('human'));

    players.human.forEach(card => {
        let cardEl = renderCard(card);
        if (isHumanTurn) {
            if (validCards.some(c => c.id === card.id)) {
                cardEl.onclick = () => playCard('human', card);
            } else {
                cardEl.classList.add('disabled');
            }
        } else {
            cardEl.classList.add('disabled');
        }
        humanHandDiv.appendChild(cardEl);
    });

    document.querySelector('#human-hand .card-count').textContent = players.human.length;

    // Update CPU Hands
    ['cpu1', 'cpu2', 'cpu3'].forEach(cpu => {
        const cpuHandDiv = document.getElementById(`hand-${cpu}`);
        cpuHandDiv.innerHTML = '';
        players[cpu].forEach(() => {
            cpuHandDiv.appendChild(renderCard(null, true));
        });
        document.querySelector(`#${cpu === 'cpu1' ? 'cpu-left' : cpu === 'cpu2' ? 'cpu-top' : 'cpu-right'} .card-count`).textContent = players[cpu].length;
    });

    // Update Table
    const tableDiv = document.getElementById('table-cards');
    tableDiv.innerHTML = '';
    table.forEach(play => {
        let wrap = document.createElement('div');
        wrap.className = 'table-card-wrapper';
        let name = document.createElement('div');
        name.className = 'table-player-name';
        name.textContent = play.player.toUpperCase();
        wrap.appendChild(name);
        wrap.appendChild(renderCard(play.card));
        tableDiv.appendChild(wrap);
    });
}

function setStatus(msg) {
    document.getElementById('status').textContent = msg;
}

// -- Game State Manager (Who leads, who is active) --
function getValidPlays(hand, suit) {
    // Force A♠ on first turn
    if (firstTurn && !suit) {
        let aSpade = hand.find(c => c.id === 'A♠');
        if (aSpade) return [aSpade];
    }
    
    if (!suit) return hand; // Can lead any card
    let followers = hand.filter(c => c.suit === suit);
    if (followers.length > 0) return followers;
    return hand; // Can play any card if off-suit
}

async function nextTurn() {
    // Check for win conditions
    for (let p of playerOrder) {
        if (players[p].length === 0 && !finishedPlayers.includes(p)) {
            finishedPlayers.push(p);
        }
    }

    if (finishedPlayers.length >= 3) {
        let loser = playerOrder.find(p => !finishedPlayers.includes(p));
        setStatus(`GAME OVER! ${loser.toUpperCase()} is the Bhabho!`);
        updateUI();
        return;
    }

    // Skip finished players
    while (finishedPlayers.includes(playerOrder[currentTurnIndex])) {
        currentTurnIndex = (currentTurnIndex + 1) % 4;
    }

    let activePlayersCount = 4 - finishedPlayers.length;

    // If everyone active has played, evaluate trick
    if (table.length === activePlayersCount) {
        await sleep(1000);
        evaluateTrick();
        return;
    }

    let currentPlayer = playerOrder[currentTurnIndex];
    updateUI();

    if (currentPlayer === 'human') {
        setStatus("Your Turn");
    } else {
        setStatus(`${currentPlayer.toUpperCase()} is thinking...`);
        await sleep(800);
        doCPUTurn(currentPlayer);
    }
}

// -- Human Player Interaction Handler --
function playCard(player, card) {
    firstTurn = false;
    
    // Remove card from hand
    players[player] = players[player].filter(c => c.id !== card.id);
    
    // Set lead suit if first
    if (table.length === 0) {
        currentSuit = card.suit;
    }

    // Add to table
    table.push({ player, card });
    
    currentTurnIndex = (currentTurnIndex + 1) % 4;
    updateUI();
    nextTurn();
}

// -- CPU Player Logic Module --
function doCPUTurn(cpuId) {
    let hand = players[cpuId];
    let validCards = getValidPlays(hand, currentSuit);
    
    let cardToPlay;
    
    if (!currentSuit) {
        // Leading: Play lowest card
        validCards.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
        cardToPlay = validCards[0];
    } else if (validCards[0].suit === currentSuit) {
        // Following suit: Play lowest card
        validCards.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
        cardToPlay = validCards[0];
    } else {
        // Cannot follow suit (Penalty!): Play highest card to get rid of it
        validCards.sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
        cardToPlay = validCards[0];
    }

    playCard(cpuId, cardToPlay);
}

// -- Trick Evaluation & Pile Logic --
function evaluateTrick() {
    let offSuitPlay = table.find(p => p.card.suit !== currentSuit);
    
    if (offSuitPlay) {
        // Someone could not follow suit. They pick up the pile.
        let loser = offSuitPlay.player;
        setStatus(`${loser.toUpperCase()} takes the pile!`);
        
        let pileCards = table.map(p => p.card);
        players[loser].push(...pileCards);
        
        // Loser leads next
        currentTurnIndex = playerOrder.indexOf(loser);
    } else {
        // Everyone followed suit. Highest card wins the trick.
        let winner = table[0];
        for (let i = 1; i < table.length; i++) {
            if (RANK_VALUES[table[i].card.rank] > RANK_VALUES[winner.card.rank]) {
                winner = table[i];
            }
        }
        setStatus(`${winner.player.toUpperCase()} wins trick!`);
        
        // Winner leads next
        currentTurnIndex = playerOrder.indexOf(winner.player);
    }

    // Clear table
    setTimeout(() => {
        table = [];
        currentSuit = null;
        
        // Re-sort hands
        for (let p in players) {
            players[p].sort((a, b) => {
                if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
                return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
            });
        }
        
        updateUI();
        nextTurn();
    }, 1500);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -- Start Game --
function startGame() {
    dealCards();
    currentTurnIndex = findStartingPlayer();
    updateUI();
    
    let startPlayer = playerOrder[currentTurnIndex];
    if (startPlayer !== 'human') {
        setStatus(`${startPlayer.toUpperCase()} starts!`);
    } else {
        setStatus("You start! Play Ace of Spades.");
    }
    
    nextTurn();
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    startGame();
});
