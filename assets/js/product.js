window.addEventListener('unhandledrejection', () => console.log('unhandledrejection occurred'));

window.addEventListener('popstate', (event) => {
  if (event.state) return;
  window.history.back();
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

// implementing carousel function

const carouselFunc = function (CarouselContainerId, carouselItemsClass) {
  const carouselId = CarouselContainerId;
  const carousel = document.getElementById(`${carouselId}`);
  const prevBtn = carousel.querySelector('.prev-btn');
  const nextBtn = carousel.querySelector('.next-btn');
  const carouselItemsWrapper = carousel.querySelector('.carousel-items');
  const items = carousel.querySelector('.carousel-items').querySelectorAll(carouselItemsClass);

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
    // console.log('currentIndex', currentIndex)
    // console.log('itemCount', itemCount)
    // console.log('visibleItems', visibleItems())
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
  
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1 );
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentIndex < itemCount - visibleItems()) {
      scrollToIndex(currentIndex + 1);
    }
  });

  let touchInterval = null;

  prevBtn.addEventListener('touchstart', () => {
    touchInterval = setInterval(() => {
      scrollTouch(1);
      if (currentIndex > 0) {
        currentIndex--;
      }
    }, 800);
  });
  
  nextBtn.addEventListener('touchstart', () => {
    touchInterval = setInterval(() => {
      scrollTouch((-1));
      if (currentIndex < itemCount - visibleItems()) {
        currentIndex++;
      }
    }, 800)
  });

  prevBtn.addEventListener('touchend', () => {
    clearInterval(touchInterval);
    updateButtonsTouch();
  });
  
  nextBtn.addEventListener('touchend', () => {
    clearInterval(touchInterval);
    updateButtonsTouch();
  });
  
  prevBtn.addEventListener('dblclick', () => {
    if (currentIndex > 0) {
      scrollToIndex(0);
    }
  });
  
  nextBtn.addEventListener('dblclick', () => {
    if (currentIndex < itemCount - visibleItems()) {
      scrollToIndex(itemCount - visibleItems());
    }
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
    // event.target.style.willChange = 'auto';
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
    // console.log(currentIndex)
    // console.log(carouselItemsWrapper.scrollWidth - carouselItemsWrapper.clientWidth === (-1) * carouselItemsWrapper.scrollLeft)
  }
    
  function endScrolling(event) {
    // event.preventDefault();
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

// document.addEventListener('DOMContentLoaded', imageZoom);
window.addEventListener('resize', imageZoom);

function imageZoom() {
  const test = matchMedia("(width >= 1200px)").matches;
  const test1200px = matchMedia("(992px <= width < 1200px)").matches;
  const test992px = matchMedia("(768px <= width < 992px)").matches;
  const test768px = matchMedia("(544px <= width < 768px)").matches;
  const test544px = matchMedia("(width < 544px)").matches;
  const viewBoxParent = document.getElementById('img-container');
  viewBoxParent.querySelectorAll('.js-image-zoom__zoomed-area').forEach(el => el.remove());
  viewBoxParent.querySelectorAll('.js-image-zoom__zoomed-image').forEach(el => el.remove());
  document.getElementById('img-container').style.display = "block";
  if (test) {
    const options1 = {
        width: 475,
        height: 475,
        offset: {vertical: 0, horizontal: 0},
        zoomPosition: 'original',
    };
    new ImageZoom(document.getElementById("img-container"), options1);
  } else if (test1200px) {
    const options1 = {
        width: 380,
        height: 380,
        offset: {vertical: 0, horizontal: 0},
        zoomPosition: 'original',
    };
    new ImageZoom(document.getElementById("img-container"), options1);
  } else if (test992px) {
    viewBoxParent.querySelector('img').style.width = "100%";
    viewBoxParent.querySelector('img').style.height = "100%";
  } else if (test768px) {
    viewBoxParent.querySelector('img').style.width = "100%";
    viewBoxParent.querySelector('img').style.height = "100%";
  } else if (test544px) {
    viewBoxParent.querySelector('img').style.width = "100%";
    viewBoxParent.querySelector('img').style.height = "100%";
  }
}

// images album with zoom
const showImageProduct = function() {
  const viewBox = document.querySelector('#img-container img');
  const imageThumbs = document.querySelectorAll('.product-image-thumb img');
  imageThumbs.forEach(item => item.addEventListener('click', (e) => {
    viewBox.src = e.currentTarget.src;
    viewBox.dataset.albumId = e.currentTarget.dataset.albumId;
    viewBox.style.filter = e.currentTarget.style.filter;
    viewBox.style.transform = e.currentTarget.style.transform;
    document.querySelectorAll('.product-image-thumb').forEach(t => t.className = t.className.replace(' active', ''));
    e.currentTarget.parentElement.className += " active";
    viewBox.parentElement.querySelectorAll('.js-image-zoom__zoomed-area').forEach(el => el.remove());
    viewBox.parentElement.querySelectorAll('.js-image-zoom__zoomed-image').forEach(el => el.remove());
    imageZoom();
    viewBox.parentElement.querySelector('.js-image-zoom__zoomed-image').style.filter = e.currentTarget.style.filter;
    viewBox.parentElement.querySelector('.js-image-zoom__zoomed-image').style.transform = e.currentTarget.style.transform;
    viewBox.parentElement.querySelector('.js-image-zoom__zoomed-image').dataset.albumId = e.currentTarget.dataset.albumId;
  }));
}

//  slide show when screen width < 992px
let slideIndex = 1;

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function showSlides(n) {
  // let i;
  const slides = document.getElementsByClassName("imageSlides");
  const viewBox = document.querySelector('#img-container img');
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  viewBox.src = slides[slideIndex-1].src;
  viewBox.dataset.albumId = slides[slideIndex-1].dataset.albumId;
  viewBox.style.filter = slides[slideIndex-1].style.filter;
  viewBox.style.transform = slides[slideIndex-1].style.transform;
  viewBox.parentElement.querySelectorAll('.js-image-zoom__zoomed-area').forEach(el => el.remove());
  viewBox.parentElement.querySelectorAll('.js-image-zoom__zoomed-image').forEach(el => el.remove());
}

// modal images when screen width < 992px
let modalSlideIndex = 1;

function openModal() {
  document.getElementById("imagesModal").style.display = "block";
}

function closeModal() {
  document.getElementById("imagesModal").style.display = "none";
}

function plusModalSlides(n) {
  showModalSlides(modalSlideIndex += n);
}

function currentSlide(albumId) {
  createModalSlides();
  const carouselItemImages = document.querySelectorAll('#image-items-container .carousel-items img');
  const n = Array.from(carouselItemImages).findIndex(img => img.dataset.albumId === albumId);
  showSlides(slideIndex = n + 1);
  showModalSlides(modalSlideIndex = n + 1);
}

function createModalSlides() {
  // slides injection
  const carouselItemImages = document.querySelectorAll('#image-items-container .carousel-items img');
  const modalContent = document.querySelector('.modal-content');
  const slidesWrapper = modalContent.querySelector('.slides-wrapper');
  const dotsWrapper = modalContent.querySelector('.dots-wrapper .carousel-items');
  slidesWrapper.innerHTML = '';
  dotsWrapper.innerHTML = '';
  carouselItemImages.forEach(img => {
    const imageSrc = img.src;
    const imgAlbumId = img.dataset.albumId;
    const imageFilter = img.style.filter;
    const imageTransform = img.style.transform;
    const n = Array.from(carouselItemImages).findIndex(img => img.dataset.albumId === imgAlbumId) + 1;
    const modalSlide = document.createElement('div');
    modalSlide.className = 'modalSlides';
    modalSlide.innerHTML = `<img src="${imageSrc}" style="filter:${imageFilter}; transform:${imageTransform}">`;
    slidesWrapper.appendChild(modalSlide);
    const modalDot = document.createElement('div');
    modalDot.className = 'dots';
    modalDot.innerHTML = `<img class="demo" src="${imageSrc}" style="filter:${imageFilter}; transform:${imageTransform}" onclick="showModalSlides(${n})" alt="">`;
    dotsWrapper.appendChild(modalDot);
  });
  carouselFunc('modal-image-container', '.dots');
}

function showModalSlides(n) {
  modalSlideIndex = n;
  showSlides(slideIndex = n);
  let i;
  const modalSlides = document.getElementsByClassName("modalSlides");
  const dots = document.getElementsByClassName("demo");
  if (n > modalSlides.length) {modalSlideIndex = 1}
  if (n < 1) {modalSlideIndex = modalSlides.length}
  for (i = 0; i < modalSlides.length; i++) {
      modalSlides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  modalSlides[modalSlideIndex-1].style.display = "flex";
  dots[modalSlideIndex-1].className += " active";
}

// Comments and reviews part

// Persian date formatter
const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

// متغیرها
let currentReviews = [];
let productIdGlobal = 0;
let productNameGlobal = 0;
let userRating = 0;
const markHelpful = throttle(markHelpfulThrottle, 5000);
// تابع برای ایجاد ستاره‌ها
function createStars(rating, container, isInteractive = false) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i <= rating ? 'filled' : ''}`;
        star.innerHTML = i <= rating ? '★' : '☆';
        star.style.cursor = isInteractive ? 'pointer' : 'default';
        
        if (isInteractive) {
            star.addEventListener('mouseenter', () => highlightStars(i, container));
            star.addEventListener('click', () => setUserRating(i));
        }
        
        container.appendChild(star);
    }
    if (isInteractive) {
        container.addEventListener('mouseleave', () => highlightStars(userRating, container));
    }
}
// تابع برای هایلایت کردن ستاره‌ها هنگام هاور
function highlightStars(rating, container) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.innerHTML = index < rating ? '★' : '☆';
        star.className = `star ${index < rating ? 'filled' : ''}`;
    });
}
// تابع برای تنظیم امتیاز کاربر
function setUserRating(rating) {
    userRating = rating;
    document.getElementById('userRating').value = rating;
    highlightStars(rating, document.getElementById('ratingStars'));
}
// تابع برای محاسبه میانگین امتیاز
function calculateAverageRating() {
    if (currentReviews.length === 0) return 0;
    const totalReviewsValue = currentReviews.reduce((sum, review) => sum + review.rating + review.rating * review.helpful, 0);
    const totalReviews = currentReviews.reduce((sum, review) => sum + 1 + review.helpful, 0);
    return (totalReviewsValue / totalReviews).toFixed(1);
}
// Throttle of commenting
function throttle(mainFunction, delay) {
  let timerFlag = null;                 
  return (...args) => {                 
    if (timerFlag === null) {           
      mainFunction(...args);            
      timerFlag = setTimeout(() => {    
        timerFlag = null;               
      }, delay);                        
    }                                   
  };
}
// تابع برای نمایش نظرات
async function renderReviews() {
    const reviewsList = document.getElementById('reviewsList');
    const reviews = await getReviewsData(productIdGlobal);
    reviewsList.innerHTML = '';
    currentReviews = [];
    currentReviews = [...reviews.comments];
    currentReviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        if (typeof review.validUser !== 'undefined') reviewElement.setAttribute('data-site-user', review.validUser);
        const reviewFormattedDate = dateFormatter.format(new Date(review.date));
        reviewElement.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <span class="reviewer-name">${review.name}</span>
                    <div class="stars" id="stars-${review.id}"></div>
                </div>
                <span class="review-date">${reviewFormattedDate}</span>
            </div>
            <div class="review-content">
                ${review.content}
            </div>
            <div class="helpful-buttons">
                <button class="helpful-btn" onclick="markHelpful(${review.id})">
                    👍 موافقم (${review.helpful})
                </button>
            </div>
        `;
        reviewsList.appendChild(reviewElement);
        
        // ایجاد ستاره‌های امتیاز برای هر نظر
        createStars(review.rating, document.getElementById(`stars-${review.id}`));
    });
    // بروزرسانی آمار
    updateStats();
}
// تابع برای بروزرسانی آمار
function updateStats() {
    const totalReviews = currentReviews.length;
    const averageRating = calculateAverageRating();
    const stat5StarEl = document.getElementById('stat-star-5');
    const stat4StarEl = document.getElementById('stat-star-4');
    const stat3StarEl = document.getElementById('stat-star-3');
    const stat2StarEl = document.getElementById('stat-star-2');
    const stat1StarEl = document.getElementById('stat-star-1');
    const quantity5StarEl = document.getElementById('quantity-star-5');
    const quantity4StarEl = document.getElementById('quantity-star-4');
    const quantity3StarEl = document.getElementById('quantity-star-3');
    const quantity2StarEl = document.getElementById('quantity-star-2');
    const quantity1StarEl = document.getElementById('quantity-star-1');
    
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('averageRating').textContent = averageRating;
    
    // بروزرسانی ستاره‌های میانگین
    createStars(averageRating, document.getElementById('overallStars'));

    // Updating stat fill percentage

    // collection of sum of users comment rating per 1-5 rates
    let sumReviewRatingStars = {
      total5starReviews: 0,
      total4starReviews: 0,
      total3starReviews: 0,
      total2starReviews: 0,
      total1starReviews: 0,
    };
    // collection of users rating by feedback button in each comments per 1-5 rates
    let reviewHelpfulStars = {
      stat5star: [],
      stat4star: [],
      stat3star: [],
      stat2star: [],
      stat1star: [],
    };
    // sum of the collection of feedback ratings plus comment ratings
    let sumReviewStars = {
      sum5star: 0,
      sum4star: 0,
      sum3star: 0,
      sum2star: 0,
      sum1star: 0,
    };
    // rating bars elements
    const statBarEl = [
      stat5StarEl,
      stat4StarEl,
      stat3StarEl,
      stat2StarEl,
      stat1StarEl,
    ];
    // summary -of quantity of comment rating plus feedback rating- elements beside bars
    const quantityBarEl = [
      quantity5StarEl,
      quantity4StarEl,
      quantity3StarEl,
      quantity2StarEl,
      quantity1StarEl,
    ];
    if (currentReviews.length === 0) {
      for ( let i = 0; i <= statBarEl.length - 1; i++) {
        statBarEl[i].style.width = '0%';
        quantityBarEl[i].textContent = `(0)`;
      }
      return;
    };
    const totalReviewsValue = currentReviews.reduce((sum, review) => sum + review.rating + review.rating * review.helpful, 0);
    for (let i = 1; i <= 5; i++) {
      // counting users rating through comment submitting
      currentReviews.forEach(obj => {
        if (obj.rating === i) sumReviewRatingStars[`total${i}starReviews`]++;
      });
      // counting users feedback rating
      currentReviews.forEach(obj => {
        if (obj.rating === i) reviewHelpfulStars[`stat${i}star`].push(obj.helpful);
      });
      sumReviewStars[`sum${i}star`] = (reviewHelpfulStars[`stat${i}star`].length === 0) ? 0 : reviewHelpfulStars[`stat${i}star`].reduce((sum, n) => sum + n, 0) + sumReviewRatingStars[`total${i}starReviews`];
    }
    const sumReviewStarsArray = Object.values(sumReviewStars);
    const sumTotalReviewStars = sumReviewStarsArray.reduce((sum, n) => sum + n, 0);
    for ( let i = 0; i <= statBarEl.length - 1; i++) {
      let widthPercent = (sumReviewStarsArray[i] * 100 / sumTotalReviewStars).toFixed(0);
      statBarEl[i].style.width = widthPercent + '%';
      quantityBarEl[i].textContent = `(${sumReviewStarsArray[i]})`;
    }
}
// تابع برای علامت گذاری نظر به عنوان مفید
function markHelpfulThrottle(reviewId) {
    const review = currentReviews.find(r => r.id === reviewId);
    if (review) {
        review.helpful++;
    }
    // write changes of reviews to database
    const changedReviews = {
      id: productIdGlobal,
      comments: currentReviews,
    };
    setReviewsData(changedReviews);
    // update feedbacks on users comments
    if (typeof review.validUser !== 'undefined') setUserCommentFeedbackData(review, review.validUser);
    renderReviews();
}
// تابع برای افزودن نظر جدید
function addNewReview(event) {
    event.preventDefault();
    
    const userName = normalizePersianText(document.getElementById('userName').value);
    const reviewText = normalizePersianText(document.getElementById('reviewText').value);
    
    if (userRating === 0) {
        alert('لطفاً امتیاز خود را انتخاب کنید');
        return;
    }
    const newReview = {
        id: Date.now(),
        name: userName,
        rating: userRating,
        date: Date.now(),
        content: reviewText,
        helpful: 0,
        validUser: (typeof username !== 'undefined') ? username : undefined,
        validUserPname: (typeof username !== 'undefined') ? productNameGlobal : undefined,
        validUserPid: (typeof username !== 'undefined') ? productIdGlobal : undefined,
    };
    currentReviews.unshift(newReview);
    
    // ریست فرم
    document.getElementById('reviewForm').reset();
    userRating = 0;
    document.getElementById('userRating').value = 0;
    window.scrollTo({ top: document.querySelector('.mui-container').scrollHeight, behavior: 'smooth'});
    // ایجاد ستاره‌های تعاملی برای فرم
    createStars(0, document.getElementById('ratingStars'), true);

    // write changes of reviews to database
    const changedReviews = {
      id: productIdGlobal,
      comments: currentReviews,
    };
    setReviewsData(changedReviews);
    if (typeof username !== 'undefined') setUserReviewData(newReview);

    renderReviews();

    notification(
      "نظر شما با موفقیت ثبت شد", 
      "&check;", 
      "#3fdb20", 
      "#000", 
      "#0056f7ff", 
      "check-01", 
      "notif-success"
    );

    function normalizePersianText (text) {
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
    }
}

// Database Reviews Updater
async function setReviewsData(rev) {
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open('db', 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let reviewsTX = db.transaction(['reviews'], 'readwrite');
        reviewsTX.onerror = (err) => console.warn(err);
        let reviewsStore = reviewsTX.objectStore('reviews');
        let reviewsRequest = reviewsStore.put(rev);
        reviewsRequest.onsuccess = (ev) => {
          console.log('Database Reviews has been updated');
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

// Get reviews from database helper function
async function getReviewsData(pId) {
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open('db', 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let reviewsTX = db.transaction(['reviews'], 'readonly');
        reviewsTX.onerror = (err) => console.warn(err);
        let reviewsStore = reviewsTX.objectStore('reviews');
        let reviewsRequest = reviewsStore.get(pId);
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

// Site Users Reviews Saver
function setUserReviewData(rev) {
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let reviewsTX = db.transaction(['comment'], 'readwrite');
        reviewsTX.onerror = (err) => console.warn(err);
        let reviewsStore = reviewsTX.objectStore('comment');
        let reviewsRequest = reviewsStore.put(rev);
        reviewsRequest.onsuccess = (ev) => {
          console.log('Reviews has been updated');
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

// Feedbacks to Users' Reviews Updater
function setUserCommentFeedbackData(rev, user) {
  return new Promise((resolve, reject) => {
    let dbOpenRequest = window.indexedDB.open(`${user}`, 1);
    dbOpenRequest.addEventListener('success', async (e) => {
      try {
        const db = e.target.result;
        let reviewsTX = db.transaction(['comment'], 'readwrite');
        reviewsTX.onerror = (err) => console.warn(err);
        let reviewsStore = reviewsTX.objectStore('comment');
        let reviewsRequest = reviewsStore.put(rev);
        reviewsRequest.onsuccess = (ev) => {
          console.log('Feedbacks to User Reviews has been updated');
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

// مقداردهی اولیه هنگام لود صفحه
document.addEventListener('DOMContentLoaded', function() {
    // افزودن ایونت لیستنر برای فرم
    document.getElementById('reviewForm').addEventListener('submit', addNewReview);
});

pageLoad.finally(async () => {
  let productId;
  let product;
  if (localStorage.getItem('productItemLink') && localStorage.getItem('productItemLink') !== undefined) {
    // Search by product
    productId = JSON.parse(localStorage.getItem('productItemLink'));
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('productID', productId.toString());
    const state = {
        url: newUrl.href,
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
        action: 'new-history-entry'
    };
    window.history.pushState(state, '', newUrl);
    product = await getProductData(productId);
    if (typeof product === 'undefined') {
      window.location.href = window.location.origin + '/404.html';
    } else {
      renderProducts();
    }
    // clear local storage
    localStorage.removeItem('productItemLink');
  } else {
    if ((new URL(window.location)).searchParams.get('productID')) {
      if (/^[?productID=]+(?:[0-9])+$/.test(window.location.search)) {
        const newUrl = new URL(window.location);
        productId = Number(newUrl.searchParams.get('productID'));
        product = await getProductData(productId);
        if (typeof product === 'undefined') {
          window.location.href = window.location.origin + '/404.html';
        } else {
          renderProducts();
        }
      } else {
        window.location.href = window.location.origin + '/404.html';
      }
    } else {
      window.location.href = window.location.origin + '/store.html';
    }
  };

  if (localStorage.getItem('productStorePageLink') && localStorage.getItem('productStorePageLink') !== undefined) {
    const lastPageUrl = JSON.parse(localStorage.getItem('productStorePageLink'));
    const lastPageUrlObj = new URL(lastPageUrl);
    console.log(lastPageUrlObj.pathname)
    switch (lastPageUrlObj.pathname) {
      case '/store.html':
        document.querySelector('meta[content="3"]').previousElementSibling.href = lastPageUrl;
        const urlParams = new URLSearchParams(lastPageUrl);
        let catId;
        if (typeof urlParams.get('category') === 'undefined') {
          catId = urlParams.get('category');
        } else {
          catId = Number(urlParams.get('category'));
        }
        const span = document.querySelector('meta[content="3"]').previousElementSibling.querySelector('span');
        switch(catId) {
          case 1:
            span.textContent = 'مبلمان راحتی';
          break;
          case 2:
            span.textContent = 'مبلمان اداری';
          break;
          case 3:
            span.textContent = 'انواع میز';
          break;
          case 4:
          case 12:
          case 13:
            span.textContent = 'سرویس خواب';
          break;
          case 5:
          case 6:
            span.textContent = 'فرش و موکت';
          break;
          case 7:
            span.textContent = 'کالاهای جدید';
          break;
          case 8:
            span.textContent = 'فروش ويژه';
          break;
          case 9:
            span.textContent = 'کالاهای چوبی';
          break;
          case 10:
            span.textContent = 'کالاهای فلزی';
          break;
          case 11:
            span.textContent = 'انواع صندلی';
          break;
          default:
            span.textContent = 'سرویس مبلمان';
        }
        break;
      case '/checkout.html':
        document.querySelector('meta[content="3"]').previousElementSibling.href = window.location.origin + '/checkout.html';
        document.querySelector('meta[content="3"]').previousElementSibling.querySelector('span').textContent = 'سبد خرید';
        break;
      default:
        document.querySelector('meta[content="3"]').previousElementSibling.href = window.location.origin + '/store.html';
        document.querySelector('meta[content="3"]').previousElementSibling.querySelector('span').textContent = 'سرویس مبلمان';
    }
    localStorage.removeItem('productStorePageLink');
  } else {
    const span = document.querySelector('meta[content="3"]').previousElementSibling.querySelector('span');
    let productId = Number.parseInt(window.location.search.replace(/[^0-9]/g,""));
    let productDataFetched = await getProductData(productId);
    let categoryArrFetched = productDataFetched.categoriesId;
    let productCategoryId = categoryArrFetched[getRndInteger(0, categoryArrFetched.length-1)];
    document.querySelector('meta[content="3"]').previousElementSibling.href = window.location.origin + '/store.html?category=' + productCategoryId;
    switch(productCategoryId) {
        case 1:
          span.textContent = 'مبلمان راحتی';
        break;
        case 2:
          span.textContent = 'مبلمان اداری';
        break;
        case 3:
          span.textContent = 'انواع میز';
        break;
        case 4:
        case 12:
        case 13:
          span.textContent = 'سرویس خواب';
        break;
        case 5:
        case 6:
          span.textContent = 'فرش و موکت';
        break;
        case 7:
          span.textContent = 'کالاهای جدید';
        break;
        case 8:
          span.textContent = 'فروش ويژه';
        break;
        case 9:
          span.textContent = 'کالاهای چوبی';
        break;
        case 10:
          span.textContent = 'کالاهای فلزی';
        break;
        case 11:
          span.textContent = 'انواع صندلی';
        break;
        default:
          span.textContent = 'سرویس مبلمان';
    }
    function getRndInteger(min, max) {
      return Math.floor(Math.random() * (max - min + 1) ) + min;
    }
  }
  
  // Get product from database helper function
  async function getProductData(pId) {
    return new Promise((resolve, reject) => {
      let dbOpenRequest = window.indexedDB.open('db', 1);
      dbOpenRequest.addEventListener('success', async (e) => {
        try {
          const db = e.target.result;
          let productTX = db.transaction(['products'], 'readonly');
          productTX.onerror = (err) => console.warn(err);
          let productStore = productTX.objectStore('products');
          let productRequest = productStore.get(pId);
          productRequest.onsuccess = (ev) => {
            resolve(ev.target.result);
          };
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

  // Product renderer
  async function renderProducts() {
      
      const productContainer = document.querySelector("#pane-justified-3 > form");
      const productNameEl = document.getElementById('product-name');
      const productProIdEl = document.getElementById('product-id');
      const productPriceEl = document.getElementById('product-price');
      const productDescriptionEl = document.getElementById('product-description');
      const productDetailsEl = document.getElementById('product-details');
      const socialShareEl = document.querySelector(".social-share");
      const pageLinkTreeEl = document.querySelector('meta[content="4"]').previousElementSibling.querySelector('span');
      const pageLinkTree = document.querySelector('meta[content="4"]').previousElementSibling;
      const productContentEl = document.querySelector('div.product-content');
      const favoriteContainer = productContentEl.querySelector('div.favorites-btn');
      const favoriteLabel = favoriteContainer.querySelector('label.favorite-checkbox');
      const imageMainContainer = document.getElementById('mainImageContainer');
      
      productContainer.innerHTML = "";
      const pId = product.id;
      const pProId = product.proId;
      const pName = product.name;
      const pPrice = divider(product.price);
      const pDescription = product.description;
      const pProductDetails = product.productDetails;
      const pImage = product.image;
      const pCategoriesId = product.categoriesId;
      const pInStock = product.inStock;
      const pColorId = product.colorId;
      const pFabricId = product.fabricId;
      const pDiscount = product.discount;
      const pDiscounted = divider(product.discountedPrice);
      const pQuantity = product.quantity;

      productContentEl.setAttribute('data-product-id', pId);
      productNameEl.innerText = pName;
      pageLinkTreeEl.innerText = pName;
      pageLinkTree.href = window.location.href;
      productProIdEl.innerText = pProId;
      productPriceEl.innerHTML += (function(){
        if (pInStock === 0) return `<span id="product-inStock">کالا در انبار موجود نیست. می‌توانید جهت سفارش تولید با همکاران ما تماس بگیرید.</span>`;
        if (pDiscount === 0) return `
          <div>
            <span id="product-price-net">${pDiscounted}</span>
          </div>
        `;
        if (pDiscount !== 0) return `
          <div>
            <span id="product-price-gross">${pPrice}</span>
            <span id="product-price-net">${pDiscounted}</span>
          </div>
        `;
      })();
      productDescriptionEl.innerText = pDescription;
      productDetailsEl.innerText = pProductDetails;
      socialShareEl.innerHTML = (function(){
        return `
        <a href="sms:09">
          <i id="envelope" class="la la-envelope specific-hover"></i>
        </a>
        <a href="javascript:void(0)">
          <i id="instagram" class="lab la-instagram specific-hover"></i>
        </a>
        <a href="javascript:void(0)">
          <i id="telegram" class="lab la-telegram specific-hover"></i>
        </a>
        <a href="https://wa.me/989?text=${window.location}">
          <i id="whatsapp" class="lab la-whatsapp specific-hover"></i>
        </a>`;
      })();
      
      const materialQuest = (function () {
        let test;
        if ( product.categoriesId.indexOf(9, 0) !== -1 && 
              product.categoriesId.indexOf(10, 0) !== -1) {
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
            <label>
              <p>
                سفيد
              </p>
              <input type="radio" name="color" value="1">
            </label>
          </li>
          ` : "";
        const colorTwoText = (colorTwo) ? `
          <li>
            <label>
              <p>
                سياه
              </p>
              <input type="radio" name="color" value="2">
            </label>
          </li>
          ` : "";
        const colorThreeText = (colorThree) ? `
          <li>
            <label>
              <p>
                سبز
              </p>
              <input type="radio" name="color" value="3">
            </label>
          </li>
          ` : "";
        const colorFourText = (colorFour) ? `
          <li>
            <label>
              <p>
                زرد
              </p>
              <input type="radio" name="color" value="4">
            </label>
          </li>
          ` : "";
        const colorFiveText = (colorFive) ? `
          <li>
            <label>
              <p>
                آبی
              </p>
              <input type="radio" name="color" value="5">
            </label>
          </li>
          ` : "";
        const colorSixText = (colorSix) ? `
          <li>
            <label>
              <p>
                قرمز
              </p>
              <input type="radio" name="color" value="6">
            </label>
          </li>
          ` : "";
        const colorSevenText = (colorSeven) ? `
          <li>
            <label>
              <p>
                خاکستری
              </p>
              <input type="radio" name="color" value="7">
            </label>
          </li>
          ` : "";
        const colorEightText = (colorEight) ? `
          <li>
            <label>
              <p>
                بنفش
              </p>
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

      let orderBtn = (function () {
        if (pInStock === 0) return `<button class="sold-out" tabindex="-1">سفارش تولید</button>`;
        return '<button class="add-to-cart" tabindex="-1"></button>';
      })();

      productContainer.innerHTML = `
        ${materialQuest}
        ${fabricQuest}
        ${colorQuest}
        ${orderBtn}
      `;
      
      let tagText = (function () {
        if (pInStock === 0) return `<span class="tag out-of-stock">ناموجود</span>`;
        if (pCategoriesId.includes(7)) return `<span class="tag new-product">جدید</span>`;
        if (pDiscount !== 0) return `<span class="tag discount">${pDiscount.toFixed(0)}</span>`;
        return "";
      })();
      document.getElementById('img-container').innerHTML += tagText;

      // transaction to database - to get user favorites
      async function favGetter() {
        return new Promise((resolve, reject) => {
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
            getRequest.onerror = () => reject('Error fetching favorites');
          };
        });
      }

      // favorite button functionality
      let userFavArr;
      if (typeof username !== 'undefined') {
        userFavArr = await favGetter();
      
        // Set initial checked state
        const isFavorite = userFavArr?.includes(pId);
        document.getElementById('favBtn').checked = isFavorite ? true : false;
        if (typeof userFavArr === 'undefined') document.getElementById('favBtn').disabled = true;

        document.getElementById('favBtn').addEventListener('click', function(e) {
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
        
          if (e.currentTarget.checked) {
            throttledChecked(e.currentTarget);
          } else {
            throttledNotChecked(e.currentTarget);
          }
          
        });

      };

      // collecting user post actions of selecting additional options
      document.querySelectorAll('fieldset.material-selection').forEach(elm => {
        elm.onchange = function (e) {
          e.currentTarget.setAttribute('data-selected-material-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
        };
      });
      document.querySelectorAll('fieldset.fabric-selection').forEach(elm => {
        elm.onchange = function (e) {
          e.currentTarget.setAttribute('data-selected-fabric-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
        };
      });
      document.querySelectorAll('fieldset.color-selection').forEach(elm => {
        elm.onchange = function (e) {
          e.currentTarget.setAttribute('data-selected-color-value', e.currentTarget.querySelector('input:checked').getAttribute('value'))
        };
      });

      // setting event listener on add to cart buttons
      document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async function(e) {
          e.preventDefault();
          const id = Number(e.target.closest('[data-product-id]').dataset.productId);
          const currentTarget = e.currentTarget;
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
          if (typeof username !== 'undefined') {
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
          cartChannel.postMessage("cart-updated");
        })
      });
      // setting functionality of sold out products
      document.querySelectorAll('.sold-out').forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = window.location.origin + "/contactus.html";
        })
      });

      // image album source with simulation
      imageMainContainer.innerHTML = `
        <div class="product-image-thumb active">
          <img src="${'assets/images/p/' + pImage}" data-album-id="0" style="filter: unset;" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="1" style="transform: scaleX(-1);" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="2" style="filter: hue-rotate(45deg);" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="3" style="filter: hue-rotate(90deg);" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="4" style="filter: hue-rotate(135deg);" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="5" style="filter: hue-rotate(180deg);" class="imageSlides"/>
        </div>
        <div class="product-image-thumb">
          <img src="${'assets/images/p/' + pImage}" data-album-id="6" style="filter: hue-rotate(225deg);" class="imageSlides"/>
        </div>
      `;
      document.querySelector('#img-container img').src = `${'assets/images/p/' + pImage}`;
      carouselFunc('image-items-container', '.product-image-thumb');
      showImageProduct();
      imageZoom();

      // Comments and reviews
      const reviews = await getReviewsData(pId);
      currentReviews = [...reviews.comments];
      productIdGlobal = pId;
      productNameGlobal = pName;
      // نمایش نظرات اولیه
      renderReviews();
      // ایجاد ستاره‌های تعاملی برای فرم
      createStars(0, document.getElementById('ratingStars'), true);
      
      // separate numbers by three
      function divider(num) {
        return num = 
          parseInt(num.toString()
            .replace(/[^\d]+/gi, ''))
              .toLocaleString('fa-IR')
                .replace(/[٬]/gi, ',');
      };
    
  }
});

pageLoad.catch((err) => {    
  console.error(err);
});