import Module from 'ffish-es6';

let ffish = null;

new Module().then((loaded) => {
  ffish = loaded;

  const player = document.getElementById("player");
  const sfenOutput = document.getElementById("sfen");
  const btn = document.getElementById("aiMove");

  // Display SFEN when board updates
  player.addEventListener("update", (e) => {
    sfenOutput.innerText = e.detail.sfen;
  });

  // Naive AI move logic
  btn.addEventListener("click", () => {
    const sfen = player.sfen;
    const board = new ffish.Board("shogi", sfen);

    const legal = board.legalMoves().split(" ");
    if (legal.length > 0) {
      board.push(legal[0]); // play first legal move
      player.sfen = board.fen();
    }

    board.delete();
  });
});
