document.addEventListener('DOMContentLoaded', () => {

    const hamburger = document.querySelector('.hamburger');

    const mobileMenu = document.getElementById('mobile-menu');

    const menuLinks = mobileMenu.querySelectorAll('a');

    const themeToggle = document.querySelector('.theme-toggle');

    const body = document.body;

    const header = document.querySelector('header');

    const sunIcon = document.querySelector('.theme-icon.sun');

    const moonIcon = document.querySelector('.theme-icon.moon');

    const carouselWrapper = document.querySelector('.carousel-wrapper');

    const leftArrow = document.querySelector('.carousel-arrow.left');

    const rightArrow = document.querySelector('.carousel-arrow.right');

    // Toggle Menu

    function toggleMenu() {

        hamburger.classList.toggle('active');

        mobileMenu.classList.toggle('open');

    }

    hamburger.addEventListener('click', toggleMenu);

    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // Theme Toggle

    if (localStorage.getItem('theme') === 'dark') {

        body.classList.add('dark-mode');

        sunIcon.style.display = 'block';

        moonIcon.style.display = 'none';

    } else {

        body.classList.remove('dark-mode');

        sunIcon.style.display = 'none';

        moonIcon.style.display = 'block';

    }

    themeToggle.addEventListener('click', () => {

        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {

            localStorage.setItem('theme', 'dark');

            sunIcon.style.display = 'block';

            moonIcon.style.display = 'none';

        } else {

            localStorage.setItem('theme', 'light');

            sunIcon.style.display = 'none';

            moonIcon.style.display = 'block';

        }

    });

    // Header Scroll Effect

    window.addEventListener('scroll', () => {

        if (window.scrollY > 50) {

            header.classList.add('scrolled');

        } else {

            header.classList.remove('scrolled');

        }

    });

    // Carousel with Infinite Loop

    leftArrow.addEventListener('click', () => {

        carouselWrapper.scrollBy({ left: -300, behavior: 'smooth' });

        if (carouselWrapper.scrollLeft === 0) {

            carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth, behavior: 'smooth' });

        }

    });

    rightArrow.addEventListener('click', () => {

        carouselWrapper.scrollBy({ left: 300, behavior: 'smooth' });

        if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth) {

            carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });

        }

    });

    // Lazy Load for Background Images in Carousel

    const cards = document.querySelectorAll('.portfolio-card');

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                const card = entry.target;

                const bgUrl = card.getAttribute('data-bg');

                if (bgUrl) {

                    card.style.backgroundImage = `url('${bgUrl}')`;

                    card.removeAttribute('data-bg'); // Rimuovi per non ricaricare

                }

                observer.unobserve(card); // Osserva solo una volta

            }

        });

    }, { threshold: 0.1 }); // Carica quando 10% visibile

    cards.forEach(card => observer.observe(card));

});