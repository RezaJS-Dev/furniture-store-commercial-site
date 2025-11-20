
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


class ContactFormSanitizer {
    // Basic HTML tag removal
    static stripHTMLTags(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.textContent || div.innerText || '';
    }

    // Remove potential JavaScript events and protocols
    static removeScriptAttributes(str) {
        return str.replace(/on\w+\s*=\s*"[^"]*"/g, '')
                  .replace(/on\w+\s*=\s*'[^']*'/g, '')
                  .replace(/javascript:\s*[^"']*/g, '')
                  .replace(/data:\s*[^"']*/g, '');
    }

    // Normalize and trim input
    static normalizeInput(str) {
        return str.trim()
                  .replace(/\s+/g, ' ')
                  .substring(0, 1000); // Limit length
    }

    // Complete sanitization function
    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        let sanitized = input;
        sanitized = this.stripHTMLTags(sanitized);
        sanitized = this.removeScriptAttributes(sanitized);
        sanitized = this.normalizeInput(sanitized);
        
        return sanitized;
    }

    // Validate email format
    static sanitizeEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? email.trim() : '';
    }
}

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  let currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("click", function(e) {
    let a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (val !== "") { return false;}
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "-autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = arr[i];
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += `<input type='hidden' value='${arr[i]}' data-value='${arr[i]}'>`;
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function(e) {
            /*insert the value for the autocomplete text field:*/
            inp.value = this.getElementsByTagName("input")[0].value;
            let eventNew = new  InputEvent('input');
            inp.dispatchEvent(eventNew);
            /*close the list of autocompleted values, (or any other open lists of autocompleted values:*/
            closeAllLists();
            inp.parentElement.nextElementSibling.querySelector('textarea').focus();
        });
        a.appendChild(b);
      }
    }
  });
  inp.addEventListener("focusin", function(e) {
    let a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (val.length) { return false;}
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "-autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = arr[i];
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += `<input type='hidden' value='${arr[i]}' data-value='${arr[i]}'>`;
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function(e) {
            /*insert the value for the autocomplete text field:*/
            inp.value = this.getElementsByTagName("input")[0].value;
            let eventNew = new  InputEvent('input');
            inp.dispatchEvent(eventNew);
            /*close the list of autocompleted values, (or any other open lists of autocompleted values:*/
            closeAllLists();
            inp.parentElement.nextElementSibling.querySelector('textarea').focus();
        });
        a.appendChild(b);
      }
    }
  });
  inp.addEventListener("input", function(e) {
      let a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "-autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substring(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substring(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substring(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += `<input type='hidden' value='${arr[i]}' data-value='${arr[i]}'>`;
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              let eventNew = new InputEvent('input');
              inp.dispatchEvent(eventNew);
              /*close the list of autocompleted values, (or any other open lists of autocompleted values:*/
              closeAllLists();
              inp.parentElement.nextElementSibling.querySelector('textarea').focus();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      let x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.key == "ArrowDown") {
        /*If the arrow DOWN key is pressed, increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.key == "ArrowUp") { //up
        /*If the arrow UP key is pressed, decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.key == "Enter") {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    let x = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
}

/*An array containing subjects:*/
let subjectSuggested = [
  'درخواست پشتیبانی فنی',
  'استعلام قیمت و خدمات',
  'همکاری با ما',
  'انتقادات و پیشنهادات',
  'سایر'
];
/*initiate the autocomplete function on the "Input" element */
autocomplete(document.getElementById("subject"), subjectSuggested);

// Form validation 

const formMessage = document.getElementById('reviewForm');
const nameField = document.getElementById('userName');
const emailField = document.getElementById('email');
const subjectField = document.getElementById('subject');
const messageField = document.getElementById('messageText');

const regexPatterns = {
  nameRegExp: /^(?:^(?:[آ-یA-Za-z\u0600-\u06FF]{3,})+(?:\s[آ-یA-Za-z\u0600-\u06FF]*){0,3})$/,
  emailRegExp: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/,
  phoneRegExp: /(?:^09\d{9}$)/,
};

const isValidInput = (InputField, regexPattern = /.*/) => {                                              
  const validity = InputField.value.length !== 0 && regexPattern.test(InputField.value);
  return validity;
};
  
const setFieldClass = (validationState, InputField) => { 
  InputField.className = validationState ? "valid" : "invalid";
};

const requiredInput = (element) => {
  if (element.value.length === 0) {
    element.setCustomValidity("اين قسمت نمی تواند خالی باشد");
  } else if (element.value.length >= 1) {
    element.setCustomValidity("");
  }
};
  
const handleNameInput = () => {
  nameField.value = nameField.value.replaceAll(/\s{2,}/g," ");
  nameField.value = nameField.value.replaceAll(/\d*/g,"");
  requiredInput(nameField);
};
  
const handleInputFinal = (input) => {
  // requiredInput(nameField);
  input.value = input.value.trim();
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
};

const handleInput = (input) => {
  requiredInput(input);
  const inputValidity = isValidInput(input);
  setFieldClass(inputValidity, input);
};

const updateNameError = (validationState) => {                                       
  if (validationState == false) {
    if (nameField.value.length === 0) {
      nameField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    };
  } else {
    nameField.setCustomValidity("");
  };
};

const updateEmailError = (validationState) => {                                       
  if (validationState === false) {
    if (emailField.value.length === 0) {
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

const updateSubjectError = (validationState) => {
  if (validationState === false) {
    if (subjectField.value.length === 0) {
      subjectField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    }
  } else {
    subjectField.setCustomValidity("");
  };
};

const updateMessageError =  (validationState) => {
  if (validationState === false) {
    if (messageField.value.length === 0) {
      messageField.setCustomValidity("اين قسمت نمی تواند خالی باشد");
    }
  } else {
    messageField.setCustomValidity("");
  };
};

const handleSubmit = async (event) => { 
  event.preventDefault(); 
  const submitBtn = document.querySelector('button[type="submit"]');
  const nameInputValidity = isValidInput(nameField, regexPatterns.nameRegExp);
  setFieldClass(nameInputValidity, nameField);
  updateNameError(nameInputValidity);
  const emailInputValidity = emailInput();
  updateEmailError(emailInputValidity);
  setFieldClass(emailInputValidity, emailField);
  const subjectInputValidity = (subjectField.value.length !== 0) ? true : false;
  updateSubjectError(subjectInputValidity);
  setFieldClass(subjectInputValidity, subjectField);
  const messageInputValidity = (messageField.value.length !== 0) ? true : false;
  setFieldClass(messageInputValidity, messageField);
  updateMessageError(messageInputValidity);
  
  const originalMessage = messageField.value;
  
  // Sanitize the input
  const sanitizedMessage = ContactFormSanitizer.sanitizeInput(originalMessage);
  
  // Validate required field
  if (!sanitizedMessage) {
    const msgError = "لطفا پیام معتبر وارد نمایید.";
    notification(msgError, "&cross;", "rgb(236, 134, 120)", "rgb(255, 255, 255)", "rgb(255, 30, 0)", "email-field-error-01", "notif-danger");
    messageInputValidity = false;
    return;
  }
  
  // Show user what will be sent (for transparency)
  if (originalMessage !== sanitizedMessage) {
    console.log('Original:', originalMessage);
    console.log('Sanitized:', sanitizedMessage);
  }
  
  if (nameInputValidity == false || emailInputValidity == false || subjectInputValidity == false || messageInputValidity == false) { 
    return;
  } else {
    submitBtn.disabled = true;
    submitBtn.querySelector('.loader').style.visibility = 'visible';
    const messageData = await sendData(sanitizedMessage);
    if (messageData.ok) {
      console.log(messageData);
      let response = await messageData.json();
      console.log(response);

      notification(
        "پیام شما با موفقیت ارسال شد.",
        "&check;",
        "#63e228ff",
        "#000",
        "#0f7918ff",
        "user-message-sent-01",
        "notif-success"
      );
      let hostMessageWrapper = document.querySelector('div.message-form');
      hostMessageWrapper.innerHTML = `
        <div class="host-response">
          <span class="bolder">"${(response.json)?response.json.name:response.name}" گرامی</span>
          <span>پیام شما با موضوع: "${(response.json)?response.json.subject:response.subject}" برای ما ارسال شد.</span>
          <span class="bolder">متن پیام شما:</span>
          <span>"${(response.json)?response.json.message:response.message}"</span>
        </div>
      `;
      scrollTopAnimated();
    } else {
          notification(
            "ارسال پیام شما با اشکال روبرو شد. لطفا دقایقی دیگر دوباره تلاش کنید.",
            "&cross;",
            "#fbff13ff",
            "#000",
            "#ff391fff",
            "check-existing-user-error-01",
            "notif-danger"
          );
          submitBtn.disabled = false;
          submitBtn.querySelector('.loader').style.visibility = 'hidden';
    };
  };
};

// Sending form data
async function sendData(msg) {
  const rndNum = Math.floor(Math.random() * 10) + 1;
  const linkUrl = (rndNum < 5) ? "https://jsonplaceholder.typicode.com/posts" : "https://httpbin.org/post";
  const request = new Request(linkUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      name: nameField.value,
      username: emailField.value,
      subject: subjectField.value,
      message: msg
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

// Scroll to input
function scrollTopAnimated() {
    window.scrollTo({
            top: 100,
            behavior: 'smooth'
    });
}

// Input highlighter on focus

const allInputs = document.querySelectorAll('input');
Array.from(allInputs).forEach((item) => item.addEventListener("focusin", (event) => {
  event.target.style.backgroundColor = "#f7fbff";
}));

Array.from(allInputs).forEach((item) => item.addEventListener("focusout", (event) => {
  event.target.style.backgroundColor = "";
}));

document.addEventListener('DOMContentLoaded', () => {
  requiredInput(nameField);
  requiredInput(messageField);
  requiredInput(subjectField);
  requiredInput(emailField);
  nameField.addEventListener("keydown", (e) => {
    preventEnterKey(e);
    if (isNumericKeyDownOrUp(e)) e.preventDefault();
  });
  nameField.addEventListener("input", handleNameInput);
  nameField.addEventListener("focusin", () => requiredInput(nameField));
  nameField.addEventListener("blur", () => handleInputFinal(nameField));
  emailField.addEventListener("keydown", (e) => {
    preventEnterKey(e);
    if (isEnglishLetters(e) === false) e.preventDefault();
  });
  emailField.addEventListener("input", handleEmailInput);
  subjectField.addEventListener("keydown", preventEnterKey);
  subjectField.addEventListener("input", () => {
    requiredInput(subjectField);
    subjectField.value += "";
  });
  subjectField.addEventListener("focusout", () => {
    requiredInput(subjectField);
    subjectField.value += "";
    handleInputFinal(subjectField)
  });
  messageField.addEventListener("keydown", preventEnterKey);
  messageField.addEventListener("input", () => handleInput(messageField));
  messageField.addEventListener("blur", () => handleInputFinal(messageField));

  formMessage.addEventListener("submit", handleSubmit);
  
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

