import confetti from 'canvas-confetti';

/**
 * Produce an animated fireworks with confettis popping all over the screen that slowly
 * fade out. For big celebrations, like a successful order or a collective freshly created.
 * Can only be used client-side.
 *
 * @param {number} durationInMilliseconds: duration for the full animation
 * @param {object} libConfettiParams: passed down to `canvas-confetti`
 */
export const confettiFireworks = (durationInMilliseconds = 10000, libConfettiParams = {}) => {
  const animationEnd = Date.now() + durationInMilliseconds;
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const confettisParams = {
    disableForReducedMotion: true, // see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    ...libConfettiParams,
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    } else {
      const particleCount = 50 * (timeLeft / durationInMilliseconds);
      confetti({ ...confettisParams, particleCount, origin: { x: randomInRange(0, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...confettisParams, particleCount, origin: { x: randomInRange(0.7, 1), y: Math.random() - 0.2 } });
    }
  }, 250);
};
