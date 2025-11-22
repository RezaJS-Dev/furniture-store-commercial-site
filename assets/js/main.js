let username;

// Dispatch event when productsDB is ready
const productsDBReadySuccessEvent = new CustomEvent('productsDatabaseSuccessReady');
let productsDBReadySuccessEventDispatched = null;

// Display numbers in persian

function toPersianNumbers(input) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return input.toString().replace(/[0-9]/g, (digit) => persianDigits[digit]);
}

// Convert Numbers to english characters

function toEnglishDigits(input) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const i = input.toString();
  return i
      .split("")                                                  // convert to an array
      .map((e) => englishDigits[persianDigits.indexOf(e)] || e)   // Creates and Returns a new array
      .join("");
}

/* Alternate way:
function convertPersianToWesternDigits(str) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (d) => persianDigits.indexOf(d));
}
*/

// Normalize persian texts

const normalizePersianText = function(text) {
  if (!text) return '';
  let normalized = text.toString();
  // Replace Arabic Yeh (ي and ى) with Persian Yeh (ی)
  normalized = normalized.replace(/[\u064A\u0649]/g, '\u06CC'); // ي ى -> ی
  // Replace Arabic Kaf (ك) with Persian Kaf (ک)
  normalized = normalized.replace(/\u0643/g, '\u06A9'); // ك -> ک
  // Remove diacritics (optional)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
  // Normalize spaces
  normalized = normalized.replace(/[\u00A0\u200C\u200E\u200F]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = toPersianNumbers(normalized);
  return normalized;
};

/* Footer Changeable */

const lastElement = document.querySelector(".post-footer");
const mainEl = document.querySelector("main");
let winScrollInit = window.scrollY;
let docOffsetHeightInit = document.body.offsetHeight;
let observedScroll = 0;
  
window.addEventListener('scroll', function() {
    const footerEl = document.getElementById("footer-changeable");
    const preFooterEl = document.querySelector(".pre-footer-before"); 
    const footerContentEl = document.querySelector(".footer-content").parentElement; 
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.body.offsetHeight;
    const scrollPercent = scrollPosition / (docHeight - windowHeight);
    const rect = lastElement.getBoundingClientRect();

    if (scrollPercent == 1) {
      observedScroll = 1;
    } else {
      observedScroll = 0;
    };
  
    if (scrollPosition > 0.2 * (docHeight - windowHeight) ) {
      footerEl.style.willChange = "transform, opacity";
  
      let transformPercent = Math.max(0, 100 - scrollPercent * 100);
      let opacityPercent = Math.min(1, 0.01 * (100 - 3 * transformPercent));
      footerEl.style.transform = `translateY(${transformPercent}%)`;
      footerEl.style.opacity = `${((opacityPercent) > 0.67) ? 1.01 * opacityPercent:0.67}`;
      footerContentEl.style.opacity = `${((opacityPercent) > 0.1) ? opacityPercent:0.01}`;
    } else {
      footerEl.style.willChange = "auto";
      footerEl.style.transform = "translateY(50%)";
      footerEl.style.opacity = "0.65";
      footerContentEl.style.opacity = "0.0";
    };
    
    if ( rect.top >= 0 &&
         rect.left >= 0 &&
         Number.parseInt(rect.bottom) <= (window.innerHeight || document.documentElement.clientHeight) &&
         Number.parseInt(rect.right) <= (window.innerWidth || document.documentElement.clientWidth)
       ) {
      winScrollInit = window.scrollY;
    };
});

window.addEventListener('resize', function (e) { 
  let preFooterEl = document.querySelector(".pre-footer");
  const rect = preFooterEl.getBoundingClientRect();
  if ( (document.body.offsetHeight > docOffsetHeightInit) && 
      Number.parseInt(0.1*winScrollInit) <= Number.parseInt(0.1*(document.body.offsetHeight - window.innerHeight)) &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      Number.parseInt(rect.bottom) <= (window.innerHeight || document.documentElement.clientHeight) &&
      Number.parseInt(rect.right) <= (window.innerWidth || document.documentElement.clientWidth)
    ) {
    lastElement.scrollIntoView(false);
    console.log('done');
  }
});

// The main element resize Observer

const observer = new ResizeObserver( () => {
  if (observedScroll == 1) {
    lastElement.scrollIntoView(false);
  };
});
  
observer.observe(mainEl);

/* Notification Maker - Primary classes: .notif-success .notif-info .notif-warning .notif-danger */

function notification(
    msg = "testing", 
    icon = "&check;", 
    bkgc = "#fff", 
    txtc = "#000", 
    iconc = "#1f1", 
    CSSStylesheetId, 
    notifPrimaryClass = "notif-style-sheet"
  ) {
    const existNotifStylesheets = Array.from(document.querySelectorAll(`.${notifPrimaryClass}`));
    const stopFunction = existNotifStylesheets.find(function (item) {
      return item.id === CSSStylesheetId;
    });
    if (stopFunction) { return };
    const notifStyleSheetsLength = (document.styleSheets) ? document.querySelectorAll(`.${notifPrimaryClass}`).length : null;
    const notifMsg = msg;
    const notifIcon = icon;
    const notifBackgroundColor = bkgc;
    const notifTextColor = txtc;
    const notifIconColor = iconc;
    const notifCSSStylesheetElId = CSSStylesheetId ?? `id${Math.floor(Math.random() * 100)}`;
    const notifElId = `id${Math.floor(Math.random() * 100)}`;
    const notifCSSStylesheetEl = document.createElement("style");
    notifCSSStylesheetEl.id = notifCSSStylesheetElId;
    notifCSSStylesheetEl.className = notifPrimaryClass;
    notifCSSStylesheetEl.innerHTML = `/* Notification style */
     .notif-wrapper-${notifElId} {
         --notif-background: ${notifBackgroundColor};
         --notif-color: ${notifTextColor};
         --notif-icon: ${notifIconColor};
         position: fixed;
         right: 3rem;
         width: max-content;
         min-width: 250px;
         height: 60px;
         background-color: var(--notif-background) !important;
         color: var(--notif-color) !important;
         bottom: ${notifStyleSheetsLength * 70 + 30}px;
         border-radius: 4px;
         -webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .16), 0 0 2px 0 rgba(0, 0, 0, .12);
         box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .16), 0 0 2px 0 rgba(0, 0, 0, .12);
         padding: 8px 16px;
         display: flex;
         flex-direction: row;
         animation: fade-in-notif 5.3s linear !important;
         -webkit-animation: fade-in-notif 5.3s linear !important;
         z-index: 3;
         transform: translateY(20px);
         -webkit-transform: translateY(20px);
         -moz-transform: translateY(20px);
         -ms-transform: translateY(20px);
         -o-transform: translateY(20px);
         visibility: hidden;
         opacity: 0;

         @media screen and (max-width: 550px) { 
             right: 10px;
         }
         
         .notif-content-${notifElId}  {
             display: flex;
             align-items: center;
             width: 100%;
         }
         
         .notif-close-${notifElId} {
             font-size: 26px;
             font-family: serif;
             position: absolute;
             left: 5px;
             top: 5px;
             padding: 2px;
             line-height: 0.5;
             background-color: transparent;
             outline: none;
             border: none;
             border-radius: 2px;
             text-align: center;
             cursor: pointer;
             appearance: none;
     
             span {
                 display: block;
                 height: 14px;
             }
     
             &:hover,
             &:focus,
             &:active {
                 font-weight: 600;
                 border: solid 1px rgba(0, 0, 0, 0.3);
                 padding: 1px;
             }
         }
     
         .notif-msg-wrapper-${notifElId} {
             font-size: 14px;
             font-family: 'Yekan';
             font-weight: 400;

             @media screen and (max-width: 550px) {
               font-size: 12px;
             }
         }
     
         span.notif-msg-${notifElId} {
             word-spacing: 2px;

             @media screen and (max-width: 550px) {
               word-spacing: 0px;
             }
         }
     
         i.notif-icon-${notifElId} {
             font-family: serif;
             font-size: 18px;
             margin-left: 8px;
             color: var(--notif-icon) !important;
             font-weight: 900;
     
             &::after {
                 content: "";
             }
     
         }
     
         &::after {
             content: "";
             position: absolute;
             bottom: 10px;
             width: calc(100% - 32px);
             height: 0.2rem;
             transform: scaleX(0);
             transform-origin: right;
             background: linear-gradient(to right, var(--notif-color), var(--notif-background) ) !important;
             animation: progress-notif 4.5s 0.4s linear !important;
             -webkit-animation: progress-notif 4.5s 0.4s linear !important;
             border-radius: 6px;
             -webkit-border-radius: 6px;
             -moz-border-radius: 6px;
             -ms-border-radius: 6px;
             -o-border-radius: 6px;
         }
     }
     /*
     @keyframes fade-in-notif {
             5% {
                 opacity: 1;
                 visibility: visible;
                 transform: translateY(10px);
                 -webkit-transform: translateY(10px);
                 -moz-transform: translateY(10px);
                 -ms-transform: translateY(10px);
                 -o-transform: translateY(10px);
             }
             95% {
                 opacity: 1;
                 transform: translateY(10px);
                 -webkit-transform: translateY(10px);
                 -moz-transform: translateY(10px);
                 -ms-transform: translateY(10px);
                 -o-transform: translateY(10px);
             }
     }
     
     @keyframes progress-notif {
         0% {
             transform: scaleX(0);
             -webkit-transform: scaleX(0);
             -moz-transform: scaleX(0);
             -ms-transform: scaleX(0);
             -o-transform: scaleX(0);
         }
         100% {
             transform: scaleX(1);
             -webkit-transform: scaleX(1);
             -moz-transform: scaleX(1);
             -ms-transform: scaleX(1);
             -o-transform: scaleX(1);
         }
      }*/
    `;
    const notifEl = document.createElement("div");
    notifEl.id = notifElId;
    notifEl.className = `notif-wrapper-default notif-wrapper-${notifElId}`;
    notifEl.innerHTML = `
    <!-- Notification body -->
    <div class="notif-content-default notif-content-${notifElId}">
      <button class="notif-close-${notifElId}" onclick="document.querySelector('.notif-wrapper-${notifElId}').style.display = 'none'">
        <span>&times;</span>
      </button>
      <div class="notif-msg-wrapper-default notif-msg-wrapper-${notifElId}">
        <i class="notif-icon-${notifElId}">${notifIcon}</i>
        <span class="notif-msg-${notifElId}">${notifMsg}</span>
      </div>
    </div>
    `;
    document.getElementsByTagName('head')[0].appendChild(notifCSSStylesheetEl);
    document.getElementsByTagName('body')[0].appendChild(notifEl);
    console.log(notifMsg);
    // Remove after 5 seconds
    setTimeout(notifRemover, 5450);
    function notifRemover() {
      const notifCSSEl = document.getElementsByTagName('head')[0].querySelector(`#${notifCSSStylesheetElId}`);
      document.getElementsByTagName('head')[0].removeChild(notifCSSEl);
      const notif = document.querySelector(`#${notifElId}`);
      document.getElementsByTagName('body')[0].removeChild(notif);
    }
}

// Sending login form data

async function sendLoginData(form) {
    const formData = new FormData(form);
    // Just to see what FormData contains
    for (let [key, value] of formData) {
        console.log(`${key}: ${value}`);
    }
    const formDataObj = Object.fromEntries(formData); 
    const jsonData = JSON.stringify(formDataObj);
    notification(
      "لطفا چند لحظه منتظر بمانید.",
      "&crarr;",
      "#fbff13ff",
      "#000",
      "#0f7918ff",
      "user-registered-01",
      "notif-success"
    );
    try {
      const rndNum = Math.floor(Math.random() * 10) + 1;
      const linkUrl = (rndNum < 5) ? "https://jsonplaceholder.typicode.com/posts" : "https://httpbin.org/post";
      console.log('sending login data to:', linkUrl);
      const response = await fetch(linkUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonData
      });
      if (response.ok) {
        console.log(response.status);
        const responseObject = await response.json();
        const userData = (responseObject.json) ? responseObject.json : responseObject;
        console.log(userData);

        if (form.name === "login-modal") {
          form.ownerDocument.querySelector('#mui-overlay a.close').click();
        }

        // Open the IndexedDB database
        const db = await openDB();
        // Fetch the full user data from IndexedDB using the username
        const authenticatedUser = await getUsername(db, userData.email); 

        // Check if the user was actually found in the database
        if (
          authenticatedUser &&
          authenticatedUser.username === userData.email &&
          authenticatedUser.password === userData.loginPassword
        ) {
          // Handle authentication
          if (sessionStorage.getItem('authenticated')) {
            sessionStorage.removeItem('authenticated');
          }
          if (localStorage.getItem('authenticated')) {
            localStorage.removeItem('authenticated');
          }
          let authenticated = {
            isAuthenticated: true,
            username: userData.email,
          }
          const rememberMeChecked = userData.rememberme;
          if (rememberMeChecked === "on") {
            sessionStorage.setItem('authenticated', JSON.stringify(authenticated));
          } else {
            localStorage.setItem('authenticated', JSON.stringify(authenticated));
          }
          // Redirect
          window.location.href = window.location.origin + "/index.html";
        } else {
          notification(
              "نام کاربری یا کلمه عبور صحیح نمی‌باشد.",
              "&cross;",
              "#ff3713ff",
              "#fff",
              "#ff391fff",
              "check-existing-user-error-01",
              "notif-danger"
          );
          if (sessionStorage.getItem('authenticated')) {
            sessionStorage.removeItem('authenticated');
          }
          if (localStorage.getItem('authenticated')) {
            localStorage.removeItem('authenticated');
          }
        }
      } else {
        notification(
          "عملیات با اشکال روبرو شد. لطفا دقایقی دیگر دوباره تلاش کنید.",
          "&cross;",
          "#fbff13ff",
          "#000",
          "#ff391fff",
          "check-existing-user-error-01",
          "notif-danger"
        );
      }
    } catch (e) {
      console.error(e);
    }

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('users', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('validUsers')) {
            const store = db.createObjectStore('validUsers', { keyPath: 'username' });
          }
        };
      });
    }
    
    /**
     * Retrieves a user by their username from the 'validUsers' store.
     * @returns {Promise<Object|undefined>} The user object if found, otherwise undefined.
     */
    function getUsername(db, username) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['validUsers'], 'readonly');
        const store = transaction.objectStore('validUsers');
        const request = store.get(username); // Get the record with the key `username`
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result); // Will be undefined if not found
      });
    }
}

// Checking Enter input
function preventEnterKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
}
  
  // Modal by MUI - login
  
const navbarEl = document.getElementById('navbar1');

const activateOverlay = function (event) {
    event.preventDefault();
    const htmlHost = document.querySelector('html');
    const bodyHost = document.querySelector('body');
    const scrollbarWidth = window.innerWidth - htmlHost.clientWidth;
    htmlHost.style.overflowY = 'hidden';
    navbarEl.shadowRoot.getElementById('stickyNavbar').style.paddingRight = `${scrollbarWidth}px`;
    htmlHost.style.paddingRight = `${scrollbarWidth}px`;
    bodyHost.style.overflowY = 'hidden';
    // set overlay options
    const options = {
      'keyboard': true,         // teardown when <esc> key is pressed (default: true)
      'static': false,          // maintain overlay when clicked (default: false)
      'onclose': function() {   // execute function when overlay is closed 
        htmlHost.style.overflowY = '';
        navbarEl.shadowRoot.getElementById('stickyNavbar').style.paddingRight = '';
        htmlHost.style.paddingRight = '';
        bodyHost.style.overflowY = '';
      }
    };
    const modalEl = document.createElement('div');
    modalEl.className = 'login-modal';
    modalEl.innerHTML = `
      <div class="login-form-modal">
        <div class="modal-content-wrapper">
          <div class="modal-contents">
            <div class="login-form-header">
              <p class="login-title">ورود</p>
              <a href="javascript:void(0)" class="close" onclick='(function(){ document.querySelector(".modal-content-wrapper").style.animation="fade-out-modal 0.305s cubic-bezier(0.45, 0.4, 0.32, 0.95)"; setTimeout(() => {mui.overlay("off")}, 300);})();'>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128;" xml:space="preserve">
                	<g><path d="M101.682,32.206L69.887,64l31.795,31.794l-5.887,5.888L64,69.888l-31.794,31.794l-5.888-5.888L58.112,64 L26.318,32.206l5.888-5.888L64,58.112l31.794-31.794L101.682,32.206z"></path></g>
                </svg>
              </a>
            </div>
            <div class="login-form-content">
               <div>
                <span>هنوز عضو نشده اید؟</span>
                <a href="signup.html">
                  <span>ثبت نام</span>
                </a>
              </div>
              <form name="login-modal" action="">
                <div>
                  <input type="text" 
                         placeholder="★ آدرس ايميل يا شماره تلفن همراه" 
                         name="email" 
                         title='نام كاربري ℹ️'
                         id="" 
                  >
                  <i class="las la-mail-bulk"></i>
                </div>
                <div>
                  <input type="text" 
                         placeholder="★ رمز عبور" 
                         name="loginPassword" 
                         title='رمز عبور ℹ️'
                  >
                  <i class="las la-lock"></i>
                </div>
                <div>
                  <button type="submit" name="sign-in-modal">
                    ورود
                  </button>
                </div>
                <div class="form-check-modal">
                  <label class="remember-me-modal">
                      <input class="form-checkbox" name="rememberme" type="checkbox">
                      <span>مرا به خاطر داشته باش</span>
                  </label>
                  <a href="javascript:void(0)">رمز عبور را فراموش کرده اید؟</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    // submit functionality
    modalEl.querySelector('button[name="sign-in-modal"]').addEventListener('click', function(ev) {
      ev.preventDefault();
      sendLoginData(this.form);
    }, {once: true});
    //
    const emailFieldLogin = modalEl.querySelector('input[name="email"]');
    const passFieldLogin = modalEl.querySelector('input[name="loginPassword"]');
    passFieldLogin.autocomplete = 'off';
    emailFieldLogin.addEventListener("keydown", (e) => {
        preventEnterKey(e);
        if (isEnglishLetters(e) === false) e.preventDefault();
    });
    emailFieldLogin.addEventListener("input", (e) => {
      emailFieldLogin.value = toEnglishDigits(emailFieldLogin.value);
    });
    passFieldLogin.addEventListener("keydown", preventEnterKey);
    passFieldLogin.addEventListener("input", (e) => {
      passFieldLogin.value = toEnglishDigits(passFieldLogin.value);
      passFieldLogin.value = passFieldLogin.value.replaceAll(/[^A-Za-z\d@$!%*?&^\s]+/g,"");
    });
    // turn on (returns overlay element)
    const overlayEl = mui.overlay('on', options, modalEl);
    // Input highlighter on focus
    const loginInputs = document.querySelectorAll('form[name="login-modal"] input[type="text"]');
    Array.from(loginInputs).forEach((item) => item.addEventListener("focusin", (event) => {
      event.target.style.backgroundColor = "#f7fbff";
    }));
    Array.from(loginInputs).forEach((item) => item.addEventListener("focusout", (event) => {
      event.target.style.backgroundColor = "";
    }));
    bodyHost.classList.remove('mui-scroll-lock');
}

// search function

const searchInput = navbarEl.shadowRoot.querySelector('li.search-box > form input[type="text"]');
searchInput.parentElement.addEventListener('submit', (e) => {
  e.preventDefault();
  function normalizePersianText(text) {
    if (!text) return '';
    let normalized = text;
    // Replace Arabic Yeh (ي and ى) with Persian Yeh (ی)
    normalized = normalized.replace(/[\u064A\u0649]/g, '\u06CC'); // ي ى -> ی
    // Replace Arabic Kaf (ك) with Persian Kaf (ک)
    normalized = normalized.replace(/\u0643/g, '\u06A9'); // ك -> ک
    // Remove diacritics (optional)
    normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
    // Normalize spaces
    normalized = normalized.replace(/[\u00A0\u200C\u200E\u200F]/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
  }
  const userInput = searchInput.value;
  const normalizedInput = normalizePersianText(userInput);
  localStorage.setItem('searchData', JSON.stringify(normalizedInput));
  window.location.href = window.location.origin + "/store.html";
});


// Sample User

const sampleUserAuthentication = async function(eve) { 
  eve.preventDefault();

  // Handle authentication
  if (sessionStorage.getItem('authenticated')) {
    sessionStorage.removeItem('authenticated');
  };
  if (localStorage.getItem('authenticated')) {
    localStorage.removeItem('authenticated');
  };
  username = "arvand@example.com";
  let authenticated = {
     isAuthenticated: true,
     username: username,
  };
  // create users (validUsers) DB 
  const db = await openDB();
  try {
    // Check if the username already exists in 'users -> valid users' object store
    const authenticatedUser = await getUsername(db, username);
    localStorage.setItem('authenticated', JSON.stringify(authenticated));
    const registeringData = {
      name: 'اروند مهرآيين',
      username: 'arvand@example.com',
      password: '123!@qweQWE',
      createdAt: 1748131200000,
      id: 100,
    };
    const {name, createdAt} = registeringData;
    const userInteraction = {
      profile: {
        name: name,
        email: (/(?:^09\d{9}$)/.test(username)) ? undefined : username,
        phone: (/(?:^09\d{9}$)/.test(username)) ? username : undefined,
        registrationDate: createdAt,
        lastBuyDate: Date.parse("2025-08-16"),
        favoritesCount: 6,
        ordersCountLength: 4,
      },
      cart: [
          {
            id: 2,
            benefit: 0,
            color: 1, 
            date: 1756941644162,
            fabric: 2,
            material: null,
            price: 0,
            quantity: 1,
          },
          {
            id: 46,
            benefit: 0,
            color: 4, 
            date: 1756941654474,
            fabric: 3,
            material: null,
            price: 0,
            quantity: 1,
          },
          {
            id: 48,
            benefit: 0,
            color: 2, 
            date: 1756942384307,
            fabric: 1,
            material: null,
            price: 0,
            quantity: 2,
          },
          {
            id: 17,
            benefit: 0,
            color: 7, 
            date: 1757157961694,
            fabric: 4,
            material: null,
            price: 0,
            quantity: 1,
          },
      ],
      favorite: [2, 24, 6, 49, 33, 12],
      orderCompleted: [
          {
            id: 60,
            serial: 396320,
            price: 11750000,
            quantity: 1,
            deliveryAddress: "تهران، اندرزگو، چیذری، رویا",
            contractDate: new Date("2025-07-25"),
            prepareDate:  new Date("2025-07-30"),
            transportDate: new Date("2025-07-30"),
            orderId: '8ad58a6c-10aa-4368-ba0e-d983e86aa53e',
            exactProductName: "صندلی اداری با رویه شمعی سياه",
            user_note: ''
          },
          {
            id: 2,
            serial: 123355,
            price: 16450000,
            deliveryAddress: "تهران، چيتگر",
            contractDate: new Date("2025-08-16"),
            prepareDate:  new Date("2025-08-21"),
            transportDate: new Date("2025-08-23"),
            orderId: '8ad58a6c-10aa-4368-ba0e-d983e86aa53d',
            exactProductName: 'مبل راحتی طرح خورشید با رویه کتانی سفيد',
            user_note: ''
          },
      ],
      orderOnProgress: [
          {
            id: 28,
            serial: 953036,
            price: 8810000,
            quantity: 1,
            deliveryAddress: "تهران، اندرزگو، چیذری، رویا",
            contractDate: new Date(Date.now() - 600000),
            prepareDate: new Date(Date.now() + 2*86400000),
            transportDate: new Date(Date.now() + 3*86400000),
            orderId: '8ad58a6c-10aa-4368-ba0e-d983e86aa53a',
            exactProductName: "صندلی طرح بهار با رویه کتانی آبی",
            user_note: '',
          },
      ],
      orderCanceled: [
          {
            id: 21,
            serial: 323355,
            price: 22750000,
            quantity: 1,
            deliveryAddress: "تهران، نياوران",
            contractDate: new Date("2025-06-15"),
            prepareDate: undefined,
            transportDate: undefined,
            orderId: '8ad58a6c-10aa-4368-ba0e-d983e86aa53w',
            exactProductName: 'مبل راحتی تخت شو',
            user_note: '',
          },
      ],
      address: [
          {
            state: "کرمان",
            city: "کرمان",
            exact: "کرمان، بزرگراه امام خمینی، بهزاد، 20 بهزاد",
            plaque: "1",
            door: "1",
            postal: "7617757353",
            type: "خانه",
            date: 1758536322684,
            latitude: "30.2659617",
            longitude: "57.0688248",
            default: "false"
          },
          {
            state: "تهران",
            city: "لواسان",
            exact: "شهرستان شمیرانات، بخش لواسانات، کوچه راکی",
            plaque: "4",
            door: "1",
            postal: "3341681979",
            type: "ویلا",
            date: 1758537477065,
            latitude: "35.8133761",
            longitude: "51.6332746",
            default: "true"
          },
          {
            state: "تهران",
            city: "تهران",
            exact: "تهران، صاحبقرانیه، پاسداران، اطلس مال، طبقه A1",
            plaque: "1",
            door: "22",
            postal: "1954735024",
            type: "محل کار",
            date: 1758537696280,
            latitude: "35.8061023",
            longitude: "51.4713335",
            default: "false"
          },
      ],
      comment: [
          {
            id: 1759235201398,
            name: "اروند",
            rating: 4,
            date: 1759235201398,
            content: "کلی از طراحی و رنگ مبل راضی هستم. فقط اگر پشتی اش کمی بلندتر بود برای قد من مناسب تر می شد. اما به طور کلی ارزش خرید داشت.",
            helpful: 0,
            validUser: "arvand@example.com",
            validUserPname: "مبل راحتی طرح خورشید",
            validUserPid: 2
          },
          {
            id: 1759235362461,
            name: "اروند",
            rating: 4,
            date: 1759235362461,
            content: "قبلا صندلی ۸ میلیونی خارجی داشتم که این صندلی ایرانی ازش کم نمی اره. فقط چرخ ها کمی صدا دارن.",
            helpful: 0,
            validUser: "arvand@example.com",
            validUserPname: "صندلی طرح کویر",
            validUserPid: 56
          },
          {
            id: 1759235656662,
            name: "اروند",
            rating: 4,
            date: 1759235656662,
            content: "این مبل واقعا به اسمش هست - راحتی محض! بعد از ۸ ساعت کار سخت وقتی می شم روی این مبل، تمام خستگیام در میره.",
            helpful: 2,
            validUser: "arvand@example.com",
            validUserPname: "مبل راحتی ۲+۱ نفره طرح یاقوت",
            validUserPid: 15
          }
      ],
      creditBalance: 62990000,
      transactions: [
          {
            type: "deposit",
            amount: 100000000,
            balance_after: 100000000,
            date: Date.parse("2025-07-20"),
            description: "افزایش اعتبار از طریق درگاه پرداخت",
            payment_method: "online",
            reference_id: "ref1752969600000",
            status: "completed",
          },
          {
            type: "purchase",
            amount: 11750000,
            balance_after: 88250000,
            date: Date.parse("2025-07-25"),
            description: "خرید محصول صندلی اداری  با رویه شمعی سياه ",
            order_id: "order396320",
            payment_method: "credit",
            status: "completed",
            type: "purchase",
            user_note: "",
          },
          {
            type: "deposit",
            amount: 12000000,
            balance_after: 100250000,
            date: Date.parse("2025-08-10"),
            description: "افزایش اعتبار از طریق درگاه پرداخت",
            payment_method: "online",
            reference_id: "ref1754784055000",
            status: "incompleted",
          },
          {
            type: "purchase",
            amount: 16450000,
            balance_after: 71800000,
            date: Date.parse("2025-08-16"),
            description: "خرید محصول سرویس مبل راحتی طرح خورشید با رویه کتانی سفيد ",
            order_id: "order123355",
            payment_method: "credit",
            status: "completed",
            type: "purchase",
            user_note: "",
          },
          {
            type: "purchase",
            amount: 8810000,
            balance_after: 62990000,
            date: (Date.now() - 600000),
            description: "خرید محصول صندلی طرح بهار با رویه کتانی آبی",
            order_id: "order953036",
            payment_method: "credit",
            status: "completed",
            type: "purchase",
            user_note: "",
          },
      ],
      creditCards: [
        {
          cardNumber: "6104337812345678",
          date: 1758536322884,
          maskedPan: "610433×××5678",
          expireMonth: "08",
          expireYear: "05",
          bankName: "ملت",
        },
        {
          cardNumber: "6037990012345678",
          date: 1758536325884,
          maskedPan: "603799×××5678",
          expireMonth: "11",
          expireYear: "08",
          bankName: "ملی",
        }
      ]
    };
    if (typeof authenticatedUser === "undefined" || authenticatedUser === null) { 
      // add sample user to (validUsers) DB
      await addUser(db, registeringData);
      // deleting existed db
      window.indexedDB.deleteDatabase(`${username}`);
    };
    // opening indexedDB for the sample user
    function initSampleUserProfile() {
      let db;
      let profileObjectStore = null,
          cartObjectStore = null,
          favoriteObjectStore = null,
          orderCompletedObjectStore = null,
          orderOnProgressObjectStore = null,
          orderCanceledObjectStore = null,
          addressObjectStore = null,
          commentObjectStore = null,
          creditBalanceObjectStore = null,
          transactionsObjectStore = null
          creditCardsObjectStore = null;
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      // Make Transactions
      function makeTX(storeName, mode) {
        let tx = db.transaction(storeName, mode);
        tx.onerror = (err) => {
          console.warn(err);
        };
        return tx;
      }
      // event listeners
      dbOpenRequest.addEventListener('upgradeneeded', (e) => {
        db = e.target.result;
        let oldVersion = e.oldVersion;
        let newVersion = e.newVersion;
        console.log('User database updated from version', oldVersion, 'to', newVersion)
        profileObjectStore = db.createObjectStore('profile', {autoIncrement: true, unique: true});
        cartObjectStore = db.createObjectStore('cart', {keyPath: 'date'});
        favoriteObjectStore = db.createObjectStore('favorite', {autoIncrement: true});
        orderCompletedObjectStore = db.createObjectStore('orderCompleted', {
          keyPath: 'orderId',
          unique: false
        });
        orderOnProgressObjectStore = db.createObjectStore('orderOnProgress', {
          keyPath: 'orderId',
          unique: false
        });
        orderCanceledObjectStore = db.createObjectStore('orderCanceled', {
          keyPath: 'orderId',
          unique: false
        });
        addressObjectStore = db.createObjectStore('address', {keyPath: 'date'});
        commentObjectStore = db.createObjectStore('comment', {keyPath: 'id'});
        creditBalanceObjectStore = db.createObjectStore('creditBalance', {autoIncrement: true});
        transactionsObjectStore = db.createObjectStore('transactions', {keyPath: 'date'});
        creditCardsObjectStore = db.createObjectStore('creditCards', {keyPath: 'date'});
        // creating indexes
        cartObjectStore.createIndex('dateIdx', 'date', {unique: false});
        orderCompletedObjectStore.createIndex("contractDateIDX","contractDate", {unique: false});
        orderOnProgressObjectStore.createIndex("contractDateIDX","contractDate", {unique: false});
        orderCanceledObjectStore.createIndex("contractDateIDX","contractDate", {unique: false});
      });
      dbOpenRequest.addEventListener('success', async (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains("profile")) {
          new Promise((res,rej) => {
            res(window.indexedDB.deleteDatabase(`${username}`));
          })
          .then(() => initSampleUserProfile());
          return;
        };
        console.log('success opening db.');
        //
        let profileTX = makeTX('profile', 'readwrite');
        profileTX.oncomplete = () => console.log('User profile creation on progress.');
        profileTX.onerror = (err) => console.warn(err);
        let profileStore = profileTX.objectStore('profile');
        let profileRequest = profileStore.count();
        profileRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            let req = profileStore.add(userInteraction.profile);
            req.onsuccess = (ev) => console.log('User profile created.');
            req.onerror = (err) => console.warn(err);
          }
        };
        profileRequest.onerror = (err) => console.warn(err);
        //
        let cartTX = makeTX('cart', 'readwrite');
        cartTX.oncomplete = () => console.log('User cart creation on progress.');
        cartTX.onerror = (err) => console.warn(err);
        let cartStore = cartTX.objectStore('cart');
        let cartCountRequest = cartStore.count();
        let cartPromises = [];
        cartCountRequest.onsuccess = async (ev) => {
          if (ev.target.result === 0) {
            cartPromises = userInteraction.cart.map(item => {
              return new Promise((resolve, reject) => {
                const request = cartStore.add(item);
                request.onsuccess = () => {
                  resolve(request.result);
                  console.log('User cart created.');
                };
                request.onerror = () => reject(request.error);
              });
            }); 
          }
        };
        cartCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(cartPromises);
        //
        let favoriteTX = makeTX('favorite', 'readwrite');
        favoriteTX.oncomplete = () => console.log('User favorite creation on progress.');
        favoriteTX.onerror = (err) => console.warn(err);
        let favoriteStore = favoriteTX.objectStore('favorite');
        let favCountRequest = favoriteStore.count();
        let favoritePromises = [];
        favCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            favoritePromises = userInteraction.favorite.map(item => {
              return new Promise((resolve, reject) => {
                const request = favoriteStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        favCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(favoritePromises);
        //
        let orderCompletedTX = makeTX('orderCompleted', 'readwrite');
        orderCompletedTX.oncomplete = () => console.log('User orderCompleted creation on progress.');
        orderCompletedTX.onerror = (err) => console.warn(err);
        let orderCompletedStore = orderCompletedTX.objectStore('orderCompleted');
        let orderCompleteCountRequest = orderCompletedStore.count();
        let orderCompletedPromises = [];
        orderCompleteCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            orderCompletedPromises = userInteraction.orderCompleted.map(item => {
              return new Promise((resolve, reject) => {
                const request = orderCompletedStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        orderCompleteCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(orderCompletedPromises);
        //
        let orderOnProgressTX = makeTX('orderOnProgress', 'readwrite');
        orderOnProgressTX.oncomplete = () => console.log('User orderOnProgress creation on progress.');
        orderOnProgressTX.onerror = (err) => console.warn(err);
        let orderOnProgressStore = orderOnProgressTX.objectStore('orderOnProgress');
        let orderOnProgressCountRequest = orderOnProgressStore.count();
        let orderOnProgressPromises = [];
        orderOnProgressCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            orderOnProgressPromises = userInteraction.orderOnProgress.map(item => {
              return new Promise((resolve, reject) => {
                const request = orderOnProgressStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        orderOnProgressCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(orderOnProgressPromises);
        //
        let orderCanceledTX = makeTX('orderCanceled', 'readwrite');
        orderCanceledTX.oncomplete = () => console.log('User orderCanceled creation on progress.');
        orderCanceledTX.onerror = (err) => console.warn(err);
        let orderCanceledStore = orderCanceledTX.objectStore('orderCanceled');
        let orderCanceledCountRequest = orderCanceledStore.count();
        let orderCanceledPromises = [];
        orderCanceledCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            orderCanceledPromises = userInteraction.orderCanceled.map(item => {
              return new Promise((resolve, reject) => {
                const request = orderCanceledStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        orderCanceledCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(orderCanceledPromises);
        //
        let addressTX = makeTX('address', 'readwrite');
        addressTX.oncomplete = () => console.log('User address creation on progress.');
        addressTX.onerror = (err) => console.warn(err);
        let addressStore = addressTX.objectStore('address');
        let addressCountRequest = addressStore.count();
        let addressPromises = [];
        addressCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            addressPromises = userInteraction.address.map(item => {
              return new Promise((resolve, reject) => {
                const request = addressStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        addressCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(addressPromises);
        //
        let commentTX = makeTX('comment', 'readwrite');
        commentTX.oncomplete = () => console.log('User comment creation on progress.');
        commentTX.onerror = (err) => console.warn(err);
        let commentStore = commentTX.objectStore('comment');
        let commentCountRequest = commentStore.count();
        let commentPromises = [];
        commentCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            commentPromises = userInteraction.comment.map(item => {
              return new Promise((resolve, reject) => {
                const request = commentStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        commentCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(commentPromises);
        //
        let creditBalanceTX = makeTX('creditBalance', 'readwrite');
        creditBalanceTX.oncomplete = () => console.log('User creditBalance creation on progress.');
        creditBalanceTX.onerror = (err) => console.warn(err);
        let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
        let creditBalanceCountRequest = creditBalanceStore.count();
        creditBalanceCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            let creditBalanceRequest = creditBalanceStore.add(userInteraction.creditBalance);
            creditBalanceRequest.onsuccess = (ev) => console.log('User Credit added.');
            creditBalanceRequest.onerror = (err) => console.warn(err);
          }
        };
        creditBalanceCountRequest.onerror = (err) => console.warn(err);
        //
        let transactionsTX = makeTX('transactions', 'readwrite');
        transactionsTX.oncomplete = () => console.log('User transactions creation on progress.');
        transactionsTX.onerror = (err) => console.warn(err);
        let transactionsStore = transactionsTX.objectStore('transactions');
        let transactionsCountRequest = transactionsStore.count();
        let transactionsPromises = [];
        transactionsCountRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            transactionsPromises = userInteraction.transactions.map(item => {
              return new Promise((resolve, reject) => {
                const request = transactionsStore.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        transactionsCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(transactionsPromises);
        //
        let creditCardsTX = makeTX('creditCards', 'readwrite');
        creditCardsTX.oncomplete = () => console.log('User creditCards creation on progress.');
        creditCardsTX.onerror = (err) => console.warn(err);
        let creditCardsStore = creditCardsTX.objectStore('creditCards');
        let creditCardsCountRequest = creditCardsStore.count();
        let creditCardsPromises = [];
        creditCardsCountRequest.onsuccess = async (ev) => {
          if (ev.target.result === 0) {
            creditCardsPromises = userInteraction.creditCards.map(item => {
              return new Promise((resolve, reject) => {
                const request = creditCardsStore.add(item);
                request.onsuccess = () => {
                  resolve(request.result); 
                  console.log('User creditCards created.');
                };
                request.onerror = () => reject(request.error);
              });
            });
          }
        };
        creditCardsCountRequest.onerror = (err) => console.warn(err);
        await Promise.all(creditCardsPromises);
        // Redirect t home page
        window.location.href = window.location.origin + "/index.html";
      });
      dbOpenRequest.addEventListener('error', (err) => {
        console.log('Error occurred while trying to open db');
        console.warn(err);
      });
    }
    initSampleUserProfile();
  } catch (error) {
  console.error("An error occurred while fetching user data:", error);
  // Handle errors (e.g., show a message, redirect to an error page)
  }
}

// Functions for IndexedDB

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('users', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('validUsers')) {
        new Promise((res,rej) => {
          res(window.indexedDB.deleteDatabase('users'));
        })
        .then(() => openDB());
      }
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('validUsers')) {
        const store = db.createObjectStore('validUsers', { keyPath: 'username' });
      }
    };
  });
}
  
/** 
   * Retrieves a user by their username from the 'validUsers' store.
   * @returns {Promise<Object|undefined>} The user object if found, otherwise undefined.
*/
function getUsername(db, username) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['validUsers'], 'readonly');
    const store = transaction.objectStore('validUsers');
    const request = store.get(username); // Get the record with the key `username`

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result); // Will be undefined if not found
  });
}

function addUser(db, userData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['validUsers'], 'readwrite');
    const store = transaction.objectStore('validUsers');
    const request = store.add(userData); // Add the user object

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Dropdown menu

const navLoginUserAction = navbarEl.shadowRoot.querySelector('a.user-action');
const dropDownMenu = document.createElement('div');
dropDownMenu.innerHTML = `
    <a href="" id="user-login" style="font-size: 14px !important;font-family: 'Yekan' !important;display: flex;justify-content: end;column-gap: 3px;">ورود 
      <i class="las la-sign-in-alt specific-hover" style="font-size: 20px;  display: flex;align-items: center;justify-content: flex-end;line-height: 28px;"></i>
    </a>
    <a href="" id="sample-user-login" style="font-size: 14px !important;font-family: 'Yekan' !important;display: flex;justify-content: end;column-gap: 3px;">ورود (کاربر پیش‌فرض) 
      <i class="las la-sign-in-alt specific-hover" style="font-size: 20px;  display: flex;align-items: center;justify-content: flex-end;line-height: 28px;"></i>
    </a>
    <a href="signup.html" style="font-size: 14px !important;font-family: 'Yekan' !important;display: flex;justify-content: end;column-gap: 3px;">ثبت نام 
      <i class="las la-user-plus specific-hover" style="font-size: 20px;  display: flex;align-items: center;justify-content: flex-end;line-height: 28px;"></i>
    </a>
    <a href="dashboard.html" style="font-size: 14px !important;font-family: 'Yekan' !important;display: flex;justify-content: end;column-gap: 3px;">پروفايل كاربری
      <i class="las la-user specific-hover" style="font-size: 20px;  display: flex;align-items: center;justify-content: flex-end;line-height: 28px;"></i>
    </a>
    <a href="" id="signout" style="font-size: 14px !important;font-family: 'Yekan' !important;display: flex;justify-content: end;column-gap: 3px;text-wrap: nowrap;">خروج از حساب كاربری
      <i class="las la-sign-out-alt specific-hover" style="font-size: 20px; display: flex;align-items: center;justify-content: flex-end;line-height: 28px;"></i>
    </a>
`;
let styleAttr = document.createAttribute("style");
const styleAttrObject = `
  width: 170px;
  height: 164px;
  border-top: solid 3px rgb(39 79 107 / 40%);
  border-bottom: solid 3px rgb(39 79 107 / 40%);
  padding: 5px 10px;
  display: flex;
  flex-direction: column;
  row-gap: 2px;
  justify-content: center;
  align-content: center;
  position: absolute;
  visibility: hidden;
  opacity: 0;
  transform: translateY(20px);
  transition: 0.6s;
  border-radius: 6px;
  background-color: #fefeff;
  text-align: end;
  `;
styleAttr.value = styleAttrObject;
dropDownMenu.setAttributeNode(styleAttr);
navLoginUserAction.parentElement.appendChild(dropDownMenu);
const dropDownShow = function() {
  dropDownMenu.style.visibility = "visible";
  dropDownMenu.style.opacity = "1";
  dropDownMenu.style.transform = "translateY(-1px)";
};
const dropDownHide = function() {
  dropDownMenu.style.visibility = "hidden";
  dropDownMenu.style.opacity = "0";
  dropDownMenu.style.transform = "translateY(20px)";
}
navLoginUserAction.addEventListener('mouseover', dropDownShow);
dropDownMenu.addEventListener('mouseover', dropDownShow);
navLoginUserAction.addEventListener('mouseleave', dropDownHide);
dropDownMenu.addEventListener('mouseleave', dropDownHide);
dropDownMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});
const userLoginBtn = navbarEl.shadowRoot.getElementById('user-login');
userLoginBtn.addEventListener('click', activateOverlay);
const sampleUserLoginBtn = navbarEl.shadowRoot.getElementById('sample-user-login');
sampleUserLoginBtn.addEventListener('click', sampleUserAuthentication);
const userSignOut = navbarEl.shadowRoot.getElementById('signout');
userSignOut.addEventListener('click', (e) => {
  e.preventDefault();
  if (sessionStorage.getItem('authenticated')) {
    sessionStorage.removeItem('authenticated');
  }
  if (localStorage.getItem('authenticated')) {
    localStorage.removeItem('authenticated');
  }
  window.location.href = window.location.origin + "/index.html";
});

// menu list items functionality

const itemOneMenuList = navbarEl.shadowRoot.querySelector('.menu-list > li:nth-child(1) > a');
const itemTwoMenuList = navbarEl.shadowRoot.querySelector('.menu-list > li:nth-child(2) > a');
const itemThreeMenuList = navbarEl.shadowRoot.querySelectorAll('.menu-list > li:nth-child(3) ul > li > a');
const itemFourMenuList = navbarEl.shadowRoot.querySelector('.menu-list > li:nth-child(4) > a');
const itemFiveMenuList = navbarEl.shadowRoot.querySelector('.menu-list > li:nth-child(5) > a');

itemOneMenuList.addEventListener('click', (e) => {
  e.preventDefault();
  const categoryId = 1;
  redirectToStore(categoryId)
});
itemTwoMenuList.addEventListener('click', (e) => {
  e.preventDefault();
  const categoryId = 2;
  redirectToStore(categoryId)
});
itemThreeMenuList.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const categoryId = 3;
    redirectToStore(categoryId)
  });
});
itemFourMenuList.addEventListener('click', (e) => {
  e.preventDefault();
  const categoryId = 4;
  redirectToStore(categoryId)
});
itemFiveMenuList.addEventListener('click', (e) => {
  e.preventDefault();
  const categoryId = 5;
  redirectToStore(categoryId)
});

function redirectToStore(catId) {
  if (localStorage.getItem('storeItemLink') && localStorage.getItem('storeItemLink') !== undefined) {
      localStorage.removeItem('storeItemLink');
  }
  window.location.href = window.location.origin + '/store.html?category=' + catId;
}

// Checking Enter input
function preventEnterKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
}
// Checking Digits input
function isNumericKeyDownOrUp(e) {
    return ([
              "1" ,
              "2" ,
              "3" ,
              "4" ,
              "5" ,
              "6" ,
              "7" ,
              "8" ,
              "9" ,
              "0",
              "۱",
              "۲",
              "۳",
              "۴",
              "۵",
              "۶",
              "۷",
              "۸",
              "۹",
              "۰",
            ].indexOf(e.key) !== -1) || /^[0-9]$/.test(e.key);
}
// Checking English input
function isEnglishLetters(e) {
  let string = isNumericKeyDownOrUp(e) ? toEnglishDigits(e.key) : e.key;
  return (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~@-]/g.test((typeof string === 'undefined') ? undefined : string));
}