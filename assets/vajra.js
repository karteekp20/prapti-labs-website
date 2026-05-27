/* ============================================================
   Prapti Labs — Shared JavaScript
   Handles: mobile menu, active nav, typewriter, smooth scroll
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Lucide icons ── */
  if (window.lucide) lucide.createIcons();

  /* ── Mobile menu toggle ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  /* ── Active nav link highlight ── */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentFile || (currentFile === '' && href === 'index.html')) {
      link.style.color = '#fff';
      link.style.borderBottom = '1px solid #b91c1c';
      link.style.paddingBottom = '2px';
    }
  });

  /* ── Typewriter effect — system status console (decorative, non-blocking) ── */
  /* Main H1 headline is static HTML — this only animates the terminal badge */
  const typeTarget = document.getElementById('typewriter');
  if (typeTarget) {
    const lines = [
      '> CRATE_INIT: oqs v0.10 // COMPLIANT',
      '> HANDSHAKE_ENGINE: ML-KEM-768 + X25519 ACTIVE',
      '> PROTOCOL_STATUS: QUANTUM_SECURE //',
    ];
    let lineIdx = 0, charIdx = 0;
    typeTarget.textContent = '';

    function type() {
      if (lineIdx >= lines.length) return;
      const line = lines[lineIdx];
      if (charIdx < line.length) {
        typeTarget.textContent += line[charIdx++];
        setTimeout(type, 35);
      } else {
        setTimeout(() => {
          typeTarget.textContent = '';
          charIdx = 0;
          lineIdx = (lineIdx + 1) % lines.length;
          type();
        }, 3000);
      }
    }
    setTimeout(type, 600);
  }

});
