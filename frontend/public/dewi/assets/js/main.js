/**
* Template Name: Dewi
* Template URL: https://bootstrapmade.com/dewi-free-multi-purpose-html-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

/* eslint-disable no-undef */
(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    // window 'load' chờ MỌI tài nguyên (ảnh, script bên ngoài...) tải xong, nếu một
    // tài nguyên nào treo thì preloader sẽ che vĩnh viễn và chặn hết tương tác trên trang.
    // Thêm timeout dự phòng để luôn gỡ preloader sau tối đa 4s.
    let removed = false;
    const removePreloader = () => {
      if (removed) return;
      removed = true;
      preloader.remove();
    };
    window.addEventListener('load', removePreloader);
    setTimeout(removePreloader, 4000);
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  try { GLightbox({ selector: '.glightbox' }); } catch { /* CDN not loaded */ }

  /**
   * Initiate Pure Counter
   */
  try { new PureCounter(); } catch { /* CDN not loaded */ }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      try {
        let config = JSON.parse(
          swiperElement.querySelector(".swiper-config").innerHTML.trim()
        );

        if (swiperElement.classList.contains("swiper-tab")) {
          initSwiperWithCustomPagination(swiperElement, config);
        } else {
          new Swiper(swiperElement, config);
        }
      } catch { /* CDN not loaded or invalid config */ }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Init isotope layout and filters
   */
  try {
    document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
      let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
      let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
      let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

      let initIsotope;
      imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
        initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
          itemSelector: '.isotope-item',
          layoutMode: layout,
          filter: filter,
          sortBy: sort
        });
      });

      isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
        filters.addEventListener('click', function() {
          isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
          this.classList.add('filter-active');
          initIsotope.arrange({
            filter: this.getAttribute('data-filter')
          });
          if (typeof aosInit === 'function') {
            aosInit();
          }
        }, false);
      });
    });
  } catch { /* CDN not loaded */ }

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function() {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    if (_scrollspyPaused) return;
    // Collect links that have matching sections on this page
    var pairs = [];
    navmenulinks.forEach(function (link) {
      if (!link.hash) return;
      var section = document.querySelector(link.hash);
      if (section) pairs.push({ link: link, top: section.offsetTop });
    });

    if (pairs.length === 0) return;

    // Active = the section whose top is closest to (but not above) scroll position.
    // When two sections share the same offsetTop (e.g. portfolio is empty/loading),
    // the first one in DOM order wins — so "Tour" beats "Giới thiệu" when portfolio
    // has zero height.
    var position = window.scrollY + 120;
    var active = null;
    var activeTop = -1;
    pairs.forEach(function (p) {
      if (p.top <= position && p.top > activeTop) {
        active = p.link;
        activeTop = p.top;
      }
    });

    // Fallback: if scrolled above all sections, activate the first
    if (!active) active = pairs[0].link;

    navmenulinks.forEach(function (link) { link.classList.remove('active'); });
    active.classList.add('active');
  }

  // On click: set active immediately, pause scrollspy until scroll stops.
  // A fixed timeout would be unreliable (scroll duration varies by distance).
  // Instead we debounce on the scroll event: when scroll has been silent for
  // 150ms we know the animation finished, then re-run scrollspy once.
  var _scrollspyPaused = false;
  var _scrollEndTimer = null;

  document.querySelectorAll('.navmenu a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      navmenulinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
      _scrollspyPaused = true;
    });
  });

  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', function () {
    if (_scrollspyPaused) {
      // While paused: each scroll event resets the 150ms "scroll has stopped" timer
      clearTimeout(_scrollEndTimer);
      _scrollEndTimer = setTimeout(function () {
        _scrollspyPaused = false;
        navmenuScrollspy();
      }, 150);
    } else {
      navmenuScrollspy();
    }
  });

  // Auto-set active nav link for sub-pages (my-tours, saved-tours, tour-details, etc.)
  // On index.html the scrollspy handles it; on other pages we match by URL.
  (function () {
    var filename = (window.location.pathname.split('/').pop() || '').split('?')[0] || 'index.html';
    if (filename === 'index.html' || filename === '') return;

    // 1. Exact href filename match (e.g. tours.html → <a href="tours.html">)
    var exactMatched = false;
    navmenulinks.forEach(function (link) {
      var hrefFile = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (hrefFile && hrefFile === filename) {
        link.classList.add('active');
        exactMatched = true;
      }
    });

    if (exactMatched) return;

    // 2. Group tour sub-pages under the "Tour" nav item
    var tourSubPages = ['my-tours.html', 'my-reviews.html', 'saved-tours.html', 'tour-details.html', 'notifications.html'];
    if (tourSubPages.indexOf(filename) !== -1) {
      navmenulinks.forEach(function (link) {
        var href = link.getAttribute('href') || '';
        // Match links that point to the tours section or tours page
        if (href.indexOf('#portfolio') !== -1 || href === 'tours.html' || href.indexOf('tours.html') !== -1) {
          link.classList.add('active');
        }
      });
    }
  })();

  // Allow external scripts (loadTours, loadRegistrations, etc.) to re-trigger
  // scrollspy after async content changes the page height.
  window.refreshNavScrollspy = function () {
    document.dispatchEvent(new Event('scroll'));
  };

})();