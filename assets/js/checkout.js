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

const accordions = document.querySelectorAll(".cart-accordion");
for (let i = 0; i < accordions.length; i++) {
  accordions[i].firstElementChild.addEventListener("click", function (e) {
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

// Cart contents functionality

async function cartBill() {
  // Cart element recently added to the 'navbar1'
  const cartEl = document.getElementById("cart-table");
  const cartOrdersEl = document.getElementById('cart-orders-list');
  const cartContainer = document.getElementById("bill").querySelector('ul.cart-content');
  const cartCounterBadge = document.getElementById('navbar1').shadowRoot.querySelector('.cartCount');
  // Cart Summary
  let cartTotal,
      cartTax,
      cartShipping,
      cartBenefit,
      cartOverall,
      cartTotalLastValue,
      cartTaxLastValue,
      cartShippingLastValue,
      cartBenefitLastValue,
      cartOverallLastValue;
  
  // Cart array to hold items
  let cartArr = [];

  // Calculate total and count
  let total = 0;
  let count = 0;
  // Calculate total
  function calculateTotal() {
    const totalProduct = cartArr.reduce((total, item) => total + (item.price * item.quantity), 0);
    const taxes = 0.1 * totalProduct;
    const transport = Math.min(total * 0.1, cartArr.length * 750000);
    const benefits = calculateBenefit();
    return totalProduct + taxes + transport - benefits;
  }
  function calculateBenefit() {
    return cartArr.reduce((total, item) => total + (item.benefit * item.quantity), 0);
  }
  
  let productsObject = {
    products: [],
    getName: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      return toPersianNumbers(this.products[index].name);
    },
    getImage: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      return this.products[index].image;
    },
    getPrice: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      return this.products[index].discountedPrice;
    },
    sellText: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      // Checking  if the product is in the "ويژه" category
      if (this.products[index].categoriesId.includes(8)) {
        return `
            <span class="price-net price-count special-sell order-price-dot">${this.products[index].discountedPrice}</span>`;
      } else {
          return `
            <span class="price-net price-count normal-sell order-price-dot">${this.products[index].price}</span>`;
      };
    },
    quantity: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      return this.products[index].quantity;
    },                       
  };
  let db = null;
  const cartDBPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(`${username}`, 1);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
  // Transaction maker
  function makeTX(storeName, mode) {
    let tx = db.transaction(storeName, mode);
    tx.onerror = (err) => {
      console.warn(err);
    };
    return tx;
  }
  // Function to get data
  async function getUserCartItems() {
    db = await cartDBPromise;
    const readCartTX = makeTX('cart', 'readonly');
    const store = readCartTX.objectStore('cart');
    // Use the index for querying
    const index = store.index('dateIdx');
    const request = index.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        console.log(event.target.result);
        resolve(event.target.result);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }
  const materialText = (products) => {
    let text;
    switch(products.material){
      case 9: 
        text = 'چوبی';
        break;
      case 10: 
        text = 'فلزی';
        break;
      default: 
        text = '';
    }
    return text;
  };
  const fabricText = (products) => {
    let text = "با رویه ";
    switch(products.fabric){
      case 1:
        text += "چرمی";
        break;
      case 2:
        text += "مخملی";
        break;
      case 3:
        text += "کتانی";
        break;
      case 4:
        text += "شمعی";
        break;
      default: 
        text = '';
    }
    return text;
  };
  const colorText = (products) => {
    let text;
    switch(products.color){
      case 1:
        text = "سفيد";
        break;
      case 2:
        text = "سياه";
        break;
      case 3:
        text = "سبز";
        break;
      case 4:
        text = "زرد";
        break;
      case 5:
        text = "آبی";
        break;
      case 6:
        text = "قرمز";
        break;
      case 7:
        text = "خاکستری";
        break;
      case 8:
        text = "بنفش";
        break;
      default: 
        text = '';
    }
    return text;
  };
  const productObject = () => {
    let db = null;
    let product;
    const dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open('db', 1);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
    return async function getProductItems(id, index) {
      try {
        db = await dbPromise;
        const productTX = db.transaction('products', 'readonly');
        const productStore = productTX.objectStore('products');
        const productRequest = productStore.get(id);
        product = await new Promise((resolve, reject) => {
            productRequest.onsuccess = (event) => resolve(event.target.result);
            productRequest.onerror = (event) => reject(event.target.error);
        });
        // reading original products information from database
        let productsArrayPush = () => {
          if (productsObject.products.length !== 0) {
            let existedProductObject = productsObject.products.find(item => item.id === id);
            (existedProductObject === undefined) ? productsObject.products.push(product) : undefined;
          } else {
            productsObject.products.push(product);
          };
        };
        productsArrayPush();
        cartArr[index].price = product.discountedPrice;
        // Checking  if the product is in the "ويژه" category
        if (product.categoriesId.includes(8)) {
          cartArr[index].benefit = (product.price - product.discountedPrice);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      }
    }
  };
  let loadProducts = productObject();
  cartArr = await getUserCartItems();

  // Wait for ALL products to load before continuing
  console.log('Loading products...', Date.now());
  const productPromises = cartArr.map((item, index) => loadProducts(item.id, index));
  await Promise.all(productPromises);
  
  console.log('All products loaded:', productsObject.products);
  console.log('Products object:', productsObject);
  console.log('cart:', cartArr);

  let innerHTMLTextArr = await cartArr.map(products => {
    let itemPrice;
    let itemTotal;
    itemPrice = productsObject?.getPrice(products.id);
    itemTotal = itemPrice * products.quantity;
    total += itemTotal;
    count += products.quantity; // Cart badge indicator
  
    return `
        <tr class="user-order" data-product-id="${products.id}" data-added-timestamp="${products.date}">
          <td>
            <a href="javascript:void(0)" class="delete-from-cart">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128;" xml:space="preserve">
                <g><path d="M101.682,32.206L69.887,64l31.795,31.794l-5.887,5.888L64,69.888l-31.794,31.794l-5.888-5.888L58.112,64 L26.318,32.206l5.888-5.888L64,58.112l31.794-31.794L101.682,32.206z"></path></g>
              </svg>
            </a>
          </td>
          <td>
            <a href="javascript:void(0)" class="product-name">
              <img src="assets/images/p/${productsObject?.getImage(products.id)}" alt="${productsObject?.getName(products.id)}" tabindex="-1">
            </a>
          </td>
          <td class="product-name">
            <span>${productsObject?.getName(products.id)} ${materialText(products)} ${fabricText(products)} ${colorText(products)}</span>
          </td>
          <td class="product-price" data-title="قیمت">
            ${productsObject?.sellText(products.id)}
          </td>
          <td class="product-quantity" data-stock-quantity="${productsObject?.quantity(products.id)}" data-title="تعداد">
            <div class="product-quantity" data-stock-quantity="5">
              <button class="quantity-btn minus">
                ${(()=>{
                  if (products.quantity === 1) {
                    return '<i class="las la-trash"></i>';
                  } else {
                    return '<i class="las la-minus"></i>';
                  }
                })()}
              </button>
              <span>${products.quantity}</span>
              <button class="quantity-btn plus">
                <i class="las la-plus"></i>
              </button>
            </div>
          </td>
          <td data-title="جمع جزء">
            <span class="order-price-dot">${products.quantity * productsObject?.getPrice(products.id)}</span>
          </td>
        </tr>
    `;
  });
  cartOrdersEl.innerHTML = await innerHTMLTextArr.join('');
  // go to product page by clicking on product name
  cartOrdersEl.querySelectorAll('.product-name').forEach(elm => {
    elm.addEventListener('click', (e) => {
      e.preventDefault();
      const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
      const thisPageUrl = new URL(window.location);
      redirectToProduct(ProductId);
    
      function redirectToProduct(pId) {
        if (localStorage.getItem('productItemLink') && localStorage.getItem('productItemLink') !== undefined) {
            localStorage.removeItem('productItemLink');
        }
        if (localStorage.getItem('productStorePageLink') && localStorage.getItem('productStorePageLink') !== undefined) {
            localStorage.removeItem('productStorePageLink');
        }
        window.location.href = window.location.origin + '/product.html?productID=' + pId;
      }
    });
  });
  cartOrdersEl.querySelectorAll('button.quantity-btn.minus').forEach(button => {
    button.addEventListener('click', async function(e) {
      const id = Number(e.target.closest('[data-product-id]').dataset.productId);
      const currentProductId = Number(e.target.closest('[data-added-timestamp]').dataset.addedTimestamp);
      let product;
      let currentProduct;
      // productObject function
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
      // Retrieving current Product from user's cart and set it to the variable
      if (typeof username !== 'undefined') {
        let db = null;
        const dbOpenRequest = indexedDB.open(`${username}`, 1);
        dbOpenRequest.addEventListener('success', (e) => {
          db = e.target.result;
          const currentProductTX = db.transaction('cart', 'readwrite');
          const currentProductStore = currentProductTX.objectStore('cart');
          const currentProductRequest = currentProductStore.get(currentProductId);
          currentProductRequest.onsuccess = (event) => {
            currentProduct = event.target.result;
            if (currentProduct.quantity <= product.quantity && currentProduct.quantity > 1) {
              currentProduct.quantity = currentProduct.quantity - 1;
              let req = currentProductStore.put(currentProduct);
              req.onsuccess = (ev) => console.log('An item has been removed from the shopping cart.');
              req.onerror = (err) => console.warn(err);
              return;
            } else if (currentProduct.quantity <= product.quantity && currentProduct.quantity === 1) {
              let req = currentProductStore.delete(currentProductId);
              req.onsuccess = (ev) => console.log('An item has been removed from the shopping cart.');
              req.onerror = (err) => console.warn(err);
            }
          };
          currentProductRequest.onerror = (event) => {
            e.target.closest('[data-added-timestamp]').remove();
            reject(event.target.error);
          };
        });
        dbOpenRequest.addEventListener('error', (e) => console.log('Error : No product has been removed from the shopping cart.'));
      };
      cartBill();
      cart();
      cartChannel.postMessage("cart-updated");
    });
  });
  cartOrdersEl.querySelectorAll('button.quantity-btn.plus').forEach(button => {
    button.addEventListener('click', async function(e) {
      const id = Number(e.target.closest('[data-product-id]').dataset.productId);
      const currentProductId = Number(e.target.closest('[data-added-timestamp]').dataset.addedTimestamp);
      let product;
      let currentProduct;
      // productObject function
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
      // Retrieving current Product from user's cart and set it to the variable
      if (typeof username !== 'undefined') {
        let db = null;
        const dbOpenRequest = indexedDB.open(`${username}`, 1);
        dbOpenRequest.addEventListener('success', (e) => {
          db = e.target.result;
          const currentProductTX = db.transaction('cart', 'readwrite');
          const currentProductStore = currentProductTX.objectStore('cart');
          const currentProductRequest = currentProductStore.get(currentProductId);
          currentProductRequest.onsuccess = (event) => {
            currentProduct = event.target.result;
            if (currentProduct.quantity >= product.quantity) {
              currentProduct.quantity = product.quantity;
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
            } else if (currentProduct.quantity < product.quantity) {
              currentProduct.quantity = currentProduct.quantity + 1;
            }
            let req = currentProductStore.put(currentProduct);
            req.onsuccess = (ev) => console.log('Another number of the Product added to Cart.');
            req.onerror = (err) => console.warn(err);
          };
          currentProductRequest.onerror = (event) => {
            e.target.closest('[data-added-timestamp]').remove();
            reject(event.target.error);
          };
        });
        dbOpenRequest.addEventListener('error', (e) => console.log('Error : No product added to Cart.'));
      };
      cartBill();
      cart();
      cartChannel.postMessage("cart-updated");
    });
  });
  cartOrdersEl.querySelectorAll('a.delete-from-cart').forEach(button => {
    button.addEventListener('click', async function(e) {
      const id = Number(e.target.closest('[data-product-id]').dataset.productId);
      const currentProductId = Number(e.target.closest('[data-added-timestamp]').dataset.addedTimestamp);
      if (typeof username !== 'undefined') {
        let db = null;
        const dbOpenRequest = indexedDB.open(`${username}`, 1);
        dbOpenRequest.addEventListener('success', (e) => {
          db = e.target.result;
          const currentProductTX = db.transaction('cart', 'readwrite');
          const currentProductStore = currentProductTX.objectStore('cart');
          const currentProductRequest = currentProductStore.get(currentProductId);
          currentProductRequest.onsuccess = (event) => {
            let req = currentProductStore.delete(currentProductId);
            req.onsuccess = (ev) => console.log('An item has been removed from the shopping cart.');
            req.onerror = (err) => console.warn(err);
          };
          currentProductRequest.onerror = (event) => {
            e.target.closest('[data-added-timestamp]').remove();
            reject(event.target.error);
          };
        });
        dbOpenRequest.addEventListener('error', (e) => console.log('Error : No product has been removed from the shopping cart.'));
      };
      cartBill();
      cart();
      cartChannel.postMessage("cart-updated");
    });
  });
  cartCounterBadge.innerHTML = `<span data-value='${count}'>${toPersianNumbers(count)}</span>`;
  
  new Promise((res, rej) => {
    cartTotalLastValue = cartContainer.querySelector('div.cart-total span.price-count')?.textContent;
    cartTaxLastValue = cartContainer.querySelector('div.cart-tax span.price-count')?.textContent;
    cartShippingLastValue = cartContainer.querySelector('div.cart-shipping span.price-count')?.textContent;
    cartBenefitLastValue = cartContainer.querySelector('div.cart-benefit span[data-benefit-value]')?.textContent;
    cartOverallLastValue = cartContainer.querySelector('div.cart-overall span.price-count')?.textContent;
    cartContainer.innerHTML = '';
    let cartContainerInnerHTML = `
      <div class="cart-total">
        <span>مجموع</span>
        <span class="price-count">${cartTotalLastValue || 0}</span>
      </div>
      <div class="cart-tax">
        <span>مالیات</span>
        <span class="price-count">${cartTaxLastValue || 0}</span>
      </div>
      <div class="cart-shipping">
        <span>هزینه ارسال</span>
        <span class="price-count">${cartShippingLastValue || 0}</span>
      </div>
      <div class="cart-benefit">
        <span></span>
        <span class="price-count" data-benefit-value="${calculateBenefit()}">${cartBenefitLastValue || 0}</span>
      </div>
      <div class="cart-overall">
        <span>قابل پرداخت</span>
        <span class="price-count">${cartOverallLastValue || 0}</span>
      </div>
      <button class="cart-checkout" id="cart-checkout-payment" data-text-content="ثبت سفارش">
        ثبت سفارش
        <div class="loader"></div>
      </button>
    `;
    cartContainer.insertAdjacentHTML('afterbegin', cartContainerInnerHTML);
    cartTotal = cartContainer.querySelector('div.cart-total span.price-count');
    cartTax = cartContainer.querySelector('div.cart-tax span.price-count');
    cartShipping = cartContainer.querySelector('div.cart-shipping span.price-count');
    cartBenefit = cartContainer.querySelector('div.cart-benefit span[data-benefit-value]');
    cartOverall = cartContainer.querySelector('div.cart-overall span.price-count');
    res();
  })
   .then(() => {
     animateCounter(cartTotal, (cartTotalLastValue) ? cartTotalLastValue : 1, total);
     animateCounter(cartTax, (cartTaxLastValue) ? cartTaxLastValue : 1, total * 0.1);
     animateCounter(cartShipping, (cartShippingLastValue) ? cartShippingLastValue : 1, Math.min(total * 0.1, cartArr.length * 750000));
     animateCounter(cartBenefit, (cartBenefitLastValue) ? cartBenefitLastValue : 1, calculateBenefit());
     animateCounter(cartOverall, (cartOverallLastValue) ? cartOverallLastValue : 1, calculateTotal());

     const submitAndPayButton = document.getElementById('cart-checkout-payment');
     submitAndPayButton.removeEventListener('click', submitOrdersAndPay);
     submitAndPayButton.addEventListener('click', submitOrdersAndPay);

     async function submitOrdersAndPay() {
        
        if (typeof username === 'undefined' || username === 'notRegisteredUser') {
          notification(
            "برای استفاده از امکانات سایت لطفا ثبت نام کنید.", 
            "&bigstar;", 
            "#25789eff", 
            "#fff", 
            "#fffb1fff", 
            "check-user-login-01", 
            "notif-info"
          );
          return;
        };

        if (cartArr.length === 0) {
            notification(
                "سبد خرید شما در حال حاضر خالی است.",
                "&cross;",
                "#fbff13ff",
                "#000",
                "#ff391fff",
                "check-existing-address-error-01",
                "notif-danger"
            );
            return;
        }
        
        if (addressGetter() === false) {
            notification(
              "لطفا آدرس مورد نظر برای ارسال کالا را تعیین نمایید.",
              "&cross;",
              "#fbff13ff",
              "#000",
              "#ff391fff",
              "check-existing-address-error-01",
              "notif-danger"
            );
            return;
        }

        const addedOrdersQuantity = cartArr.length;
        const lastUsersBuyDate = Date.now();
        const totalCost = calculateTotal();
        const userBalance = await new Promise((resolve, reject) => {
          let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbOpenRequest.addEventListener('success', async (e) => {
            let db = e.target.result;
            console.log('success opening db.');
            let profileTX = db.transaction(['creditBalance'], 'readonly');
            profileTX.onerror = (err) => console.warn(err);
            // get credit data
            let creditBalanceStore = profileTX.objectStore('creditBalance');
            let creditBalanceRequest = creditBalanceStore.get(1);
            creditBalanceRequest.onsuccess = (ev) => resolve(ev.target.result);
            creditBalanceRequest.onerror = (err) => console.warn(err);
          });
        });

        if (totalCost > userBalance) {
            notification(
              "موجودی اعتبار حساب شما کمتر از مبلغ صورت حساب است.",
              "&cross;",
              "#fbff13",
              "#000000",
              "#ff391f",
              "insufficient-user-credit-01",
              "notif-warning"
            );
            return;
        }
        
        const orderSerial = Date.now().toString().slice(-6);
        // create orderObject
        const orderObject = cartArr.map(item => {
            const quantityNum = (()=>{
                if (item.quantity > 1) {
                   return `(تعداد ${item.quantity})`;
                } else {
                    return ``;
                }
            })();
            const id = item.id,
                  price = calculateItemTotal(item),
                  quantity = item.quantity,
                  color = item.color,
                  fabric = item.fabric,
                  material = item.material,
                  deliveryAddress = addressGetter(),
                  contractDate = new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`),
                  prepareDate = new Date(Date.now(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`) + 86400000 * 6),
                  transportDate = new Date(Date.now(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`) + 86400000 * 7),
                  exactProductName = `${productsObject?.getName(item.id)} ${materialText(item)} ${fabricText(item)} ${colorText(item)} ${quantityNum}`;

            return {
                id,
                serial: orderSerial,
                price,
                quantity,
                color,
                fabric,
                material,
                deliveryAddress,
                orderId: `${Date.now()}-${generateUUID()}`,
                contractDate,
                prepareDate,
                transportDate,
                exactProductName,
            };
        });
        
        const payment = (async () => {
          submitAndPayButton.disabled = true;
          submitAndPayButton.querySelector('.loader').style.visibility = 'visible';
          let purchaseOperation = await settingPurchaseTransaction();
          let creditUpdateOperation = await settingNewCreditBalance();
          let updateLastPurchaseDateOperation = await settingUserLastBuy();
          let UpdateOrdersOverallQuantityOperation = await settingOrderQuantity();
        })()
        .then(() => {
          notification(
            "سفارش شما ثبت گردید. با تشکر از خرید شما!",
            "&bigstar;",
            "#13ff46ff",
            "#000000ff",
            "#1f88ffff",
            "payment-accomplished-01",
            "notif-success"
          );
          emptyCart();
          setTimeout(() => {
            document.getElementById('trash-cart').click();
            window.location.href = window.location.origin + "/dashboard.html#data-controller-num-2";
          }, 4100);
        });

        // setting orders in progress
        async function settingInProgressOrder() {
            const dbOpenRequest =  window.indexedDB.open(`${username}`, 1);
            dbOpenRequest.addEventListener('success', async (e) => {
                let db = e.target.result;
                let orderTX = db.transaction(['orderOnProgress'], 'readwrite');
                orderTX.onerror = (err) => console.warn(err);
                let orderOnProgressStore = orderTX.objectStore('orderOnProgress');
                let orderOnProgressCountRequest = orderOnProgressStore.count();
                let orderOnProgressPromises = [];
                orderOnProgressCountRequest.onsuccess = (ev) => {
                    orderOnProgressPromises = orderObject.map(item => {
                        return new Promise((resolve, reject) => {
                            const request = orderOnProgressStore.add(item);
                            request.onsuccess = (e) => resolve(e.target);
                            request.onerror = () => reject(request.error);
                        });
                    });
                };
                orderOnProgressCountRequest.onerror = (err) => console.warn(err);
                return await Promise.all(orderOnProgressPromises);
            });
        }

        // setting credit transactions
        async function settingPurchaseTransaction() {
            let descriptions = null;
            if (orderObject.length === 1) {
                descriptions = "خرید محصول " + orderObject[0].exactProductName + ` - شماره سریال فاکتور ${orderSerial}#`;
            } else {
                descriptions = `خرید محصولات طبق فاکتور با شماره سریال ${orderSerial}#`;
            }
            const userNotes = document.getElementById("suggestion").querySelector('textarea').value;
            const transactionObject = {
                type: "purchase",
                amount: totalCost,
                description: descriptions,
                user_note: userNotes,
                status: "completed",
                date: Date.now(),
                order_id: `order${orderSerial}`,
                payment_method: "credit",
                balance_after: userBalance - totalCost,
            };

            // const receivedResponse = await sendData();
            // console.log(receivedResponse);

            // simulation: Sending payment data to server
            // async function sendData() {
            //   const request = new Request("https://jsonplaceholder.typicode.com/posts", {
            //           method: "POST",
            //           headers: {
            //             "Content-Type": "application/json"
            //           },
            //           body: JSON.stringify(transactionObject),
            //         });
            //   const response = await fetch(request);
            //   console.log(response.status);
            //   return await response.json();
            // }

            return new Promise((resolve, reject) => {
              const dbOpenRequest = window.indexedDB.open(`${username}`, 1);
              dbOpenRequest.addEventListener('success', (e) => {
                  let db = e.target.result;
                  let transactionsTX = db.transaction('transactions', 'readwrite');
                  transactionsTX.onerror = (err) => console.warn(err);
                  let transactionsStore = transactionsTX.objectStore('transactions');
                  let transactionsRequest = transactionsStore.add(transactionObject);
                  transactionsRequest.onerror = (err) => console.warn(err);
                  transactionsRequest.onsuccess = (e) => resolve(e.target.result);
              });
            });
        }

        // setting new credit balance
        async function settingNewCreditBalance() {
          return new Promise((resolve, reject) => {
            const balance = userBalance - totalCost;
            const dbOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbOpenRequest.addEventListener('success', (e) => {
                let db = e.target.result;
                let creditBalanceTX = db.transaction('creditBalance', 'readwrite');
                creditBalanceTX.onerror = (err) => console.warn(err);
                let creditBalanceStore = creditBalanceTX.objectStore('creditBalance');
                let creditBalanceRequest = creditBalanceStore.put(balance, 1);
                creditBalanceRequest.onerror = (err) => console.warn(err);
                creditBalanceRequest.onsuccess = (e) => resolve(e.target.result);
            });
          });
        }

        // emptying the cart
        async function emptyCart() {
            let db = null;
            const dbOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbOpenRequest.addEventListener('success', async (e) => {
              db = e.target.result;
              const cartTX = db.transaction('cart', 'readwrite');
              const store = cartTX.objectStore('cart');
              const clearRequest = store.clear();
              clearRequest.onsuccess = (event) => console.log('The user cart has been cleared.');
              clearRequest.onerror = (event) => reject(event.target.error);
            });
            dbOpenRequest.onerror = (event) => reject(event.target.error);
        }

        // Updating user's orders quantity
        async function settingOrderQuantity() {
          const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
          dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
          dbCurrentUserOpenRequest.onsuccess = (e) => {
            const db = e.target.result; // Declare inside callback
            let ordersThen = 0;
            const countTransaction = db.transaction(['orderCompleted', 'orderOnProgress', 'orderCanceled'], 'readonly');
            //
            const orderCompletedPromise = new Promise((res,rej) => {
              const orderCompletedStore = countTransaction.objectStore('orderCompleted');
              const orderCompletedCounter = orderCompletedStore.count();
              orderCompletedCounter.onerror = (err) => console.warn('Error in counting orderCompleted!', err);
              orderCompletedCounter.onsuccess = (e) => {
                const result = e.target.result;
                ordersThen += result;
                res();
              };
            });
            //
            const orderOnProgressPromise = new Promise((res,rej) => {
              const orderOnProgressStore = countTransaction.objectStore('orderOnProgress');
              const orderOnProgressCounter = orderOnProgressStore.count();
              orderOnProgressCounter.onerror = (err) => console.warn('Error in counting orderOnProgress!', err);
              orderOnProgressCounter.onsuccess = (e) => {
                const result = e.target.result;
                ordersThen += result;
                res();
              };
            });            
            //
            const orderCanceledPromise = new Promise((res,rej) => {
              const orderCanceledStore = countTransaction.objectStore('orderCanceled');
              const orderCanceledCounter = orderCanceledStore.count();
              orderCanceledCounter.onerror = (err) => console.warn('Error in counting orderCanceled!', err);
              orderCanceledCounter.onsuccess = (e) => {
                const result = e.target.result;
                ordersThen += result;
                res();
              };
            });
            //
            const promiseAll = Promise.all([orderCompletedPromise,orderOnProgressPromise,orderCanceledPromise]);
            promiseAll.then(() => {
              const transaction = db.transaction(['profile'], 'readwrite');
              const store = transaction.objectStore('profile');
              const getRequest = store.get(1);
              getRequest.onsuccess = (e) => {
                const profile = e.target.result;
                profile.ordersCountLength = ordersThen + addedOrdersQuantity;
                console.log(profile.ordersCountLength);
                const updateReq = store.put(profile, 1);
                updateReq.onerror = (err) => console.warn('Error in Updating users ordersCountLength!', err);
                updateReq.onsuccess = (e) => {
                  console.log('ordersCountLength:', profile.ordersCountLength);
                  return settingInProgressOrder();
                };
              };
            });
          };
        }

        // Updating user's last buy date & 
        async function settingUserLastBuy() {
          return new Promise((resolve, reject) => {
            const dbCurrentUserOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbCurrentUserOpenRequest.onerror = () => reject('Error opening database');
            dbCurrentUserOpenRequest.onsuccess = (e) => {
              const db = e.target.result; // Declare inside callback
              const transaction = db.transaction(['profile'], 'readwrite');
              const store = transaction.objectStore('profile');
              const getRequest = store.get(1);
              getRequest.onsuccess = (e) => {
                const profile = e.target.result;
                profile.lastBuyDate = lastUsersBuyDate;
                console.log(profile.lastBuyDate);
                const updateReq = store.put(profile, 1);
                updateReq.onerror = (err) => console.warn('Error in Updating users last buy date!', err);
                updateReq.onsuccess = (e) => {
                  console.log('Today:', profile.lastBuyDate);
                  resolve(profile.lastBuyDate);
                };
              };
            };
          });
        }

        // Getting user saved addresses
        function addressGetter() {
            const addressContainer = Array.from(document.querySelectorAll('.address-check-input'));
            if (addressContainer.length === 0) return false;
            if (typeof addressContainer.find(i => i.checked) === 'undefined') return false;
            const addressStr = addressContainer.find(i => i.checked).nextElementSibling.nextElementSibling.querySelector('p.exact-address').innerText;
            return addressStr;
        }

        // calculating any item's cost from total cost
        function calculateItemTotal(item) {
            const totalProduct = item.price * item.quantity;
            const taxes = 0.1 * totalProduct;
            const transport = Math.min(total * 0.1, cartArr.length * 750000) / (cartArr.length);
            const benefits = item.benefit * item.quantity;
            return totalProduct + taxes + transport - benefits;
        }

        // Uniq Id Generating by crypto API
        function generateUUID() {
          return crypto.randomUUID ? crypto.randomUUID() : 
            ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
              (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

     }

   });
  
  if (cartArr.length === 0) {
    cartOrdersEl.innerHTML = '';
    cartOrdersEl.innerHTML = `<div class="empty-cart">
      <a href="/store.html">
        سبد خرید شما در حال حاضر خالی است.
      </a>
    </div>`;
    cartContainer.querySelectorAll('span:last-child.price-count')
      .forEach(item => {
        item.style.minWidth = 'unset';
        item.style.display = 'initial';
      });
  };

  if (cartArr.length !== 0) {
    if (matchMedia("(width < 395px)").matches || matchMedia("(width >= 992px) and (width < 1200px)").matches) {
      cartContainer.querySelectorAll('span:last-child.price-count')
        .forEach(item => {
          item.style.minWidth = 'unset';
          item.style.display = 'block';
        });
    } else {
      cartContainer.querySelectorAll('span:last-child.price-count')
        .forEach(item => {
          item.style.minWidth = '156px';
          item.style.display = 'flex';
        });
    }
  }
  
  // divide numbers by 3
  const orderPrice = cartEl.querySelectorAll(".order-price-dot");
  for (let i of orderPrice) {
    i.textContent =
      parseInt(i.textContent
        .replace(/[^\d]+/gi, ''))
          .toLocaleString('fa-IR')
            .replace(/[٬]/gi, ',')
  };

  function animateCounter(element, lastValue, targetValue, duration = 1000) { 
    if (typeof lastValue === 'undefined') return false;
    if (parseInt(lastValue.toString().replace(/,/g, '')) === targetValue) return false;
    const startValue = (lastValue === 1) ? 1 : parseInt(lastValue.replace(/,/g, ''));
    const target = parseInt(targetValue.toString().replace(/,/g, ''));
    const range = target - startValue;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = progress => 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(startValue + (range * easeOut(progress)));
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString(); // Ensure final value is exact
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
};

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof username === 'undefined' || username === 'notRegisteredUser') return false;
    
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
            const addressContainer = document.querySelector('.address-container');
            if (addressesArr.length === 0) {
                addressContainer.innerHTML = `
                  <li class="dropdown-content">
		                <a href="/dashboard.html#data-controller-num-4">
		                 <span class="">برای ایجاد آدرس جدید کلیک کنید.</span>
		                </a>
		              </li>
                `;
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
                            <input type="radio" id="${radioBtnID}" name="customRadioInline" class="form-check-input address-check-input" ${checkedAddressAsDefault}>
                            <label class="form-check-label" for="${radioBtnID}"></label>
                            <div>
                                <div class="content-control">
                                    <div class="">
                                        <h6 class="">${type} <span>(استان ${state} - ${city})</span></h6> 
                                        <p class="badge">مقصد انتخابی</p>
                                        <p class="badge-idle"></p>
                                    </div>
                                    <p class="exact-address">${exact}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    addressContainer.appendChild(addressEl);
                });
                const editAddressButton = document.createElement('button');
                editAddressButton.dataset.textContent = "ویرایش آدرس‌ها";
                editAddressButton.onclick = () => window.location.href = window.location.origin + "/dashboard.html#data-controller-num-4";
                editAddressButton.innerHTML = `
                    <a href="/dashboard.html#data-controller-num-4">
		                  <span class="">ویرایش آدرس‌ها</span>
		                </a>
                `;
                addressContainer.appendChild(editAddressButton);
            };
        };

        const userAddresses = await addressGetter();
        renderAddresses(userAddresses);
    };
    const renderPaymentMethods = function () {
        const methodContainer = document.querySelector('.method-container');
        methodContainer.innerHTML = "";
        const methodEl = document.createElement('div');
        methodEl.className = "method-item";
        methodEl.innerHTML = `
            <div class="method-form-check">
                <input type="radio" id="credit-online" name="customRadioCredit" class="form-check-input" checked="">
                <label class="form-check-label" for="credit-online"></label>
                <div>
                    <div class="content-control">
                        <div class="">
                            <h6 class="">اعتبار حساب کاربری
                              <span>(پرداخت آنلاین)</span>
                            </h6> 
                            <p class="badge">روش انتخابی</p>
                            <p class="badge-idle"></p>
                        </div>
                        <p class="">افزایش اعتبار حساب از 
                          <a href="/dashboard.html#data-controller-num-6">داشبورد کاربری</a>
                        </p>
                    </div>
                </div>
            </div>
         `;
        methodContainer.appendChild(methodEl);
        const increaseCreditButton = document.createElement('button');
        increaseCreditButton.dataset.textContent = "افزایش اعتبار حساب";
        increaseCreditButton.onclick = () => window.location.href = window.location.origin + "/dashboard.html#data-controller-num-6";
        increaseCreditButton.innerHTML = `
            <a href="/dashboard.html#data-controller-num-6">
               <span class="">افزایش اعتبار حساب</span>
            </a>
        `;
        methodContainer.appendChild(increaseCreditButton);
    };
    
    renderUserAddresses();
    renderPaymentMethods();
    
    window.onresize = () => {
      const cartContainer = document.getElementById("bill").querySelector('ul.cart-content');
      if (matchMedia("(width < 395px)").matches || matchMedia("(width >= 992px) and (width < 1200px)").matches) {
        cartContainer.querySelectorAll('span:last-child.price-count')
          .forEach(item => {
            item.style.minWidth = 'unset';
            item.style.display = 'block';
          });
      } else {
        cartContainer.querySelectorAll('span:last-child.price-count')
          .forEach(item => {
            item.style.minWidth = '156px';
            item.style.display = 'flex';
          });
      }
    };
});
