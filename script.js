document.addEventListener('DOMContentLoaded', () => {
  const currentYear = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = currentYear;
  }

  const smoothScroll = (event, targetId) => {
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const enterButton = document.querySelector('.btn-enter');
  if (enterButton) {
    enterButton.addEventListener('click', (event) => smoothScroll(event, '#news'));
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute('href');
    if (targetId && targetId.length > 1) {
      link.addEventListener('click', (event) => smoothScroll(event, targetId));
    }
  });

  const slider = document.querySelector('.news-slider');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    let currentIndex = 0;
    let intervalId = null;

    const showSlide = (index) => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === index);
      });
    };

    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const startSlider = () => {
      if (intervalId || prefersReducedMotion.matches || slides.length <= 1) return;
      intervalId = window.setInterval(nextSlide, 3000);
    };

    const stopSlider = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    prefersReducedMotion.addEventListener('change', () => {
      stopSlider();
      if (!prefersReducedMotion.matches) {
        startSlider();
      }
    });

    slider.addEventListener('mouseenter', stopSlider);
    slider.addEventListener('mouseleave', startSlider);
    slider.addEventListener('focusin', stopSlider);
    slider.addEventListener('focusout', startSlider);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopSlider();
      } else {
        startSlider();
      }
    });

    showSlide(currentIndex);
    startSlider();
  }
});
