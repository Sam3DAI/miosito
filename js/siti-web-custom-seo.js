document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');

    // Carousel Infinite - Con lazy via observer
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');

    leftArrow.addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: -300, behavior: 'smooth' });
        if (carouselWrapper.scrollLeft <= 0) {
            carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth - carouselWrapper.clientWidth, behavior: 'smooth' });
        }
    });

    rightArrow.addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: 300, behavior: 'smooth' });
        if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth - 1) {
            carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
    });

    // Lazy load backgrounds
    const cards = document.querySelectorAll('.benefit-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const bgStyle = card.getAttribute('style');
                if (bgStyle) {
                    card.style.backgroundImage = bgStyle.replace('background-image: url(', '').replace(');', '');
                }
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(card => observer.observe(card));

    // Toggle Menu - Keyboard
    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
    }

    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleMenu();
        }
    });
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // Theme Toggle - Device default
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    let savedTheme = localStorage.getItem('theme');

    if (!savedTheme) {
        savedTheme = isMobile ? 'dark' : 'light';
        localStorage.setItem('theme', savedTheme);
    }

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        body.classList.remove('dark-mode');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    });

    // Header Scroll
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Service Sections Animation
    const serviceSections = document.querySelectorAll('.service-section');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    serviceSections.forEach(section => sectionObserver.observe(section));

    // Fullscreen Modal - Con trap focus
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    const closeBtn = document.querySelector('.close-btn');
    const modal = document.getElementById('fullscreen-modal');

    fullscreenBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        closeBtn.focus();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Debounce resize per theme
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) {
            location.reload();
        }
    }, 300));
});