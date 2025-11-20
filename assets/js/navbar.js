class NavBar extends HTMLElement {
    constructor() {
      super();
    }
    
    connectedCallback() {
      // Accessing elements within the Shadow DOM using the element.shadowRoot object
      const shadow = this.attachShadow({ mode: 'open' });
      const shadowOwner = shadow.host.parentElement.ownerDocument;

      const styleResetCSS = new CSSStyleSheet();
      styleResetCSS.replaceSync(`
          html {
            box-sizing:border-box;
          }  
        
          *, *:before, *:after {
              box-sizing:inherit;
          }  
        
          /* All the text in the following tags is converted to the default size, margin and padding */
          html, body, div, span, applet, object, iframe,
          h1, h2, h3, h4, h5, h6, p, blockquote, pre,
          a, abbr, acronym, address, big, cite, code,
          del, dfn, em, img, ins, kbd, q, s, samp,
          small, strike, strong, sub, sup, tt, var,
          b, u, i, center,
          dl, dt, dd, ol, ul, li,
          fieldset, form, label, legend,
          table, caption, tbody, tfoot, thead, tr, th, td,
          article, aside, canvas, details, embed, 
          figure, figcaption, footer, header, hgroup, 
          menu, nav, output, ruby, section, summary,
          time, mark, audio, video {  
	        margin: 0;  
	        padding: 0;  
	        border: 0;  
	        font-size: 100%;  
	        font: inherit;  
	        vertical-align: baseline;
          }  
        
          /* HTML5 display-role reset for older browsers */
          article, aside, details, figcaption, figure, 
          footer, header, hgroup, menu, nav, section {  
	        display: block;
          }  
        
          /* decrease body's line-height */
          body {  
	        line-height: 1;
          }  
        
          ol, ul, li {  
	        list-style: none;
          }  
        
          blockquote, q {  
	        quotes: none;
          }  
        
          blockquote:before, blockquote:after,
          q:before, q:after {  
	        content: '';  
	        content: none;
          }  
        
          table {  
	        border-collapse: collapse;  
	        border-spacing: 0;
          }  
        
          img {
            border-style:none
          }  
        
          audio:not([controls]) {
            display:none;
            height:0
          }  
        
          progress {
            vertical-align:baseline
          }  
        
          template, [hidden] {
            display:none
          }  
        
          a { 
            background-color:transparent;
            color: inherit
          }  
        
          a:active,a:hover {
            outline-width:0
          }  
        
          abbr[title],acronym[title] {
            border-bottom:none;
            text-decoration:underline;
          }  
        
          hr {
            box-sizing:content-box;
            height:0;
            border-width: 1px;
            overflow:visible
          }   
        
          button, input, select, textarea, optgroup {
            font:inherit;
            margin:0
          }  
        
          optgroup {
            font-weight:bold 
          }  
        
          button, input {
            overflow:visible
          }  
        
          button, select {
            text-transform:none
          }  
        
          button,[type=button],[type=reset],[type=submit]{
            -webkit-appearance:button
          }  
        
          button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,[type="color"]::-moz-focus-inner{
            border-style:none;
            padding:0
          }  
        
          textarea{
            overflow:auto
          }  
        
          /* style the inner part of the spinner button of number picker input elements in the browsers based on WebKit and Blink. */
          [type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button {
            height:auto;
            cursor: pointer;
          }  
        
          [type=search]{
            -webkit-appearance:textfield;
            outline-offset:0px
          }  
        
          input::file-selector-button{
            -webkit-appearance:button;
            font:inherit
          }
      `);
      shadow.adoptedStyleSheets = [styleResetCSS];

      const styleNavBar = new CSSStyleSheet();
      styleNavBar.replaceSync(`

        nav {
          direction: rtl;
          background-color: var(--nav-bar-background-color);
          display: flex !important;
          justify-content: center;
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 60px;
          z-index: 100;
        }
      
        a {
          text-decoration: none;
          transition: all 0.4s;
        }
      
        nav#stickyNavbar > div.container a,
        nav#stickyNavbar > div.container span:not(.accordion-content-text.dropdown-content-text) {
          font-family: var(--nav-bar-font);
          font-size: var(--nav-bar-font-size);
          color: var(--nav-bar-links-color);
          transition: all 0.4s;
        }
      
        a:hover,
        i:not(.specific-hover):hover {
          color: var(--nav-bar-links-hover) !important;
          transition: all 0.4s;
        }
      
        .btn-wrapper {
          cursor: pointer;
          justify-content: end;
        }
      
        .btn-wrapper:hover span {
          color: var(--nav-bar-links-hover) !important;
        }
      
        .btn-wrapper:hover .bar1,
        .btn-wrapper:hover .bar2,
        .btn-wrapper:hover .bar3 {
          background-color: var(--nav-bar-links-hover) !important;
        }
      
        ul {
          list-style-type: none;
          column-gap: 11px;
        }
      
        i.las {
          font-size: calc( 1.5 * var(--nav-bar-font-size));
          cursor: pointer;
          color: var(--nav-bar-links-color);
          transition: all 0.4s;
        }
      
        ul:last-child {
          justify-self: end;
          direction: ltr;
        }
      
        .image {
          max-width: 100%;
          height: auto;
        }
      
        .img {
          width: 100%;
        }
      
        img {
          vertical-align: middle;
        }
      
        .display-none {
          display: none;
        }
      
        .invisible {
          visibility: hidden;
        }
      
        .show {
          display: block;
        }
      
        .display-inline {
          display: inline;
        }
      
        .display-flex {
          display: flex;
          align-items: center;
        }
      
        .container {
          margin: 0 auto;
          display: grid;
          grid-template-columns: calc(3 * var(--nav-bar-font-size)) calc(4 * var(--nav-bar-font-size)) auto auto;
          width: 90%;
          max-width: min(1100px, 90%);
          align-items: center;
          column-gap: calc(1.2 * var(--nav-bar-font-size));
          height: 50px;
          padding: calc(0.3 * var(--nav-bar-font-size));
      
          ul {
            column-gap: calc(1.2 * var(--nav-bar-font-size));
          }

          .logo-wrapper {
            position: relative;

            a {
              position: absolute;
              top: -24px;

              img {
                width: 52px;
                max-height: 52px;
              }
            }
          }
        }
      
        .menu-btn-container {
          display: inline-flex;
          flex-direction: column;
          cursor: pointer;
          padding: 0 5px;
          position: relative;
        }
      
        .bar1,
        .bar2,
        .bar3 {
          width: 18px;
          height: 3px;
          background-color: var(--nav-bar-links-color);
          margin: 2px 0;
          transition: 0.4s;
        }
      
        .bar1.checked {
          transform: translate(0, 6px) rotate(-45deg);
        }
      
        .bar2.checked {
          opacity: 0;
        }
      
        .bar3.checked {
          transform: translate(0, -8px) rotate(45deg);
        }
      
        div.menu {
          position: fixed;
          z-index: -1;
          visibility: hidden;
          right: 0;
          top: 0;
          height: 100%;
          width: 0;
          display: flex;
          flex-direction: column;
          -webkit-transition: 0.5s;
          -moz-transition: 0.5s;
          -ms-transition: 0.5s;
          -o-transition: 0.5s;
          transition: 0.5s;
          opacity: 0;
          pointer-events: none;
      
          #close-menu {
            position: absolute;
            left: 15px;
            top: 25px;
          }
      
          & > a {
            margin: 7vh 0px 7vh;
            align-self: center;
            max-height: 22vh;
            width: 220px;

            img {
              max-height: 100%;
              width: 100%;
            }
          }
      
          ul.menu-list {
            padding: 0 40px;
            max-height: 50vh;
            min-height: 49vh;
            display: flex;
            flex-direction: column;
            row-gap: calc(0.25 * var(--nav-bar-font-size));
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: none;
      
            & > li {
              visibility: hidden;
              opacity: 0;
              min-width: 200px;
              margin-bottom: 5px;
              font-weight: 400;
              -webkit-transition: 0.5s;
              -moz-transition: 0.5s;
              -ms-transition: 0.5s;
              -o-transition: 0.5s;
              transition: 0.5s;

              & a > img {
                max-width: 42px;
                max-height: 42px;
              }
      
              & span {
                margin-right: 10px;
              }
            }
      
            .accordion {
              border: none;
              outline: none;
      
              & > a {
                display: block;
                width: 100%;
                position: relative;

                span.accordion-content-text {
                  font-size: var(--nav-bar-font-size);
                }
              }
            }
      
            .accordion > a > span::after {
              content: "+";
              color: var(--nav-bar-links-color);
              font-family: arial;
              font-size: 16px;
              font-weight: bold;
              margin-right: 5px;
              position: absolute;
              right: 250px;
              top: 16px;
            }
      
            a.active > span::after {
              content: "−";
            }
      
            .dropdown-panel {
              padding: 0 18px;
              max-height: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              width: 100%;
              justify-content: flex-start;
              direction: rtl;
              transition: max-height 0.2s ease-out;
      
              & > .dropdown-content {
                margin-top: 14px;
                margin-right: 48px;

                span.accordion-content-text.dropdown-content-text {
                   font-size: calc(0.92 * var(--nav-bar-font-size));
                }
              }
            }
          }
      
          footer.social {
            position: absolute;
            bottom: 5%;
            align-self: center;
            display: flex;
      
            div.popup {
              width: 240px;
              height: 50px;
              display: flex;
              justify-content: center;
              align-items: center;
              border-radius: calc(2.25 * var(--nav-bar-font-size));
              transition: all 0.25s ease;
              -webkit-transition: all 0.25s ease;
            }

            div.popup a[href=''] {
              display: none;
            }
      
            div.popup a:not([href='']) {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 30px;
              height: 30px;
              margin: 0 calc(0.4 * var(--nav-bar-font-size));
            }
      
            div.popup i {
              font-size: calc(1.5 * var(--nav-bar-font-size));;
              color: #000;
              transition: all 0.25s ease;
              -webkit-transition: all 0.25s ease;
            }
      
            div.popup a:hover > i {
              font-size: calc(2 * var(--nav-bar-font-size));
              transform: translateY(-3px);
            }
      
            div.popup a:nth-child(5):hover > i#phone {
              color: #3b5999;
            }
            div.popup a:nth-child(2):hover > i#instagram {
              color: #e1306c;
            }
            div.popup a:nth-child(3):hover > i#telegram {
              color: #46c1f6;
            }
            div.popup a:nth-child(4):hover > i#whatsapp {
              color: #378600;
            }
            div.popup a:nth-child(1):hover > i#envelope {
              color: #00998c;
            }
          }
        }
      
        .menu.open {
          z-index: 110;
          visibility: visible;
          opacity: 1;
          width: 350px;
          pointer-events: fill;
      
          ul.menu-list > li {
            visibility: visible;
            opacity: 1;
            -webkit-transition: 0.5s;
            -moz-transition: 0.5s;
            -ms-transition: 0.5s;
            -o-transition: 0.5s;
            transition: 0.5s;
          }
        }
      
        .menu.open::before {
          width: 100%;
        }
      
        .menu::before {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 0;
          background: var(--nav-bar-menu-background-color);
          -webkit-transition: 0.5s;
          -moz-transition: 0.5s;
          -ms-transition: 0.5s;
          -o-transition: 0.5s;
          transition: 0.5s;
          z-index: -1;
        }

        /*
      
        .menu::after {
          content: "";
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          position: fixed;
          top: 0;
          right: 0;
          z-index: -2;
          opacity: 0;
          visibility: hidden;
          -webkit-transition: 0.8s;
          -moz-transition: 0.8s;
          -ms-transition: 0.8s;
          -o-transition: 0.8s;
          transition: 0.8s;
        }
      
        .menu.open::after {
          visibility: visible;
          opacity: 1;
        }

        */

        .container::after{
          content: "";
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          position: fixed;
          top: 0;
          right: 0;
          z-index: 1;
          opacity: 0;
          visibility: hidden;
          -webkit-transition: 0.3s;
          -moz-transition: 0.3s;
          -ms-transition: 0.3s;
          -o-transition: 0.3s;
          transition: 0.3s;
        }
      
        .container.open::after {
          visibility: visible;
          opacity: 1;
        }

        .search-box {
          position: relative;
          direction: rtl;
          height: 40px;
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
      
          form {
            position: absolute;
            display: flex;
            left: 40px;
            top: 0;
            height: 40px;
            justify-content: center;
            background-color: #666;
            transition: transform 0.3s;
            direction: rtl;
            transform: scaleX(0);
            transform-origin: 0% 50%;
      
            i.la-undo-alt {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: calc(0.6 * var(--nav-bar-font-size));;
              color: #fff;
              margin: 0 8px;
              transition: all 0.3s;
            }
      
            input {
              border: none;
              outline: none;
              font-family: var(--nav-bar-font);
              font-size: calc(0.7 * var(--nav-bar-font-size));
              font-weight: 700;
              direction: rtl;
              background-color: #666;
              color: #fff;
              transition: all 0.3s;
            }
      
            input::placeholder {
              color: #fff;
              direction: rtl;
              transition: all 0.3s;
            }
          }
        }

        #nav-cart {
          position: relative;
        }
      
        @media screen and (min-width: 1360px) {
          a,
          span:not(.accordion-content-text) {
            font-size: calc(1.22 * var(--nav-bar-font-size)) !important;
          }
          .container {
            column-gap: calc(1.3 * var(--nav-bar-font-size));
            grid-template-columns: calc(6.2 * var(--nav-bar-font-size)) calc(4 * var(--nav-bar-font-size)) auto auto;
            width: 90%;
            max-width: min(1200px, 90%);
      
            ul {
              column-gap: calc(1.3 * var(--nav-bar-font-size));
            }
          }
        }
        @media screen and (max-width: 700px) {
          a,
          span:not(.accordion-content-text) {
            font-size: calc(0.85 * var(--nav-bar-font-size)) !important;
          }
          .container {
            column-gap: calc(0.8 * var(--nav-bar-font-size));
      
            ul {
              column-gap: calc(0.6 * var(--nav-bar-font-size));
            }
          }
          .hide-576,
          .hide-500 a {
            line-height: 16px;
          }
        }
        @media screen and (max-width: 615px) {
          a,
          span:not(.accordion-content-text) {
            font-size: calc(0.75 * var(--nav-bar-font-size)) !important;
          }
        }
        @media screen and (max-width: 576px) {
          .hide-576 {
            display: none;
          }
        }
        @media screen and (max-width: 500px) {
          .hide-500 {
            display: none;
          }
        }
        
        .stickyClass {
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.2);

          .container {
            .logo-wrapper {
              a {
                position: absolute;
                top: -24px;
  
                img {
                  width: 48px;
                  max-height: 48px;
                }
              }    
            }
          }
        }

        .user-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: calc(0.3 * var(--nav-bar-font-size));
          cursor: pointer;

          &:hover * {
            color: var(--nav-bar-links-hover) !important;
            transition: all 0.4s;
          }
        }

      `);
      shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, styleNavBar];

      // Get items from attributes or use default
      const navLogo = this.getAttribute('logo')
        ? JSON.parse(this.getAttribute('logo'))
        : [
            { src: '', href: 'javascript:void(0)' }
          ];
        
      const menuButton = this.getAttribute('menu-button-label')
        ? JSON.parse(this.getAttribute('menu-button-label'))
        : [
            { text: 'محصولات' }
          ];
      
      const sideMenuLogo = this.getAttribute('side-menu-logo')
        ? JSON.parse(this.getAttribute('side-menu-logo'))
        : [
            { src: '', href: 'javascript:void(0)' }
          ];

      const sideMenuList = this.getAttribute('side-menu-list')
        ? JSON.parse(this.getAttribute('side-menu-list'))
        : [
            { text: 'آيتم اول', 
              link: 'javascript:void(0)', 
              icon: '', 
              accordion: '', 
              dropdown: [
                { text: '', href: '' },
                { text: '', href: '' }
              ]
            },
            { text: 'آيتم دوم', 
              link: 'javascript:void(0)', 
              icon: '', 
              accordion: 'yes', 
              dropdown: [
                { text: 'زیر آيتم اول', href: '' },
                { text: 'زیر آيتم دوم', href: '' }
              ]
            }
          ];
        
      const sideMenuListItems = sideMenuList.map(function (item) { 

        if (item.accordion === 'yes') {

          const listSubItems = item.dropdown.map(subitem => 
            `<li class="dropdown-content">
		          <a href="${subitem.href}">
		        	  <span class="accordion-content-text dropdown-content-text">${subitem.text}</span>
		          </a>
		        </li>`
          ).join('');

          return `
            <li class="accordion">
              <a href="${item.link}">
                <img src="${item.icon}" alt="icon" />
                <span class="accordion-content-text">${item.text}</span>
              </a>
              <ul class="dropdown-panel">
                ${listSubItems}
              </ul>
            </li>`;

        } else {

           return `
            <li class="">
              <a href="${item.link}">
                <img src="${item.icon}" alt="icon" />
                <span class="accordion-content-text">${item.text}</span>
              </a>
            </li>`;
        };

      }).join('');

      const socialMediaLinks = this.getAttribute('social-links')
        ? JSON.parse(this.getAttribute('social-links'))
        : [
            { email: 'javascript:void(0)' },
            { instagram: 'javascript:void(0)' },
            { telegram: 'javascript:void(0)' },
            { whatsapp: 'javascript:void(0)' },
            { phone: 'javascript:void(0)' }
          ];
      
      let emailValue = "", instagramValue = "", telegramValue = "", whatsappValue = "", phoneValue = "";
      for (const obj of socialMediaLinks) {
        if (obj.email) {
          emailValue = `mailto:${obj.email}`;
        } else if (obj.instagram) {
          instagramValue = obj.instagram;
        } else if (obj.telegram) {
          telegramValue = obj.telegram;
        } else if (obj.whatsapp) {
          whatsappValue = `https://wa.me/${obj.whatsapp}?text=سلام!`;
        } else if (obj.phone) {
          phoneValue = `tel:${obj.phone}`;
        } else {
          break;
        }
      }

      const navList = this.getAttribute('items')
        ? JSON.parse(this.getAttribute('items'))
        : [
            { text: 'درباره ما', href: 'javascript:void(0)' },
            { text: 'تماس با ما', href: 'javascript:void(0)' }
          ];
    
      const navItems = navList.map(item => 
        `<li class="hide-500"><a href="${item.href}">${item.text}</a></li>`
      ).join('');

      shadow.innerHTML = `
        
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css"
        />

        <nav id="stickyNavbar" class="none" lang="fa" style="padding-top: 10px">
          <div class="container">

            <!-- site's logo -->
            <div class="display-flex logo-wrapper">
              <a href="${navLogo[0].href}">
                <img src="${navLogo[0].src}" alt="logo" />
              </a>
            </div>

            <!-- menu button -->
            <div class="display-flex btn-wrapper">
              <div class="menu-btn-container">
                <div class="bar1"></div>
                <div class="bar2"></div>
                <div class="bar3"></div>
              </div>
              <span> ${menuButton[0].text} </span>
            </div>

            <!-- side menu contents -->
            <div class="menu">
              <!-- menu closing button -->
              <i class="las la-times" id="close-menu"></i>

              <!-- side menu logo -->
              <a href="${sideMenuLogo[0].href}">
                <img src="${sideMenuLogo[0].src}" alt="menu-logo" />
              </a>

              <!-- menu list -->
              <ul class="menu-list">
                ${sideMenuListItems}
              </ul>

              <!-- social media links -->
              <footer class="social">
                <div class="popup">
                  <a href="${emailValue}">
                    <i id="envelope" class="la la-envelope specific-hover"></i>
                  </a>
                  <a href="${instagramValue}">
                    <i id="instagram" class="lab la-instagram specific-hover"></i>
                  </a>
                  <a href="${telegramValue}">
                    <i id="telegram" class="lab la-telegram specific-hover"></i>
                  </a>
                  <a href="${whatsappValue}">
                    <i id="whatsapp" class="lab la-whatsapp specific-hover"></i>
                  </a>
                  <a href="${phoneValue}">
                    <i id="phone" class="la la-phone specific-hover"></i>
                  </a>
                </div>
              </footer>
            </div>

            <!-- navigation items -->
            <ul class="display-flex">
              ${navItems}
            </ul>

            <!-- navigation items left -->
            <ul class="display-flex">
              <li>
                <i id="nav-cart" class="las la-shopping-cart"></i>
              </li>
              <li id="nav-login">
                <a class="user-action">
                  <i id="" style="font-size: 18px" class="las la-caret-down"></i>
                  <i id="nav-user-action" class="las la-user"></i>
                  <!--
                  <span id="nav-signup" class="hide-576" href="">ثبت نام</span>
                  <span class="hide-576"> | </span>
                  <span class="hide-576" href="">ورود</span>
                  -->
                </a>
              </li>
              <li class="search-box">
                <i class="las la-search"></i>
                <form class="invisible" action="">
                  <i class="las la-undo-alt specific-hover"></i>
                  <input type="text" placeholder="جستجو..." />
                </form>
              </li>
            </ul>

          </div>
        </nav>
      `;

      window.onscroll = function () {stickyFunction()};

      const lineAwesomeLink = document.createElement("link");
      lineAwesomeLink.rel = 'stylesheet';
      lineAwesomeLink.href = "https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css";
      lineAwesomeLink.id = "line-awesome";
      shadowOwner.getElementsByTagName('head')[0].appendChild(lineAwesomeLink);
      const lineAwesomeStylesheet = shadowOwner.getElementById("line-awesome");
          
      lineAwesomeStylesheet.onerror = (e) => {
        e.target.href = "https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css";
      };
      
      const navbar = shadow.getElementById("stickyNavbar");
      const menuToggle = shadow.querySelector(".btn-wrapper");
      const menuClose = shadow.getElementById("close-menu");
      const accordion = shadow.querySelectorAll(".accordion");
      const container = shadow.querySelector(".container");
      const sideMenu = shadow.querySelector("div.menu");

      menuToggle.addEventListener("click", closeMenu);
      menuClose.addEventListener("click", closeMenu);
      sideMenu.addEventListener('click', (e) => {e.stopPropagation()});
      container.addEventListener("click", function (e) {
        if (e.target.classList.contains("open")) {
          closeMenu();
        }
        return;
      }, { capture: false });
      
      for (let i = 0; i < accordion.length; i++) {
        accordion[i].firstElementChild.addEventListener("click", function (e) {
          this.classList.toggle("active");
          e.preventDefault();
          let dropdownPanel = this.nextElementSibling;
          if (dropdownPanel.style.maxHeight) {
            dropdownPanel.style.maxHeight = null;
          } else {
            dropdownPanel.style.maxHeight = dropdownPanel.scrollHeight + "px";
          }
        });
      }
      
      shadow.querySelector(".la-undo-alt").addEventListener("click", (event) => {
         shadow.querySelector("form").reset();
      });
      
      shadow.querySelector(".la-search").addEventListener("click", (event) => {
        const searchBox =  shadow.querySelector(".search-box");
        const searchBtn = event.target;
        const form = event.target.nextElementSibling;
     
        if (form.classList.contains("invisible")) {
          form.classList.remove("invisible");
          searchBox.style.backgroundColor = "#666";
          searchBtn.style.color = "#FFF";
          searchBtn.classList.toggle("la-times");
          shadow.querySelector("form").style.transform = "scaleX(1)";
        } else {
          form.classList.add("invisible");
          shadow.querySelector("form").style.transform = "scaleX(0)";
          setTimeout(() => {
            searchBox.style.backgroundColor = "transparent";
            searchBtn.style.color = "var(--nav-bar-links-color)";
            searchBtn.classList.toggle("la-times");
          }, 270);
        }
      });
      
      function stickyFunction() {
        if(window.scrollY || window.pageYOffSet > 1) {
          navbar.classList.add("stickyClass");
          navbar.style.paddingTop = "0";
          navbar.style.height = '50px';
          navbar.style.backgroundColor = "#f1f1f1";
        } else {
          navbar.classList.remove("stickyClass");
          navbar.style.paddingTop = "10px";
          navbar.style.height = '60px';
          navbar.style.backgroundColor = "transparent";
        }
      }
      
      function closeMenu(event) {
         shadow.querySelector(".bar1").classList.toggle("checked");
         shadow.querySelector(".bar2").classList.toggle("checked");
         shadow.querySelector(".bar3").classList.toggle("checked");
         shadow.querySelector("div.menu").classList.toggle("open");
         if (shadow.querySelector("div.menu").classList.contains("open")) {
           const scrollbarWidth = parseFloat(window.innerWidth - shadowOwner.querySelector('html').clientWidth);
           shadowOwner.querySelector('html').style.overflowY = 'hidden';
           shadowOwner.querySelector('html').style.paddingRight = `${scrollbarWidth}px`;
           navbar.style.paddingRight = `${scrollbarWidth}px`;
         } else {
           shadowOwner.querySelector('html').style.overflowY = '';
           shadowOwner.querySelector('html').style.paddingRight = '';
           navbar.style.paddingRight = '0px';
         };
         for (let i = 0; i < accordion.length; i++) {
           if (accordion[i].firstElementChild.classList.contains("active")) {
             accordion[i].firstElementChild.classList.remove("active");
             accordion[i].firstElementChild.nextElementSibling.style.maxHeight = null;
           };
         };
         container.classList.toggle("open");
      }
    }
}

customElements.define('nav-bar', NavBar);