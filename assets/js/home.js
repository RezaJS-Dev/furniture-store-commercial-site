// Dispatch event when productsDB is ready
const productsDBReadySuccessEvent = new CustomEvent('productsDatabaseSuccessReady');

// load the database.json
const pageLoad = new Promise((resolve, reject) => {
  import('./database.json', {with: { type: 'json' }})
    .then(({ default: databaseObject }) => {
        resolve(databaseObject);
    });
});

// To save the database into indexedDB storage
pageLoad.then((database) => {
    new Promise((resolve, reject) => {
        const storeDatabase = database;
        console.log('Starting database initialization with data:', storeDatabase);
        if (!storeDatabase || !storeDatabase.products) {
            console.error('Invalid database structure:', storeDatabase);
            return;
        };
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
                    console.warn('Object stores missing, attempting recovery...');
                    db.close(); // Close current connection
                    setTimeout(() => {
                      new Promise((res,rej) => {
                        let deleteDB = window.indexedDB.deleteDatabase('db');
                        res(deleteDB);
                      }).then((i) => indexdb());
                    }, 10);
                    return;
                };
                console.log('success opening db.');
                if (typeof storeDatabase == "undefined") {
                    console.error('storeDatabase is undefined');
                    return;
                } 

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
                    console.log('productsDBReadySuccessEvent dispatched.');
                    resolve(storeDatabase);
                };
            });

            dbOpenRequest.addEventListener('error', (err) => {
                console.error('Error occurred while trying to open db:', err);
                if (!db.objectStoreNames.contains("products")) {
                    console.warn('Object stores missing, attempting recovery...');
                    db.close(); // Close current connection
                    setTimeout(() => {
                      new Promise((res,rej) => {
                        let deleteDB = window.indexedDB.deleteDatabase('db');
                        res(deleteDB);
                      }).then((i) => indexdb());
                    }, 10);
                    return;
                };
            });

            function makeTX(storeName, mode) {
              if (!db) {
                  console.error('Database not available for transaction');
                  return null;
              }
              let tx = db.transaction(storeName, mode);
              tx.onerror = (err) => {
                  console.warn('Transaction error:', err);
              };
              return tx;
            }
        };
        indexdb();
    })
});

// implementing carousel function
const carouselFunc = function (CarouselContainerId) {
  const carouselId = CarouselContainerId;
  const carousel = document.getElementById(`${carouselId}`);
  const prevBtn = carousel.querySelector('.prev-btn');
  const nextBtn = carousel.querySelector('.next-btn');
  const carouselItemsWrapper = carousel.querySelector('.carousel-items');
  const items = carousel.querySelectorAll('.carousel-items .c-item');

  // Calculate how many items are visible at once
  const visibleItems = () => {
    const carouselWidth = carouselItemsWrapper.offsetWidth;
    const itemWidth = items[0].offsetWidth + 
                     parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap);
    return Math.floor(carouselWidth / itemWidth);
  };
  
  let currentIndex = 0;
  const itemCount = items.length;
  
  function updateButtons() {
    prevBtn.disabled = (parseInt(currentIndex) === 0);
    nextBtn.disabled = (currentIndex >= itemCount - visibleItems());
  }
  
  function updateButtonsTouch() {
    prevBtn.disabled = (carouselItemsWrapper.scrollLeft !== 0) ? false : true;
    nextBtn.disabled = ((carouselItemsWrapper.scrollWidth - carouselItemsWrapper.clientWidth - parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap) <= (-1) * carouselItemsWrapper.scrollLeft)) ? true : false;
    if (prevBtn.disabled === true && nextBtn.disabled === false) currentIndex = 0;
    if (nextBtn.disabled === true && prevBtn.disabled === false) (currentIndex = itemCount - visibleItems());
  }
  
  const scrollToIndex = (index) => {
    const itemWidth = items[0].offsetWidth + 
                     parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap);
    carouselItemsWrapper.scrollTo({
      left: (-1) * index * itemWidth,
      behavior: 'smooth'
    });
    currentIndex = index;
    updateButtons();
  };

  const scrollTouch = (dir) => {
    const itemWidth = items[0].offsetWidth + 
                     parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap);
    carouselItemsWrapper.scrollLeft += dir * itemWidth;
    updateButtonsTouch();
  };
  
  let touchIntervalNext = null;
  let touchIntervalPrev = null;

  prevBtn.addEventListener('touchstart', () => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    touchIntervalPrev = setInterval(() => {
      scrollTouch(1);
      if (currentIndex > 0) {
        currentIndex--;
      }
    }, 800);
  });
  
  nextBtn.addEventListener('touchstart', () => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    touchIntervalNext = setInterval(() => {
      scrollTouch((-1));
      if (currentIndex < itemCount - visibleItems()) {
        currentIndex++;
      }
    }, 800)
  });

  prevBtn.addEventListener('touchend', () => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    updateButtonsTouch();
  });
  
  nextBtn.addEventListener('touchend', () => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    updateButtonsTouch();
  });

  prevBtn.addEventListener('mousedown', () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1 );
    }
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    touchIntervalPrev = setInterval(() => {
      scrollTouch(1);
      if (currentIndex > 0) {
        currentIndex--;
      }
    }, 800);
    setTimeout(() => {
      if (currentIndex === itemCount - 2) scrollToIndex(currentIndex - 2);
    }, 101);
  });
  
  nextBtn.addEventListener('mousedown', () => {
    if (currentIndex < itemCount - visibleItems()) {
      scrollToIndex(currentIndex + 1);
    }
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    touchIntervalNext = setInterval(() => {
      scrollTouch((-1));
      if (currentIndex < itemCount - visibleItems()) {
        currentIndex++;
      }
    }, 800);
    setTimeout(() => {
      if (currentIndex === 0) currentIndex++;
      updateButtons();
    }, 101);
  });

  prevBtn.addEventListener('mouseup', (e) => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    updateButtonsTouch();
  });
  
  nextBtn.addEventListener('mouseup', (e) => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
    updateButtonsTouch();
  });

  prevBtn.addEventListener('mouseout', (e) => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
  });
  
  nextBtn.addEventListener('mouseout', (e) => {
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
  });
  
  prevBtn.addEventListener('dblclick', () => {
    if (currentIndex > 0) {
      scrollToIndex(0);
    }
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
  });
  
  nextBtn.addEventListener('dblclick', () => {
    if (currentIndex < itemCount - visibleItems()) {
      scrollToIndex(itemCount - visibleItems());
    }
    clearInterval(touchIntervalNext);
    clearInterval(touchIntervalPrev);
  });

  carouselItemsWrapper.addEventListener('mousedown', startScrolling , {capturing: false});
  carouselItemsWrapper.onmousemove = scrolling; 
  carouselItemsWrapper.addEventListener('mouseup', endScrolling , {capturing: false});
  
  carouselItemsWrapper.addEventListener('touchstart', updateButtonsTouch , {capturing: false});
  carouselItemsWrapper.ontouchmove = updateButtonsTouch;
  carouselItemsWrapper.addEventListener('touchend', updateButtonsTouch , {capturing: false});
  
  let scrollClientX = 0;
  let scrollInterval = 0;
  
  function startScrolling(event) {
    event.preventDefault();
    scrollInterval = 1;
    scrollClientX = event.currentTarget.scrollLeft;
  }
  
  function scrolling(event) {
    event.preventDefault();
    if (scrollInterval === 1) {
      event.currentTarget.scrollTo({
        left: scrollClientX = scrollClientX + (-1 * event.movementX),
        behavior: 'smooth'
      });
    }
    const itemWidth = items[0].offsetWidth + 
                        parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap);
    const halfItemWidth = items[0].offsetWidth * 0.5 + parseInt(window.getComputedStyle(carouselItemsWrapper).columnGap);
    const f = Number((carouselItemsWrapper.scrollWidth - carouselItemsWrapper.clientWidth === (-1) * carouselItemsWrapper.scrollLeft) ? (1) : 0);
    currentIndex = Number(((((-1) * (carouselItemsWrapper.scrollLeft - (halfItemWidth)) / (itemWidth)).toFixed(0)) - 1))+ f;
  }
    
  function endScrolling(event) {
    scrollInterval = 0;
    scrollClientX = event.currentTarget.scrollLeft;
    updateButtons();
  }
  
  document.addEventListener('click', (ev) => {
    endScrolling(ev);
  });
  
  // Initialize
  updateButtons();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    updateButtons();
  });
};

// counting how many products are available
const productQuantityCounter = async function() {

  const countStockSec1El = document.querySelector(".count-stock[data-section='1']");
  const countStockSec2El = document.querySelector(".count-stock[data-section='2']");
  const countStockSec3El = document.querySelector(".count-stock[data-section='3']");
  const countStockSec4El = document.querySelector(".count-stock[data-section='4']");
  const countStockSec5El = document.querySelector(".count-stock[data-section='5']");
  const productCategories = [
    countStockSec1El,
    countStockSec2El,
    countStockSec3El,
    countStockSec4El,
    countStockSec5El,
  ];

  function promiseGetter() {
    return async function (el) {
      try {
        let filteringTotalWorkerObject;
        // Filtering Workers Executer
        const filteringTotalWorkerObjectFunc = function(data) {
          return new Promise((resolve, reject) => {
            if (typeof Worker === "undefined") {
              reject("Your browser doesn't support worker API");
              return;
            }
        
            if (typeof filteringTotalWorkerObject === "undefined") {
              filteringTotalWorkerObject = new Worker("./assets/js/filterWorkerTotal.js");
            }
            filteringTotalWorkerObject.postMessage(data);
            console.log("Message posted to worker");
        
            filteringTotalWorkerObject.onerror = (event) => {
              console.error("Total Worker error:", event.message || "Unknown Total counter worker error");
            };
        
            filteringTotalWorkerObject.onmessage = function(event) { 
              if (event.data.success === false) {
                console.error("Total Worker processing error:", event.data.error);
                reject(event.data.error);
              } else {
                // console.log("Total Worker results:", event.data);
                
                // Process the data
                const totalProducts = event.data;
                const { totalMatches } = totalProducts;
                
                // Clean up
                filteringTotalWorkerObject.terminate();
                // console.log('Worker Terminated');
                filteringTotalWorkerObject = undefined;
                
                // Resolve the promise with the results
                resolve(totalMatches);
              }
            };
          });
        };
        const categoryID = Number(el.dataset.section);
        const filterParameters = {category: categoryID};
        const totalProductsQuantity = await filteringTotalWorkerObjectFunc(filterParameters);
        
        el.textContent = await totalProductsQuantity;
      } catch (error) {
        console.error('Error loading product:', error);
      }
    }
  }
  const newFunc = promiseGetter();
  const productsCounting = productCategories.map((element) => newFunc(element));
  await Promise.all(productsCounting);
  return;
}


// filtering worker executer
const filteringWorkerObjectFunc = function(data) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject("Your browser doesn't support worker API");
      return;
    }

    let filteringWorkerObject = new Worker("./assets/js/filterWorker.js");
    
    filteringWorkerObject.postMessage(data);

    filteringWorkerObject.onerror = (event) => {
      console.error("Filtering Worker error:", event.message || "Unknown Filtering Worker error");
    };
    
    filteringWorkerObject.onmessage = async function(event) { 
      if (event.data.success === false) {
        console.error("Filtering Worker processing error:", event.data.error);
        reject(event.data.error);
      } else {
        console.log("Filtering Worker results:", event.data);
        // Process the data
        const filteredProducts = event.data;
        const {products} = filteredProducts;
        console.log("Message received from worker", filteredProducts);
        // Resolve the promise with the results
        resolve(products);
      }
    };
  });
};

pageLoad.then((v) => {
  document.addEventListener('productsDatabaseSuccessReady', productQuantityCounter);

  // Special sell products extracting
  document.addEventListener('productsDatabaseSuccessReady', async function () {
    const filterParameters = {
      category: 8,
      sortField: 'idIDX',
      sortDirection: 'asc',
      page: 1,
      pageSize: +Infinity,
    };
    const specialProducts = await filteringWorkerObjectFunc(filterParameters);
    if (specialProducts.length == 0) return;
    const carouselItems = document.querySelector(".carousel-items.special-items");
  
    const renderProducts = async function (products) {
      // transaction to database - to get user favorites
      async function favGetter() {
        return new Promise((resolve, reject) => {
          if (typeof username === "undefined") {
            resolve(undefined);
          } else {
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              if (!db.objectStoreNames.contains("favorite")) {
                resolve(undefined);
                return;
              };
              const transaction = db.transaction(['favorite'], 'readonly');
              const store = transaction.objectStore('favorite');
              const getRequest = store.getAll();
              getRequest.onsuccess = () => {
                const data = getRequest.result;
                resolve(data);
              };
              getRequest.onerror = () => {
                resolve(undefined);
              };
            };
          };
        });
      }
  
      let userFavArr;
      if (typeof username !== undefined) {
        userFavArr = await favGetter();
      }
  
      // Internal Products renderer function
      const renderer = function(productsToRender) {
        {
          if (productsToRender.length == 0) {
            carouselItems.innerHTML = `<span class="no-match-found">متاسفانه کالایی با مشخصات مورد نظر یافت نشد.</span>`;
          } else {
            carouselItems.innerHTML = "";
            for (let p of productsToRender) {
              // p is a product object
              const pId = p.id;
              const pProId = p.proId;
              const pName = p.name;
              const pPrice = p.price;
              const pDescription = p.description;
              const pProductDetails = p.productDetails;
              const pImage = p.image;
              const pCategoriesId = p.categoriesId;
              const pInStock = p.inStock;
              const pColorId = p.colorId;
              const pFabricId = p.fabricId;
              const pDiscount = p.discount;
  
              if (pInStock === 1) {
            
                const materialQuest = (function () {
                    let test;
                    if ( p.categoriesId.indexOf( 9, 0) !== -1 && 
                        p.categoriesId.indexOf( 10, 0) !== -1) {
                      test = true;
                    }
                    if (test == true) {
                      return `
                        <fieldset class="material-selection">
                          <legend class="select-material-title">انتخاب نوع جنس كالا:</legend>
                          <ul class="select-material">
                            <li>
                              <label>چوبی
                                <input type="radio" name="material" value="9">
                              </label>
                            </li>
                            <li>
                              <label>فلزی
                                <input type="radio" name="material" value="10">
                              </label>
                            </li>
                          </ul>
                        </fieldset>
                      `
                    } else {
                      return "";
                    }
                })();
            
                let fabricQuest;
                const fabricTest = (function () {
                  let questArr = [];
                  if ( pFabricId[0] !== 0 ) {
                    const fabOne = pFabricId.some(i => i === 1);
                    const fabTwo = pFabricId.some(i => i === 2);
                    const fabThree = pFabricId.some(i => i === 3);
                    const fabFour = pFabricId.some(i => i === 4);
                    const fabOneText = (fabOne) ? `
                      <li>
                        <label>چرم
                          <input type="radio" name="fabric" value="1">
                        </label>
                      </li>` : "";
                    const fabTwoText = (fabTwo) ? `
                      <li>
                        <label>پارچه مخمل
                          <input type="radio" name="fabric" value="2">
                        </label>
                      </li>` : "";
                    const fabThreeText = (fabThree) ? `
                      <li>
                        <label>پارچه کتان
                          <input type="radio" name="fabric" value="3">
                        </label>
                      </li>` : "";
                    const fabFourText = (fabFour) ? `
                      <li>
                        <label>پارچه شمعی
                          <input type="radio" name="fabric" value="4">
                        </label>
                      </li>` : "";
                    questArr.unshift(fabOneText, fabTwoText, fabThreeText, fabFourText);
                    if (
                      fabOne !== false || 
                      fabTwo !== false || 
                      fabThree !== false || 
                      fabFour !== false 
                    ) {
                      fabricQuest = `
                        <fieldset class="fabric-selection">
                          <legend class="select-fabric-title">انتخاب نوع پارچه:</legend>
                          <ul class="select-fabric">
                            ${questArr.join('')}
                          </ul>
                        </fieldset>
                      `;
                    } else {
                      return "";
                    }
                  } else {
                    fabricQuest = "";
                  }
                })();
            
                let colorQuest;
                const colorTest = (function () {
                  let questArr = [];
                  const colorOne = pColorId.some(i => i === 1);
                  const colorTwo = pColorId.some(i => i === 2);
                  const colorThree = pColorId.some(i => i === 3);
                  const colorFour = pColorId.some(i => i === 4);
                  const colorFive = pColorId.some(i => i === 5);
                  const colorSix = pColorId.some(i => i === 6);
                  const colorSeven = pColorId.some(i => i === 7);
                  const colorEight = pColorId.some(i => i === 8);
                  const colorOneText = (colorOne) ? `
                    <li>
                      <label>سفيد
                        <input type="radio" name="color" value="1">
                      </label>
                    </li>
                    ` : "";
                  const colorTwoText = (colorTwo) ? `
                    <li>
                      <label>سياه
                        <input type="radio" name="color" value="2">
                      </label>
                    </li>
                    ` : "";
                  const colorThreeText = (colorThree) ? `
                    <li>
                      <label>سبز
                        <input type="radio" name="color" value="3">
                      </label>
                    </li>
                    ` : "";
                  const colorFourText = (colorFour) ? `
                    <li>
                      <label>زرد
                        <input type="radio" name="color" value="4">
                      </label>
                    </li>
                    ` : "";
                  const colorFiveText = (colorFive) ? `
                    <li>
                      <label>آبی
                        <input type="radio" name="color" value="5">
                      </label>
                    </li>
                    ` : "";
                  const colorSixText = (colorSix) ? `
                    <li>
                      <label>قرمز
                        <input type="radio" name="color" value="6">
                      </label>
                    </li>
                    ` : "";
                  const colorSevenText = (colorSeven) ? `
                    <li>
                      <label>خاکستری
                        <input type="radio" name="color" value="7">
                      </label>
                    </li>
                    ` : "";
                  const colorEightText = (colorEight) ? `
                    <li>
                      <label>بنفش
                        <input type="radio" name="color" value="8">
                      </label>
                    </li>
                    ` : "";
                  questArr.unshift(
                    colorOneText, 
                    colorTwoText, 
                    colorThreeText, 
                    colorFourText, 
                    colorFiveText, 
                    colorSixText, 
                    colorSevenText, 
                    colorEightText
                  );
                  colorQuest = `
                    <fieldset class="color-selection">
                      <legend class="select-color-title">انتخاب نوع رنگ:</legend>
                      <ul class="select-color">
                        ${questArr.join('')}
                      </ul>
                    </fieldset>
                  `;
                })();
                
                let tagText = (function () {
                  if (pInStock === 0) return `<span class="tag out-of-stock">ناموجود</span>`;
                  if (pCategoriesId.includes(7)) return `<span class="tag new-product">جدید</span>`;
                  if (p.discount !== 0) return `<span class="tag discount">${pDiscount.toFixed(0)}</span>`;
                  return "";
                })();
            
                let grossPriceContent = (function () {
                  if (!pDiscount) return "";
                  return `
                    <span class="price-gross" tabindex="-1">
                      <strong class="order-price" tabindex="-1">${pPrice}</strong>
                    </span>`;
                })();
            
                let descriptionTxtContent = (function () {
                  if (pDiscount) {
                    return `<span class="p-dscr" tabindex="-1">${pDescription}</span>`;
                  } else {
                    return `<span class="p-dscr more-height" tabindex="-1">${pDescription}</span>`
                  }
                })();
      
                let orderBtn = (function () {
                  if (pInStock === 0) return `<button class="sold-out" tabindex="-1">سفارش تولید</button>`;
                  return '<button class="add-to-cart" tabindex="-1"></button>';
                })();
      
                let favBtn = (function () {
                    if (typeof userFavArr === 'undefined') return `<input type="checkbox" tabindex="-1" disabled></input>`;
                    if (userFavArr.length > 0) {
                      const savedFavoriteTest = userFavArr.includes(pId);
                      if (savedFavoriteTest) return `<input type="checkbox" tabindex="-1" checked="true"></input>`
                      return `<input type="checkbox" tabindex="-1"></input>`
                    } else {
                      return `<input type="checkbox" tabindex="-1"></input>`
                    }
                })();
            
                const productEl = document.createElement('div');
                productEl.className = "c-item rounded-6";
                productEl.setAttribute('data-product-id', `${pId}`)
                productEl.innerHTML = `
                  <div class="image-product" tabindex="-1">
                    <img src="assets/images/p/${pImage}" alt="${pName} ${pProId} ${pId}" tabindex="-1">
                    <div class="favorites-btn" tabindex="-1">
                      <label class="favorite-checkbox" tabindex="-1">
                        ${favBtn}
                      </label>
                    </div>
                    <div class="favorites-tooltip rounded-4" tabindex="-1">
                      <span tabindex="-1">افزودن به علاقه‌مندی</span>
                    </div>
                    ${tagText}
                  </div>
                  <div class="product-action" tabindex="-1">
                    <div class="pre-act" tabindex="-1">
                      <div class="p-details" tabindex="-1">
                        <p class="p-name" tabindex="-1">${pName}</p>
                        ${descriptionTxtContent}
                      </div>
                      <div class="p-price" tabindex="-1">
                        ${grossPriceContent}
                        <span class="price-net" tabindex="-1">
                          <strong class="order-price" tabindex="-1">${(pPrice * (1 - (pDiscount/100))).toFixed(0)}</strong>
                        </span>
                      </div>
                      <div class="cart-btn" tabindex="-1">
                        <button class="order-details rounded-4" onclick="this.parentElement.parentElement.nextElementSibling.style.transform='scaleY(1)';" tabindex="-1">
                          جزييات سفارش
                        </button>
                        <a class="show-product" href="${'/product.html?productID=' + pId}" tabindex="-1">
                          <i class="las la-search"></i>
                        </a>
                      </div>
                    </div>
                    <div class="post-act" tabindex="-1">
                      <div class="post-act-contents" tabindex="-1">
                        <button class="close-btn" href="javascript:void(0);" title="بستن" onclick="this.parentElement.parentElement.style.transform='scaleY(0)';" tabindex="-1">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 128 128" xml:space="preserve">
                            <g><path d="M101.682,32.206L69.887,64l31.795,31.794l-5.887,5.888L64,69.888l-31.794,31.794l-5.888-5.888L58.112,64 L26.318,32.206l5.888-5.888L64,58.112l31.794-31.794L101.682,32.206z"></path></g>
                          </svg>
                        </button>
                        <button class="reset-btn" title="پاك كردن" tabindex="-1">
                          <i class="las la-undo-alt"></i>
                        </button>
                        <h6>انتخاب متريال سفارشی:</h6>
                        <form action="javascript:void(0)" tabindex="-1">
                          ${materialQuest}
                          ${fabricQuest}
                          ${colorQuest}
                          ${orderBtn}
                        </form>
                      </div>
                    </div>
                  </div>
                `;
                carouselItems.appendChild(productEl);
              }
            };
          };
        }
        // go to product page by clicking on product image
        carouselItems.querySelectorAll('.image-product img').forEach(elm => {
          let mouseDownScrollS = 0;
          elm.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            mouseDownScrollS = rect.left;
          });
          elm.addEventListener('mouseup', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            if (mouseDownScrollS === rect.left) {
              e.stopImmediatePropagation();
              const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
              redirectToProduct(ProductId);
            }
          });
        });
        // go to product page by clicking on product name
        carouselItems.querySelectorAll('.product-action .p-name').forEach(elm => {
          let mouseDownScrollS = 0;
          elm.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            mouseDownScrollS = rect.left;
          });
          elm.addEventListener('mouseup', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            if (mouseDownScrollS === rect.left) {
              e.stopImmediatePropagation();
              const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
              redirectToProduct(ProductId);
            }
          });
        });
        // go to product page by clicking on show-product button
        carouselItems.querySelectorAll('a.show-product').forEach(elm => {
          let mouseDownScrollS = 0;
          elm.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            mouseDownScrollS = rect.left;
          });
          elm.addEventListener('mouseup', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            if (mouseDownScrollS === rect.left) {
              e.stopImmediatePropagation();
              const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
              redirectToProduct(ProductId);
            }
          
          });
        });
        function redirectToProduct(pId, url) {
          if (localStorage.getItem('productItemLink') && localStorage.getItem('productItemLink') !== undefined) {
              localStorage.removeItem('productItemLink');
          }
          if (localStorage.getItem('productStorePageLink') && localStorage.getItem('productStorePageLink') !== undefined) {
              localStorage.removeItem('productStorePageLink');
          }
          window.location.href = window.location.origin + '/product.html?productID=' + pId;
        }
        // collecting user post actions of selecting additional options
        carouselItems.querySelectorAll('fieldset.material-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-material-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        carouselItems.querySelectorAll('fieldset.fabric-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-fabric-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        carouselItems.querySelectorAll('fieldset.color-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-color-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        // favorite button functionality
        carouselItems.querySelectorAll('.favorites-btn').forEach(elm => {
          const throttle = function (mainFunction, delay) {
            let timerFlag = null;               
            return (...args) => {               
              if (timerFlag === null) {         
                mainFunction(...args);          
                timerFlag = setTimeout(() => {  
                  timerFlag = null;             
                }, delay);
              }
            };
          };
          // Add to favorites
          const favInputCheckedFunc = function (e) {
            const thisProductId = Number(e.closest('div[data-product-id]').dataset.productId);
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['favorite'], 'readwrite');
              const store = transaction.objectStore('favorite');
              const getRequest = store.add(thisProductId);
              getRequest.onsuccess = () => {
                console.log('Added new favorite');
                const countTransaction = db.transaction(['favorite'], 'readonly');
                const countStore = countTransaction.objectStore('favorite');
                const counter = countStore.count();
                
                counter.onsuccess = (e) => {
                  const quantityOfFavs = e.target.result;
                  console.log(quantityOfFavs);
                  
                  const updateTransaction = db.transaction(['profile'], 'readwrite');
                  const profileStore = updateTransaction.objectStore('profile');
                  const profileGetReq = profileStore.get(1);
                  
                  profileGetReq.onsuccess = (e) => {
                    const profile = e.target.result;
                    profile.favoritesCount = quantityOfFavs;
                    const updateFavRequest = profileStore.put(profile, 1);
                    updateFavRequest.onsuccess = () => console.log('Favorites counter updated');
                    updateFavRequest.onerror = () => console.log('Error updating favorites counter!');
                  };
                  
                  profileGetReq.onerror = () => console.log('Error getting profile');
                }
              };
              getRequest.onerror = () => console.log('Error adding favorites');
            };
          };
          // Remove from favorites
          const favInputNotCheckedFunc = function (e) {
            const thisProductId = Number(e.closest('div[data-product-id]').dataset.productId);
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['favorite'], 'readwrite');
              const store = transaction.objectStore('favorite');
              const cursor = store.openCursor();
              cursor.onsuccess = function(event) {
                const result = event.target.result;                          
                if (result) {                                                
                  if (result.value === thisProductId) {
                    const removeReq = store.delete(result.key);
                    removeReq.onsuccess = () => {
                      console.log('Removed the favorite');
                      const countTransaction = db.transaction(['favorite'], 'readonly');
                      const countStore = countTransaction.objectStore('favorite');
                      const counter = countStore.count();
                      
                      counter.onsuccess = (e) => {
                        const quantityOfFavs = e.target.result;
                        console.log(quantityOfFavs);
                        
                        const updateTransaction = db.transaction(['profile'], 'readwrite');
                        const profileStore = updateTransaction.objectStore('profile');
                        const profileGetReq = profileStore.get(1);
                        
                        profileGetReq.onsuccess = (e) => {
                          const profile = e.target.result;
                          profile.favoritesCount = quantityOfFavs;
                          const updateFavRequest = profileStore.put(profile, 1);
                          updateFavRequest.onsuccess = () => console.log('Favorites counter updated');
                          updateFavRequest.onerror = () => console.log('Error updating favorites counter!');
                        };
                        
                        profileGetReq.onerror = () => console.log('Error getting profile');
                      }
                    }
                    removeReq.onerror = () => console.log('Error removing the favorite');
                    result.continue();
                  } else {
                    result.continue();
                  }
                } else {                                                                    
                  console.log("No more entries!");
                }
              };
              cursor.onerror = function(event) {
                console.error("Cursor request failed:", event.target.error);
              };
            };
          };
          const throttledChecked = throttle(favInputCheckedFunc, 2000);
          const throttledNotChecked = throttle(favInputNotCheckedFunc, 2000);
  
          elm.addEventListener('click', function (e) {
            
            if (typeof username !== undefined) {
              if (e.currentTarget.querySelector('input[type="checkbox"]').checked === false) {
                e.currentTarget.querySelector('input[type="checkbox"]').checked = true;
                throttledChecked(e.currentTarget.querySelector('input[type="checkbox"]'));
              } else {
                e.currentTarget.querySelector('input[type="checkbox"]').checked = false;
                throttledNotChecked(e.currentTarget.querySelector('input[type="checkbox"]'));
              }
            } else {
              return;
            }
          });
        });
        // setting event listener on add to cart buttons
        carouselItems.querySelectorAll('.add-to-cart').forEach(button => {
          button.addEventListener('click', async function(e) {
            const id = Number(e.target.closest('[data-product-id]').dataset.productId);
            const currentTarget = e.currentTarget;
            let product;
            const productObject = () => {
              let db = null;
              const dbPromise = new Promise((resolve, reject) => {
                  const request = indexedDB.open('db', 1);
                  request.onsuccess = (event) => resolve(event.target.result);
                  request.onerror = (event) => reject(event.target.error);
              });
              return async function getProductItems(id) {
                try {
                  db = await dbPromise;
                  const productTX = db.transaction('products', 'readonly');
                  const productStore = productTX.objectStore('products');
                  const productRequest = productStore.get(id);
                  product = await new Promise((resolve, reject) => {
                      productRequest.onsuccess = (event) => resolve(event.target.result);
                      productRequest.onerror = (event) => reject(event.target.error);
                  });
                } catch (error) {
                  console.error('Error loading product:', error);
                }
              }
            }
            let loadProducts = productObject();
            await loadProducts(id);
            const orderTime = Date.now();
            
            let materialSelectedValue, 
                fabricSelectedValue, 
                colorSelectedValue,
                considerMaterial = false,
                considerFabric = false,
                considerColor = false,
                selectedProductObj;
            if (currentTarget.parentElement.querySelector('fieldset.material-selection')) {
              materialSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.material-selection').dataset.selectedMaterialValue);
              considerMaterial = true;
            };
            if (currentTarget.parentElement.querySelector('fieldset.fabric-selection')) {
              fabricSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.fabric-selection').dataset.selectedFabricValue);
              considerFabric = true;
            };
            if (currentTarget.parentElement.querySelector('fieldset.color-selection')) {
              colorSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.color-selection').dataset.selectedColorValue);
              considerColor = true;
            };
            // console.log(materialSelectedValue, fabricSelectedValue, colorSelectedValue);
            if (considerMaterial ||
                considerFabric ||
                considerColor) {
              if (Number.isNaN(materialSelectedValue) ||
                  Number.isNaN(fabricSelectedValue) ||
                  Number.isNaN(colorSelectedValue)) {
                notification(
                  "لطفا یکی از گزینه‌های مورد نیاز را انتخاب نمایید.", 
                  "&cross;;", 
                  "#fbff13ff", 
                  "#000", 
                  "#ff391fff", 
                  "check-necessary-fieldset-error-01", 
                  "notif-danger"
                );
                return;
              } else {
                selectedProductObj = {
                  id: Number(id),
                  material: (considerMaterial && !isNaN(materialSelectedValue)) ? materialSelectedValue : null,
                  fabric: (considerFabric && !isNaN(fabricSelectedValue)) ? fabricSelectedValue : null,
                  color: (considerColor && !isNaN(colorSelectedValue)) ? colorSelectedValue : null,
                  quantity: 1,
                  date: orderTime,
                  price: 0,
                  benefit: 0,
                };
              };
            };
            if (typeof username !== undefined) {
              // indexedDB database transactions 
              let db;
              let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
              // Check if product already in cart
              function makeTX(storeName, mode) {
                let tx = db.transaction(storeName, mode);
                tx.onerror = (err) => {
                  console.warn(err);
                };
                return tx;
              }
              dbOpenRequest.addEventListener('success', (e) => {
                db = e.target.result;
                console.log('success opening db.');
                let cartTX = makeTX('cart', 'readwrite');
                cartTX.oncomplete = () => {
                  console.log('User cart exists.');
                };
                cartTX.onerror = (err) => {
                  console.warn(err);
                };
                let cartStore = cartTX.objectStore('cart');
                let cartRequest = cartStore.count();
                cartRequest.onsuccess = function(event) {
                  if (event.target.result === 0) {
                    let req = cartStore.add(selectedProductObj);
                    req.onsuccess = (ev) => {
                      console.log('New product added to cart.');
                    };
                    req.onerror = (err) => {
                      console.warn(err);
                    };
                  } else {
                    let cursorRequest = cartStore.openCursor();
                    cursorRequest.onsuccess = (event) => {
                      const result = event.target.result;
                      if (result) {
                        if (
                          result.value.id === selectedProductObj.id &&
                          result.value.material === selectedProductObj.material &&
                          result.value.fabric === selectedProductObj.fabric &&
                          result.value.color === selectedProductObj.color
                          ) {
                          let quantityAddedProduct = result.value;
                          let cartQuantity = result.value.quantity;
                          if (cartQuantity >= product.quantity) {
                            quantityAddedProduct.quantity = product.quantity;
                            notification(
                                "شما در حال حاضر تمام موجودی انبار این محصول را در سبد خرید خود دارید.",
                                "",
                                "#ff3713",
                                "#fff",
                                "#030000",
                                "out-of-stock-01",
                                "notif-danger"
                            );
                            return;
                          } else if (cartQuantity < product.quantity) {
                            quantityAddedProduct.quantity = cartQuantity + 1;
                          }
                          let req = cartStore.put(quantityAddedProduct);
                          req.onsuccess = (ev) => {
                            console.log('Another number of the Product added to cart.');
                          };
                          req.onerror = (err) => {
                            console.warn(err);
                          };
                        } else {
                          result.continue();
                        };
                      } else {
                        let req = cartStore.add(selectedProductObj);
                        req.onsuccess = (ev) => {
                          console.log('New product added to cart.');
                        };
                        req.onerror = (err) => {
                          console.warn(err);
                        };
                      };
                    };
                    cursorRequest.onerror = (err) => {
                      console.warn(err);
                    };
                  };
                };
              });
            };
            cart();
          });
        });
        // setting functionality of sold out products
        carouselItems.querySelectorAll('.sold-out').forEach(button => {
          button.addEventListener('click', function(e) {
            window.location.href = window.location.origin + "/contactus.html";
          })
        });
        // reset button functionality
        carouselItems.querySelectorAll('.post-act-contents > .reset-btn').forEach( button => {
          button.addEventListener('click', function (e) {
            e.currentTarget.nextElementSibling.nextElementSibling.reset();
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.material-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.material-selection').removeAttribute('data-selected-material-value');
            }
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.fabric-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.fabric-selection').removeAttribute('data-selected-fabric-value');
            }
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.color-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.color-selection').removeAttribute('data-selected-color-value');
            }
          });
        });
        // separate numbers by three
        const orderPrice = document.querySelector(".special-items").querySelectorAll(".order-price");
        for (let i of orderPrice) {
            i.textContent =
              parseInt(i.textContent
                .replace(/[^\d]+/gi, ''))
                  .toLocaleString('fa-IR')
                    .replace(/[٬]/gi, ',')
        };
        return `Render Operation Processed: ${productsToRender}`;
      };
      
      try {
        renderer(products);
        carouselFunc('special-items-container');
      } catch (e) {
        throw e;
      }
    };
  
    renderProducts(specialProducts);
  
  });
  
  // New Products extracting
  document.addEventListener('productsDatabaseSuccessReady', async function () {
    const filterParameters = {
      category: 7,
      sortField: 'idIDX',
      sortDirection: 'asc',
      page: 1,
      pageSize: +Infinity,
    };
    const specialProducts = await filteringWorkerObjectFunc(filterParameters);
    if (specialProducts.length == 0) return;
    const carouselItems = document.querySelector(".carousel-items.new-items");
  
    const renderProducts = async function (products) {
      // transaction to database - to get user favorites
      async function favGetter() {
        return new Promise((resolve, reject) => {
          if (typeof username === "undefined") {
            resolve(undefined);
          } else {
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              if (!db.objectStoreNames.contains("favorite")) {
                resolve(undefined);
                return;
              };
              const transaction = db.transaction(['favorite'], 'readonly');
              const store = transaction.objectStore('favorite');
              const getRequest = store.getAll();
              getRequest.onsuccess = () => {
                const data = getRequest.result;
                resolve(data);
              };
              getRequest.onerror = () => {
                resolve(undefined)
              };
            };
          }
        });
      }
  
      let userFavArr;
      if (typeof username !== undefined) {
        userFavArr = await favGetter();
      }
  
      // transaction to database - to get categories name
      async function catNameGetter() {
        return new Promise((resolve, reject) => {
          const dbOpenRequest = window.indexedDB.open(`db`, 1);
          dbOpenRequest.onerror = () => reject('Error opening database');
          dbOpenRequest.onsuccess = (e) => {
            const db = e.target.result; // Declare inside callback
            const transaction = db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => {
              const data = getRequest.result;
              resolve(data);
            };
            getRequest.onerror = () => reject('Error fetching favorites');
          };
        });
      }
  
      let catName;
      catName = await catNameGetter();
  
      // renderer function
      const renderer = function(productsToRender) {
        {
          if (productsToRender.length == 0) {
            carouselItems.innerHTML = `<span class="no-match-found">متاسفانه کالایی با مشخصات مورد نظر یافت نشد.</span>`;
          } else {
            carouselItems.innerHTML = "";
            for (let p of productsToRender) {
              // p is a product object
              const pId = p.id;
              const pProId = p.proId;
              const pName = p.name;
              const pPrice = p.price;
              const pDescription = p.description;
              const pProductDetails = p.productDetails;
              const pImage = p.image;
              const pCategoriesId = p.categoriesId;
              const pCategories = p.categoriesId.map(cat => {
                return `${catName[cat-1].name}, `;
              }).join('');
              const pInStock = p.inStock;
              const pColorId = p.colorId;
              const pFabricId = p.fabricId;
              const pDiscount = p.discount;
              // const pQuantity = p.quantity;
  
              if (pInStock === 1) {
            
                const materialQuest = (function () {
                    let test;
                    if ( p.categoriesId.indexOf( 9, 0) !== -1 && 
                        p.categoriesId.indexOf( 10, 0) !== -1) {
                      test = true;
                    }
                    if (test == true) {
                      return `
                        <fieldset class="material-selection">
                          <legend class="select-material-title">انتخاب نوع جنس كالا:</legend>
                          <ul class="select-material">
                            <li>
                              <label>چوبی
                                <input type="radio" name="material" value="9">
                              </label>
                            </li>
                            <li>
                              <label>فلزی
                                <input type="radio" name="material" value="10">
                              </label>
                            </li>
                          </ul>
                        </fieldset>
                      `
                    } else {
                      return "";
                    }
                })();
            
                let fabricQuest;
                const fabricTest = (function () {
                  let questArr = [];
                  if ( pFabricId[0] !== 0 ) {
                    const fabOne = pFabricId.some(i => i === 1);
                    const fabTwo = pFabricId.some(i => i === 2);
                    const fabThree = pFabricId.some(i => i === 3);
                    const fabFour = pFabricId.some(i => i === 4);
                    const fabOneText = (fabOne) ? `
                      <li>
                        <label>چرم
                          <input type="radio" name="fabric" value="1">
                        </label>
                      </li>` : "";
                    const fabTwoText = (fabTwo) ? `
                      <li>
                        <label>پارچه مخمل
                          <input type="radio" name="fabric" value="2">
                        </label>
                      </li>` : "";
                    const fabThreeText = (fabThree) ? `
                      <li>
                        <label>پارچه کتان
                          <input type="radio" name="fabric" value="3">
                        </label>
                      </li>` : "";
                    const fabFourText = (fabFour) ? `
                      <li>
                        <label>پارچه شمعی
                          <input type="radio" name="fabric" value="4">
                        </label>
                      </li>` : "";
                    questArr.unshift(fabOneText, fabTwoText, fabThreeText, fabFourText);
                    if (
                      fabOne !== false || 
                      fabTwo !== false || 
                      fabThree !== false || 
                      fabFour !== false 
                    ) {
                      fabricQuest = `
                        <fieldset class="fabric-selection">
                          <legend class="select-fabric-title">انتخاب نوع پارچه:</legend>
                          <ul class="select-fabric">
                            ${questArr.join('')}
                          </ul>
                        </fieldset>
                      `;
                    } else {
                      return "";
                    }
                  } else {
                    fabricQuest = "";
                  }
                })();
            
                let colorQuest;
                const colorTest = (function () {
                  let questArr = [];
                  const colorOne = pColorId.some(i => i === 1);
                  const colorTwo = pColorId.some(i => i === 2);
                  const colorThree = pColorId.some(i => i === 3);
                  const colorFour = pColorId.some(i => i === 4);
                  const colorFive = pColorId.some(i => i === 5);
                  const colorSix = pColorId.some(i => i === 6);
                  const colorSeven = pColorId.some(i => i === 7);
                  const colorEight = pColorId.some(i => i === 8);
                  const colorOneText = (colorOne) ? `
                    <li>
                      <label>سفيد
                        <input type="radio" name="color" value="1">
                      </label>
                    </li>
                    ` : "";
                  const colorTwoText = (colorTwo) ? `
                    <li>
                      <label>سياه
                        <input type="radio" name="color" value="2">
                      </label>
                    </li>
                    ` : "";
                  const colorThreeText = (colorThree) ? `
                    <li>
                      <label>سبز
                        <input type="radio" name="color" value="3">
                      </label>
                    </li>
                    ` : "";
                  const colorFourText = (colorFour) ? `
                    <li>
                      <label>زرد
                        <input type="radio" name="color" value="4">
                      </label>
                    </li>
                    ` : "";
                  const colorFiveText = (colorFive) ? `
                    <li>
                      <label>آبی
                        <input type="radio" name="color" value="5">
                      </label>
                    </li>
                    ` : "";
                  const colorSixText = (colorSix) ? `
                    <li>
                      <label>قرمز
                        <input type="radio" name="color" value="6">
                      </label>
                    </li>
                    ` : "";
                  const colorSevenText = (colorSeven) ? `
                    <li>
                      <label>خاکستری
                        <input type="radio" name="color" value="7">
                      </label>
                    </li>
                    ` : "";
                  const colorEightText = (colorEight) ? `
                    <li>
                      <label>بنفش
                        <input type="radio" name="color" value="8">
                      </label>
                    </li>
                    ` : "";
                  questArr.unshift(
                    colorOneText, 
                    colorTwoText, 
                    colorThreeText, 
                    colorFourText, 
                    colorFiveText, 
                    colorSixText, 
                    colorSevenText, 
                    colorEightText
                  );
                  colorQuest = `
                    <fieldset class="color-selection">
                      <legend class="select-color-title">انتخاب نوع رنگ:</legend>
                      <ul class="select-color">
                        ${questArr.join('')}
                      </ul>
                    </fieldset>
                  `;
                })();
                
                let tagText = (function () {
                  if (pInStock === 0) return `<span class="tag out-of-stock">ناموجود</span>`;
                  if (pCategoriesId.includes(7)) return `<span class="tag new-product">جدید</span>`;
                  if (p.discount !== 0) return `<span class="tag discount">${pDiscount.toFixed(0)}</span>`;
                  return "";
                })();
            
                let grossPriceContent = (function () {
                  if (!pDiscount) return "";
                  return `
                    <span class="price-gross" tabindex="-1">
                      <strong class="order-price" tabindex="-1">${pPrice}</strong>
                    </span>`;
                })();
            
                let descriptionTxtContent = (function () {
                  if (pDiscount) {
                    return `<span class="p-dscr" tabindex="-1">${pDescription}</span>`;
                  } else {
                    return `<span class="p-dscr more-height" tabindex="-1">${pDescription}</span>`
                  }
                })();
      
                let orderBtn = (function () {
                  if (pInStock === 0) return `<button class="sold-out" tabindex="-1">سفارش تولید</button>`;
                  return '<button class="add-to-cart" tabindex="-1"></button>';
                })();
      
                let favBtn = (function () {
                    if (typeof userFavArr === 'undefined') return `<input type="checkbox" tabindex="-1" disabled></input>`;
                    if (userFavArr.length > 0) {
                      const savedFavoriteTest = userFavArr.includes(pId);
                      if (savedFavoriteTest) return `<input type="checkbox" tabindex="-1" checked="true"></input>`
                      return `<input type="checkbox" tabindex="-1"></input>`
                    } else {
                      return `<input type="checkbox" tabindex="-1"></input>`
                    }
                })();
            
                const productEl = document.createElement('div');
                productEl.className = "c-item rounded-6";
                productEl.setAttribute('data-product-id', `${pId}`)
                productEl.innerHTML = `
                  <div class="image-product" tabindex="-1">
                    <img src="assets/images/p/${pImage}" alt="${pName} ${pProId} ${pId}" tabindex="-1">
                    <div class="favorites-btn" tabindex="-1">
                      <label class="favorite-checkbox" tabindex="-1">
                        ${favBtn}
                      </label>
                    </div>
                    <div class="favorites-tooltip rounded-4" tabindex="-1">
                      <span tabindex="-1">افزودن به علاقه‌مندی</span>
                    </div>
                    ${tagText}
                  </div>
                  <div class="product-action" tabindex="-1">
                    <div class="pre-act" tabindex="-1">
                      <div class="p-details" tabindex="-1">
                        <p class="p-name" tabindex="-1">${pName}</p>
                        <span class="p-id" tabindex="-1">شناسه كالا : ${pProId}</span>
                        <span class="p-cat" tabindex="-1">${pCategories}</span>
                      </div>
                      <div class="p-price" tabindex="-1">
                        ${grossPriceContent}
                        <span class="price-net" tabindex="-1">
                          <strong class="order-price" tabindex="-1">${(pPrice * (1 - (pDiscount/100))).toFixed(0)}</strong>
                        </span>
                      </div>
                      <div class="cart-btn" tabindex="-1">
                        <button class="order-details rounded-4" onclick="this.parentElement.parentElement.nextElementSibling.style.transform='scaleY(1)';" tabindex="-1">
                          جزييات سفارش
                        </button>
                        <a class="show-product" href="${'/product.html?productID=' + pId}" tabindex="-1">
                          <i class="las la-search"></i>
                        </a>
                      </div>
                    </div>
                    <div class="post-act" tabindex="-1">
                      <div class="post-act-contents" tabindex="-1">
                        <button class="close-btn" href="javascript:void(0);" title="بستن" onclick="this.parentElement.parentElement.style.transform='scaleY(0)';" tabindex="-1">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 128 128" xml:space="preserve">
                            <g><path d="M101.682,32.206L69.887,64l31.795,31.794l-5.887,5.888L64,69.888l-31.794,31.794l-5.888-5.888L58.112,64 L26.318,32.206l5.888-5.888L64,58.112l31.794-31.794L101.682,32.206z"></path></g>
                          </svg>
                        </button>
                        <button class="reset-btn" title="پاك كردن" tabindex="-1">
                          <i class="las la-undo-alt"></i>
                        </button>
                        <h6>انتخاب متريال سفارشی:</h6>
                        <form action="javascript:void(0)" tabindex="-1">
                          ${materialQuest}
                          ${fabricQuest}
                          ${colorQuest}
                          ${orderBtn}
                        </form>
                      </div>
                    </div>
                  </div>
                `;
                carouselItems.appendChild(productEl);
              }
            };
          };
        }
        // go to product page by clicking on product image
        carouselItems.querySelectorAll('.image-product img').forEach(elm => {
          let mouseDownScrollS = 0;
          elm.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            mouseDownScrollS = rect.left;
          });
          elm.addEventListener('mouseup', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            if (mouseDownScrollS === rect.left) {
              e.stopImmediatePropagation();
              const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
              redirectToProduct(ProductId);
            }
          });
        });
        // go to product page by clicking on product name
        carouselItems.querySelectorAll('.product-action .p-name').forEach(elm => {
          let mouseDownScrollS = 0;
          elm.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            mouseDownScrollS = rect.left;
          });
          elm.addEventListener('mouseup', (e) => {
            e.preventDefault();
            let rect = e.currentTarget.closest('.c-item').getBoundingClientRect();
            if (mouseDownScrollS === rect.left) {
              e.stopImmediatePropagation();
              const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
              redirectToProduct(ProductId);
            }
          });
        });
        // go to product page by clicking on show-product button
        carouselItems.querySelectorAll('a.show-product').forEach(elm => {
          elm.addEventListener('click', (e) => {
            e.preventDefault();
            const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
            redirectToProduct(ProductId);
          
          });
        });
        function redirectToProduct(pId, url) {
          if (localStorage.getItem('productItemLink') && localStorage.getItem('productItemLink') !== undefined) {
              localStorage.removeItem('productItemLink');
          }
          if (localStorage.getItem('productStorePageLink') && localStorage.getItem('productStorePageLink') !== undefined) {
              localStorage.removeItem('productStorePageLink');
          }
          window.location.href = window.location.origin + '/product.html?productID=' + pId;
        }
        // collecting user post actions of selecting additional options
        carouselItems.querySelectorAll('fieldset.material-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-material-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        carouselItems.querySelectorAll('fieldset.fabric-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-fabric-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        carouselItems.querySelectorAll('fieldset.color-selection').forEach(elm => {
          elm.onchange = function (e) {
            e.currentTarget.setAttribute('data-selected-color-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
          };
        });
        // favorite button functionality
        carouselItems.querySelectorAll('.favorites-btn').forEach(elm => {
          const throttle = function (mainFunction, delay) {
            let timerFlag = null;               
            return (...args) => {               
              if (timerFlag === null) {         
                mainFunction(...args);          
                timerFlag = setTimeout(() => {  
                  timerFlag = null;             
                }, delay);
              }
            };
          };
          // Add to favorites
          const favInputCheckedFunc = function (e) {
            const thisProductId = Number(e.closest('div[data-product-id]').dataset.productId);
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['favorite'], 'readwrite');
              const store = transaction.objectStore('favorite');
              const getRequest = store.add(thisProductId);
              getRequest.onsuccess = () => {
                console.log('Added new favorite');
                const countTransaction = db.transaction(['favorite'], 'readonly');
                const countStore = countTransaction.objectStore('favorite');
                const counter = countStore.count();
                
                counter.onsuccess = (e) => {
                  const quantityOfFavs = e.target.result;
                  console.log(quantityOfFavs);
                  
                  const updateTransaction = db.transaction(['profile'], 'readwrite');
                  const profileStore = updateTransaction.objectStore('profile');
                  const profileGetReq = profileStore.get(1);
                  
                  profileGetReq.onsuccess = (e) => {
                    const profile = e.target.result;
                    profile.favoritesCount = quantityOfFavs;
                    const updateFavRequest = profileStore.put(profile, 1);
                    updateFavRequest.onsuccess = () => console.log('Favorites counter updated');
                    updateFavRequest.onerror = () => console.log('Error updating favorites counter!');
                  };
                  
                  profileGetReq.onerror = () => console.log('Error getting profile');
                }
              };
              getRequest.onerror = () => console.log('Error adding favorites');
            };
          };
          // Remove from favorites
          const favInputNotCheckedFunc = function (e) {
            const thisProductId = Number(e.closest('div[data-product-id]').dataset.productId);
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['favorite'], 'readwrite');
              const store = transaction.objectStore('favorite');
              const cursor = store.openCursor();
              cursor.onsuccess = function(event) {
                const result = event.target.result;                          
                if (result) {                                                
                  if (result.value === thisProductId) {
                    const removeReq = store.delete(result.key);
                    removeReq.onsuccess = () => {
                      console.log('Removed the favorite');
                      const countTransaction = db.transaction(['favorite'], 'readonly');
                      const countStore = countTransaction.objectStore('favorite');
                      const counter = countStore.count();
                      
                      counter.onsuccess = (e) => {
                        const quantityOfFavs = e.target.result;
                        console.log(quantityOfFavs);
                        
                        const updateTransaction = db.transaction(['profile'], 'readwrite');
                        const profileStore = updateTransaction.objectStore('profile');
                        const profileGetReq = profileStore.get(1);
                        
                        profileGetReq.onsuccess = (e) => {
                          const profile = e.target.result;
                          profile.favoritesCount = quantityOfFavs;
                          const updateFavRequest = profileStore.put(profile, 1);
                          updateFavRequest.onsuccess = () => console.log('Favorites counter updated');
                          updateFavRequest.onerror = () => console.log('Error updating favorites counter!');
                        };
                        
                        profileGetReq.onerror = () => console.log('Error getting profile');
                      }
                    }
                    removeReq.onerror = () => console.log('Error removing the favorite');
                    result.continue();
                  } else {
                    result.continue();
                  }
                } else {                                                                    
                  console.log("No more entries!");
                }
              };
              cursor.onerror = function(event) {
                console.error("Cursor request failed:", event.target.error);
              };
            };
          };
          const throttledChecked = throttle(favInputCheckedFunc, 2000);
          const throttledNotChecked = throttle(favInputNotCheckedFunc, 2000);
  
          elm.onclick = function (e) {
            if (typeof username !== undefined) {
              if (e.currentTarget.querySelector('input[type="checkbox"]').checked === false) {
                throttledChecked(e.currentTarget.querySelector('input[type="checkbox"]'));
                e.currentTarget.querySelector('input[type="checkbox"]').checked = true;
              } else {
                throttledNotChecked(e.currentTarget.querySelector('input[type="checkbox"]'));
                e.currentTarget.querySelector('input[type="checkbox"]').checked = false;
              }
            } else {
              return;
            }
          };
        });
        // setting event listener on add to cart buttons
        carouselItems.querySelectorAll('.add-to-cart').forEach(button => {
          button.addEventListener('click', async function(e) {
            const id = Number(e.target.closest('[data-product-id]').dataset.productId);
            const currentTarget = e.currentTarget;
            let product;
            const productObject = () => {
              let db = null;
              const dbPromise = new Promise((resolve, reject) => {
                  const request = indexedDB.open('db', 1);
                  request.onsuccess = (event) => resolve(event.target.result);
                  request.onerror = (event) => reject(event.target.error);
              });
              return async function getProductItems(id) {
                try {
                  db = await dbPromise;
                  const productTX = db.transaction('products', 'readonly');
                  const productStore = productTX.objectStore('products');
                  const productRequest = productStore.get(id);
                  product = await new Promise((resolve, reject) => {
                      productRequest.onsuccess = (event) => resolve(event.target.result);
                      productRequest.onerror = (event) => reject(event.target.error);
                  });
                } catch (error) {
                  console.error('Error loading product:', error);
                }
              }
            }
            let loadProducts = productObject();
            await loadProducts(id);
            //
            const orderTime = Date.now();
            
            let materialSelectedValue, 
                fabricSelectedValue, 
                colorSelectedValue,
                considerMaterial = false,
                considerFabric = false,
                considerColor = false,
                selectedProductObj;
            if (currentTarget.parentElement.querySelector('fieldset.material-selection')) {
              materialSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.material-selection').dataset.selectedMaterialValue);
              considerMaterial = true;
            };
            if (currentTarget.parentElement.querySelector('fieldset.fabric-selection')) {
              fabricSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.fabric-selection').dataset.selectedFabricValue);
              considerFabric = true;
            };
            if (currentTarget.parentElement.querySelector('fieldset.color-selection')) {
              colorSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.color-selection').dataset.selectedColorValue);
              considerColor = true;
            };
            if (considerMaterial ||
                considerFabric ||
                considerColor) {
              if (Number.isNaN(materialSelectedValue) ||
                  Number.isNaN(fabricSelectedValue) ||
                  Number.isNaN(colorSelectedValue)) {
                notification(
                  "لطفا یکی از گزینه‌های مورد نیاز را انتخاب نمایید.", 
                  "&cross;;", 
                  "#fbff13ff", 
                  "#000", 
                  "#ff391fff", 
                  "check-necessary-fieldset-error-01", 
                  "notif-danger"
                );
                return;
              } else {
                selectedProductObj = {
                  id: Number(id),
                  material: (considerMaterial && !isNaN(materialSelectedValue)) ? materialSelectedValue : null,
                  fabric: (considerFabric && !isNaN(fabricSelectedValue)) ? fabricSelectedValue : null,
                  color: (considerColor && !isNaN(colorSelectedValue)) ? colorSelectedValue : null,
                  quantity: 1,
                  date: orderTime,
                  price: 0,
                  benefit: 0,
                };
              };
            };
            if (typeof username !== undefined) {
              // indexedDB database transactions 
              let db;
              let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
              // Check if product already in cart
              function makeTX(storeName, mode) {
                let tx = db.transaction(storeName, mode);
                tx.onerror = (err) => {
                  console.warn(err);
                };
                return tx;
              }
              dbOpenRequest.addEventListener('success', (e) => {
                db = e.target.result;
                console.log('success opening db.');
                let cartTX = makeTX('cart', 'readwrite');
                cartTX.oncomplete = () => {
                  console.log('User cart exists.');
                };
                cartTX.onerror = (err) => {
                  console.warn(err);
                };
                let cartStore = cartTX.objectStore('cart');
                let cartRequest = cartStore.count();
                cartRequest.onsuccess = function(event) {
                  if (event.target.result === 0) {
                    let req = cartStore.add(selectedProductObj);
                    req.onsuccess = (ev) => {
                      console.log('New product added to cart.');
                    };
                    req.onerror = (err) => {
                      console.warn(err);
                    };
                  } else {
                    let cursorRequest = cartStore.openCursor();
                    cursorRequest.onsuccess = (event) => {
                      const result = event.target.result;
                      if (result) {
                        if (
                          result.value.id === selectedProductObj.id &&
                          result.value.material === selectedProductObj.material &&
                          result.value.fabric === selectedProductObj.fabric &&
                          result.value.color === selectedProductObj.color
                          ) {
                          let quantityAddedProduct = result.value;
                          let cartQuantity = result.value.quantity;
                          if (cartQuantity >= product.quantity) {
                            quantityAddedProduct.quantity = product.quantity;
                            notification(
                                "شما در حال حاضر تمام موجودی انبار این محصول را در سبد خرید خود دارید.",
                                "",
                                "#ff3713",
                                "#fff",
                                "#030000",
                                "out-of-stock-01",
                                "notif-danger"
                            );
                            return;
                          } else if (cartQuantity < product.quantity) {
                            quantityAddedProduct.quantity = cartQuantity + 1;
                          }
                          let req = cartStore.put(quantityAddedProduct);
                          req.onsuccess = (ev) => {
                            console.log('Another number of the Product added to cart.');
  
                          };
                          req.onerror = (err) => {
                            console.warn(err);
                          };
                        } else {
                          result.continue();
                        };
                      } else {
                        let req = cartStore.add(selectedProductObj);
                        req.onsuccess = (ev) => {
                          console.log('New product added to cart.');
                        };
                        req.onerror = (err) => {
                          console.warn(err);
                        };
                      };
                    };
                    cursorRequest.onerror = (err) => {
                      console.warn(err);
                    };
                  };
                };
              });
            };
            cart();
          });
        });
        // setting functionality of sold out products
        carouselItems.querySelectorAll('.sold-out').forEach(button => {
          button.addEventListener('click', function(e) {
            window.location.href = window.location.origin + "/contactus.html";
          })
        });
        // reset button functionality
        carouselItems.querySelectorAll('.post-act-contents > .reset-btn').forEach( button => {
          button.addEventListener('click', function (e) {
            e.currentTarget.nextElementSibling.nextElementSibling.reset();
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.material-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.material-selection').removeAttribute('data-selected-material-value');
            }
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.fabric-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.fabric-selection').removeAttribute('data-selected-fabric-value');
            }
            if (e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.color-selection')) {
              e.currentTarget.nextElementSibling.nextElementSibling.querySelector('fieldset.color-selection').removeAttribute('data-selected-color-value');
            }
          });
        });
        // separate numbers by three
        const orderPrice = document.querySelector(".new-items").querySelectorAll(".order-price");
        for (let i of orderPrice) {
            i.textContent =
              parseInt(i.textContent
                .replace(/[^\d]+/gi, ''))
                  .toLocaleString('fa-IR')
                    .replace(/[٬]/gi, ',')
        };
        return `Render Operation Processed: ${productsToRender}`;
      };
      
      try {
        renderer(products);
        carouselFunc('new-items-container');
      } catch (e) {
        throw e;
      }
    };
  
    renderProducts(specialProducts);
    
  });
});

// slideshow initialization
document.addEventListener('DOMContentLoaded', () => {
  // throttle
  const throttle = function (mainFunction, delay) {
    let timerFlag = null;               
    return (...args) => {               
      if (timerFlag === null) {         
        mainFunction(...args);          
        timerFlag = setTimeout(() => {  
          timerFlag = null;             
        }, delay);
      }
    };
  };
  
  let slideIndex = 1;
  
  const showSlides = function(n) {
    let i;
    let slides = document.getElementsByClassName("slides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      let element = slides[i];
      element.querySelector('img').style.animation = "zoomOut 0.55s";
      setTimeout(() => {
          element.style.display = "none";
        }, 540);
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    setTimeout(() => {
        slides[slideIndex-1].querySelector('img').style.animation = "";
        slides[slideIndex-1].querySelector('img').style.animation = "flipInX 0.8s";
        slides[slideIndex-1].style.display = "grid";
      }, 540);
    dots[slideIndex-1].className += " active";
  }
  
  showSlides(slideIndex);

  let slideShowAuto = setInterval(() => {
     slideIndex++;
     showSlides(slideIndex);
    }, 4000);
  
  // Next/previous controls
  const plusSlides = function(n) {
    clearInterval(slideShowAuto);
    showSlides(slideIndex += n);
    slideShowAuto = setInterval(() => {
     slideIndex++;
     showSlides(slideIndex);
    }, 4000);
  };
  
  // Indicators controls
  const currentSlide = function(n) {
    clearInterval(slideShowAuto);
    showSlides(slideIndex = n);
    slideShowAuto = setInterval(() => {
     slideIndex++;
     showSlides(slideIndex);
    }, 4000);
  };

  const throttledPlusSlides = throttle(plusSlides, 2000);
  const throttledCurrentSlide = throttle(currentSlide, 2000);

  document.getElementById('dot1').addEventListener('click', () => { throttledCurrentSlide(1) });
  document.getElementById('dot2').addEventListener('click', () => { throttledCurrentSlide(2) });
  document.getElementById('dot3').addEventListener('click', () => { throttledCurrentSlide(3) });
  document.getElementById('dot4').addEventListener('click', () => { throttledCurrentSlide(4) });
  document.querySelector('.prev').addEventListener('click', () => { throttledPlusSlides(-1) });
  document.querySelector('.next').addEventListener('click', () => { throttledPlusSlides(1) });
});