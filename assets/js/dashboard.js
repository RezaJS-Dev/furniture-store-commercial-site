
// authentication of user
window.addEventListener('load', () => {
  if ((sessionStorage.getItem('authenticated') === null)  &&
      (localStorage.getItem('authenticated') === null)
  ) {
    // unauthenticated user
    // Redirect
    setTimeout(() => {
      window.location.href = "signup.html";
    }, 4100);
  }
});

// load the database.json
const pageLoad = new Promise((resolve, reject) => {
  import('./database.json', {with: { type: 'json' }})
    .then(({ default: databaseObject }) => {
        // data = databaseObject;
        resolve(databaseObject);
    });
});

// To save the database into indexedDB storage
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

let db;
function makeTX(storeName, mode) {
  let tx = db.transaction(storeName, mode);
  tx.onerror = (err) => {
    console.warn(err);
  };
  return tx;
}

/* tab num 1 <!-- داشبورد --> */

const createDashboardLog = async function() {
  const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // let contractDate = (i.contractDate !== null && i.contractDate !== undefined) ? dateFormatter.format(new Date(i.contractDate)) : null;
  const userName = document.querySelector('.user-name > span');
  const userNameLog = document.querySelector('.user-name-log');
  const userId = document.querySelector('.user-id');
  const registrationDate = document.getElementById('registration-date');
  const lastBuy = document.getElementById('last-buy');
  const ordersSummaryNum = document.getElementById('orders-summary-num');
  const favoriteSummaryNum = document.getElementById('favorite-summary-num');
  const creditSummaryNum = document.getElementById('credit-summary-num');
  const dateTime = document.querySelector('.date-time');
  // wallet balance in tab 6 
  const walletSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.wallet");
  let dateTimeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const dbPromise = new Promise((resolve, reject) => {
    let userProfile = [];
    let dbOpenRequest = window.indexedDB.open(`${username}`,1);
    dbOpenRequest.addEventListener('success', async (e) => {
      db = e.target.result;
      console.log('success opening db.');
      let profileTX = makeTX(['profile', 'creditBalance'], 'readonly');
      profileTX.oncomplete = () => console.log('done');
      profileTX.onerror = (err) => console.warn(err);
      // get profile data
      let profileStore = profileTX.objectStore('profile');
      let profileRequest = await profileStore.get(1);
      profileRequest.onsuccess = (ev) => userProfile.push(ev.target.result);
      profileRequest.onerror = (err) => console.warn(err);
      // get credit data
      let creditBalanceStore = profileTX.objectStore('creditBalance');
      let creditBalanceRequest = await creditBalanceStore.get(1);
      creditBalanceRequest.onsuccess = (ev) => {
        userProfile.push(ev.target.result);
        resolve(userProfile);
      };
      creditBalanceRequest.onerror = (err) => console.warn(err);
    });
  });

  dbPromise.then( (userProfile) => {
    userName.textContent = userProfile[0].name;
    userNameLog.textContent = userProfile[0].name;
    userId.textContent = (userProfile[0].email) ? userProfile[0].email : userProfile[0].phone;
    registrationDate.textContent = (userProfile[0].registrationDate) ? dateFormatter.format(new Date(userProfile[0].registrationDate)) : "-";
    lastBuy.innerHTML = (userProfile[0].lastBuyDate !== null && userProfile[0].lastBuyDate !== undefined) ? dateFormatter.format(new Date(userProfile[0].lastBuyDate)) : "<span style='font-size: 12px;' title='شما خريدی نداشتيد'>-</span>";
    ordersSummaryNum.innerText = userProfile[0].ordersCountLength.toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    favoriteSummaryNum.innerText = userProfile[0].favoritesCount.toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    creditSummaryNum.innerText = (userProfile[1]) ? userProfile[1].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    walletSumEl.textContent = (userProfile[1]) ? userProfile[1].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    dateTime.innerText = dateTimeFormatter.format(new Date());
  });
};

/* tab num 2 <!-- سفارش های من --> */

const createOrderLog = async function() {
  // Check if order is been completed 
  const completedOrdersDeadline = new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let ordersTX = db.transaction(['orderCompleted','orderOnProgress'], 'readwrite');
        ordersTX.onerror = (err) => console.warn(err);
        let orderOnProgressStore = ordersTX.objectStore('orderOnProgress');
        let orderOnProgressRequest = orderOnProgressStore.openCursor();
        orderOnProgressRequest.onerror = (err) => console.warn(err);
        orderOnProgressRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve();
          } else {
            const completedOrder = (event.target.result.value.transportDate > new Date()) 
              ? undefined
              : event.target.result.value;
            if (typeof completedOrder === 'undefined') {
              cursor.continue();
            } else {
              let deleteOrderFromStore = orderOnProgressStore.delete(completedOrder.orderId);
              let orderCompletedStore = ordersTX.objectStore('orderCompleted');
              let orderCompletedRequest = orderCompletedStore.add(completedOrder);
              orderCompletedRequest.onerror = (err) => console.warn(err);
              orderCompletedRequest.onsuccess = (event) => console.log(`Your order (${completedOrder.orderId}) is delivering now.`);
            }
          }
        };
      } catch (error) {
        reject(error);
      }
    });
    dbOpenRequest.addEventListener('error', (e) => {
      reject(e.target.error);
    });
  });

  try {
    // Get orders data
    const orderArr = await new Promise((resolve, reject) => {
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          console.log('success opening db.');
          function makeTX(storeName, mode) {
            let tx = db.transaction(storeName, mode);
            tx.onerror = (err) => {
              console.warn(err);
            };
            return tx;
          }
          let orderTX = makeTX(['orderCompleted', 'orderOnProgress', 'orderCanceled'], 'readonly');
          
          const [orderCompleted, orderOnProgress, orderCanceled] = await Promise.all([
            getAllFromStore(orderTX, 'orderCompleted'),
            getAllFromStore(orderTX, 'orderOnProgress'),
            getAllFromStore(orderTX, 'orderCanceled')
          ]);
          
          resolve([orderCompleted, orderOnProgress, orderCanceled]);
          
        } catch (error) {
          reject(error);
        }
      });
      
      dbOpenRequest.addEventListener('error', (e) => {
        reject(e.target.error);
      });
    });

    const [orderCompleted, orderOnProgress, orderCanceled] = orderArr;
    
    // Process each order type sequentially if any of them exist
    if (orderCompleted && orderCompleted.length > 0) {
      await processOrders(orderCompleted.reverse(), 'orders-pane-1', 'transportDate');
    }
    
    if (orderOnProgress && orderOnProgress.length > 0) {
      await processOrders(orderOnProgress.reverse(), 'orders-pane-2', 'contractDate');
    }
    
    if (orderCanceled && orderCanceled.length > 0) {
      await processOrders(orderCanceled.reverse(), 'orders-pane-3', 'contractDate');
    }
    
  } catch (error) {
    console.error('Error in createOrderLog:', error);
  } finally {
    // This will now execute AFTER all processing is done
    processFinalTasks();
  }
};

// Helper function to get all orders data from a store
function getAllFromStore(transaction, storeName) {
  return new Promise((resolve, reject) => {
    const store = transaction.objectStore(storeName);
    let indexObject = store.index("contractDateIDX");
    const request = indexObject.getAll();
    
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Helper function to get product data
async function getProductData(productId) {
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open('db', 1);
    
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let productTX = db.transaction(['products'], 'readonly');
        productTX.onerror = (err) => console.warn(err);
        let productStore = productTX.objectStore('products');
        let productRequest = productStore.get(productId);
        
        productRequest.onsuccess = (ev) => resolve(ev.target.result);
        productRequest.onerror = (ev) => reject(ev.target.error);
        
      } catch (error) {
        reject(error);
      }
    });
    
    dbOpenRequest.addEventListener('error', (e) => {
      reject(e.target.error);
    });
  });
}

// Process orders for a specific pane
async function processOrders(orders, paneId, dateField) {
  const orderPane = document.getElementById(paneId);
  orderPane.innerHTML = '';
  
  // Process all orders in parallel - output: Array [Promises (fulfilled with object {an item of 'orders' array, a product from db})...]
  const orderPromises = orders.map(async (orderItem) => {
    try {
      const product = await getProductData(orderItem.id);
      return { orderItem, product };
    } catch (error) {
      console.error(`Error fetching product ${orderItem.id}:`, error);
      return null;
    }
  });
  // output: Array [{an item of 'orders' array, a product from db}...]
  const orderResults = await Promise.all(orderPromises);
  
  // Create DOM elements for successful results
  orderResults.forEach(result => {
    if (result) {
      const { orderItem, product } = result;
      const orderElement = createOrderElement(orderItem, product, dateField, paneId);
      orderPane.appendChild(orderElement);
    }
  });
}

// Create order element (similar to your inner HTML creation)
function createOrderElement(orderItem, product, dateField, paneId) {
  // order element creation logic
  let productItem = orderItem;
  let productBase = product;
  let productBaseName = productBase.name;
  let productName = productItem.exactProductName;
  let productDetails = productBase.productDetails;
  let imgSrc = `./assets/images/p/${productBase.image}`;
  let receivedAddress = productItem.deliveryAddress;
  let serial = productItem.serial;
  let price = productItem.price;

  const statusEl = document.createElement('div');
  statusEl.className = "order-status";
  
  // Format dates
  const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const contractDate = orderItem.contractDate ? dateFormatter.format(new Date(orderItem.contractDate)) : null;
  const prepareDate = orderItem.prepareDate ? dateFormatter.format(new Date(orderItem.prepareDate)) : null;
  const transportDate = orderItem.transportDate ? dateFormatter.format(new Date(orderItem.transportDate)) : null;
  
  // Set the appropriate date based on the dateField parameter
  // 'transportDate' for orderCompleted
  // 'contractDate'  for orderOnProgress & orderCanceled
  const displayDate = dateField === 'transportDate' ? transportDate : contractDate;
  switch (paneId) {
    case 'orders-pane-1':
      statusEl.innerHTML = `
        <div class="order-status-inner rounded-6 box-shadow-tip" data-product-id="${productBase.id}" data-order-id="${orderItem.orderId}">
          <div class="product-title mui--divider-bottom">
            <div class="">
                <img alt="#" src="${imgSrc}" class="product-title-img image rounded-6">
            </div>
            <div>
                <p class="order-product" title="${productName}"><a href="/product.html?productID=${productBase.id}" class="">${productName}</a></p>
                <p class="order-address">${receivedAddress}</p>
                <p class="order-serial">شماره سفارش 
                  <strong>#${serial}</strong>
                </p>
            </div>
            <div class="">
              <p class="rounded-6" data-order-state=""></p>
              <time class="order-date"><i class="las la-clock"></i>${transportDate}</time>
              <div class="order-invoice">
                <div class="">
                  <span>
                    مبلغ فاكتور : 
                    <strong class="order-price">${price}</strong>
                    تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-end">
            <p class="">
              <a class="product-detail-modal" href="javascript:void(0);">جزئيات بيشتر</a>
            </p>
            <div>
              <a href="contactus.html" class="btn help rounded-6">مشاوره</a>
              <a href="checkout.html" class="btn action re-order rounded-6"></a>
            </div>
          </div>
        </div>`;
    break;
    case 'orders-pane-2':
      statusEl.innerHTML = `
        <div class="order-status-inner rounded-6 box-shadow-tip" data-order-id="${orderItem.orderId}">
          <div class="product-title mui--divider-bottom">
            <div class="">
                <img alt="#" src="${imgSrc}" class="product-title-img image rounded-6">
            </div>
            <div>
                <p class="order-product" title="${productName}"><a href="/product.html?productID=${productBase.id}" class="">${productName}</a></p>
                <p class="order-address">${receivedAddress}</p>
                <p class="order-serial">شماره سفارش 
                  <strong>#${serial}</strong>
                </p>
            </div>
            <div class="">
              <p class="rounded-6" data-order-state="${(orderItem.prepareDate > new Date()) ? "" : "آماده بارگیری"}"></p>
              <time class="order-date"><i class="las la-clock"></i>${contractDate}</time>
              <div class="order-invoice">
                <div class="">
                  <span>
                    مبلغ فاكتور : 
                    <strong class="order-price">${price}</strong>
                    تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-end">
            <p class="">
              <a class="product-detail-modal" href="javascript:void(0);">جزئيات بيشتر</a>
            </p>
            <div>
              <a href="contactus.html" class="btn help rounded-6">مشاوره</a>
              <a class="cancel-order btn rounded-6" >لغو سفارش</a>
            </div>
          </div>
        </div>`;
    break;
    case 'orders-pane-3':
      statusEl.innerHTML = `
        <div class="order-status-inner rounded-6 box-shadow-tip" data-product-id="${productBase.id}" data-order-id="${orderItem.orderId}">
          <div class="product-title mui--divider-bottom">
            <div class="">
                <img alt="#" src="${imgSrc}" class="product-title-img image rounded-6">
            </div>
            <div>
                <p class="order-product" title="${productName}"><a href="/product.html?productID=${productBase.id}" class="">${productName}</a></p>
                <p class="order-address">${receivedAddress}</p>
                <p class="order-serial">شماره سفارش 
                  <strong>#${serial}</strong>
                </p>
            </div>
            <div class="">
              <p class="rounded-6" data-order-state=""></p>
              <time class="order-date"><i class="las la-clock"></i>${contractDate}</time>
              <div class="order-invoice">
                <div class="">
                  <span>
                    مبلغ فاكتور : 
                    <strong class="order-price">${price}</strong>
                    تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-end">
            <p class="">
              <a class="product-detail-modal" href="javascript:void(0);">جزئيات بيشتر</a>
            </p>
            <div>
              <a href="contactus.html" class="btn help rounded-6">مشاوره</a>
              <a href="javascript:void(0);" class="btn action canceled rounded-6"></a>
            </div>
          </div>
        </div>`;
    break;
  }
  
  return statusEl;
}

// Final tasks that should run after everything
function processFinalTasks() {
  // Handle image errors
  const productImg = document.querySelectorAll(".product-title-img");
  productImg.forEach((item) => {
    item.onerror = () => {
      item.src = "./assets/images/nosourcethumb.jpg";
    };
  });
  
  // Format prices
  const orderPrice = document.querySelectorAll(".order-price");
  orderPrice.forEach((item) => {
    item.textContent = parseInt(item.textContent.replace(/[^\d]+/gi, ''))
      .toLocaleString('fa-IR')
      .replace(/[٬]/gi, ',');
  });

  // Cancelling orders Functionality
  document.querySelectorAll('.cancel-order').forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      const orderElement = e.target.closest('[data-order-id]');
      const orderId = orderElement.dataset.orderId;
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          let ordersTX = db.transaction(['orderCanceled','orderOnProgress'], 'readwrite');
          ordersTX.onerror = (err) => console.warn(err);
          let orderOnProgressStore = ordersTX.objectStore('orderOnProgress');
          let orderOnProgressRequest = orderOnProgressStore.get(orderId);
          orderOnProgressRequest.onerror = (err) => console.warn(err);
          orderOnProgressRequest.onsuccess = (event) => {
            const orderToBeCanceled = event.target.result;
            if (orderToBeCanceled.prepareDate < new Date()) {
              notification(
                "در این مرحله امکان لغو سفارش وجود ندارد.",
                "&cross;",
                "#fbff13",
                "#000000",
                "#ff391f",
                "unable-to-cancel-order-01",
                "notif-warning"
              );
              return;
            }
            orderElement.remove();
            let deleteOrderFromStore = orderOnProgressStore.delete(orderId);
            let orderCanceledStore = ordersTX.objectStore('orderCanceled');
            let orderCanceledRequest = orderCanceledStore.add(orderToBeCanceled);
            orderCanceledRequest.onerror = (err) => console.warn(err);
            orderCanceledRequest.onsuccess = async (event) => {
              console.log(`Your order (${orderToBeCanceled.orderId}) has been canceled.`);  //price
              createOrderLog();
              const currentBalance = await getUserBalance();
              const transactionID = Date.now();
              const transaction = {
                type: "deposit",
                amount: Number(orderToBeCanceled.price),
                description: `بازگشت اعتبار به علت لغو سفارش - شماره سریال فاکتور ${orderToBeCanceled.serial}#`,
                status: "completed",
                date: transactionID,
                reference_id: `ref${transactionID}`,
                payment_method: "online",
                balance_after: Number(currentBalance) + Number(orderToBeCanceled.price),
              };
              
              // setting new deposit transaction into transactions object store
              const transactionSet = setUserTransaction(transaction);
                // changing transaction state to complete and update the user's creditBalance value
                transactionSet.then(() => {
                    console.log('transaction completed!');
                    setUserBalance(transaction['balance_after']);
                    notification(
                      "عملیات با موفقیت انجام شد! لطفا موجودی کیف پول خود را بررسی کنید.", 
                      "&check;", 
                      "#3fdb20", 
                      "#000", 
                      "#0056f7ff", 
                      "check-01", 
                      "notif-success"
                    );
                });
              
              function setUserBalance(bal) {
                return new Promise((resolve, reject) => {
                  let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
                  dbOpenRequest.addEventListener('success', async (e) => {
                    try {
                      const db = e.target.result;
                      let creditBalanceTX = db.transaction(['creditBalance'], 'readwrite');
                      creditBalanceTX.onerror = (err) => console.warn(err);
                      let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
                      let creditBalanceRequest = creditBalanceStore.put(bal, 1);
                      creditBalanceRequest.onsuccess = (ev) => {
                        console.log('Credit balance updated!');
                        const walletSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.wallet");
                        walletSumEl.textContent = (transaction['balance_after']) ? transaction['balance_after'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
                        walletSummaryUpdate();
                        createDashboardLog();
                        discardTransactionsTableFilter();
                        setTimeout(() => applyTransactionsTableFilter(), 1000);
                      }
                      creditBalanceRequest.onerror = (ev) => reject(ev.target.error);
                    } catch (error) {
                      reject(error);
                    }
                  });
                  dbOpenRequest.addEventListener('error', (e) => {
                    reject(e.target.error);
                  });
                });
              }
              
              function setUserTransaction(tr) {
                return new Promise((resolve, reject) => {
                  let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
                  dbOpenRequest.addEventListener('success', async (e) => {
                    try {
                      const db = e.target.result;
                      let transactionTX = db.transaction(['transactions'], 'readwrite');
                      transactionTX.onerror = (err) => console.warn(err);
                      let transactionStore = transactionTX.objectStore('transactions');
                      let transactionRequest = transactionStore.add(tr);
                      transactionRequest.onsuccess = (ev) => {
                        console.log('transaction completed!');
                        setUserBalance(transaction['balance_after']);
                        notification(
                          "عملیات با موفقیت انجام شد! لطفا موجودی کیف پول خود را بررسی کنید.", 
                          "&check;", 
                          "#3fdb20", 
                          "#000", 
                          "#0056f7ff", 
                          "check-01", 
                          "notif-success"
                        );
                        resolve(ev.target.result)
                      };
                      transactionRequest.onerror = (ev) => reject(ev.target.error);
                    } catch (error) {
                      reject(error);
                    }
                  });
                  dbOpenRequest.addEventListener('error', (e) => {
                    reject(e.target.error);
                  });
                });
              }

              // Getting user Balance from profile object store
              function getUserBalance() {
                return new Promise((resolve, reject) => {
                  let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
                  dbOpenRequest.addEventListener('success', async (e) => {
                    try {
                      const db = e.target.result;
                      let creditBalanceTX = db.transaction(['creditBalance'], 'readonly');
                      creditBalanceTX.onerror = (err) => console.warn(err);
                      let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
                      let creditBalanceRequest = creditBalanceStore.get(1);
                      creditBalanceRequest.onsuccess = (ev) => {
                        resolve(ev.target.result);
                      };
                      creditBalanceRequest.onerror = (ev) => reject(ev.target.error);
                    } catch (error) {
                      reject(error);
                    }
                  });
                  dbOpenRequest.addEventListener('error', (e) => {
                    reject(e.target.error);
                  });
                });
              }

              async function walletSummaryUpdate() {
                let transactions = await getUserTransactions();
                const deposits = transactions.filter((item) => item.type === "deposit" && item.status === "completed");
                const purchases = transactions.filter((item) => item.type === "purchase" && item.status === "completed");
                const depositsCount = deposits.reduce((total, item) => total + item.amount, 0);
                const purchasesCount = purchases.reduce((total, item) => total + item.amount, 0);
                const depositSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.deposit");
                const purchaseSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.purchase");
                const summaryTransaction = {
                  deposits: depositsCount,
                  purchases: purchasesCount,
                };
                depositSumEl.textContent = (summaryTransaction['deposits']) ? summaryTransaction['deposits'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
                purchaseSumEl.textContent = (summaryTransaction['purchases']) ? summaryTransaction['purchases'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
                return;
              }
            
              // Getting all transactions
              function getUserTransactions() {
                return new Promise((resolve, reject) => {
                  let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
                  dbOpenRequest.addEventListener('success', async (e) => {
                    try {
                      const db = e.target.result;
                      let transactionTX = db.transaction(['transactions'], 'readonly');
                      transactionTX.onerror = (err) => console.warn(err);
                      let transactionStore = transactionTX.objectStore('transactions');
                      let transactionRequest = transactionStore.getAll();
                      transactionRequest.onsuccess = (ev) => resolve(ev.target.result);
                      transactionRequest.onerror = (ev) => reject(ev.target.error);
                    } catch (error) {
                      reject(error);
                    }
                  });
                  dbOpenRequest.addEventListener('error', (e) => {
                    reject(e.target.error);
                  });
                });
              }
            };
          };
        } catch (error) {
          reject(error);
        }
      });
      dbOpenRequest.addEventListener('error', (e) => {
        reject(e.target.error);
      });
    }
  });

  // Reordering products functionality
  document.querySelectorAll('.re-order').forEach(button => {
    button.addEventListener('click', async function(e) {
        e.preventDefault();
        const id = Number(e.target.closest('[data-product-id]').dataset.productId);
        const orderId = e.target.closest('[data-order-id]').dataset.orderId;
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
              return new Promise((resolve, reject) => {
                  productRequest.onsuccess = (event) => resolve(event.target.result);
                  productRequest.onerror = (event) => reject(event.target.error);
              });
            } catch (error) {
              console.error('Error loading product:', error);
            }
          }
        };
        let loadProducts = productObject();
        // Retrieving product from database and set it to the variable
        product = await loadProducts(id);
        //
        let currentProduct;
        const currentProductObject = () => {
          let db = null;
          const dbPromise = new Promise((resolve, reject) => {
              const request = window.indexedDB.open(`${username}`, 1);
              request.onsuccess = (event) => resolve(event.target.result);
              request.onerror = (event) => reject(event.target.error);
          });
          return async function getProductItems(orderId) {
            try {
              db = await dbPromise;
              const productTX = db.transaction('orderCompleted', 'readonly');
              const productStore = productTX.objectStore('orderCompleted');
              const productRequest = productStore.get(orderId);
              currentProduct = await new Promise((resolve, reject) => {
                  productRequest.onsuccess = (event) => resolve(event.target.result);
                  productRequest.onerror = (event) => reject(event.target.error);
              });
            } catch (error) {
              console.error('Error loading product:', error);
            }
          }
        };
        let loadCurrentProduct = currentProductObject();
        await loadCurrentProduct(orderId);
        const orderTime = Date.now();
        let selectedProductObj = {
              id: Number(id),
              material: currentProduct.material,
              fabric: currentProduct.fabric,
              color: currentProduct.color,
              quantity: currentProduct.quantity,
              date: orderTime,
              price: 0,
              benefit: 0,
        };
        if (typeof username !== 'undefined') {
          // indexedDB User database transactions 
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
            let cartTX = makeTX('cart', 'readwrite');
            cartTX.oncomplete = () => console.log('User cart exists.');
            cartTX.onerror = (err) => console.warn(err);
            let cartStore = cartTX.objectStore('cart');
            let cartRequest = cartStore.count();
            cartRequest.onsuccess = function(event) {
              if (event.target.result === 0) {
                let req = cartStore.add(selectedProductObj);
                req.onsuccess = (ev) => console.log('New product added to cart.');
                req.onerror = (err) => console.warn(err);
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
                      req.onsuccess = (ev) => console.log('Another number of the Product added to cart.');
                      req.onerror = (err) => console.warn(err);
                    } else {
                      result.continue();
                    };
                  } else {
                    let req = cartStore.add(selectedProductObj);
                    req.onsuccess = (ev) => console.log('New product added to cart.');
                    req.onerror = (err) => console.warn(err);
                  };
                };
                cursorRequest.onerror = (err) => console.warn(err);
              };
            };
          });
        };
        cart();
        cartChannel.postMessage("cart-updated");
    });
  });
}

/* tab num 3 <!-- لیست علاقه مندی ها --> */

const renderFavoriteProducts = async function () {
  if (typeof username === 'undefined' || username === 'notRegisteredUser') return;

  // transaction to database - to get user favorites
  async function favGetter() {
    return new Promise((resolve, reject) => {
      const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
      dbCurrentUserOpenRequest.onsuccess = (e) => {
        const db = e.target.result; // Declare inside callback
        const transaction = db.transaction(['favorite'], 'readonly');
        const store = transaction.objectStore('favorite');
        const getRequest = store.getAll();
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          resolve(data);
        };
        getRequest.onerror = () => reject('Error fetching favorites');
      };
    });
  }

  let userFavProductsArr = [];
  if (username) {
    const userFavIDArr = await favGetter();
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
          return await new Promise((resolve, reject) => {
            productRequest.onsuccess = (event) => {
              userFavProductsArr.push(event.target.result);
              resolve(event.target.result);
            };
            productRequest.onerror = (event) => reject(event.target.error);
          });
        } catch (error) {
          console.error('Error loading product:', error);
        }
      }
    };
    let loadProducts = productObject();
    const productPromises = userFavIDArr.map((item) => loadProducts(item));
    await Promise.all(productPromises);
  };

  // renderer function
  const renderer = function(productsToRender) {
    const productsDiv = document.querySelector("div.item-wrapper > .item-list");
    {
      if (productsToRender.length == 0) {
        const noProductEl = document.createElement('p');
        noProductEl.className = "empty";
        noProductEl.innerHTML = `تا کنون کالایی ذخیره نشده است.`;
        const anyPElExists = productsDiv.parentElement.querySelector('p.empty');
        if (anyPElExists === null) productsDiv.parentElement.appendChild(noProductEl);
      } else {
        productsDiv.innerHTML = "";
        for (let p of productsToRender) {
            // p is a product object
            const pId = p.id;
            const pProId = p.proId;
            const pName = toPersianNumbers(p.name);
            const pPrice = p.price;
            const pDescription = p.description;
            const pProductDetails = p.productDetails;
            const pImage = p.image;
            const pCategoriesId = p.categoriesId;
            const pInStock = p.inStock;
            const pColorId = p.colorId;
            const pFabricId = p.fabricId;
            const pDiscount = p.discount;
            // const pQuantity = p.quantity;
        
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
              if (!pDiscount) return `
                <span class="price-gross hidden-unit" tabindex="-1">
                  <strong class="" tabindex="-1"> </strong>
                </span>
              `;
              return `
                <span class="price-gross" tabindex="-1">
                  <strong class="order-price" tabindex="-1">${pPrice}</strong>
                </span>`;
            })();

            let orderBtn = (function () {
              if (pInStock === 0) return `<button class="sold-out" tabindex="-1">سفارش تولید</button>`;
              return '<button class="add-to-cart" tabindex="-1"></button>';
            })();
        
            const productEl = document.createElement('div');
            productEl.className = "c-item rounded-6";
            productEl.setAttribute('data-product-id', `${pId}`)
            productEl.innerHTML = `
              <div class="image-product" tabindex="-1">
                <img src="assets/images/p/${pImage}" alt="${pName} ${pProId} ${pId}" tabindex="-1">
                <div class="trash-fav" tabindex="-1">
                  <input type="button" tabindex="-1">
                  <i class="las la-trash" tabindex="-1"></i>
                </div>
                <div class="favorites-tooltip rounded-4" tabindex="-1">
                  <span tabindex="-1">حذف از علاقه‌مندی</span>
                </div>
                ${tagText}
              </div>
              <div class="product-action" tabindex="-1">
                <div class="pre-act" tabindex="-1">
                  <div class="p-details" tabindex="-1">
                    <p class="p-name" tabindex="-1">${pName}</p>
                  
                  </div>
                  <div class="p-price" tabindex="-1">
                    ${grossPriceContent}
                    <span class="price-net" tabindex="-1">
                      <strong class="order-price" tabindex="-1">${p.discountedPrice.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div class="cart-btn" tabindex="-1">
                    <button class="order-details rounded-4" onclick="this.parentElement.parentElement.nextElementSibling.style.transform='scaleY(1)';" tabindex="-1">
                      جزييات سفارش
                    </button>
                    <a class="show-product" href="" tabindex="-1">
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
            productsDiv.appendChild(productEl);
        };
      };
    }
    // go to product page by clicking on product image
    productsDiv.querySelectorAll('.image-product img').forEach(elm => {
      elm.addEventListener('click', (e) => {
        e.preventDefault();
        const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
        redirectToProduct(ProductId);
      });
    });
    // go to product page by clicking on product name
    productsDiv.querySelectorAll('.product-action .p-name').forEach(elm => {
      elm.addEventListener('click', (e) => {
        e.preventDefault();
        const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
        redirectToProduct(ProductId);
      });
    });
    // go to product page by clicking on show-product button
    productsDiv.querySelectorAll('a.show-product').forEach(elm => {
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
    productsDiv.querySelectorAll('fieldset.material-selection').forEach(elm => {
      elm.onchange = function (e) {
        e.currentTarget.setAttribute('data-selected-material-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
      };
    });
    productsDiv.querySelectorAll('fieldset.fabric-selection').forEach(elm => {
      elm.onchange = function (e) {
        e.currentTarget.setAttribute('data-selected-fabric-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
      };
    });
    productsDiv.querySelectorAll('fieldset.color-selection').forEach(elm => {
      elm.onchange = function (e) {
        e.currentTarget.setAttribute('data-selected-color-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
      };
    });
    // favorite remover button functionality
    productsDiv.querySelectorAll('.trash-fav input[type="button"]').forEach(elm => {
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
                    const updateTransaction = db.transaction(['profile'], 'readwrite');
                    const profileStore = updateTransaction.objectStore('profile');
                    const profileGetReq = profileStore.get(1);
                    
                    profileGetReq.onsuccess = (e) => {
                      const profile = e.target.result;
                      profile.favoritesCount = quantityOfFavs;
                      const updateFavRequest = profileStore.put(profile, 1);
                      updateFavRequest.onsuccess = () => {
                        console.log('Favorites counter updated');
                        renderFavoriteProducts()
                      }
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

      elm.onclick = function (e) {
        if (username) {
          favInputNotCheckedFunc(e.currentTarget);
          e.target.closest('div[data-product-id]').remove();
        }
      };
    });
    // setting event listener on add to cart buttons
    productsDiv.querySelectorAll('.add-to-cart').forEach(button => {
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
        console.log(materialSelectedValue, fabricSelectedValue, colorSelectedValue);
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
        if (username) {
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
        cartChannel.postMessage("cart-updated");
      });
    });
    // setting functionality of sold out products
    productsDiv.querySelectorAll('.sold-out').forEach(button => {
      button.addEventListener('click', function(e) {
        window.location.href = "contactus.html";
      })
    });
    // reset button functionality
    productsDiv.querySelectorAll('.post-act-contents > .reset-btn').forEach( button => {
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
    // const orderPrice = productsDiv.querySelectorAll(".order-price");
    // for (let i of orderPrice) {
    //     i.textContent =
    //       parseInt(i.textContent
    //         .replace(/[^\d]+/gi, ''))
    //           .toLocaleString('fa-IR')
    //             .replace(/[٬]/gi, ',')
    // };
    return `Render Operation Processed: ${productsToRender}`;
  };
  
  renderer(userFavProductsArr);
  
};

/* tab num 4 <!-- آدرس های من --> */

// Modal by MUI - Address

const addressAddBtn = document.getElementById('address-add');
const editAddress = function (event, editing = undefined) {
  const isEditing = editing;
  const activateAddressAddOverlay = function (event) {
    event.preventDefault();
    const htmlHost = document.querySelector('html');
    const bodyHost = document.querySelector('body');
    const scrollbarWidth = window.innerWidth - htmlHost.clientWidth;
    htmlHost.style.overflowY = 'hidden';
    let changedAppliedOnMedia = false;
    let editingAddress = false;
    if (matchMedia("(width >= 768px)").matches) {
      navbarEl.shadowRoot.getElementById('stickyNavbar').style.paddingRight = `${scrollbarWidth}px`;
      htmlHost.style.paddingRight = `${scrollbarWidth}px`;
      changedAppliedOnMedia = true;
    }
    if (typeof isEditing !== "undefined" && typeof isEditing === "object") {
      editingAddress = isEditing;
    }
    bodyHost.style.overflowY = 'hidden';
    // set overlay options
    const options = {
      'keyboard': true,         // teardown when <esc> key is pressed (default: true)
      'static': true,           // Prevents closing on click (default: false)
      'onclose': function() {   // execute function when overlay is closed 
        htmlHost.style.overflowY = '';
        bodyHost.style.overflowY = '';
        if (matchMedia("(width >= 768px)").matches && changedAppliedOnMedia) {
          navbarEl.shadowRoot.getElementById('stickyNavbar').style.paddingRight = '';
          htmlHost.style.paddingRight = '';
        }
      }
    };
    const modalEl = document.createElement('div');
    modalEl.className = 'address-modal';
    modalEl.innerHTML = `
      <div class="address-form-modal">
        <div class="address-content-wrapper">
          <div class="address-contents">
            <div class="address-form-header">
              <p class="address-title">انتخاب موقعیت مکانی</p>
              <a href="javascript:void(0)" 
                 class="close" 
                 onclick='(function(){
                   let test = ${changedAppliedOnMedia};
                   if (test) {
                     document.querySelector(".address-content-wrapper").style.animation="fade-out-modal 0.305s cubic-bezier(0.45, 0.4, 0.32, 0.95)";
                     setTimeout(() => {mui.overlay("off")}, 300);
                     return;
                   }
                   mui.overlay("off");
                 })();'>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128;" xml:space="preserve">
                  <g><path d="M101.682,32.206L69.887,64l31.795,31.794l-5.887,5.888L64,69.888l-31.794,31.794l-5.888-5.888L58.112,64 L26.318,32.206l5.888-5.888L64,58.112l31.794-31.794L101.682,32.206z"></path></g>
                </svg>
              </a>
            </div>
            <div class="address-form-content">
              <iframe src="assets/iframe/address.html" 
                      title="Embedded HTML" 
                      width="100%" 
                      height="100%">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    `;
    const sendingToIframe = [changedAppliedOnMedia, editingAddress];
    // Form submitters
    modalEl.querySelector('iframe').addEventListener('load', (event) => {
      event.currentTarget.contentWindow.postMessage(
        sendingToIframe,          
        '*'                            
      );
    });
    const overlayEl = mui.overlay('on', options, modalEl);
    bodyHost.classList.remove('mui-scroll-lock');
  }
  return activateAddressAddOverlay(event);
};

addressAddBtn.addEventListener('click', editAddress);

// event listener for address object coming from address modal

window.addEventListener('message', (event) => {
  // if (event.origin !== 'http://127.0.0.1:5500') return;
  const dataReceived = event.data;
  let addressObject = {
    state: "",
    city: "",
    exact: "",
    plaque: "",
    door: "",
    postal: "",
    type: "",
    date: 0,
    latitude: 0,
    longitude: 0,
    default: false,
  };
  for (let i of dataReceived) {
    Object.defineProperty(addressObject, i.name, {value: i.value});
  };
  addUserAddress(username, addressObject)
    .then(() => console.log('New User Address Added Successfully'))
    .catch(error => console.error(error));

  function addUserAddress(username, newAddressObject) {
    return new Promise((resolve, reject) => {
      const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
      dbCurrentUserOpenRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['address'], 'readwrite');
        const store = transaction.objectStore('address');
        let countRequest = store.count();
        countRequest.onsuccess = (ev) => {
          if (ev.target.result === 0) {
            addressObject.default = true;
            let addRequest = store.put(newAddressObject);
            addRequest.onsuccess = () => renderUserAddresses();
            addRequest.onerror = () => reject('Error adding new address');
          } else {
            let addRequest = store.put(newAddressObject);
            addRequest.onsuccess = () => renderUserAddresses();
            addRequest.onerror = () => reject('Error adding new address');
          }
        };
      };
    });
  }
});

const renderUserAddresses = async function () {
  // transaction to database - to get user Addresses
  async function addressGetter() {
    return new Promise((resolve, reject) => {
      const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
      dbCurrentUserOpenRequest.onsuccess = (e) => {
        const db = e.target.result; // Declare inside callback
        const transaction = db.transaction(['address'], 'readonly');
        const store = transaction.objectStore('address');
        const getRequest = store.getAll();
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          resolve(data);
        };
        getRequest.onerror = () => reject('Error fetching addresses');
      };
    });
  }

  function renderAddresses(addressesArr) {
    const addressContainer = document.querySelector('.address-box .address-container');
    if (addressesArr.length === 0) {
        addressContainer.innerHTML = `<p class="empty">تا کنون آدرسی ذخیره نشده است.</p>`;
    } else {
      addressContainer.innerHTML = "";
      addressesArr.forEach (function(address, index) {
        // address is an addressObject
        const {
          state = "",
          city = "",
          exact = "",
          plaque = "",
          door = "",
          postal = "",
          type = "",
          date = 0,
          latitude = 0,
          longitude = 0,
          default: isDefault,
        } = address;
        const addressEl = document.createElement('div');
        addressEl.className = "address-item";
        addressEl.setAttribute('data-address-date', `${date}`);
        let checkedAddressAsDefault = "";
        if (isDefault !== "false") {
          addressEl.setAttribute('data-default-address', `${isDefault}`);
          checkedAddressAsDefault = 'checked=""';
        }
        const radioBtnID = "customRadioInline" + index;
        addressEl.innerHTML = `
          <div class="address-form-check">
              <input type="radio" id="${radioBtnID}" name="customRadioInline" class="form-check-input" ${checkedAddressAsDefault}>
              <label class="form-check-label" for="${radioBtnID}"></label>
              <div>
                  <div class="content-control">
                      <div class="">
                          <h6 class="">${type} <span>(استان ${state} - ${city})</span></h6> 
                          <p class="badge">پیش فرض</p>
                          <a class="address-select" href="#">انتخاب</a>
                      </div>
                      <p class="">${exact}</p>
                  </div>
                  <a href="#" class="btn address-edit">ویرایش</a>
                  <a href="#" class="btn address-delete">حذف</a>
              </div>
          </div>
        `;
        addressContainer.appendChild(addressEl);
      });
    };
    // address remover
    addressContainer.querySelectorAll('a.address-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const existedHTMLEl = e.target.closest('[data-address-date]');
        const addressID = e.target.closest('[data-address-date]').dataset.addressDate;
        new Promise((resolve, reject) => {
          const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
          dbCurrentUserOpenRequest.onsuccess = (e) => {
            const db = e.target.result; // Declare inside callback
            const transaction = db.transaction(['address'], 'readwrite');
            const store = transaction.objectStore('address');
            const deleteRequest = store.delete(Number(addressID));
            deleteRequest.onsuccess = () => {
              existedHTMLEl.remove();
              renderUserAddresses();
            }
            deleteRequest.onerror = () => reject('Error deleting address');
          };
        });
      });
    });
    // default address selector
    addressContainer.querySelectorAll('a.address-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const addressID = e.target.closest('[data-address-date]').dataset.addressDate;
        new Promise((resolve, reject) => {
          const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
          dbCurrentUserOpenRequest.onsuccess = (e) => {
            const db = e.target.result; // Declare inside callback
            const transaction = db.transaction(['address'], 'readwrite');
            const store = transaction.objectStore('address');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = (event) => {
              const allAddresses = event.target.result;
              allAddresses.forEach(address => {
                const addressObj = address;
                address["default"] = "false";
              });
              let index = allAddresses.findIndex(item => Number(item.date) == Number(addressID));
              allAddresses[index]["default"] = true;
              const newTransaction = db.transaction(['address'], 'readwrite');
              const store = newTransaction.objectStore('address');
              const deleteAllRequest = store.clear();
              deleteAllRequest.onsuccess = async (e) => {
                const addressPromises = allAddresses.map(item => {
                  return new Promise((resolve, reject) => {
                    const anotherTransaction = db.transaction(['address'], 'readwrite');
                    const store = anotherTransaction.objectStore('address');
                    const request = store.add(item);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                  });
                });
                await Promise.all(addressPromises);
                renderUserAddresses();
              };
            };
            getAllRequest.onerror = () => reject('Error setting the default address');
          };
        });
      });
    });
    // edit existing address
    addressContainer.querySelectorAll('a.address-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const addressID = e.target.closest('[data-address-date]').dataset.addressDate;
        new Promise((resolve, reject) => {
          const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
          dbCurrentUserOpenRequest.onsuccess = (ev) => {
            const db = ev.target.result; // Declare inside callback
            const transaction = db.transaction(['address'], 'readonly');
            const store = transaction.objectStore('address');
            const getAllRequest = store.get(Number(addressID));
            getAllRequest.onsuccess = (event) => {
              const data = event.target.result;
              editAddress(e, data);
            };
          };
        });
      });
    });
  };

  const userAddresses = await addressGetter();
  renderAddresses(userAddresses);
};

/* tab num 5 <!-- نظرات من --> */

// تابع برای نمایش نظرات
async function renderReviews() {
    if (typeof username === 'undefined') return;
    const reviewsList = document.getElementById('reviewsList');
    const reviews = await getUserReviewData();
    const commentSummaryNum = document.getElementById('comment-summary-num');
    commentSummaryNum.innerText = toPersianNumbers(reviews.length);
    reviewsList.innerHTML = '';
    let currentReviews = [...reviews];
    currentReviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        if (typeof review.validUser !== 'undefined') reviewElement.setAttribute('data-site-user', review.validUser);
        const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const reviewFormattedDate = dateFormatter.format(new Date(review.date));
        reviewElement.innerHTML = `
            <div class="review-header">
              <span class="reviewer-name">${review.name}</span>
              <span class="review-date">${reviewFormattedDate}</span>
            </div>
            <div class="reviewer-info">
              <a class="rated-product" href="${'/product.html?productID='+ review.validUserPid}">${review.validUserPname}</a>
              <div class="product-rating">
                <div class="stars" id="stars-${review.id}"></div>
              </div>
            </div>
            <div class="review-content">
                ${review.content}
            </div>
            <div class="helpful-buttons">
                <button class="helpful-btn">
                    👍 (${toPersianNumbers(review.helpful)})
                </button>
            </div>
        `;
        reviewsList.appendChild(reviewElement);
        
        // ایجاد ستاره‌های امتیاز برای هر نظر
        createStars(review.rating, document.getElementById(`stars-${review.id}`));
    });
}

// تابع برای ایجاد ستاره‌ها
function createStars(rating, container) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i <= rating ? 'filled' : ''}`;
        star.innerHTML = i <= rating ? '★' : '☆';
        container.appendChild(star);
    }
}

// Get reviews from database helper function
function getUserReviewData() {
  if (typeof username === 'undefined') return;
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let reviewsTX = db.transaction(['comment'], 'readonly');
        reviewsTX.onerror = (err) => console.warn(err);
        let reviewsStore = reviewsTX.objectStore('comment');
        let reviewsRequest = reviewsStore.getAll();
        reviewsRequest.onsuccess = (ev) => {
          resolve(ev.target.result);
        };
        reviewsRequest.onerror = (ev) => reject(ev.target.error);
      } catch (error) {
        reject(error);
      }
    });
    dbOpenRequest.addEventListener('error', (e) => {
      reject(e.target.error);
    });
  });
}

/* tab num 6 <!-- كیف پول من --> */

// credit increase
let panDtoList = [],
    ctrlDown = false,
    ctrlKey = "Control",
    cmdKey = "Meta",
    previousPan,
    selectedPanIndex = -1,
    previousSelectedPanIndex = -1,
    keyPadInputId,
    focusedField,
    shuffledArray,
    availableBankNames = {
        610433: "ملت",    
        589905: "ملی",    
        170019: "ملی",    
        603799: "ملی",    
        603769: "صادرات", 
        639217: "کشاورزی",
        603770: "کشاورزی",
        589210: "سپه",    
        627353: "تجارت",  
        628023: "مسکن",   
        207177: "توسعه صادرات",
        627648: "توسعه صادرات",
        627961: "صنعت و معدن", 
        627760: "پست بانک",    
        621986: "سامان",       
        627412: "اقتصاد نوین", 
        639347: "پاسارگاد",
        502229: "پاسارگاد",
        639607: "سرمایه",  
        627488: "کارآفرین",
        639194: "پارسیان", 
        622106: "پارسیان", 
        639346: "سینا", 
        589463: "رفاه",
        628157: "اعتباری توسعه",
        504706: "شهر",
        502806: "شهر",
        502908: "توسعه تعاون",
        502938: "دی",
        606373: "مهر ایران",
        639370: "مهر ایران",
        627381: "انصار",
        636214: "(آینده قدیم) ملی",
        636949: "حکمت ایرانیان",
        505785: "ایران زمین",
        505416: "گردشگری",
        636795: "مرکزی",
        504172: "رسالت",
        505801: "کوثر",
        505809: "خاورمیانه",
        507677: 'موسسه اعتباری نور',
        606256: "ملل",
        639599: "قوامین",
        621986: "بلو بانک"
    },
    availableBankLogos = {
        610433: "bank-mellat", 
        589905: "bank-melli",  
        170019: "bank-melli",  
        603799: "bank-melli",  
        603769: "bank-saderat",
        639217: "bank-keshavarzi",    
        603770: "bank-keshavarzi",    
        589210: "bank-sepah",  
        627353: "bank-tejarat",
        628023: "bank-maskan", 
        207177: "bank-tose-saderat",  
        627648: "bank-tose-saderat",  
        627961: "bank-sanat-va-madan",
        627760: "bank-postbank",
        621986: "bank-saman",   
        627412: "bank-eghtesad-novin",
        639347: "bank-pasargad", 
        502229: "bank-pasargad", 
        639607: "bank-sarmayeh", 
        627488: "bank-karafarin",
        639194: "bank-parsian",  
        622106: "bank-parsian",  
        639346: "bank-sina", 
        589463: "bank-refah",
        628157: "bank-etebari-tose",
        504706: "bank-shahr",
        502806: "bank-shahr",
        502908: "bank-tose-teavon",
        502938: "bank-dey",
        606373: "bank-mehr-Iran",
        639370: "bank-mehr-Iran",
        627381: "bank-ansar",
        636214: "bank-ayandeh",
        636949: "bank-hekmat-iranian",
        505785: "bank-iranzamin",
        505416: "bank-gardeshgari",
        636795: "bank-markazi",
        504172: "bank-resalat",
        505801: "bank-kosar",
        505809: "bank-khavarmiyaneh",
        507677: "bank-noor",
        606256: "bank-melal",
        639599: "bank-ghavamin",
        621987: "bank-blu-bank",
    };

document.addEventListener('DOMContentLoaded', () => {
  if (typeof username === 'undefined' || username === 'notRegisteredUser') return;

  const savePanCheckbox = document.getElementById('savePanCheckbox');
  savePanCheckbox.disabled = false;

  document.addEventListener('keydown', function(e) {
      let keyCode = getEventKeyCode(e);
      if (keyCode === ctrlKey || keyCode === cmdKey) ctrlDown = true;
  });
  document.addEventListener('keyup', function(e) {
      let keyCode = getEventKeyCode(e);
      if (keyCode === ctrlKey || keyCode === cmdKey) ctrlDown = false;
  });
  document.addEventListener('click', (e) => {
    hideKeypadOnOutsideClick(e);
    hideCardSuggestionListOnOutSideClick(e);
  });

  document.getElementById('increase-credit').addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    if (e.key === 'Enter') {
        e.preventDefault();
        showCardSuggestionList(panDtoList);
    }
    if (e.key === 'Tab') {
        showCardSuggestionList(panDtoList);
    }
  });
  document.getElementById('increase-credit').addEventListener('input', (e) => {
    let max = 200000000;
    e.currentTarget.value = toEnglishDigits(e.currentTarget.value);
    e.currentTarget.value = parseInt(e.currentTarget.value.replace(/[,]/gi, ''))
      .toLocaleString()
      .replace(/[^\d,]/g, '');
    if (Number(e.currentTarget.value.replace(/[,]/gi, '')) <= max) {
      e.currentTarget.value = parseInt(e.currentTarget.value.replace(/[,]/gi, ''))
      .toLocaleString()
      .replace(/[^\d,]/g, '');
    } else {
      e.currentTarget.value = max
      .toLocaleString()
      .replace(/[^\d,]/g, '');
    }
    document.getElementById('increase-value').value = Number(e.currentTarget.value.replace(/[,]/gi, ''));
  });

  document.getElementById("card-list-button").addEventListener('click', (e) => {
    toggleAllPans();
  });

  document.getElementById('user-card').addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    setPanCursorPosition(e);
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  });
  document.getElementById('user-card').addEventListener('keyup', (e) => {
    formatPanOnKeyUp(e);
    filterAndShowCardSuggestionList();
    setBankLogo();
    if (getBankName() === 'نامشخص') {
      document.querySelector('p.user-card-bank').innerHTML = "";
    } else {
      document.querySelector('p.user-card-bank').innerHTML = typeof getBankName() === 'undefined' 
        ? "" : "(بانک " + getBankName() + ")";
    }
    focusNextField(e.target,'user-card-cvv2', e);
    resetSelectedPan(e);
  });
  document.getElementById('user-card').addEventListener('input', (e) => {
    e.target.value = toEnglishDigits(e.target.value);
    formatPanOnKeyUp(e);
    setBankLogo();
    if (getBankName() === 'نامشخص') {
      document.querySelector('p.user-card-bank').innerHTML = "";
    } else {
      document.querySelector('p.user-card-bank').innerHTML = typeof getBankName() === 'undefined' 
        ? "" : "(بانک " + getBankName() + ")";
    }
    focusNextField(e.target,'user-card-cvv2', e);
    resetSelectedPan(e);
    if (e.target.dataset.panId !== "") {
      savePanCheckbox.disabled = true;
      savePanCheckbox.checked = false;
    }
  });
  window.addEventListener('paste', (e) => {
    if (e.target === document.getElementById('user-card')) {
      setTimeout(() => {
          if ((true) && e.target.value.length === e.target.maxLength) {
              let element = document.getElementById('user-card-cvv2');
              if (element && element.style.display !== "none") {
                  element.focus();
              }
          }
      }, 30);
    }
  });
  document.getElementById('user-card').addEventListener('focus', (e) => {
    hideKeypad();
    removeInvalidClassFromInput('user-card');
    scrollTopAnimated();
  });
  document.getElementById('user-card').addEventListener('blur', (e) => {
    handlePanChange(e);
  });

  document.querySelectorAll('button.form-btn.keypad').forEach(item => {
    const inputTarget = item.dataset.inputTarget;
    item.addEventListener('click', (e) => showKeypad(inputTarget, e));
  });
  
  document.getElementById("user-card-cvv2").addEventListener('focus', (e) => {
    const inputTarget = e.target;
    hideOthersKeypad(inputTarget);
    hideCardSuggestionList();
    removeInvalidClassFromInput("user-card-cvv2");
  });
  document.getElementById("user-card-cvv2").addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  });
  document.getElementById("user-card-cvv2").addEventListener('keyup', (e) => {
    focusNextField(e.target, "user-card-exp-month|user-card-password", e);
  });
  document.getElementById("user-card-cvv2").addEventListener('input', (e) => {
    e.target.value = toEnglishDigits(e.target.value);
  });

  document.getElementById('user-card-exp-month').addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  });
  document.getElementById('user-card-exp-month').addEventListener('focus', (e) => {
    hideKeypad();
		removeInvalidClassFromInput('user-card-exp-month');
  });
  document.getElementById('user-card-exp-month').addEventListener('keyup', (e) => {
    focusNextField(e.target, "user-card-exp-year", e);
  });
  document.getElementById('user-card-exp-month').addEventListener('input', (e) => {
    e.target.value = toEnglishDigits(e.target.value);
  });
  document.getElementById('user-card-exp-month').addEventListener('blur', (e) => {
    e.target.value = (e.target.value.length > 0 
      ? Number(e.target.value) <= 10 
        ? (e.target.value.length < 2 ? '0' + e.target.value : e.target.value) 
        : e.target.value
      : "");
  });

  document.getElementById('user-card-exp-year').addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  });
  document.getElementById('user-card-exp-year').addEventListener('focus', (e) => {
    hideKeypad();
		removeInvalidClassFromInput('user-card-exp-year');
  });
  document.getElementById('user-card-exp-year').addEventListener('keyup', (e) => {
    focusNextField(e.target, "user-card-password", e);
  });
  document.getElementById('user-card-exp-year').addEventListener('input', (e) => {
    e.target.value = toEnglishDigits(e.target.value);
  });
  document.getElementById('user-card-exp-year').addEventListener('blur', (e) => {
    e.target.value = (e.target.value.length > 0 
      ? Number(e.target.value) <= 10 
        ? (e.target.value.length < 2 ? '0' + e.target.value : e.target.value) 
        : e.target.value
      : "");
  });

  document.getElementById('user-card-password').addEventListener('focus', (e) => {
    const inputTarget = e.target;
    hideOthersKeypad(inputTarget);
    hideCardSuggestionList();
    removeInvalidClassFromInput('user-card-password');
    scrollMiddleAnimated();
  });
  document.getElementById('user-card-password').addEventListener('keydown', (e) => {
    preventInvalidKeys(e);
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  });
  document.getElementById('user-card-password').addEventListener('keyup', (e) => {
    focusNextField(e.target, "paymentSubmit", e);
  });
  document.getElementById('user-card-password').addEventListener('input', (e) => {
    e.target.value = toEnglishDigits(e.target.value); 
  });
  
  document.querySelector('button[name="credit-request-submit"]').addEventListener('click', async (e) => {
    e.preventDefault();
    const submitBtn = e.target;
    const visibleInput = document.getElementById('increase-credit');
    visibleInput.value = '';
    const credit = document.getElementById('increase-value').value;
    if (credit === "0" || credit === '') {
      if (window.matchMedia("(max-width: 543px)").matches) {
          window.scrollTo({
              top: 544,
              behavior: 'smooth'
          });
      }
      return visibleInput.focus();
    };
    // else : user form validation (for guests we skip this)
    const skipValidation = !(username === 'notRegisteredUser') ? true : false;
    let cardNumberValue = null,
          cardCvv2NumberValue = null,
          userCardExpYear = null,
          userCardExpMonth = null,
          userCardPassword = null,
          userCardInsertion = null,
          userCardbankName = null,
          selectedPanIndexNumber = null;
    if (validatePaymentInputs(skipValidation)) {
      const cardInput = document.getElementById("user-card");
      const cvv2Input = document.getElementById('user-card-cvv2');
      const monthInput = document.getElementById('user-card-exp-month');
      const yearInput = document.getElementById('user-card-exp-year');
      const passwordInput = document.getElementById('user-card-password');
      
      if (selectedPanIndex >= 0) {
        selectedPanIndexNumber = selectedPanIndex;
        // Getting saved pans informations to ensure that the selected card existed in the database
        const cards = await getUserCreditCards();
        const cardSelected = panDtoList[selectedPanIndexNumber];
        if(typeof cardSelected  === 'undefined' || typeof cards.find(i => i.date === cardSelected.date) === 'undefined') {
          // Invalid or deleted card pan
          notification(
            "شماره کارت نامعتبر است", 
            "&bigstar;", 
            "#dbd820ff", 
            "#000", 
            "#f70000ff", 
            "check-02", 
            "notif-danger"
          );
          addInvalidClassToInput("user-card");
          setTimeout(() => cardInput.select(), 20);
          selectedPanIndex = -1;
          cardInput.dataset.panId = "";
          unmaskExpireDate(false);
          return false;
        }

        // Used card information is collectable from database to send to servers if it is necessary
        const index = cards.findIndex(i => i.date === cardSelected.date);
        cardNumberValue = concatNumericChars(cards[index].cardNumber, 16);
        cardCvv2NumberValue = cvv2Input.value;
        userCardExpMonth = cards[index].expireMonth;
        userCardExpYear = cards[index].expireYear;
        userCardPassword = passwordInput.value;

      } else {
        cardNumberValue = concatNumericChars(cardInput.value, 16);
        cardCvv2NumberValue = cvv2Input.value;
        userCardExpMonth = monthInput.value;
        userCardExpYear = yearInput.value;
        userCardPassword = passwordInput.value;
        userCardInsertion = Date.now();
        userCardbankName = getBankName();

        let newPan = {
          cardNumber: cardNumberValue,
          date: userCardInsertion,
          maskedPan: panMasker(extractNumbers(cardInput, 16)),
          expireMonth: userCardExpMonth,
          expireYear: userCardExpYear,
          bankName: userCardbankName,
        };

        if (savePanCheckbox.checked) addNewCreditCards();

        // Checking if inserted card number exists in the database othewise save it
        function addNewCreditCards() {
          return new Promise((resolve, reject) => {
            let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbOpenRequest.addEventListener('success', async (e) => {
              try {
                const db = e.target.result;
                let creditcardsTX = db.transaction(['creditCards'], 'readonly');
                creditcardsTX.onerror = (err) => console.warn(err);
                let creditcardsStore = creditcardsTX.objectStore('creditCards');
                let cursorRequest = creditcardsStore.openCursor();
                let matchesFound = 0;
                cursorRequest.onsuccess = (ev) => {
                  const result = ev.target.result;
                  if (result) {
                    if (result.value.cardNumber === cardNumberValue) {
                      matchesFound++;
                    }
                    result.continue();
                  } else {
                    // No more entries!
                    if (matchesFound === 0) {
                      let cardsTX = db.transaction(['creditCards'], 'readwrite');
                      cardsTX.onerror = (err) => console.warn(err);
                      let cardsStore = cardsTX.objectStore('creditCards');
                      let addRequest = cardsStore.add(newPan);
                      addRequest.onsuccess = (ev) => {
                        console.log("The new card's informations saved to the database.")
                        resolve(ev.target.error);
                      };
                      addRequest.onerror = (ev) => reject(ev.target.error);
                    } else {
                      resolve(ev.target.error);
                    }
                  }
                }
                cursorRequest.onerror = (ev) => reject(ev.target.error);
              } catch (error) {
                reject(error);
              }
            });
            dbOpenRequest.addEventListener('error', (e) => {
              reject(e.target.error);
            });
          });
        }
      }

      // Simulation of Sending the transaction request data
      
      submitBtn.disabled = true;
      submitBtn.querySelector('.loader').style.visibility = 'visible';
      disableIncreaseCredit();
      disableCardNumber();
      disableCvv2KeyPad();
      disableInputCVV2();
      disableInputMonth();
      disableInputYear();
      disablePasswordKeyPad();
      disableInputPassword();
      const currentBalance = await getUserBalance();
      const transactionID = Date.now();
      const transaction = {
        type: "deposit",
        amount: Number(credit),
        description: "افزایش اعتبار از طریق درگاه پرداخت",
        status: "incompleted",
        date: transactionID,
        reference_id: `ref${transactionID}`,
        payment_method: "online",
        balance_after: Number(currentBalance) + Number(credit),
      };
  
      notification(
        "درخواست شما ثبت شد. لطفا منتظر بمانید!", 
        "&bigstar;", 
        "#2096dbff", 
        "#000", 
        "#0056f7ff", 
        "check-01", 
        "notif-success"
      );
  
      // setting new deposit transaction into transactions object store
      const transactionSet = setUserTransaction(transaction);
        // changing transaction state to complete and update the user's creditBalance value
        transactionSet.then(() => {
          setTimeout(() => {
            return new Promise((resolve, reject) => {
              let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
              dbOpenRequest.addEventListener('success', async (e) => {
                try {
                  const db = e.target.result;
                  let transactionTX = db.transaction(['transactions'], 'readwrite');
                  transactionTX.onerror = (err) => console.warn(err);
                  let transactionStore = transactionTX.objectStore('transactions');
                  let transactionRequest = transactionStore.get(transactionID);
                  transactionRequest.onsuccess = (ev) => {
                    const trxData = ev.target.result;
                    trxData.status = "completed";
                    let transactionRequest = transactionStore.put(trxData);
                    transactionRequest.onsuccess = (ev) => {
                      console.log('transaction completed!');
                      setUserBalance(transaction['balance_after']);
                      document.getElementById('increase-value').value = 0;
                      submitBtn.disabled = false;
                      submitBtn.querySelector('.loader').style.visibility = 'hidden';
                      notification(
                        "عملیات با موفقیت انجام شد! لطفا موجودی کیف پول خود را بررسی کنید.", 
                        "&check;", 
                        "#3fdb20", 
                        "#000", 
                        "#0056f7ff", 
                        "check-01", 
                        "notif-success"
                      );
                    };
                    transactionRequest.onerror = (ev) => reject(ev.target.error);
                  }  
                  transactionRequest.onerror = (ev) => reject(ev.target.error);
                } catch (error) {
                  reject(error);
                };
              });
            });
          }, 10000)
        });

      function setUserBalance(bal) {
        return new Promise((resolve, reject) => {
          let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbOpenRequest.addEventListener('success', async (e) => {
            try {
              const db = e.target.result;
              let creditBalanceTX = db.transaction(['creditBalance'], 'readwrite');
              creditBalanceTX.onerror = (err) => console.warn(err);
              let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
              let creditBalanceRequest = creditBalanceStore.put(bal, 1);
              creditBalanceRequest.onsuccess = (ev) => {
                console.log('Credit balance updated!');
                const walletSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.wallet");
                walletSumEl.textContent = (transaction['balance_after']) ? transaction['balance_after'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
                walletSummaryUpdate();
                createDashboardLog();
                secureUserCards();
                enableIncreaseCredit();
                enableCardNumber();
                enableCvv2KeyPad();
                enableInputCVV2();
                enableInputMonth();
                enableInputYear();
                enablePasswordKeyPad();
                enableInputPassword();
                paymentFormReseter();
                discardTransactionsTableFilter();
                setTimeout(() => applyTransactionsTableFilter(), 1000);
              }
              creditBalanceRequest.onerror = (ev) => reject(ev.target.error);
            } catch (error) {
              reject(error);
            }
          });
          dbOpenRequest.addEventListener('error', (e) => {
            reject(e.target.error);
          });
        });
      }
  
      function setUserTransaction(tr) {
        return new Promise((resolve, reject) => {
          let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbOpenRequest.addEventListener('success', async (e) => {
            try {
              const db = e.target.result;
              let transactionTX = db.transaction(['transactions'], 'readwrite');
              transactionTX.onerror = (err) => console.warn(err);
              let transactionStore = transactionTX.objectStore('transactions');
              let transactionRequest = transactionStore.add(tr);
              transactionRequest.onsuccess = (ev) => resolve(ev.target.result);
              transactionRequest.onerror = (ev) => reject(ev.target.error);
            } catch (error) {
              reject(error);
            }
          });
          dbOpenRequest.addEventListener('error', (e) => {
            reject(e.target.error);
          });
        });
      }
    }
  });

  walletSummaryUpdate();
  secureUserCards();          // Retrieving Cards data from database for suggestion list

  // Getting user Balance from profile object store
  function getUserBalance() {
    return new Promise((resolve, reject) => {
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          let creditBalanceTX = db.transaction(['creditBalance'], 'readonly');
          creditBalanceTX.onerror = (err) => console.warn(err);
          let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
          let creditBalanceRequest = creditBalanceStore.get(1);
          creditBalanceRequest.onsuccess = (ev) => {
            resolve(ev.target.result);
          };
          creditBalanceRequest.onerror = (ev) => reject(ev.target.error);
        } catch (error) {
          reject(error);
        }
      });
      dbOpenRequest.addEventListener('error', (e) => {
        reject(e.target.error);
      });
    });
  }

  async function walletSummaryUpdate() {
    let transactions = await getUserTransactions();
    const deposits = transactions.filter((item) => item.type === "deposit" && item.status === "completed");
    const purchases = transactions.filter((item) => item.type === "purchase" && item.status === "completed");
    const depositsCount = deposits.reduce((total, item) => total + item.amount, 0);
    const purchasesCount = purchases.reduce((total, item) => total + item.amount, 0);
    const depositSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.deposit");
    const purchaseSumEl = document.querySelector("#credit-pane-1 > div.summary div.summary-amount.purchase");
    const summaryTransaction = {
      deposits: depositsCount,
      purchases: purchasesCount,
    };
    depositSumEl.textContent = (summaryTransaction['deposits']) ? summaryTransaction['deposits'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    purchaseSumEl.textContent = (summaryTransaction['purchases']) ? summaryTransaction['purchases'].toLocaleString('fa-IR').replace(/[٬]/gi, ',') : Number(0).toLocaleString('fa-IR').replace(/[٬]/gi, ',');
    return;
  }

  // Getting all transactions
  function getUserTransactions() {
    return new Promise((resolve, reject) => {
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          let transactionTX = db.transaction(['transactions'], 'readonly');
          transactionTX.onerror = (err) => console.warn(err);
          let transactionStore = transactionTX.objectStore('transactions');
          let transactionRequest = transactionStore.getAll();
          transactionRequest.onsuccess = (ev) => resolve(ev.target.result);
          transactionRequest.onerror = (ev) => reject(ev.target.error);
        } catch (error) {
          reject(error);
        }
      });
      dbOpenRequest.addEventListener('error', (e) => {
        reject(e.target.error);
      });
    });
  }

  // Getting all User Credit cards
  function getUserCreditCards() {
    return new Promise((resolve, reject) => {
      let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          let creditcardsTX = db.transaction(['creditCards'], 'readonly');
          creditcardsTX.onerror = (err) => console.warn(err);
          let creditcardsStore = creditcardsTX.objectStore('creditCards');
          let creditcardsRequest = creditcardsStore.getAll();
          creditcardsRequest.onsuccess = (ev) => resolve(ev.target.result);
          creditcardsRequest.onerror = (ev) => reject(ev.target.error);
        } catch (error) {
          reject(error);
        }
      });
      dbOpenRequest.addEventListener('error', (e) => {
        reject(e.target.error);
      });
    });
  }

  // Securing Card numbers
  async function secureUserCards() {
      const cards = await getUserCreditCards();
      panDtoList = [];
      cards.forEach((item) => {
          delete item.cardNumber;
          panDtoList.push(item);
      });
      panDtoList.forEach((item, idx) => {
          // setting index property for objects
          item.index = idx;
      });
  }
  
  // Checking Digits input
  function isNumericKeyDownOrUp(str) {
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
              ].indexOf(str) !== -1) || /^[0-9]$/.test(str);
  }

  // Return Event.Key
  function getEventKeyCode(e) {
    return e.key;
  }

  // Prevent keys other than digits
  function preventInvalidKeys(e) {
      let isAllowed = false;
      let n = getEventKeyCode(e);
      if ([
            "Shift", 
            "Control", 
            "Meta", 
            "OS", 
            "Unidentified", 
            "Enter", 
            "Backspace", 
            "Tab", 
            "PageUp", 
            "PageDown", 
            "End", 
            "Home", 
            "ArrowDown", 
            "ArrowLeft", 
            "ArrowRight", 
            "ArrowUp", 
            "Insert", 
            "Delete",
            "F1" ,
            "F2" ,
            "F3" ,
            "F4" ,
            "F5" ,
            "F6" ,
            "F7" ,
            "F8" ,
            "F9" ,
            "F10",
            "F11",
            "F12",
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
          ].indexOf(n) !== -1) {
          isAllowed = true;
          };
      if (isNumericKeyDownOrUp(n)) {
          isAllowed = true;
          };
      if (ctrlDown) {
          isAllowed = true;
          };
      if (isAllowed) {
          return true;
      } else {
          e.preventDefault();
          return false;
      }
  }

  // Seting Pan Position
  function setPanCursorPosition(e) {
      let n = document.getElementById(e.target.id);
      let t = getEventKeyCode(e);
      if (!n) return;
      cursorPosition = n.selectionStart;

      if ("Backspace" === t) {
          if (0 !== cursorPosition) {
              let a = n.value.substring(n.selectionStart, n.selectionEnd);
              if (/ /.test(a)) {
                  if (5 !== cursorPosition && 10 !== cursorPosition && 15 !== cursorPosition) {
                      // Do nothing
                  } else {
                      cursorPosition--;
                  }
              } else {
                  if ((6 !== cursorPosition && 11 !== cursorPosition && 16 !== cursorPosition) || cursorPosition--) {
                      cursorPosition--;
                  }
                  cursorPosition = cursorPosition < 0 ? 0 : cursorPosition;
              }
          }
      } else {
          if ("Delete" === t) {
              if (4 !== cursorPosition && 9 !== cursorPosition && 14 !== cursorPosition) {
                  // Do nothing
              } else {
                  cursorPosition++;
              }
          } else if ([
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
                    ].indexOf(t) !== -1) {
              if (!(3 !== cursorPosition && 8 !== cursorPosition && 13 !== cursorPosition && 
                    4 !== cursorPosition && 9 !== cursorPosition && 14 !== cursorPosition) || 
                  cursorPosition++) {
                  cursorPosition++;
              }
          }
      }
  }

  // Formatting Pan of card number on Keyup
  function formatPanOnKeyUp(e) {
      let n = getEventKeyCode(e);
      let t = document.getElementById(e.target.id);
      if (shouldIgnore(n)) return true;
      if (!t) return true;

      let a = concatNumericChars(t.value, 16);
      t.value = getFormattedPan(a);
      return !n || isNumericKeyDownOrUp(n);
  }

  // Ignoring input
  function shouldIgnore(e) {
      return !(!e || isNumericKeyDownOrUp(e) || (ctrlDown && "v" === e));
  }

  // Getting formatted pan
  function getFormattedPan(e) {
      let n, 
          t = "", 
          a = /\d{1,4}/g;
      while ((n = a.exec(e)) !== null) {
          if (0 !== t.length) t += " ";
          t += n[0];
      }
      return t;
  }

  // Concatinating digits
  function concatNumericChars(str, n) {
      let t, 
          a = "", 
          i = /\d{1,16}/g;
      while ((t = i.exec(str)) !== null && a.length < n) {
          a += t[0];
      }
      return a.length > n ? a.substring(0, n) : a;
  }

  // Filtering And Showing Card Suggestion List
  function filterAndShowCardSuggestionList() {
      const e = [];
      const cardInput = document.getElementById("user-card");
      if (!cardInput || !panDtoList) return;
  
      const n = cardInput.value.replace(/ /g, "");
      
      panDtoList.forEach((a) => {
          // searching for typed card number if it is matched a.maskedPan
          if (a.maskedPan.lastIndexOf(n, 0) === 0) {
              e.push(a);
          }
      });
      if (document.querySelector("label[for='user-card']")?.classList.contains("opensugestion")) {
        hideCardSuggestionList();
      }
      showCardSuggestionList(e);
  }

  // Showing saved user Cards 
  function showCardSuggestionList(cards) {
      const suggestionList = document.querySelector(".card-suggestionlist");
      if (!suggestionList) return;

      if (cards.length > 0) {
          // Remove all children except those with class 'editcard'
          const children = suggestionList.children;
          for (let i = children.length - 1; i >= 0; i--) {
              if (!children[i].classList.contains('editcard')) {
                  suggestionList.removeChild(children[i]);
              }
          }

          for (let n = cards.length - 1; n > -1; n--) {
              const t = cards[n];
              const a = t.maskedPan;
              const i = a.substring(0, 6);
              const s = 
                `<div class="dropdown-item">
                  <span class="btn delete-selected-pan" tabindex="-1" data-pan-index="${t.index}" data-pan-id="${t.date}">
                    <span class="close-button-red"></span>
                  </span>
                  <span class="btn btn-w select-pan" tabindex="-1" data-pan-index="${t.index}" data-pan-id="${t.date}">
                    <span>${a}</span>
                    <span>
                      <span class="width-fit">${t.bankName}</span>` + 
                      (isBankLogoAvailable(i) 
                          ? '<img src="' + getBankLogoSrc(i) + '">' 
                          : '<img src="./assets/images/bank-logo/bank-markazi.png">') +
                    "</span>" +
                  "</span>" +
                "</div>";

              suggestionList.insertAdjacentHTML('afterbegin', s);
          }
          const dropDownItems = document.querySelectorAll(".dropdown-item");
          dropDownItems.forEach(item => {
              item.querySelector('.delete-selected-pan').addEventListener('click', (e) => {
                  const idx = e.currentTarget.dataset.panIndex;
                  const id = e.currentTarget.dataset.panId;
                  deleteSelectedPan(idx, id, e);
              });
              item.querySelector('.select-pan').addEventListener('click', (e) => {
                  const idx = e.currentTarget.dataset.panIndex;
                  const id = e.currentTarget.dataset.panId;
                  selectPan(idx, id, e);
              });
          });

          document.querySelector("label[for='user-card']")?.classList.add("opensugestion");
          const cardListButton = document.getElementById("card-list-button");
          if (cardListButton) cardListButton.classList.add("close-button");
      } else {
          hideCardSuggestionList();
      }
  }

  // Deleting selected pan from card lists
  function deleteSelectedPan(idx, id, ev) {
      if (idx < panDtoList.length) {
          const date = Number(id);
          panDtoList.splice(idx, 1);
          showCardSuggestionList(panDtoList);

          // card item remover functionality
          const removeCard = new Promise((res, rej) => {
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['creditCards'], 'readwrite');
              const store = transaction.objectStore('creditCards');
              const removeReq = store.delete(date);
              removeReq.onsuccess = () => res('Removed the pan');
              removeReq.onerror = () => console.log('Error removing the pan');
            }
          });
          removeCard.then(processDeleteSelectedPanResponse);
         
      } else {
          hideCardSuggestionList();
          setBankLogo();
          if (getBankName() === 'نامشخص') {
            document.querySelector('p.user-card-bank').innerHTML = "";
          } else {
            document.querySelector('p.user-card-bank').innerHTML = typeof getBankName() === 'undefined' 
              ? "" : "(بانک " + getBankName() + ")";
          }
      }
  }

  function processDeleteSelectedPanResponse(e) {
    console.log(e);
  }

  // Setting bank of inserted card logo
  function setBankLogo() {
      const bankLogo = document.querySelector(".bank-logo");
      if (!bankLogo) return;

      // Remove all children
      while (bankLogo.firstChild) {
          bankLogo.removeChild(bankLogo.firstChild);
      }

      const cardInput = document.getElementById("user-card");
      if (!cardInput) return;

      const e = cardInput.value.replace(/ /g, "");
      if (e.length >= 6) {
          const n = e.substring(0, 6);
          if (isBankLogoAvailable(n)) {
              const t = '<img src="' + getBankLogoSrc(n) + '">';
              bankLogo.insertAdjacentHTML('beforeend', t);
          } else {
              const t = '<img src="assets/images/bank-logo/bank-markazi.png" alt="bank">';
              bankLogo.insertAdjacentHTML('beforeend', t);
          }
      }
  }

  // checking for pan bank logo availibility from the 'availableBankLogos' list by first 6 starting card numbers
  function isBankLogoAvailable(e) {
      return !!availableBankLogos[parseInt(e)];
  }

  // Getting bank logo source
  function getBankLogoSrc(e) {
      return "./assets/images/bank-logo/" + availableBankLogos[e] + ".png";
  }

  // hidding cards list
  function hideCardSuggestionList() {
      document.querySelector("label[for='user-card']")?.classList.remove("opensugestion");
      const cardListButton = document.getElementById("card-list-button");
      if (cardListButton) cardListButton.classList.remove("close-button");
  }

  // showing CardSuggestionList on click on credit card icon
  function toggleAllPans() {
      (panDtoList.length > 0 ? null : secureUserCards());
      const cardListBtn = document.querySelector("#card-list-button.close-button");
      if (cardListBtn) {
          hideCardSuggestionList();
      } else {
          panDtoList.forEach((item, idx) => {
              // setting index property for objects
              item.index = idx;
          });
          showCardSuggestionList(panDtoList);

          const cardInput = document.getElementById("user-card");
          if (cardInput) {
              cardInput.focus();
              cardInput.setSelectionRange(0, cardInput.value.length);
          }
      }
  }

  // Getting focus to next input
  function focusNextField(thisInput, nextInputId, e) {
      if ((e ? isNumericKeyDownOrUp(getEventKeyCode(e)) : true) && thisInput.value.length >= thisInput.maxLength) {
          let a = nextInputId.split("|");
          for (let i = 0; i < a.length; i++) {
              let s = a[i];
              let element = document.getElementById(s);
              if (element && element.style.display !== "none") {
                  focusField(s);
                  break;
              }
          }
      }
  }  

  // Focusing on a specified input
  function focusField(e) {
      let n = document.getElementById(e);
      if (n) {
          n.focus();
          if (n.type !== "button") {
              n.setSelectionRange(0, n.value.length);
          }
      }
  }

  // reset selectedPanIndex and user card input attributes
  function resetSelectedPan(e) {
      const cardInput = document.getElementById("user-card");
      if (shouldIgnore(getEventKeyCode(e))) return true;
      selectedPanIndex = -1;
      cardInput.dataset.panId = "";
      if (cardInput.dataset.panId === "") {
        savePanCheckbox.disabled = false;
        savePanCheckbox.checked = true;
      }
      unmaskExpireDate(false);
  }

  // Set mask on the expire date field
  function maskExpireDate() {
      const monthInput = document.getElementById("user-card-exp-month");
      const yearInput = document.getElementById("user-card-exp-year");

      if (!monthInput || !yearInput) return;

      const e = monthInput.getAttribute("class");
      const n = yearInput.getAttribute("class");

      // correct values are retrieved from the cach
      monthInput.value = "";
      monthInput.style.display = 'none';
      yearInput.value = "";
      yearInput.style.display = 'none';

      // Remove existing encrypted inputs
      const existingMonthEnc = document.getElementById("inputMonthEnc");
      const existingYearEnc = document.getElementById("inputYearEnc");
      if (existingMonthEnc) existingMonthEnc.remove();
      if (existingYearEnc) existingYearEnc.remove();

      // Add existing encrypted inputs
      const t = '<input id="inputMonthEnc" type="password" style="display: flex" data-encrypt-exp-date class="' + e + '" tabindex="-1" value="**" readonly/>';
      const a = '<input id="inputYearEnc" type="password" style="display: flex" data-encrypt-exp-date class="' + n + '" tabindex="-1" value="**"  readonly/>';

      monthInput.insertAdjacentHTML('afterend', t);
      yearInput.insertAdjacentHTML('afterend', a);

      document.getElementById("inputMonthEnc").addEventListener('click', (e) => unmaskExpireDate(true));
      document.getElementById("inputYearEnc").addEventListener('click', (e) => unmaskExpireDate(true));

  }

  // Remove mask from expire date field
  function unmaskExpireDate(e) {
      const monthEnc = document.getElementById("inputMonthEnc");
      const yearEnc = document.getElementById("inputYearEnc");
      const monthInput = document.getElementById("user-card-exp-month");
      const yearInput = document.getElementById("user-card-exp-year");
      
      if (monthEnc) monthEnc.remove();
      if (yearEnc) yearEnc.remove();
      
      if (monthInput) {
          monthInput.style.display = 'flex';
          if (e) monthInput.focus();
      }
      if (yearInput) yearInput.style.display = 'flex';
  }

  // Hiding Keypad
  function hideKeypad() {
      let keypadContainer = document.querySelectorAll(".keypad-container");
      if (keypadContainer) {
          keyPadInputId = null;
          keypadContainer.forEach((item) => {
            item.classList.remove("openkeypad");
            item.innerHTML = "";
          });
      }
  }

  // Hiding all keyboards
  function hideOthersKeypad(e) {
      if (e.id !== keyPadInputId) {
          hideKeypad();
      }
  }

  // to hide Keypad On Out side Click
  function hideKeypadOnOutsideClick(e) {
      let keypadContainer = document.querySelectorAll(".keypad-container");
      keypadContainer.forEach(item => {
        if (!item.classList.contains('openkeypad')) return false;
          if (item && 
              item.parentElement !== e.target.closest(".keypad-parent") &&
              !e.target.closest(".keypad-parent")) {
              hideKeypad();
          }
      });
  }

  // to hide Card Suggestion List On Out Side Click
  function hideCardSuggestionListOnOutSideClick(e) {
      let cardNumberBox = document.querySelector("label[for='user-card']");
      if (cardNumberBox !== e.target && !e.target.closest("label[for='user-card']")) {
          hideCardSuggestionList();
      }
  }
  
  // Scroll to card input
  function scrollTopAnimated() {
      if (window.matchMedia("(max-width: 543px)").matches) {
          window.scrollTo({
              top: 650,
              behavior: 'smooth'
          });
      }
  }
  
  // Scroll to card password input
  function scrollMiddleAnimated() {
      if (window.matchMedia("(max-width: 543px)").matches) {
          window.scrollTo({
              top: 900,
              behavior: 'smooth'
          });
      }
  }

  // Handling changes of card pan after the input filled
  function handlePanChange() {
      const cardInput = document.getElementById("user-card");
      const inputElVal = cardInput.value.replace(/ /g, "");

      if (isNewPan(cardInput)) {
          previousSelectedPanIndex = selectedPanIndex;
          previousPan = inputElVal;
      }
  }

  // Checking for if new card selected/inserted
  function isNewPan(e) {
      return (
          (selectedPanIndex >= 0 && previousSelectedPanIndex !== selectedPanIndex) ||
          (16 === e.value.length && previousPan !== e.value)
      );
  }

  // Setting new pan to the user card input
  function setPan(str, id) {
      const cardInput = document.getElementById("user-card");
      if (cardInput) {
          cardInput.value = str;
          cardInput.dataset.panId = id;
          removeInvalidClassFromInput('user-card');
          if (cardInput.dataset.panId !== "") {
            savePanCheckbox.disabled = true;
            savePanCheckbox.checked = false;
          }
      }
  }

  // Selecting pans from the suggestion list
  function selectPan(idx, id, e) {
      selectedPanIndex = -1;
      const selectedPanId = id;

      if (idx < panDtoList.length) {
          const t = panDtoList[idx];
          const a = t.maskedPan;
          let i = a.substring(0, 4);
          i += " " + a.substring(4, 6);
          i += "×× ×××× ";
          i += a.substring(a.length - 4, a.length);

          setPan(i, selectedPanId);
          selectedPanIndex = idx;

          if (t.expireMonth && t.expireYear) maskExpireDate();

          const cvv2Input = document.getElementById("user-card-cvv2");
          if (cvv2Input) cvv2Input.value = "";
          
          hideCardSuggestionList();
          setBankLogo();
          if (getBankName() === 'نامشخص') {
            document.querySelector('p.user-card-bank').innerHTML = "";
          } else {
            document.querySelector('p.user-card-bank').innerHTML = typeof getBankName() === 'undefined' 
              ? "" : "(بانک " + getBankName() + ")";
          }
          handlePanChange();
          scrollTopAnimated();
          
          // instead of cvv2Input.focus() Using:
          setTimeout(() => simulateClick(), 3);
          // simulate click on next input
          function simulateClick() {
            const nextInput = document.querySelector('label[for="user-card-cvv2"]');
            const event = new MouseEvent("click", {
              bubbles: true,
              cancelBubble: false,
              cancelable: true,
              view: window,
            });
            nextInput.dispatchEvent(event);
          }
          
      } else {
          hideCardSuggestionList();
          setBankLogo();
          if (getBankName() === 'نامشخص') {
            document.querySelector('p.user-card-bank').innerHTML = "";
          } else {
            document.querySelector('p.user-card-bank').innerHTML = typeof getBankName() === 'undefined' 
              ? "" : "(بانک " + getBankName() + ")";
          }
      }
  }

  // showing safe keypad
  function showKeypad(id, e) {
      // if any keypad is visible hide that and return to prevent the visible keyboard from rendering 
      if (document.getElementById(id).closest(".keypad-parent") === e.target.parentElement.closest(".keypad-parent") &&
          document.getElementById(id).parentElement.querySelector(".keypad-container")?.classList.contains("openkeypad")
        ) return hideKeypad(), false;
      if (typeof keyPadInputId === "string") {
        hideKeypad();
        if (document.getElementById(id).closest(".keypad-parent") !== e.target.parentElement.closest(".keypad-parent")) return false;
      }
      // id parameter is keypad's destination input target's id
      keyPadInputId = id;
      let targetElement = document.getElementById(id);
      if (!targetElement) return false;

      targetElement.focus();
      setFocusedField(targetElement);

      const keypadContainer = targetElement.parentElement.querySelector('.keypad-container');
      keypadContainer.innerHTML = `
          <h4>
            <div class="input-group input-group-sm">
              <span class="form-control border_none " aria-describedby="closeBtn">
                 صفحه کلید امن
              </span>
              <div class="input-group-prepend ">
                <button id="closeBtn" type="button" class="close-button-pinpad"></button>
              </div>
            </div>
          </h4>
          <div class="frame-umbtn"><button id="num1" type="button" class=" numpad" tabindex="-1" value="9">9</button></div>
          <div class="frame-umbtn"><button id="num2" type="button" class=" numpad" tabindex="-1" value="5">5</button></div>
          <div class="frame-umbtn"><button id="num3" type="button" class=" numpad" tabindex="-1" value="6">6</button></div>
          <div class="frame-umbtn"><button id="num4" type="button" class=" numpad" tabindex="-1" value="1">1</button></div>
          <div class="frame-umbtn"><button id="num5" type="button" class=" numpad" tabindex="-1" value="4">4</button></div>
          <div class="frame-umbtn"><button id="num6" type="button" class=" numpad" tabindex="-1" value="7">7</button></div>
          <div class="frame-umbtn"><button id="num7" type="button" class=" numpad" tabindex="-1" value="8">8</button></div>
          <div class="frame-umbtn"><button id="num8" type="button" class=" numpad" tabindex="-1" value="0">0</button></div>
          <div class="frame-umbtn"><button id="clear" type="button" class=" numpad" tabindex="-1">⌫</button></div>
          <div class="frame-umbtn"><button id="num9" type="button" class=" numpad" tabindex="-1" value="2">2</button></div>
          <div class="frame-umbtn"><button id="num0" type="button" class=" numpad" tabindex="-1" value="3">3</button></div>
          <div class="frame-umbtn"><button id="tab-key" type="button" class=" numpad" tabindex="-1" style="color: #27d286;">✔</button></div>
      `;

      shuffleKeypad();

      for (let i = 0; i < 10; i++) {
          let n = "num" + i,
              t = document.getElementById(n);
          if (t) {
              t.addEventListener('click', (e) => fillField(e.target, e));
          }
      }

      document.getElementById('tab-key').addEventListener('click', (e) => keypadTab(), {once: true});
      document.getElementById('clear').addEventListener('click', (e) => keyPadBackspace(e));
      document.querySelector('button#closeBtn[class="close-button-pinpad"]').addEventListener('click', (e) => hideKeypad());

      if (keypadContainer && targetElement) {
          keypadContainer.classList.add("openkeypad");
      }

      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      return false;
  }

  // Setting focus field for safe keypad
  function setFocusedField(e) {
      focusedField = e;
  }

  // Shuffling safe Keypad buttons
  function shuffleKeypad() {
      shuffledArray = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let e = 0; e < shuffledArray.length; e++) {
          let n = "num" + e,
              t = document.getElementById(n);
          if (t) {
              t.value = shuffledArray[e];
              t.textContent = shuffledArray[e];
          }
      }
  }

  // Array Shuffling functionality
  function shuffle(arr) {
      let n, t, a;
      for (a = arr.length - 1; a > 0; a--) {
          n = Math.floor(Math.random() * (a + 1));
          t = arr[a];
          arr[a] = arr[n];
          arr[n] = t;
      }
      return arr;
  }

  // filling input field with keypad numbers
  function fillField(element, e) {
      if (focusedField) {
          e.preventDefault();
          e.stopPropagation();
          focusedField.focus();

          let t, 
              a = element.value,
              i = focusedField.selectionStart,
              s = focusedField.selectionEnd;

          t = i === focusedField.value.length
              ? focusedField.value + a
              : focusedField.value.substring(0, i) + a + focusedField.value.substring(s, focusedField.value.length);

          if (focusedField.maxLength === -1 ? true : t.length <= focusedField.maxLength) {
              focusedField.value = t;
          }

          if (focusedField.maxLength === -1 ? false : focusedField.value.length === focusedField.maxLength) {
              keypadTab();
          }
      }
      return false;
  }

  // blur input when max length reaches limit and focus on next element
  function keypadTab() {
      hideKeypad();
      let e = focusedField.id !== "user-card-cvv2" 
          ? "paymentSubmit" 
          : document.getElementById("user-card-exp-month") && document.getElementById("user-card-exp-month").style.display !== "none"
              ? "user-card-exp-month"
              : "user-card-password";

      let n = document.getElementById(e);
      if (n && n.tagName !== 'INPUT') {
          n.focus();
      } else {
          n.focus();
          n.setSelectionRange(0, n.value.length);
      }
  }

  // Erasing input content by safe keypad button
  function keyPadBackspace(e) {
      if (focusedField) {
          e.preventDefault();
          e.stopPropagation();
          focusedField.focus();

          let n = focusedField.selectionStart,
              t = focusedField.selectionEnd;

          if (n === focusedField.value.length) {
              focusedField.value = focusedField.value.substring(0, focusedField.value.length - 1);
          } else {
              focusedField.value = n === t
                  ? focusedField.value.substring(0, n - 1) + focusedField.value.substring(t, focusedField.value.length)
                  : focusedField.value.substring(0, n) + focusedField.value.substring(t, focusedField.value.length);
          }
      }
      return false;
  }

  // Main validation function
  function validatePaymentInputs(e) {
      // 'e' acts as a feature flag 
      // When true, it enables validation
      // When false, the entire validation is skipped due to short-circuit evaluation
      let n = true;
      return (
          e && (validatePan("user-card") || (n = false)),
          e && (validateInput("user-card-password", /\d{5,12}/) || (n = false)),
          e && (validateInput("user-card-cvv2", /\d{3,4}/) || (n = false)),
          e && (validateDate() || (n = false)),
          n 
              ? document.getElementById('paymentbox').querySelector('.invalid')?.focus()
              : notification(
                    "لطفا اطلاعات مورد نیاز را به درستی وارد نمایید!", 
                    "&bigstar;", 
                    "#dbd820ff", 
                    "#000", 
                    "#f70000ff", 
                    "check-02", 
                    "notif-danger"
                  ),
          n
      );
  }

  // pattern checking function
  function checkPattern(id, pattern) {
      let element = document.getElementById(id);
      return element && pattern.test(element.value);
  }

  // pan validation function
  function validatePan(panId) {
      let e =
          checkPattern(panId, /\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/) ||
          checkPattern(panId, /(-){4}\s?(-){4}\s?(-){4}\s?\d{4}/) ||
          (selectedPanIndex > -1 && checkPattern(panId, /\d{4}\s?\d{2}(×){2}\s?(×){4}\s?\d{4}/));
      return e ? removeInvalidClassFromInput(panId) : addInvalidClassToInput(panId), e;
  }

  // other inputs validattion function
  function validateInput(id, pattern) {
      return checkPattern(id, pattern) ? (removeInvalidClassFromInput(id), true) : (addInvalidClassToInput(id), false);
  }

  // Removing invalid class from input's parentNode
  function removeInvalidClassFromInput(e) {
      let element = document.getElementById(e);
      if (element && element.parentNode) {
          element.parentNode.classList.remove("invalid");
      }
  }

  // Adding invalid class to input's parentNode
  function addInvalidClassToInput(e) {
      let element = document.getElementById(e);
      if (element && element.parentNode) {
          element.parentNode.classList.add("invalid");
      }
  }

  // Date input validation function
  function validateDate() {
      let e = true;
      let inputMonth = document.getElementById("user-card-exp-month");

      if (inputMonth && inputMonth.style.display !== "none") {
          if (!checkPattern("user-card-exp-month", /\d{2}/)) {
              e = false;
          }
          let n = inputMonth.value;
          if (n < 1 || n > 12) {
              e = false;
          }
      }

      let inputYear = document.getElementById("user-card-exp-year");
      if (inputYear && inputYear.style.display !== "none" && !checkPattern("user-card-exp-year", /\d{2}/)) {
          e = false;
      }

      if (e) {
          inputMonth.parentNode.parentNode.parentNode.classList.remove("invalid");
      } else {
          inputMonth.parentNode.parentNode.parentNode.classList.add("invalid");
      }

      return e;
  }

  // Getting bank name
  function getBankName() {
      const cardInput = document.getElementById("user-card");
      const e = cardInput.value.replace(/ /g, "");
      if (e.length >= 6) {
          const n = e.substring(0, 6);
          if (isBankLogoAvailable(n)) {
              return availableBankNames[n];
          } else {
              return 'نامشخص';
          }
      }
  }

  // extract user card numbers if it is validated
  function extractNumbers(input, n) {
      let t = input.value;
      t = concatNumericChars(t, n);
      return t;
  }

  // Masking card number
  function panMasker(str) {
    const t = str;
    let i = t.substring(0, 6);
    i += "×××" + t.substring(t.length - 4, t.length);
    return i;
  }

  // Disable/Enable functions
  function disableIncreaseCredit() {
      const increaseCredit = document.getElementById("increase-credit");
      if (increaseCredit) increaseCredit.disabled = true;
  }

  function enableIncreaseCredit() {
      const increaseCredit = document.getElementById("increase-credit");
      if (increaseCredit) increaseCredit.disabled = false;
  }

  function disableCardNumber() {
      const cardInput = document.getElementById("user-card");
      const cardListBtn = document.getElementById("card-list-button");
      if (cardInput) cardInput.disabled = true;
      cardListBtn.style.pointerEvents = 'none';
  }

  function enableCardNumber() {
      const cardInput = document.getElementById("user-card");
      const cardListBtn = document.getElementById("card-list-button");
      if (cardInput) cardInput.disabled = false;
      cardListBtn.style.pointerEvents = '';
  }

  function disableCvv2KeyPad() {
      const cvv2KeyPad = document.getElementById("cvv2KeyPad");
      if (cvv2KeyPad) cvv2KeyPad.disabled = true;
  }

  function enableCvv2KeyPad() {
      const cvv2KeyPad = document.getElementById("cvv2KeyPad");
      if (cvv2KeyPad) cvv2KeyPad.disabled = false;
  }

  function disableInputCVV2() {
      const cvv2Input = document.getElementById("user-card-cvv2");
      if (cvv2Input) cvv2Input.disabled = true;
  }

  function enableInputCVV2() {
      const cvv2Input = document.getElementById("user-card-cvv2");
      if (cvv2Input) cvv2Input.disabled = false;
  }

  function disableInputMonth() {
      const monthInput = document.getElementById("user-card-exp-month");
      const monthInputEnc = document.getElementById("inputMonthEnc");
      if (monthInput) monthInput.disabled = true;
      if (monthInputEnc) monthInputEnc.disabled = true;
  }

  function enableInputMonth() {
      const monthInput = document.getElementById("user-card-exp-month");
      const monthInputEnc = document.getElementById("inputMonthEnc");
      if (monthInput) monthInput.disabled = false;
      if (monthInputEnc) monthInputEnc.disabled = false;
  }

  function disableInputYear() {
      const yearInput = document.getElementById("user-card-exp-year");
      const yearInputEnc = document.getElementById("inputYearEnc");
      if (yearInput) yearInput.disabled = true;
      if (yearInputEnc) yearInputEnc.disabled = true;
  }

  function enableInputYear() {
      const yearInput = document.getElementById("user-card-exp-year");
      const yearInputEnc = document.getElementById("inputYearEnc");
      if (yearInput) yearInput.disabled = false;
      if (yearInputEnc) yearInputEnc.disabled = false;
  }

  function disablePasswordKeyPad() {
      const passwordKeyPad = document.getElementById("passwordKeyPad");
      if (passwordKeyPad) passwordKeyPad.disabled = true;
  }

  function enablePasswordKeyPad() {
      const passwordKeyPad = document.getElementById("passwordKeyPad");
      if (passwordKeyPad) passwordKeyPad.disabled = false;
  }

  function disableInputPassword() {
      const passwordInput = document.getElementById("user-card-password");
      if (passwordInput) passwordInput.disabled = true;
  }

  function enableInputPassword() {
      const passwordInput = document.getElementById("user-card-password");
      if (passwordInput) passwordInput.disabled = false;
  }

  // Reseting credit form
  function paymentFormReseter() {
    const form = document.getElementById('paymentbox');
    const bankLogo = document.querySelector(".bank-logo");
    unmaskExpireDate(false);
    form.reset();
    while (bankLogo.firstChild) {
        bankLogo.removeChild(bankLogo.firstChild);
    }
  }

});

// Sorter element custom select

let trxList = [];
let chartList = [];
let chartListAll = [];
let trxChart = null;
let creditChart = null;

let filterParameters = {
  transactionsType: 'all',       // deposit, purchase
  transactionsState: 'all',      // completed, pending
  fromDateTimestamp: 0,
  toDateTimestamp: 0,
  startDefaultTimestamp: 0,
  endDefaultTimestamp: 0,
  startDefaultFa: 0,
  endDefaultFa: 0,
}

const pcalStartDate = document.getElementById('pcal-start-date');
const pcalEndDate = document.getElementById('pcal-end-date');

// transaction Chart Data
const transactionChartData = {
    labels: [],
    datasets: [
        {
            label: 'واریز',
            data: [],
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            fill: false,
            tension: 0.3
        },
        {
            label: 'خرید',
            data: [],
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.2)',
            fill: false,
            tension: 0.3
        }
    ]
};

// transaction Chart Config
const transactionChartConfig = {
    type: 'line',
    data: transactionChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'نمودار تاریخچه تراکنش ها در بازه زمانی معین',
                font: {
                    size: 16,
                    family: 'Estedad'
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.parsed.y.toLocaleString('fa-IR') + ' تومان';
                    },
                },
                // Specify font family for different parts of the tooltip
                titleFont: {
                    family: 'Estedad' // Title font
                },
                bodyFont: {
                    family: 'Estedad' // Body font
                },
                footerFont: {
                    family: 'Estedad' // Footer font
                }
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'تاریخ',
                    font: {
                        family: 'Estedad'
                    }
                },
                ticks: {
                    font: {
                        family: 'Estedad'
                    }
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'مبلغ (تومان)',
                    font: {
                        family: 'Estedad'
                    }
                },
                ticks: {
                    callback: function(value) {
                        return value.toLocaleString('fa-IR');
                    },
                    font: {
                        family: 'Estedad'
                    }
                }
            }
        }
    }
};

// credit Chart Data
const creditChartData = {
    labels: [],
    datasets: [
        {
            label: 'موجودی',
            data: [],
            borderColor: '#2cb7eeff',
            backgroundColor: 'rgba(36, 191, 230, 0.2)',
            fill: true,
            tension: 0.3
        }
    ]
};

// credit Chart Config
const creditChartConfig = {
    type: 'line',
    data: creditChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'نمودار تاریخچه اعتبار حساب در بازه زمانی معین',
                font: {
                    size: 16,
                    family: 'Estedad'
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.parsed.y.toLocaleString('fa-IR') + ' تومان';
                    },
                },
                // Specify font family for different parts of the tooltip
                titleFont: {
                    family: 'Estedad' // Title font
                },
                bodyFont: {
                    family: 'Estedad' // Body font
                },
                footerFont: {
                    family: 'Estedad' // Footer font
                }
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'تاریخ',
                    font: {
                        family: 'Estedad'
                    }
                },
                ticks: {
                    font: {
                        family: 'Estedad'
                    }
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'مبلغ (تومان)',
                    font: {
                        family: 'Estedad'
                    }
                },
                ticks: {
                    callback: function(value) {
                        return value.toLocaleString('fa-IR');
                    },
                    font: {
                        family: 'Estedad'
                    }
                }
            }
        }
    }
};

// Initializing transactions log
const userTransactionsLog = async function() {
  const dbPromise = new Promise((resolve, reject) => {
    let userProfile = [];
    let dbOpenRequest = window.indexedDB.open(`${username}`,1);
    dbOpenRequest.addEventListener('success', async (e) => {
      db = e.target.result;
      console.log('success opening db.');
      let profileTX = makeTX(['profile'], 'readonly');
      profileTX.onerror = (err) => console.warn(err);
      // get profile data
      let profileStore = profileTX.objectStore('profile');
      let profileRequest = await profileStore.get(1);
      profileRequest.onsuccess = (ev) => {
        userProfile.push(ev.target.result);
        resolve(userProfile);
      }
      profileRequest.onerror = (err) => console.warn(err);
    });
  });

  dbPromise.then( (userProfileArr) => {
    const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    let userRegistrationDate = userProfileArr[0].registrationDate ? userProfileArr[0].registrationDate : (Date.now() - 86400001);
    let dateNow = Date.now();
    filterParameters.fromDateTimestamp = userRegistrationDate;
    filterParameters.toDateTimestamp = dateNow + 86400000;
    filterParameters.startDefaultTimestamp = userRegistrationDate;
    filterParameters.endDefaultTimestamp = dateNow + 86400000;
    let start = dateFormatter.format(userRegistrationDate);
    let end = dateFormatter.format(dateNow);
    filterParameters.startDefaultFa = toEnglishDigits(start);
    filterParameters.endDefaultFa = toEnglishDigits(end);
    
    // Persian calendar initialize
    const objCalStart = new AMIB.persianCalendar( 'pcal-start-date', {
        initialDate: toEnglishDigits(start),
        // defaultDate: '1402/12/12',
      }
    );
    
    const objCalEnd = new AMIB.persianCalendar( 'pcal-end-date', {
        initialDate: toEnglishDigits(end),
        // defaultDate: '1402/12/12',
      }
    );

    renderTransactionsTable();
  });
};

// transaction Chart functionality
function prepareChartData() {
  transactionChartData.labels = [];
  transactionChartData.datasets[0].data = [];
  transactionChartData.datasets[1].data = [];
  let dateAmountDepositArr = [];
  let dateAmountDepositObj = {};
  let dateAmountPurchaseArr = [];
  let dateAmountPurchaseObj = {};
  const options = {month: "2-digit", day: "2-digit"};
  // Deposit items
  chartList.forEach(item => {
    if (item.status !== "completed") return;
    const itemDAte =  new Intl.DateTimeFormat("fa-IR", options).format(item.date);
    const itamAmount = (item.type === "deposit") ? item.amount : 0;
    const obj = {
      amount: itamAmount,
      date: itemDAte,
    };
    dateAmountDepositArr.push(obj);
  });
  dateAmountDepositArr.forEach(item => {
    const objKeys = Object.keys(dateAmountDepositObj);
    if (objKeys.includes(item.date)) {
      dateAmountDepositObj[item.date].push(item.amount);
    } else {
      dateAmountDepositObj[item.date] = [];
      dateAmountDepositObj[item.date].push(item.amount);
    }
  });
  transactionChartData.labels = Object.keys(dateAmountDepositObj);
  const dateAmountDepositObjValues = Object.values(dateAmountDepositObj);
  for (i of dateAmountDepositObjValues) {
    const depositItems = i.reduce((total, num) => total + num, 0);
    transactionChartData.datasets[0].data.push(depositItems);
  }
  // Purchase items
  chartList.forEach(item => {
    if (item.status !== "completed") return;
    const itemDAte =  new Intl.DateTimeFormat("fa-IR", options).format(item.date);
    const itamAmount = (item.type === "purchase") ? item.amount : 0;
    const obj = {
      amount: itamAmount,
      date: itemDAte,
    };
    dateAmountPurchaseArr.push(obj);
  });
  dateAmountPurchaseArr.forEach(item => {
    const objKeys = Object.keys(dateAmountPurchaseObj);
    if (objKeys.includes(item.date)) {
      dateAmountPurchaseObj[item.date].push(item.amount);
    } else {
      dateAmountPurchaseObj[item.date] = [];
      dateAmountPurchaseObj[item.date].push(item.amount);
    }
  });
  transactionChartData.labels.sort((a, b) => a.localeCompare(b));
   const dateAmountPurchaseObjValues = Object.values(dateAmountPurchaseObj);
  for (i of dateAmountPurchaseObjValues) {
    const depositItems = i.reduce((total, num) => total + num, 0);
    transactionChartData.datasets[1].data.push(depositItems);
  }
  // Adding Date zero
  transactionChartData.labels.unshift('ابتدا');
  transactionChartData.datasets[0].data.unshift(0);
  transactionChartData.datasets[1].data.unshift(0);
  return;
}

function drawChart() {
  const ctx = document.getElementById('transactionChart').getContext('2d');
  trxChart = new Chart(ctx, transactionChartConfig);
}

function destroyChart() {
  if (trxChart) trxChart.destroy();
}

// Credit Chart functionality
function prepareCreditChartData() {
  creditChartData.labels = [];
  creditChartData.datasets[0].data = [];
  // Array of {amount: Number, date: 'PersianDate'}...
  let dateAmountArr = [];
  // Object of 'PersianDate':[amountNumber]...
  let dateAmountObj = {};
  const options = {month: "2-digit", day: "2-digit"};
  // Deposit items to dateAmountArr
  chartList.forEach(item => {
    if (item.status !== "completed") return;
    const itemDAte =  new Intl.DateTimeFormat("fa-IR", options).format(item.date);
    const itamAmount = (item.type === "deposit") ? item.amount : (-1)*item.amount;
    const obj = {
      amount: itamAmount,
      date: itemDAte,
    };
    dateAmountArr.push(obj);
  });
  // dateAmountArr items to dateAmountObj
  dateAmountArr.forEach(item => {
    const objKeys = Object.keys(dateAmountObj);
    if (objKeys.includes(item.date)) {
      dateAmountObj[item.date].push(item.amount);
    } else {
      dateAmountObj[item.date] = [];
      dateAmountObj[item.date].push(item.amount);
    }
  });
  creditChartData.labels = Object.keys(dateAmountObj); // labels['str',...]
  const dateAmountObjValues = Object.values(dateAmountObj); // data[Number,...]
  creditChartData.labels.sort((a, b) => a.localeCompare(b));
  if ((filterParameters.startDefaultTimestamp - filterParameters.fromDateTimestamp) >= 0) {
    // Adding Date zero
    creditChartData.labels.unshift('ابتدا');
    creditChartData.datasets[0].data.unshift(0);
  } else {
    //
    if (chartList.length === 0) {
      const balance = chartListAll.findLast((i) => i.date < filterParameters.toDateTimestamp)['balance_after'];
      const balanceIndex = chartListAll.findIndex((i) => i['balance_after'] === balance);
      creditChartData.datasets[0].data.unshift(0);
      creditChartData.datasets[0].data.unshift(chartListAll[balanceIndex]['balance_after']);
      const datefirst = document.getElementById('pcal-start-date').value.split('/');
      const dateLast = document.getElementById('pcal-end-date').value.split('/');
      creditChartData.labels.unshift(toPersianNumbers(dateLast[1] + '/' + dateLast[2]));
      creditChartData.labels.unshift(toPersianNumbers(datefirst[1] + '/' + datefirst[2]));
    } else {
      creditChartData.labels.unshift('ابتدا');
      if (chartListAll[0].date === chartList[0].date) {
        creditChartData.datasets[0].data.unshift(0);
      } else {
        const balance = chartListAll[chartListAll.findIndex((i) => i.date === chartList[0].date)-1]['balance_after'];
        creditChartData.datasets[0].data.unshift(balance);
      }
    }
  }
  for (i of dateAmountObjValues) {
    const chartItems = i.reduce((total, num) => total + num, 0);
    creditChartData.datasets[0].data.push(chartItems);
  }
  creditChartData.datasets[0].data.forEach((item, index, arr) => {
    if (index > 0) arr[index] = item + arr[index-1];
  });
  return;
}

function drawCreditChart() {
  const ctx = document.getElementById('creditChart').getContext('2d');
  creditChart = new Chart(ctx, creditChartConfig);
}

function destroyCreditChart() {
  if (creditChart) creditChart.destroy();
}

function renderTransactionsTable() {
  console.log('Transactions Table Rendered!');
  const tableBody = document.getElementById('transactions-table-body');
  tableBody.innerHTML = '';
  if (trxList.length === 0) return; 
  for(let i of trxList) {
    const tdDate = (() => {
      let options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tehran",
      };
      const strDate = new Intl.DateTimeFormat("fa-IR", options).format(i.date);
      return `<td style="direction:ltr;text-align:left;">${strDate.replace(/, /g, " - ")}</td>`;
    })();
    const tdType = (() => {
      switch (i.type) {
        case "deposit":
          return '<td><i class="las la-money-check-alt deposit"></i> واریز</td>';
        case "purchase":
          return '<td><i class="las la-shopping-cart purchase"></i> خرید</td>';
        default:
          return "<td></td>";
      }
    })();
    const tdMoney = (() => {
      switch (i.type) {
        case "deposit":
          return `<td class="positive">${new Intl.NumberFormat().format(i.amount)}</td>`;
        case "purchase":
          return `<td class="negative">${new Intl.NumberFormat().format(i.amount)}</td>`;
        default:
          return "<td></td>";
      }
    })();
    const tdDescription = `<td>${i.description}</td>`;
    const tdStatus = (() => {
      switch (i.status) {
        case "completed":
          return `<td><span class="status completed"></span></td>`;
        case "incompleted":
          return `<td><span class="status pending"></span></td>`;
        default:
          return "<td></td>";
      }
    })();
    const trHTML = `
      <tr>
        ${tdDate}
        ${tdType}
        ${tdMoney}
        ${tdDescription}
        ${tdStatus}
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", trHTML);
  }
};

function prepareDateFilters() {
  let pcalStartDateFix = (() => {
    let timeStamp = persianToGregorianTimestamp(pcalStartDate.value);
    let dateConvert = new Date(timeStamp);
    return dateConvert.toString().includes('03:30:00') ? timeStamp - 12600000 : timeStamp;
  })();
  let pcalEndDateFix = (() => {
    let timeStamp = persianToGregorianTimestamp(pcalEndDate.value);
    let dateConvert = new Date(timeStamp);
    return dateConvert.toString().includes('03:30:00') ? timeStamp - 12600000 : timeStamp;
  })();
  // Reading date and time from calendar inputs
  filterParameters.fromDateTimestamp = (/^\d{4}\/\d{1,2}\/\d{1,2}$/).test(pcalStartDate.value) 
    ? pcalStartDateFix
    : filterParameters.startDefaultTimestamp;
  filterParameters.toDateTimestamp = (/^\d{4}\/\d{1,2}\/\d{1,2}$/).test(pcalEndDate.value) 
    ? pcalEndDateFix + 86399999
    : filterParameters.endDefaultTimestamp + 86399999 ;
  return ( filterParameters.toDateTimestamp >= filterParameters.fromDateTimestamp);
}

function applyTransactionsTableFilter() {
  let controlDateInput = prepareDateFilters() ? true : false;
  if (controlDateInput === false) {
    notification(
                  "تاریخ ابتدایی بازه زمانی باید پیش از تاریخ انتهایی آن تنظیم شود.",
                  "",
                  "#ff3713",
                  "#fff",
                  "#030000",
                  "wrong-date-input",
                  "notif-danger"
              );
    return;
  };
  trxList = [];
  chartList = [];
  const transactionsType = (() => {
    switch (filterParameters.transactionsType) {
      case "deposit":
        return "deposit";
      case "purchase":
        return "purchase";
      default:
        return undefined;
    }
  })();
  const transactionsState = (() => {
    switch (filterParameters.transactionsState) {
      case "completed":
        return "completed";
      case "pending":
        return "incompleted";
      default:
        return undefined;
    }
  })();
  const lowerDateRange = filterParameters.fromDateTimestamp;
  const upperDateRange = filterParameters.toDateTimestamp;

  const dbPromise = new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${username}`,1);
    dbOpenRequest.addEventListener('success', (e) => {
      let db = e.target.result;
      let transactionsTX = db.transaction(['transactions'], 'readonly');
      transactionsTX.onerror = (err) => console.warn(err);
      let transactionsStore = transactionsTX.objectStore('transactions');
      const rangeObject = IDBKeyRange.bound(lowerDateRange, upperDateRange);
      const transactionsRequest = transactionsStore.openCursor(rangeObject);
      transactionsRequest.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (!cursor) return renderTransactionsTable() ;
        const transaction = cursor.value;
        let considerType = true;
        let considerState = true;
        let match = true;
        if (typeof transactionsType === 'undefined') considerType = false;
        if (typeof transactionsState === 'undefined') considerState = false;

        considerType && ((transaction.type === transactionsType) || (match = false));
        considerState && ((transaction.status === transactionsState) || (match = false));

        if (match) trxList.push(transaction);
        cursor.continue();
      };
      transactionsRequest.onerror = (err) => console.warn(err);
    });
  });

  const dbPromiseChart = new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${username}`,1);
    dbOpenRequest.addEventListener('success', (e) => {
      let db = e.target.result;
      let transactionsTX = db.transaction(['transactions'], 'readonly');
      transactionsTX.onerror = (err) => console.warn(err);
      let transactionsStore = transactionsTX.objectStore('transactions');
      const rangeObject = IDBKeyRange.bound(lowerDateRange, upperDateRange);
      const transactionsRequest = transactionsStore.openCursor(rangeObject);
      transactionsRequest.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (!cursor) {
          let trxStore = transactionsTX.objectStore('transactions');
          const trxStoreReq = trxStore.getAll();
          trxStoreReq.onsuccess = (ev) => {
            // console.log('allTrx', ev.target.result)
            chartListAll = ev.target.result;
            return (() => {
              destroyChart();
              prepareChartData();
              drawChart();
              destroyCreditChart();
              prepareCreditChartData();
              drawCreditChart();
            })();
          };
          return;
        };
        const transaction = cursor.value;
        let considerType = false;
        let considerState = false;
        let match = true;
        if (typeof transactionsType === 'undefined') considerType = false;
        if (typeof transactionsState === 'undefined') considerState = false;

        considerType && ((transaction.type === transactionsType) || (match = false));
        considerState && ((transaction.status === transactionsState) || (match = false));

        if (match) chartList.push(transaction);
        cursor.continue();
      };
      transactionsRequest.onerror = (err) => console.warn(err);
    });
  });

}

function discardTransactionsTableFilter() {
  pcalStartDate.value = filterParameters.startDefaultFa;
  pcalEndDate.value = filterParameters.endDefaultFa;
  document.querySelector('.type-filter .select-items > div:first-child').click();
  document.querySelector('.status-filter .select-items > div:first-child').click();
  applyTransactionsTableFilter();
}

// Convert Persian date to Gregorian (with AMIB persianCalendar)
function persianToGregorianTimestamp(str) {
    let persianFormatDate = str;
    let seperatedFormatArray = persianFormatDate.split("/");
    // First convert Persian to Julian Day (pYear, pMonth, pDay)
    let jd = persianToJD(Number(seperatedFormatArray[0]), Number(seperatedFormatArray[1]), Number(seperatedFormatArray[2]));
    // Then convert Julian Day to Gregorian
    const gregorianDate = jdToGregorian(jd);
    return Date.parse(gregorianDate.join("-"));
}

{
  const closeAllSelect = function(elmnt) {
    /*a function that closes all select boxes in the document,
    except the current select box:*/
    let x, y, i, xl, yl, arrNo = [];
    x = document.getElementsByClassName("select-items");
    y = document.getElementsByClassName("select-selected");
    xl = x.length;
    yl = y.length;
    for (i = 0; i < yl; i++) {
      if (elmnt == y[i]) {
        arrNo.push(i)
      } else {
        y[i].classList.remove("select-arrow-active");
      }
    }
    for (i = 0; i < xl; i++) {
      if (arrNo.indexOf(i)) {
        x[i].classList.add("select-hide");
      }
    }
  }

  let x, i, j, l, ll, selElmnt, a, b, c;
  /*look for any elements with the class "custom-select":*/                 // Outputs :
  x = document.getElementsByClassName("custom-select");                     // HTMLCollection [div.custom-select]
  l = x.length;                                                             // 1
  for (i = 0; i < l; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];                      // <select></select>
    ll = selElmnt.length;                                                   // number of <option></option> elements
    /*for each element, create a new DIV that will act as the selected item:*/
    a = document.createElement("DIV");                                      // for: <div class="select-selected">"selected option's innerHTML"</div>
    a.setAttribute("class", "select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;       // created: <div class="select-selected">"selected option's innerHTML"</div>
    x[i].appendChild(a);                                                    // adds the <div class="select-selected"> after <select> element within the custom select
    /*for each element, create a new DIV that will contain the option list:*/
    b = document.createElement("DIV");                                      // want to create :
    b.setAttribute("class", "select-items select-hide");                    // for: <div class="select-items select-hide"> <div>option items</div>... </div>
    for (j = 1; j < ll; j++) {                                              // creates '<div>option items</div>...' elements 
      /*for each option in the original select element except first one,
      create a new DIV that will act as an option item:*/
      c = document.createElement("DIV");
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", function(e) {
          /*when an item is clicked, update the original select box,
          and the selected item:*/
          let y, i, k, s, h, sl, yl;
          s = this.parentNode.parentNode.getElementsByTagName("select")[0];     // The original <select> element
          sl = s.length;                                                        // The number of <option> elements
          h = this.parentNode.previousSibling;                                  // The 'div.select-selected' element
          for (i = 0; i < sl; i++) {
            if (s.options[i].innerHTML == this.innerHTML) {                     // select the selected option in original <select> element
              s.selectedIndex = i;
              h.innerHTML = this.innerHTML;
              y = this.parentNode.getElementsByClassName("same-as-selected");   // removes the last <div class="same-as-selected">option items</div>... element
              yl = y.length;
              for (k = 0; k < yl; k++) {
                y[k].removeAttribute("class");
              }
              this.setAttribute("class", "same-as-selected");                   // sets the last <div class="same-as-selected">option items</div>... element
              break;
            };
          };
          h.click();
          try {
            if (s[s.selectedIndex].getAttribute('data-transactions-type')) {
              filterParameters.transactionsType = s[s.selectedIndex]?.getAttribute('data-transactions-type');
            } else {
              throw undefined;
            };
          } catch (e) {
            filterParameters.transactionsState = s[s.selectedIndex]?.getAttribute('data-transactions-state');
          }
      });
      b.appendChild(c);                                                // makes: <div class="select-items select-hide"> <div>option items</div>... </div>
    }
    x[i].appendChild(b);                                               // attaches created custom fields to corresponding <select> elements
    a.addEventListener("click", function(e) {
      /*when the select box is clicked, close any other select boxes,
      and open/close the current select box:*/
      e.stopPropagation();
      closeAllSelect(this);
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
    });
  }

  const optionSelectorDefault = Array.from(document.querySelectorAll(".select-items"))
    .forEach((elm) => {elm.childNodes[0].setAttribute("class", "same-as-selected")});
  
  /*if the user clicks anywhere outside the select box, then close all select boxes:*/
  document.addEventListener("click", closeAllSelect);
}

// Filter submiter and discarder
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('apply-transactions-filter').onclick = applyTransactionsTableFilter;
  document.getElementById('discard-transactions-filter').onclick = discardTransactionsTableFilter;
  setTimeout(() => applyTransactionsTableFilter(), 1000);
});

// window load Event listeners
window.addEventListener('load', createOrderLog);
window.addEventListener('load', createDashboardLog);
window.addEventListener('load', renderUserAddresses);
window.addEventListener('load', renderReviews);
window.addEventListener('load', userTransactionsLog);
window.addEventListener('load', renderFavoriteProducts);

// Field checker helper
const requiredInput = (element) => {
  if (element.value.length == 0) {
    element.setCustomValidity("اين قسمت نمی تواند خالی باشد");
  } else if (element.value.length >= 1 || element.validity.patternMismatch) {
    element.setCustomValidity("");
  }
};

// Name changer submitter
const nameChangerBtn = document.querySelector('button[name="new-name"]');
const nameChangerInp = document.querySelector('input[name="change-name"]');
nameChangerBtn.addEventListener('click', (ev) => {
  // ev.preventDefault();
  requiredInput(nameChangerInp);
  const newName = nameChangerInp.value;
  if (/^(?:^(?:[آ-یA-Za-z\u0600-\u06FF]{3,})+(?:\s[آ-یA-Za-z\u0600-\u06FF]*){0,4})$/.test(newName)) {
    updateUserName(username, newName)
      .then(() => console.log('Name updated successfully'))
      .catch(error => console.error(error));
  } else {
    notification("نام خود را به فارسی یا انگلیسی شامل حداقل ۳ حرف وارد کنید.", "&iscr;", "rgb(120, 184, 236)", "rgb(14, 9, 9)", "rgb(0, 68, 255)", "name-field-info-01", "notif-info");
    element.setCustomValidity("");
  }

  function updateUserName(username, newName) {
    return new Promise((resolve, reject) => {
      const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
      dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
      dbCurrentUserOpenRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['profile'], 'readwrite');
        const store = transaction.objectStore('profile');
        const getRequest = store.get(1);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          data.name = newName;
          const updateNameRequest = store.put(data, 1);
          updateNameRequest.onerror = () => reject('Error updating name');
        };
        getRequest.onerror = () => reject('Error fetching profile');
      };
      
      const dbUsersOpenRequest = window.indexedDB.open('users', 1);
      dbUsersOpenRequest.onerror = () => reject('Error opening database');
      dbUsersOpenRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction('validUsers', 'readwrite');
        const store = transaction.objectStore('validUsers');
        const getRequest = store.get(`${username}`);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          data.name = newName;
          const updateNameRequest = store.put(data);
          updateNameRequest.onsuccess = () => resolve();
          updateNameRequest.onerror = () => reject('Error updating name');
        };
        getRequest.onerror = () => reject('Error fetching profile');
      };
    });
  }
});

// Password changer submitter
const passChangerBtn = document.querySelector('button[name="new-pass"]');
const passChangerInp = document.querySelector('input[name="change-pass"]');
passChangerBtn.addEventListener('click', (ev) => {
  passChangerInp.value = passChangerInp.value.replaceAll(/[^A-Za-z\d@$!%*?&^\s]+/g,"");
  requiredInput(passChangerInp);
  const newPass = passChangerInp.value;
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^\s])*(?!^\d+$)[A-Za-z\d@$!%*?&^\s]{8,}$/.test(newPass)) {
    updatePass(username, newPass)
      .then(() => console.log('Password updated successfully'))
      .catch(error => console.error(error));
  } else {
    if (passChangerInp.value.length >= 1) passChangerInp.setCustomValidity("مقدار وارد شده صحیح نمی‌باشد.");
  }

  function updatePass(username, newPass) {
    return new Promise((resolve, reject) => {
      const dbUsersOpenRequest = window.indexedDB.open('users', 1);
      dbUsersOpenRequest.onerror = () => reject('Error opening database');
      dbUsersOpenRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction('validUsers', 'readwrite');
        const store = transaction.objectStore('validUsers');
        const getRequest = store.get(`${username}`);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          data.password = newPass;
          const updatePasswordRequest = store.put(data);
          updatePasswordRequest.onsuccess = () => resolve();
          updatePasswordRequest.onerror = () => reject('Error updating Password');
        };
        getRequest.onerror = () => reject('Error fetching profile');
      };
    });
  }
});

// controller tabs click event listeners

document.querySelector('li[data-controller-num="1"]').addEventListener('click', (e) => {
  const divTabDisplayTest = window.getComputedStyle(document.querySelector('[data-tab-num="1"]'));
  if (divTabDisplayTest.display === 'none') {
    createDashboardLog();
  }
});

// Activate data-tabs and Brighten the background color of control tab links when activated

const tablinks = document.querySelectorAll('li[data-controller-num]');
for (let i = 0; i < tablinks.length; i++) {
  tablinks[i].addEventListener('click', function(event) {
    let tabs;
    tabs = document.querySelectorAll('div[data-tab-num]');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].className = 'display-none';
    }
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = '';
    }
    const currentTarget = event.currentTarget;
    currentTarget.className = 'active';
    const currentTabName = currentTarget.querySelector('div > span');
    const currentTargetNumber = event.currentTarget.getAttribute("data-controller-num");
    const destinationTab = document.querySelector(`div[data-tab-num='${currentTargetNumber}']`);
    destinationTab.className = destinationTab.className.replace('display-none', 'active');
    const userControlTabTitle = document.querySelector('.user-control-tab-title');
    userControlTabTitle.textContent = currentTabName.textContent;
    const currentUrl = new URL(window.location.origin);
    const state = {
        url: currentUrl + 'dashboard.html' + `#${currentTarget.id}`,
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
        action: 'state-updated'
    };
    window.history.replaceState(state, '', currentUrl + 'dashboard.html' + `#${currentTarget.id}`);
  });
}

// sidebar expander on mobile size screen
const sideBar = document.querySelector('.dashboard-control-tab-inner');
const sideBarExpand = document.getElementById('side-bar-toggle');

sideBarExpand.addEventListener('click', () => {
  sideBarExpand.classList.toggle("activated");
  sideBar.classList.toggle("expand");
});
sideBarExpand.addEventListener('blur', (e) => {
  sideBarExpand.classList.remove("activated");
  sideBar.classList.remove("expand");
});

document.addEventListener('DOMContentLoaded', () => {
  if ((new URL(window.location)).hash) {
      const newUrl = new URL(window.location).hash;
      document.getElementById(newUrl.substring(1)).click();
      setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
      }, 10);
  }
});

