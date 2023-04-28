const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
};

const Symbols = [
  'img/spade.jpg',
  'img/heart.jpg',
  'img/diamond.jpg',
  'img/club.jpg',
];

const model = {
  revealedCards: [],
  score: 0,
  triedTimes: 0,
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13;
  }
};

const view = {
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return number;
    }
  },
  getCardContent(i) {
    const number = this.transformNumber((i % 13) + 1);
    const symbol = Symbols[Math.floor(i / 13)];
    return `
        <p> ${number} </p>
        <img src=" ${symbol} ">
        <p> ${number} </p>
      `;
  },
  getCardElement(i) {
    return `<div data-index=${i} class="card back"></div>`;
  },
  renderCards(cardNumber) {
    const cardElement = document.querySelector('.cards');
    cardElement.innerHTML = cardNumber.map((i) => this.getCardElement(i)).join('');
  },
  shuffleCards(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number;
  },
  flipCards(...card) {
    card.forEach(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back');
        card.innerHTML = this.getCardContent(card.dataset.index);
        return
      } else {
        card.classList.add('back');
        card.innerHTML = null;
      }
    }
    )
  },
  pairCards(...card) {
    card.forEach(card => {
      card.classList.add('paired');
      card.addEventListener('animationend', (e) => e.target.classList.remove('correct'), { once: true });
    })
  },
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`;
  },
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards) {
    cards.forEach(card => {
      card.classList.add('wrong');
      card.addEventListener('animationend', (e) => e.target.classList.remove('wrong'), { once: true });
    })
  },
  showGameFinished() {
    clearInterval(timer.timerFunction);
    const div = document.createElement('div');
    div.classList.add('completed');
    div.innerHTML = `
      <p>Complete!</p>
      <p>Spend time: <span>${timer.minutesElement.textContent}:${timer.secondsElement.textContent}</span></p>
      <p>You've tried: <span>${model.triedTimes}</span> times</p>
      <button type="button" class="again">Try Again</button>
    `
    const header = document.querySelector('.header');
    header.before(div);
    document.querySelector('.again').addEventListener('click', controller.resetGame);
  }
};

const timer = {
  timerFunction: {},
  minutesElement: document.querySelector('.minutes'),
  secondsElement: document.querySelector('.seconds'),
  isStart: false,
  timeStart() {
    const startTime = new Date();

    this.timerFunction = setInterval(() => {
      const currentTime = new Date();
      const elapsedTime = Math.floor((currentTime - startTime) / 1000);

      const minutes = Math.floor((elapsedTime % 3600) / 60);
      const seconds = elapsedTime % 60;

      this.minutesElement.textContent = this.padZero(minutes);
      this.secondsElement.textContent = this.padZero(seconds);
    }, 1000);
  },
  padZero(num) {
    return num < 10 ? "0" + num : num;
  },
  resetTimer() {
    this.minutesElement.textContent = '00';
    this.secondsElement.textContent = '00';
  },
};

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.renderCards(view.shuffleCards(52));
  },
  dispatchCardAction(card) {
    if (!timer.isStart) {
      timer.timeStart();
      timer.isStart = true;
    }
    if (card.classList.contains('back')) {
      switch (this.currentState) {
        case GAME_STATE.FirstCardAwaits:
          view.flipCards(card);
          model.revealedCards.push(card);
          this.currentState = GAME_STATE.SecondCardAwaits;
          break;
        case GAME_STATE.SecondCardAwaits:
          view.flipCards(card);
          model.revealedCards.push(card);
          view.renderTriedTimes(++model.triedTimes);
          if (model.isRevealedCardsMatched()) {
            this.currentState = GAME_STATE.CardsMatched;
            view.pairCards(...model.revealedCards);
            model.revealedCards = [];
            view.renderScore(model.score += 10);
            if (model.score === 260) {
              this.currentState = GAME_STATE.GameFinished;
              view.showGameFinished();
              return
            } else {
              this.currentState = GAME_STATE.FirstCardAwaits;
            }
          } else {
            this.currentState = GAME_STATE.CardsMatchFailed;
            view.appendWrongAnimation(...model.revealedCards);
            setTimeout(this.resetCards, 1000);
          }
          break;
      }
    }
  },
  resetCards() {
    view.flipCards(...model.revealedCards);
    model.revealedCards = [];
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
  startGame() {
    this.generateCards();
    document.querySelectorAll('.card').forEach((card) =>
      card.addEventListener('click', () => controller.dispatchCardAction(card)));
  },
  resetGame() {
    const div = document.querySelector('.completed');
    div.remove();
    controller.currentState = GAME_STATE.FirstCardAwaits;
    timer.resetTimer();
    timer.isStart = false;
    model.score = 0;
    view.renderScore(model.score);
    model.triedTimes = 0;
    view.renderTriedTimes(model.triedTimes);
    controller.startGame();
  }
};

controller.startGame();
