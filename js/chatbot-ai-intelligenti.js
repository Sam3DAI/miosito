document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');

    // Toggle Menu - Keyboard support
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

    // Theme Toggle - Default device-based
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
            if (statsChart) statsChart.updateOptions(getChartOptions()); // Update grafico
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            if (statsChart) statsChart.updateOptions(getChartOptions());
        }
    });

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Multi-Carousel con Debounce e Infinite Loop
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const carouselContainers = document.querySelectorAll('.carousel-container');
    carouselContainers.forEach(container => {
        const carouselWrapper = container.querySelector('.carousel-wrapper');
        const leftArrow = container.querySelector('.carousel-arrow.left');
        const rightArrow = container.querySelector('.carousel-arrow.right');

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
    });

    // Lazy Load Backgrounds per Carousels
    const cards = document.querySelectorAll('.benefit-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const bgUrl = card.getAttribute('data-bg');
                if (bgUrl) {
                    card.style.backgroundImage = `url('${bgUrl}')`;
                    card.removeAttribute('data-bg');
                }
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));

    // ApexCharts con Stat Aggiornate, Dark Mode e Accessibilità
    function getChartOptions() {
        const isDark = body.classList.contains('dark-mode');
        return {
            chart: {
                type: 'bar',
                height: 350,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 2000,
                    animateGradually: { enabled: true, delay: 150 },
                    dynamicAnimation: { enabled: true, speed: 350 }
                },
                toolbar: { show: false }
            },
            plotOptions: {
                bar: { horizontal: true, barHeight: '75%', distributed: true }
            },
            dataLabels: { enabled: false },
            series: [{ data: [80, 40, 75, 40] }], // Aggiornate: 80% tempi, 40% sat, 75% auto, 40% costi
            xaxis: {
                categories: ['Riduzione Tempi di Risposta', 'Aumento Soddisfazione Clienti', 'Automatizzazione Processi', 'Riduzione Costi Operativi'],
                labels: {
                    formatter: (val) => val + '%',
                    style: { colors: isDark ? '#a1a1a6' : '#6e6e73', fontSize: '14px' }
                },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: {
                    formatter: (value) => {
                        if (value === 'Riduzione Tempi di Risposta') return ['Riduzione Tempi', 'di Risposta'];
                        if (value === 'Aumento Soddisfazione Clienti') return ['Aumento', 'Soddisfazione Clienti'];
                        if (value === 'Automatizzazione Processi') return ['Automatizzazione', 'Processi'];
                        if (value === 'Riduzione Costi Operativi') return ['Riduzione Costi', 'Operativi'];
                        return value;
                    },
                    style: { colors: isDark ? '#a1a1a6' : '#6e6e73', fontSize: '14px' }
                },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
            grid: { show: false },
            tooltip: { enabled: false }
        };
    }

    // Render Grafico on Visible
    const whyChooseSection = document.getElementById('why-choose');
    let statsChart = null;
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (statsChart) statsChart.destroy();
                statsChart = new ApexCharts(document.querySelector("#stats-chart"), getChartOptions());
                statsChart.render();
            }
        });
    }, { threshold: 0.1 });

    chartObserver.observe(whyChooseSection);

    // Resize Listener per Theme
    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) {
            const newIsMobile = window.matchMedia("(max-width: 768px)").matches;
            const newDefault = newIsMobile ? 'dark' : 'light';
            if (newDefault !== savedTheme) location.reload();
        }
        if (statsChart) statsChart.updateOptions(getChartOptions());
    }, 300));
});