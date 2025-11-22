
// load the database.json
const pageLoad = new Promise((resolve, reject) => {
  import('./database.json', {with: { type: 'json' }})
    .then(({ default: databaseObject }) => {
        // data = databaseObject;
        resolve(databaseObject);
    });
});

// save the database into indexedDB storage
pageLoad.then((database) => {
    new Promise((resolve, reject) => {
        const storeDatabase = database;
        // normalizing persian texts
        let normalizedProducts = [];
        let normalizedReviews = [];
        const normalizePersianText = function(text) {
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
          normalized = toPersianNumbers(normalized);
          return normalized;
        };
        storeDatabase.products.map(el => {
          const {
            id,
            proId,
            name,
            price,
            description,
            productDetails,
            image,
            categoriesId,
            inStock,
            colorId,
            fabricId,
            discount,
            discountedPrice,
            quantity,
          } = el;
          // Normalizing texts
          const normalizedName = normalizePersianText(name);
          const normalizedDescription = normalizePersianText(description);
          const normalizedProductDetails = normalizePersianText(productDetails);
          const normalizedProduct = {
            id,
            proId,
            name: normalizedName,
            price,
            description: normalizedDescription,
            productDetails: normalizedProductDetails,
            image,
            categoriesId,
            inStock,
            colorId,
            fabricId,
            discount,
            discountedPrice,
            quantity,
          };
          // push product to the normalizedProducts array
          normalizedProducts.push(normalizedProduct);
        });
        storeDatabase.reviews.map(el => {
          const {
            id,
            comments,
          } = el;
          let normalizedComments = [];
          comments.map(ele => {
            const {
              id,
              name,
              rating,
              date,
              content,
              helpful,
              validUser,
              validUserPname,
              validUserPid,
            } = ele;
            // Normalizing texts
            const normalizedName = normalizePersianText(name);
            const normalizedContent = normalizePersianText(content);
            const normalizedComment = {
              id,
              name: normalizedName,
              rating,
              date,
              content: normalizedContent,
              helpful,
              validUser,
              validUserPname,
              validUserPid,
            };
            // push product to the normalizedComments array
            normalizedComments.push(normalizedComment);
          });
          const normalizedReview = {
            id,
            comments: normalizedComments,
          };
          normalizedReviews.push(normalizedReview);
        });
        storeDatabase.products = normalizedProducts;
        storeDatabase.reviews = normalizedReviews;
        console.log('initial database:',storeDatabase);
        const indexdb = function () {
            let db = null;
            let objectStore = null;
            let dbOpenRequest = window.indexedDB.open('db', 1);
            // Event listeners
            dbOpenRequest.addEventListener('upgradeneeded', (e) => {
                db = e.target.result;
                let oldVersion = e.oldVersion;
                let newVersion = e.newVersion || db.version;
                console.log('Database updated from version', oldVersion, 'to', newVersion);

                if (db.objectStoreNames.contains('database')) {
                    db.deleteObjectStore('database');
                    db.deleteObjectStore('products');
                    db.deleteObjectStore('fabrics');
                    db.deleteObjectStore('colors');
                    db.deleteObjectStore('categories');
                    db.deleteObjectStore('reviews');
                }
                
                objectStore = db.createObjectStore('database', {
                    keyPath: 'id',
                });
                let productsObjectStore = db.createObjectStore('products', {
                    keyPath: 'id',
                });
                let fabricsObjectStore = db.createObjectStore('fabrics', {
                    keyPath: 'id',
                });
                let colorsObjectStore = db.createObjectStore('colors', {
                    keyPath: 'id',
                });
                let categoriesObjectStore = db.createObjectStore('categories', {
                    keyPath: 'id',
                });
                let reviewsObjectStore = db.createObjectStore('reviews', {
                    keyPath: 'id',
                });
                
                productsObjectStore.createIndex('idIDX', 'id', {unique: true});
                productsObjectStore.createIndex('nameIDX', 'name', {unique: false});
                productsObjectStore.createIndex('priceIDX', 'price', {unique: false});
                productsObjectStore.createIndex('inStockIDX', 'inStock', {unique: false});
                productsObjectStore.createIndex('discountIDX', 'discount', {unique: false});
                productsObjectStore.createIndex('discountedIDX', 'discountedPrice', {unique: false});
                productsObjectStore.createIndex('categoriesIDX', 'categoriesId', {
                  unique: false,
                  multiEntry: true,
                });
                reviewsObjectStore.createIndex('dateIDX', 'date', {unique: true});
            });

            dbOpenRequest.addEventListener('success', (e) => {
                db = e.target.result;
                if (!db.objectStoreNames.contains("products")) {
                  new Promise((res,rej) => {
                    res(window.indexedDB.deleteDatabase('db'));
                  })
                  .then(() => indexdb());
                  return;
                };
                console.log('success opening db.');
                if (typeof storeDatabase == "undefined") return; 

                // Adding / Updating products
                let psTransaction = makeTX('products', 'readwrite');
                psTransaction.oncomplete = (ev) => {
                    console.log('finished adding products data');
                };
                let psStore = psTransaction.objectStore('products');
                let psRequest = psStore.count();
                psRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                        storeDatabase.products.forEach((obj) => {
                            let req = psStore.add(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    } else {
                        storeDatabase.products.forEach((obj) => {
                            let req = psStore.put(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    };
                };

                // Adding / Updating fabrics
    
                let fabricTransaction = makeTX('fabrics', 'readwrite');
                fabricTransaction.oncomplete = (ev) => {
                    console.log('finished adding fabrics data');
                };
                let fabricStore = fabricTransaction.objectStore('fabrics');
                let fabricRequest = fabricStore.count();
                fabricRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                        storeDatabase.fabrics.forEach((obj) => {
                            let req = fabricStore.add(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    } else {
                        storeDatabase.fabrics.forEach((obj) => {
                            let req = fabricStore.put(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    };
                };

                // Adding / Updating colors
    
                let colorTransaction = makeTX('colors', 'readwrite');
                colorTransaction.oncomplete = (ev) => {
                    console.log('finished adding colors data');
                };
                let colorStore = colorTransaction.objectStore('colors');
                let colorRequest = colorStore.count();
                colorRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                        storeDatabase.colors.forEach((obj) => {
                            let req = colorStore.add(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    } else {
                        storeDatabase.colors.forEach((obj) => {
                            let req = colorStore.put(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    };
                };

                // Adding / Updating categories
    
                let categoryTransaction = makeTX('categories', 'readwrite');
                categoryTransaction.oncomplete = (ev) => {
                    console.log('finished adding categories data');
                };
                let categoryStore = categoryTransaction.objectStore('categories');
                let categoryRequest = categoryStore.count();
                categoryRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                        storeDatabase.categories.forEach((obj) => {
                            let req = categoryStore.add(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    } else {
                        storeDatabase.categories.forEach((obj) => {
                            let req = categoryStore.put(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    };
                };

                // Adding / Updating reviews
                let rvTransaction = makeTX('reviews', 'readwrite');
                rvTransaction.oncomplete = (ev) => {
                    console.log('finished adding reviews data');
                };
                let rvStore = rvTransaction.objectStore('reviews');
                let rvRequest = rvStore.count();
                rvRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                        storeDatabase.reviews.forEach((obj) => {
                            let req = rvStore.add(obj);
                            req.onsuccess = (ev) => {
                                console.log('added an object');
                            };
                            req.onerror = (err) => {
                                console.warn(err);
                            };
                        });
                    };
                    document.dispatchEvent(productsDBReadySuccessEvent);
                    productsDBReadySuccessEventDispatched = true;
                };
            });

            dbOpenRequest.addEventListener('error', (err) => {
                console.log('Error occurred while trying to open db');
                console.warn(err);
            });

            function makeTX(storeName, mode) {
              let tx = db.transaction(storeName, mode);
              tx.onerror = (err) => {
                console.warn(err);
              };
              return tx;
            }
        };
        indexdb();
        resolve(storeDatabase);
    })
});



/* show the password */
const showPassBtn = Array.from(document.querySelectorAll('i.las.la-lock'));
const inputsArray = [
  document.querySelector('input[name=password]'), 
  document.querySelector('input[name=check-password]'),
  document.querySelector('input[name=password-login]')
];
for (let i = 0; i < showPassBtn.length; i++) {
  showPassBtn[i].addEventListener('click', function (event) {
  
    if (event.target.classList.contains('la-lock')) {
      event.target.classList.replace("la-lock", "la-lock-open");
    } else {
      event.target.classList.replace("la-lock-open", "la-lock");
    }
    const formSignup = document.querySelector('form[name="register"]');
    const formLogin = document.querySelector('form[name="login"]');
    if (formSignup.contains(event.target)) {
      for (let i = 0; i < inputsArray.length - 1; i++) {
        if (inputsArray[i].dataset.passwordFont == 'set') {
          inputsArray[i].dataset.passwordFont = 'unset';
        } else {
          inputsArray[i].dataset.passwordFont = 'set';
        }
      }
    } else if (formLogin.contains(event.target)) {
      if (inputsArray[2].dataset.passwordFont == 'set') {
        inputsArray[2].dataset.passwordFont = 'unset';
      } else {
        inputsArray[2].dataset.passwordFont = 'set';
      }
    }
  });
}

// Signup Form validation 

const formSignup = document.querySelector('form[name=register]');
const nameField = formSignup.querySelector('input[name=name]');
const emailField = formSignup.querySelector('input[name=email]');
const passField = formSignup.querySelector('input[name=password]');
const checkPassField = formSignup.querySelector('input[name=check-password]');

const regexPatterns = {
  nameRegExp: /^(?:^(?:[آ-یA-Za-z\u0600-\u06FF]{3,})+(?:\s[آ-یA-Za-z\u0600-\u06FF]*){0,3})$/,
  emailRegExp: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/,
  phoneRegExp: /(?:^09\d{9}$)/,
  passRegExp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^\s])*(?!^\d+$)[A-Za-z\d@$!%*?&^\s]{8,}$/,
};

const isValidInput = (InputField, regexPattern = /.*/) => {                                              
  const validity = InputField.value.length !== 0 && regexPattern.test(InputField.value);
  return validity;
};
  
const setFieldClass = (validationState, InputField) => { 
  InputField.className = validationState ? "valid" : "invalid";
};

const requiredInput = (element) => {
  if (element.value.length == 0) {
    element.setCustomValidity("اين قسمت نمی تواند خالی باشد");
  } else if (element.value.length >= 1 || element.validity.patternMismatch) {
    element.setCustomValidity("");
  }
};

const handleNameFocus = () => {
  scrollTopAnimated();
  if (nameField.value.length == 0) {
    notification("نام خود را به فارسی یا انگلیسی شامل حداقل ۳ حرف وارد کنید.", "&iscr;", "rgb(120, 184, 236)", "rgb(14, 9, 9)", "rgb(0, 68, 255)", "name-field-info-01", "notif-info");
  }
  requiredInput(nameField);
};

const handleEmailFocus = () => {  
  if (emailField.value.length == 0) {                                     
    const msgEmailError = "لطفاً یک ایمیل معتبر وارد کنید مثال: example@domain.com";
    notification(msgEmailError, "&iscr;", "rgb(120, 184, 236)", "rgb(14, 9, 9)", "rgb(0, 68, 255)", "email-field-info-01", "notif-info");
    const msgPhonError = "شماره موبایل باید ۱۱ رقمی باشد و با ۰۹ شروع شود";
    notification(msgPhonError, "&iscr;", "rgb(120, 184, 236)", "rgb(14, 9, 9)", "rgb(0, 68, 255)", "email-field-info-02", "notif-info");
  }
  requiredInput(emailField);
};

const handlePassFocus = () => {
  if (passField.value.length == 0) {
    notification("رمز عبور باید حداقل ۸ کاراکتر و ترکیبی از حروف بزرگ، کوچک، اعداد و نمادها باشد", "&iscr;", "rgb(120, 184, 236)", "rgb(14, 9, 9)", "rgb(0, 68, 255)", "pass-field-info-01", "notif-info");
  }
  requiredInput(passField);
};

const handleCheckPassFocus = () => {
  requiredInput(checkPassField);
};
  
const handleNameInput = () => {
  nameField.value = nameField.value.replaceAll(/\s{2,}/g," ");
  nameField.value = nameField.value.replaceAll(/\d*/g,"");
  requiredInput(nameField);
  const nameInputValidity = isValidInput(nameField, regexPatterns.nameRegExp);
  setFieldClass(nameInputValidity, nameField);
};
  
const handleNameInputFinal = () => {
  nameField.value = nameField.value.trim();
};

const emailInput = () => {
  if (isValidInput(emailField, regexPatterns.emailRegExp) === true) {
    return true;
  } else if (isValidInput(emailField, regexPatterns.phoneRegExp) === true) {
    return true;
  }
  return false;
};

const handleEmailInput = () => {
  emailField.value = emailField.value.replaceAll(/\s{1,}/g,"");
  emailField.value = toEnglishDigits(emailField.value);
  requiredInput(emailField);
  const emailInputValidity = emailInput();
  setFieldClass(emailInputValidity, emailField);
};

const handlePassInput = () => {
  passField.value = toEnglishDigits(passField.value);
  passField.value = passField.value.replaceAll(/[^A-Za-z\d@$!%*?&^\s]+/g,"");
  requiredInput(passField);
  const passInputValidity = isValidInput(passField, regexPatterns.passRegExp);
  setFieldClass(passInputValidity, passField);
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(passField.value)) {
    const iconEls = document.querySelectorAll('input[name="password"] ~ i');
    for (let i = 0; i < iconEls.length; i++) {
      iconEls[i].style = `
        color:#f96a00 !important;
        filter: drop-shadow(-1px 4px 7px #f96a00);
        -webkit-filter: drop-shadow(-1px 4px 7px #f96a00);
      `;
    }
  } else if (passInputValidity) {
    const iconEls = document.querySelectorAll('input[name="password"] ~ i');
    for (let i = 0; i < iconEls.length; i++) {
      iconEls[i].style = `
        color:#219f00 !important;
        filter: drop-shadow(-1px 4px 7px #2dd700);
        -webkit-filter: drop-shadow(-1px 4px 7px #2dd700);
      `;
    }
  } else {
    const iconEls = document.querySelectorAll('input[name="password"] ~ i');
    for (let i = 0; i < iconEls.length; i++) {
      iconEls[i].style = `
        color: #ff0000 !important;
        filter: drop-shadow(-1px 4px 7px #ff0000);
        -webkit-filter: drop-shadow(-1px 4px 7px #ff0000);
      `;
    }
  }  
};

const handleCheckPassInput = () => {
  checkPassField.value = toEnglishDigits(checkPassField.value);
  checkPassField.value = checkPassField.value.replaceAll(/[^A-Za-z\d@$!%*?&^\s]+/g,"");
  requiredInput(checkPassField);
  const checkPassInputValidity = (passField.value.length !== 0 && passField.value === checkPassField.value) ? true:false;
  setFieldClass(checkPassInputValidity, checkPassField);
};

const updateNameError = (validationState) => {                                       
  if (validationState == false) {
    if (nameField.value.length == 0) {
      nameField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    } else if (nameField.value.length <= 2) {
      notification("نام و نام خانوادگی باید حداقل ۳ حرف داشته باشد", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "name-field-error-01", "notif-danger");
    } else if (/[^آ-یA-Za-z\u0600-\u06FF\s]+/.test(nameField.value)) {
      notification("برای نام و نام خانوادگی فقط از حروف فارسی یا لاتین استفاده کنید", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "name-field-error-02", "notif-danger");
    } else {
      notification("تعداد اسامی بيش از حد مجاز است", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "name-field-error-03", "notif-danger");
    };
  } else {
    nameField.setCustomValidity("");
  };
};

const updateEmailError = (validationState) => {                                       
  if (validationState == false) {
    if (emailField.value.length == 0) {
      emailField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    } else {
      const msgEmailError = "لطفاً یک ایمیل معتبر وارد کنید مثال: example@domain.com";
      const msgPhonError = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود";
      notification(msgEmailError, "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "email-field-error-01", "notif-danger");
      notification(msgPhonError, "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "email-field-error-02", "notif-danger");
    };
  } else {
    emailField.setCustomValidity("");
  };
};

const updatePassError = (validationState) => {
  if (validationState == false) {
    if (passField.value.length == 0) {
      passField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    } else if (passField.value.length <= 7) {
        notification("رمز عبور باید حداقل ۸ کاراکتر داشته باشد", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "pass-field-error-01", "notif-danger");
    } else if (/^(?=\d+$).*$/.test(passField.value)) {
        notification("رمز عبور نمی‌تواند فقط عدد باشد", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "pass-field-error-03", "notif-danger");
    } else if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^])[A-Za-z\d@$!%*?&^\s]{8,}$/.test(passField.value) == false) {
        notification("رمز عبور باید شامل حروف بزرگ، کوچک و اعداد و يا نمادها باشد", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "pass-field-error-02", "notif-danger");
    }
  } else {
    passField.setCustomValidity("");
  };
};

const updateCheckPassError =  (validationState) => {
  if (validationState == false) {
    if (checkPassField.value.length == 0) {
      checkPassField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    } else {
      notification("تکرار رمز عبور با رمز اصلی مطابقت ندارد", "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "check-pass-field-error-01", "notif-danger");
    }
  }
};

const initializeValidation = () => {
  const nameInputValidity = isValidInput(nameField, regexPatterns.nameRegExp);
  updateNameError(nameInputValidity);
  setFieldClass(nameInputValidity, nameField);
  const emailInputValidity = emailInput();
  updateEmailError(emailInputValidity);
  setFieldClass(emailInputValidity, emailField);
  const passInputValidity = isValidInput(passField, regexPatterns.passRegExp);
  updatePassError(passInputValidity);
  setFieldClass(passInputValidity, passField);
  requiredInput(checkPassField);
  const checkPassInputValidity = (passField.value.length !== 0 && passField.value === checkPassField.value) ? true:false;
  setFieldClass(checkPassInputValidity, checkPassField);
  formSignup.autocomplete = 'off';
};

const handleSubmit = async (event) => {
  event.preventDefault(); 
  const submitBtn = document.querySelector('button[name="sign-up"]');
  submitBtn.disabled = true;
  submitBtn.querySelector('.loader').style.visibility = 'visible';
  const nameInputValidity = isValidInput(nameField, regexPatterns.nameRegExp);
  setFieldClass(nameInputValidity, nameField);
  updateNameError(nameInputValidity);
  const emailInputValidity = emailInput();
  updateEmailError(emailInputValidity);
  setFieldClass(emailInputValidity, emailField);
  const passInputValidity = isValidInput(passField, regexPatterns.passRegExp);
  updatePassError(passInputValidity);
  setFieldClass(passInputValidity, passField);
  const checkPassInputValidity = (passField.value.length !== 0 && passField.value === checkPassField.value) ? true:false;
  setFieldClass(checkPassInputValidity, checkPassField);
  updateCheckPassError(checkPassInputValidity);
  if (nameInputValidity == false || emailInputValidity == false || passInputValidity == false || checkPassInputValidity == false) { 
    submitBtn.disabled = false;
    submitBtn.querySelector('.loader').style.visibility = 'hidden';
    return;
  } else {
    const registeringData = await sendData();
    if (registeringData.ok) {
      console.log(registeringData);
      let responseObject = await registeringData.json();
      const userData = (responseObject.json) ? responseObject.json : responseObject;
      console.log(userData);
  
      const db = await openDB();
    
      try { 
        // Check if the username already exists
        const userNameToCheck = userData.username;
        const existingUser = await getUsername(db, userNameToCheck);
    
        if (existingUser) {
          // If user exists, show error
          notification(
            "نام کاربری مورد نظر قبلا استفاده شده است.",
            "&cross;",
            "#fbff13ff",
            "#000",
            "#ff391fff",
            "check-existing-user-error-01",
            "notif-danger"
          );
          submitBtn.disabled = false;
          submitBtn.querySelector('.loader').style.visibility = 'hidden';
        } else {
          const newUserObject = userData;
          // If user doesn't exist, add them to the database
          await addUser(db, newUserObject);
          notification(
            "ثبت نام شما با موفقیت انجام شد.",
            "&check;",
            "#63e228ff",
            "#000",
            "#0f7918ff",
            "user-registered-01",
            "notif-success"
          );
    
          // Handle authentication
          if (sessionStorage.getItem('authenticated')) {
            sessionStorage.removeItem('authenticated');
          }
          if (localStorage.getItem('authenticated')) {
            localStorage.removeItem('authenticated');
          }
          let userNameToAuthenticated = userData.username;
          let authenticated = {
            isAuthenticated: true,
            username: userNameToAuthenticated,
          };
          sessionStorage.setItem('authenticated', JSON.stringify(authenticated));
          let username = userNameToAuthenticated;
          const {name, createdAt} = newUserObject;
          const userInteraction = {
            profile: {
              name: name,
              email: (/(?:^09\d{9}$)/.test(authenticated.username)) ? undefined : authenticated.username,
              phone: (/(?:^09\d{9}$)/.test(authenticated.username)) ? authenticated.username : undefined,
              registrationDate: createdAt,
              lastBuyDate: undefined,
              favoritesCount: 0,
              ordersCountLength: 0,
            },
            cart: [],
            favorite: [],
            orderCompleted: [],
            orderOnProgress: [],
            orderCanceled: [],
            address: [],
            comment: [],
            creditBalance: 0,
            transactions: [],
            creditCards: [],
          };
          console.log(userInteraction)
          // opening indexedDB for user
          function initUserProfile() {
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
                transactionsObjectStore = null,
                creditCardsObjectStore = null;
            let dbOpenRequestNew = window.indexedDB.open(`${username}`,1);
            dbOpenRequestNew.addEventListener('upgradeneeded', (e) => {
              db = e.target.result;
              let oldVersion = e.oldVersion;
              let newVersion = e.newVersion;
              console.log('User database updated from version', oldVersion, 'to', newVersion)
              profileObjectStore = db.createObjectStore('profile', {autoIncrement: true});
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
            dbOpenRequestNew.addEventListener('success', (e) => {
              updateProfileNewUser();
              function updateProfileNewUser() {
                let dbOpenReq = window.indexedDB.open(`${username}`, 1);
                dbOpenReq.addEventListener('success', (e) => {
                  let db = e.target.result;
                  if (!db.objectStoreNames.contains("profile")) {
                    new Promise((res,rej) => {
                      res(window.indexedDB.deleteDatabase(`${username}`));
                    })
                    .then(() => initUserProfile());
                    return;
                  };
                  let profileTX = db.transaction(['profile','creditBalance'], 'readwrite');
                  profileTX.oncomplete = () => console.log('User profile creation on progress.');
                  profileTX.onerror = (err) => console.warn(err);
                  //
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
                  let creditBalanceStore = profileTX.objectStore('creditBalance');
                  let creditBalanceCountRequest = creditBalanceStore.count();
                  creditBalanceCountRequest.onsuccess = (ev) => {
                    if (ev.target.result === 0) {
                      let creditBalanceRequest = creditBalanceStore.add(userInteraction.creditBalance);
                      creditBalanceRequest.onsuccess = (ev) => {
                        console.log('User Credit added.');
                      };
                      creditBalanceRequest.onerror = (err) => console.warn(err);
                      // Redirect
                      setTimeout(() => {
                        window.location.href = window.location.origin + "/index.html";
                      }, 4100);
                      return;
                    } else {
                      return;
                    }
                  };
                  creditBalanceCountRequest.onerror = (err) => console.warn(err);
                });
                dbOpenReq.addEventListener('error', (err) => console.warn(err));
              }
            });
            dbOpenRequestNew.addEventListener('error', (err) => {
              console.log('Error occurred while trying to open db');
              console.warn(err);
            });
          }
          initUserProfile();
        }
      } catch (error) {
        console.error("An error occurred with the database operation:", error);
        submitBtn.disabled = false;
        submitBtn.querySelector('.loader').style.visibility = 'hidden';
        // Handle any errors here (e.g., show a user-friendly notification)
      }
    } else {
      notification(
        "ثبت نام شما با اشکال روبرو شد. لطفا دقایقی دیگر دوباره تلاش کنید.",
        "&cross;",
        "#fbff13ff",
        "#000",
        "#ff391fff",
        "check-existing-user-error-01",
        "notif-danger"
      );
      submitBtn.disabled = false;
      submitBtn.querySelector('.loader').style.visibility = 'hidden';
      return;
    };
  };
};

// Functions for IndexedDB

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
  
/**
 * Adds a new user to the 'validUsers' store.
 * @returns {Promise<void>}
 */
function addUser(db, userData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['validUsers'], 'readwrite');
    const store = transaction.objectStore('validUsers');
    const request = store.add(userData); // Add the user object

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Sending signup form data

async function sendData() {
  const rndNum = Math.floor(Math.random() * 10) + 1;
  const linkUrl = (rndNum < 5) ? "https://jsonplaceholder.typicode.com/posts" : "https://httpbin.org/post";
  console.log('sending signup data to:', linkUrl);
  const request = new Request(linkUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      name: nameField.value,
      username: emailField.value.toLowerCase(),
      password: passField.value,
      createdAt: Date.now()
    }),
  });
  let response;
  try {
    response = await fetch(request);
    console.log(response.status);
  } catch(err) {
    return err;
  }
  return response;
}

// Scroll to card input
function scrollTopAnimated() {
    if (window.matchMedia("(max-width: 767px)").matches) {
        window.scrollTo({
            top: 450,
            behavior: 'smooth'
        });
    } else {
      window.scrollTo({
          top: 317,
          behavior: 'smooth'
      });
    }
}

// Login Form Validation

const formLogin = document.querySelector('form[name="login"]');
const emailFieldLogin = formLogin.querySelector('input[name="email"]');
const passFieldLogin = formLogin.querySelector('input[name="loginPassword"]');
  
const handleEmailInputLogin = () => {
  emailFieldLogin.value = toEnglishDigits(emailFieldLogin.value);
  emailFieldLogin.value = emailFieldLogin.value.toLowerCase();
  requiredInput(emailFieldLogin);
};

const handlePassInputLogin = () => {
  passFieldLogin.value = toEnglishDigits(passFieldLogin.value);
  passFieldLogin.value = passFieldLogin.value.replaceAll(/[^A-Za-z\d@$!%*?&^\s]+/g,"");
  requiredInput(passFieldLogin);
};

const updateEmailLoginError = (validationState) => {
  if (validationState == false) {
    if (emailFieldLogin.value.length == 0) {
      notification(
        "نام كاربری خود را در كادر مربوطه وارد كنيد", 
        "&tritime;", 
        "rgb(228, 236, 120)", 
        "rgb(0, 0, 0)", 
        "rgb(14, 12, 10)", 
        "user-login-field-error-01", 
        "notif-warning"
      );
    }
  }
};

const updatePassLoginError = (validationState) => {
  if (validationState == false) {
    if (passFieldLogin.value.length == 0) {
      notification(
        "رمز عبور خود را در كادر مربوطه وارد كنيد", 
        "&tritime;", 
        "rgb(228, 236, 120)", 
        "rgb(0, 0, 0)", 
        "rgb(14, 12, 10)", 
        "pass-login-field-error-01", 
        "notif-warning"
      );
    }
  }
};

const handleSubmitLogin = (event) => {
  const passInputValidityLogin = isValidInput(passFieldLogin);
  updatePassLoginError(passInputValidityLogin);
  const emailInputValidityLogin = isValidInput(emailFieldLogin);
  updateEmailLoginError(emailInputValidityLogin);
  if (emailInputValidityLogin == false || passInputValidityLogin == false ) { 
    event.preventDefault();
  } else {
    event.preventDefault();
    sendLoginData(formLogin);
  }
};

  
// Form Changer

const formChanger = document.getElementById('signup');
const userLeading = document.getElementById('user-leading');
const signupTitle = document.getElementById('signup-title');
const leadingTitle = document.getElementById('leading-title');
const leadingBtn = document.getElementById('leading-btn');

// Input highlighter on focus

const allInputs = document.querySelectorAll('input');
Array.from(allInputs).forEach((item) => item.addEventListener("focusin", (event) => {
  event.target.style.backgroundColor = "#f7fbff";
}));

Array.from(allInputs).forEach((item) => item.addEventListener("focusout", (event) => {
  event.target.style.backgroundColor = "";
}));
  
document.addEventListener('DOMContentLoaded', () => {
  nameField.addEventListener("keydown", (e) => {
    preventEnterKey(e);
    if (isNumericKeyDownOrUp(e)) e.preventDefault();
  });
  nameField.addEventListener("focus", handleNameFocus);
  nameField.addEventListener("input", handleNameInput);
  nameField.addEventListener("blur", handleNameInputFinal);
  emailField.addEventListener("keydown", (e) => {
    preventEnterKey(e);
    if (isEnglishLetters(e) === false) e.preventDefault();
  });
  emailField.addEventListener("focus", handleEmailFocus);
  emailField.addEventListener("input", handleEmailInput);
  passField.addEventListener("keydown", preventEnterKey);
  passField.addEventListener("focus", handlePassFocus);
  passField.addEventListener("input", handlePassInput);
  checkPassField.addEventListener("keydown", preventEnterKey);
  checkPassField.addEventListener("focus", handleCheckPassFocus);
  checkPassField.addEventListener("input", handleCheckPassInput);

  formSignup.addEventListener("submit", handleSubmit);
  window.addEventListener("load", initializeValidation); 
  
  formChanger.addEventListener('click', function (event) {
    event.preventDefault();
    if (userLeading.dataset.leader == 'login') {
      signupTitle.textContent = 'ورود به حساب کاربری';
      leadingTitle.textContent = 'کاربر جدید هستید؟';
      leadingBtn.textContent = 'ثبت‌نام';
      formSignup.classList.toggle('display-none');
      formLogin.classList.toggle('display-none');
      userLeading.dataset.leader = 'signup';
      docOffsetHeightInit = document.body.offsetHeight;
    } else {
      signupTitle.textContent = 'عضويت در سايت';
      leadingTitle.textContent = 'قبلا ثبت نام كرده ايد؟';
      leadingBtn.textContent = 'وارد شويد';
      formSignup.classList.toggle('display-none');
      formLogin.classList.toggle('display-none');
      userLeading.dataset.leader = 'login';
      docOffsetHeightInit = document.body.offsetHeight;
    }
  });

  emailFieldLogin.addEventListener("keydown", (e) => {
    preventEnterKey(e);
    if (isEnglishLetters(e) === false) e.preventDefault();
  });
  emailFieldLogin.addEventListener("input", handleEmailInputLogin);
  passFieldLogin.addEventListener("keydown", preventEnterKey);
  passFieldLogin.addEventListener("input", handlePassInputLogin);
  
  formLogin.addEventListener("submit", handleSubmitLogin);
  passFieldLogin.autocomplete = 'off';
});

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