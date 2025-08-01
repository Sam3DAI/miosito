document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');

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

    // Toggle Menu con keyboard
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

    // Theme: Default device-based
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

    // Chart con dati aggiornati (da stat: 66% efficiency, 60% time, 70% precision, 45% satisfaction)
    const barChartOptions = {
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
        series: [{ data: [66, 70, 60, 45] }],
        xaxis: {
            categories: ['Efficienza Operativa', 'Precisione dei Dati', 'Risparmio di Tempo', 'Soddisfazione Clienti'],
            labels: {
                formatter: (val) => val + '%',
                style: { colors: '#6e6e73', fontSize: '14px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: (value) => {
                    if (value === 'Efficienza Operativa') return ['Efficienza', 'Operativa'];
                    if (value === 'Precisione dei Dati') return ['Precisione', 'dei Dati'];
                    if (value === 'Risparmio di Tempo') return ['Risparmio', 'di Tempo'];
                    if (value === 'Soddisfazione Clienti') return ['Soddisfazione', 'Clienti'];
                    return value;
                },
                style: { colors: '#6e6e73', fontSize: '14px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
        grid: { show: false },
        tooltip: { enabled: false }
    };

    const whyChooseSection = document.getElementById('why-choose');
    let statsChart = null;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (statsChart) statsChart.destroy();
                statsChart = new ApexCharts(document.querySelector("#stats-chart"), barChartOptions);
                statsChart.render();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(whyChooseSection);

    // Resize per theme
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };
    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) location.reload();
    }, 300));
});