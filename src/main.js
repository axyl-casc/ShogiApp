import Module from 'ffish-es6';

Module({
  locateFile: (p) =>
    p.endsWith('.wasm') ? (import.meta.env.BASE_URL || '/') + 'ffish.wasm' : p
}).then((ffish) => {
  const playerEl = document.getElementById('player');
  const sfenEl   = document.getElementById('sfen');
  const infoEl   = document.getElementById('info');
  const aiBtn    = document.getElementById('aiMove');

  if (!(playerEl && sfenEl && infoEl && aiBtn)) {
    console.error('Missing one of #player, #sfen, #info or #aiMove in DOM');
    return;
  }

  // Starting SFEN
  const START_SFEN =
    'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

  // Initialize the visual board
  playerEl.mode = 'edit';
  playerEl.setAttribute('sfen', START_SFEN);
  sfenEl.textContent = START_SFEN;
  infoEl.textContent = 'Make a move on the board, then press “AI Move.”';

  // Decide sides randomly (just for display)—but AI code
  // below doesn’t actually care which side is “AI” vs “human.”
  const humanIsBlack = Math.random() < 0.5;
  const HUMAN = humanIsBlack ? 'b' : 'w';
  const CPU   = humanIsBlack ? 'w' : 'b';

  infoEl.textContent += ` You are ${HUMAN === 'b' ? 'Black' : 'White'}.`;

  // Whenever <shogi-player> fires an update (i.e. you’ve just made a move,
  // or the AI just pushed a move), we:
  //  1) normalize/fix the SFEN (strip any “[info]…” tags),
  //  2) update the <pre> on screen,
  //  3) read “who is to move next” and set mode=“view” (if AI to move) or “edit” (if human).
  playerEl.addEventListener('update', (e) => {
    // 1) Strip engine‐tags out of SFEN
    const cleanSFEN = e.detail.sfen.replace(/\[.*?]/g, '').trim();
    // 2) Put it back on <shogi-player> and in <pre>
    playerEl.setAttribute('sfen', cleanSFEN);
    sfenEl.textContent = cleanSFEN;

    // 3) Whose turn is next? (the “side” is the second token, 'b' or 'w')
    const sideToMove = cleanSFEN.split(' ')[1];
    if (sideToMove === CPU) {
      // Lock the board so you can’t move until AI replies
      playerEl.mode = 'view';
    } else {
      // Your turn again
      playerEl.mode = 'edit';
    }
  });

  // “AI Move” button callback:
  //   • Read current SFEN from the <shogi-player> attribute
  //   • Build a fresh engine board from it
  //   • Push exactly one legal move
  //   • Update <shogi-player>’s SFEN (this will trigger the above update handler again,
  //     which sets mode correctly for your next turn)
  aiBtn.addEventListener('click', () => {
    // 1) Grab current SFEN
    const currentSFEN = playerEl.getAttribute('sfen');
    // 2) Build a fresh engine board
    const board = new ffish.Board('shogi', currentSFEN);
    // 3) Pick a random legal move
    const moves = board.legalMoves().split(' ');
    if (!moves || moves.length === 0) {
      infoEl.textContent = 'Game Over!';
      return;
    }
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    board.push(randomMove);
    // 4) Extract and clean the new SFEN
    const nextSFEN = board.fen().replace(/\[.*?]/g, '').trim();
    // 5) Drop it onto <shogi-player>; that automatically fires “update”
    playerEl.setAttribute('sfen', nextSFEN);
    // We do NOT set mode here—let the update handler above do it.
  });

  // If AI is Black, let it play the very first move from START_SFEN
  if (CPU === 'b') {
    setTimeout(() => {
      const board = new ffish.Board('shogi', START_SFEN);
      const moves = board.legalMoves().split(' ');
      if (moves && moves.length) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        board.push(randomMove);
        const nextSFEN = board.fen().replace(/\[.*?]/g, '').trim();
        playerEl.setAttribute('sfen', nextSFEN);
        // “update” handler will lock or unlock accordingly
      }
    }, 100);
  }
})
.catch((error) => {
  console.error('Failed to load WASM module:', error);
  const infoEl = document.getElementById('info');
  if (infoEl) infoEl.textContent = 'Failed to load game engine';
});
