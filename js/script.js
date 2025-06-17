// Hamburger menu functionality - simplified for better compatibility
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    
    // Simple toggle function that works across all environments
    function toggleMenu() {
        if (hamburger.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        } else {
            hamburger.classList.add('active');
            navLinks.classList.add('active');
            document.body.classList.add('menu-open');
        }
    }
    
    // Add click event to hamburger
    hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMenu();
    });
    
    // Add click events to all nav links
    const links = document.querySelectorAll('.nav-links a');
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    }
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        const isClickInside = navLinks.contains(e.target) || hamburger.contains(e.target);
        if (!isClickInside && navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});