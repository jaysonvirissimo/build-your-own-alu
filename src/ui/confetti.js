export function burstConfetti(host) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'confetti');
  svg.setAttribute('viewBox', '-100 -100 200 200');

  const colors = ['#e8a317', '#2aa198', '#c73e3e', '#28a745', '#4a7fc1'];
  for (let i = 0; i < 24; i++) {
    const piece = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const angle = (i / 24) * Math.PI * 2;
    const dx = Math.cos(angle) * (60 + Math.random() * 30);
    const dy = Math.sin(angle) * (60 + Math.random() * 30);
    piece.setAttribute('x', '-3');
    piece.setAttribute('y', '-3');
    piece.setAttribute('width', '6');
    piece.setAttribute('height', '6');
    piece.setAttribute('fill', colors[i % colors.length]);
    piece.style.setProperty('--dx', `${dx}px`);
    piece.style.setProperty('--dy', `${dy}px`);
    piece.style.animationDelay = `${Math.random() * 80}ms`;
    svg.appendChild(piece);
  }
  host.appendChild(svg);
  setTimeout(() => svg.remove(), 1100);
}
