# Bhabho (Get Away) Card Game - Chrome Extension

A minimalist, high-contrast, monochrome (Black & White) Chrome Extension implementation of the traditional Indian card game "Bhabho", also known as "Get Away".

## Features
- **Monochrome Aesthetic**: Minimalist design inspired by the "Dino Jump" style to minimize eye impact.
- **Classic Rules**: Standard 52-card deck, Ace is high.
- **CPU Opponents**: Play against 3 AI players with distinct decision-making logic.
- **Chrome Extension Ready**: Built with Manifest V3.

## How to Play
1. **Goal**: Be the first to get rid of all your cards.
2. **Starting**: The player with the **Ace of Spades** leads the first trick.
3. **Follow Suit**: Players must follow the lead suit if they have it.
4. **Winning a Trick**: The highest card of the lead suit wins and discards the pile. The winner leads the next trick.
5. **The Penalty**: If you cannot follow suit, you must pick up the entire pile (the "thulla"). You then lead the next trick.
6. **Winning the Game**: Players "Get Away" once their hand is empty. The last player left with cards is the "Bhabho" (loser).

## Installation for Development
1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.

## Tech Stack
- HTML5
- CSS3 (Vanilla)
- JavaScript (Vanilla)
- Chrome Extension Manifest V3
