window.addEventListener('unhandledrejection', () => console.log('unhandledrejection occurred'));

// Filtering, sorting, paginating, rendering products

let filterParameters = {
  lowerBound: 0,
  upperBound: +Infinity,
  category: undefined,
  fabricArr: [],
  colorArr: [],
  inStockVal: false,
  sortField: 'idIDX',
  sortDirection: 'asc',
  page: 1,
  pageSize: 8,
  keyword: undefined,
  priceFilterChecked: false,
  categoryFilterChecked: false,
  fabricFilterChecked: false,
  colorFilterChecked: false,
  inStockFilterChecked: false,
};

let filteringTotalWorkerObject;
let filteringWorkerObject;

const summaryTotal = {
  totalMatchesCount: undefined,
  totalPagesCount: undefined,
  skippedProducts: undefined,
  currentPagesProductsCount: undefined,
  currentPageNumber: undefined,
};

// Handle browser navigation - URL Parameter Helper Functions
class HistoryManager {
  maxVal = 0;
  constructor(max) {
    this.isNavigating = false;
    this.debounceTimer = null;
    this.debounceDelay = 300; // ms
    this.scrollUpdateTimer = null;
    this.maxVal = max;
    this.init();
  }

  init() {
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });

    // Track scroll position and update current state
    window.addEventListener('scroll', () => {
        this.handleScroll();
    });
    
    // Set up initial state
    this.updateCurrentState();
  }

  // Handle scroll events with throttling
  handleScroll() {
      if (this.scrollUpdateTimer) {
          clearTimeout(this.scrollUpdateTimer);
      }
      
      this.scrollUpdateTimer = setTimeout(() => {
          this.updateCurrentState();
      }, 150);
  }

  // Debounced history state update (creates new history entry)
  saveState(url, immediate = false) {
    if (this.isNavigating) return;

    // Clear any pending debounced save
    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
    }
    
    // Creating new history entry
    const saveOperation = () => {
        const state = {
            url: url.href,
            filterParameters: {...filterParameters},
            timestamp: Date.now(),
            scrollPosition: window.scrollY,
            previousPage: history.state?.filterParameters.page,
            action: 'new-history-entry'
        };
        
        window.history.pushState(state, '', url);
    };
    
    if (immediate) {
        saveOperation();
        console.log('New history entry state created...');
    } else {
        this.debounceTimer = setTimeout(saveOperation, this.debounceDelay);
    }
  }

  // Update current state without creating new history entry
  updateCurrentState(existedUrl) {
    if (this.isNavigating) return;
    
    const currentUrl = (typeof existedUrl === 'undefined') ? new URL(window.location) : existedUrl;
    const state = {
        url: currentUrl.href,
        filterParameters: {...filterParameters},
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
        previousPage: history.state?.filterParameters.page,
        action: 'state-updated'
    };

    window.history.replaceState(state, '', currentUrl);
    console.log('Current state Updated...');
  }

  handlePopState(event) {
    this.isNavigating = true;

    try {
        if (event.state) {
            this.restoreState(event.state);
        } else {
            // Initial page load or cleared history
            this.restoreInitialState();
        }
    } catch (error) {
        console.error('Error restoring state:', error);
        // Initial page load or cleared history
        this.restoreInitialState();
    } finally {
        setTimeout(() => {
            this.isNavigating = false;
        }, 50);
    }
  }

  restoreState(state) {

    // Restore filter parameters
    if (state.filterParameters) {
        Object.assign(filterParameters, state.filterParameters);
        this.updateUIFromState();
    }
    
    // Update URL to match state
    this.syncUrlToState(state);
    
    // Restore scroll position
    if (state.scrollPosition !== undefined) {
        setTimeout(() => {
            window.scrollTo(0, state.scrollPosition);
        }, 50);
    }
    
    this.logState('State restored', state);

    // Run filtering with restored parameters
    runFilteringInSequence(filterParameters);
  }

  restoreInitialState() {
    // Reset to default state
    filterParameters = {
      lowerBound: 0,
      upperBound: +Infinity,
      category: undefined,
      fabricArr: [],
      colorArr: [],
      inStockVal: false,
      sortField: 'idIDX',
      sortDirection: 'asc',
      page: 1,
      pageSize: 8,
      keyword: undefined,
      priceFilterChecked: false,
      categoryFilterChecked: false,
      fabricFilterChecked: false,
      colorFilterChecked: false,
      inStockFilterChecked: false,
    };
    
    this.updateUIFromState();
    runFilteringInSequence(filterParameters);
  }

  // Sync URL parameters to match current state
  syncUrlToState(state) {
    const newUrl = new URL(window.location);
    
    // Clear existing parameters
    const params = new URLSearchParams(newUrl.search);
    for (const key of params.keys()) {
        newUrl.searchParams.delete(key);
    }
    
    // Add current state parameters
    if (state.filterParameters) {
        Object.entries(state.filterParameters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        newUrl.searchParams.set(key, value.join(','));
                    }
                } else {
                    newUrl.searchParams.set(key, value.toString());
                }
            }
        });
    }
    
    // Update URL without adding to history
    window.history.replaceState(state, '', newUrl);
  }

  logState(action, state) {
    // action is string description of operation fo logging
    // state is filterParameters
    const stateCopy = {...state};
    
    // Format for display
    if (stateCopy.filterParameters) {
        stateCopy.filterParameters = {...stateCopy.filterParameters};
    }
    
    console.log(`${action}:\n${JSON.stringify(stateCopy, null, 2)}`);
  }

  updateUIFromState() {
    // Update all filter UI elements to match current state
    this.updatePriceFilterUI();
    this.updateCategoryFilterUI();
    this.updateFabricFilterUI();
    this.updateColorFilterUI();
    this.updateInStockFilterUI();
    this.updatePerPageUI();
    this.updateSortUI();
    this.updateKeywordSearchUI();
  }

  updatePriceFilterUI() {
    const priceFilterBtnBackground = document.querySelector('.price-f > label');
    const defaultColor = '#7490a2';

    if (filterParameters.lowerBound < 0) filterParameters.lowerBound = 0;
    if (filterParameters.upperBound < 0) filterParameters.upperBound = this.maxVal;

    if (filterParameters.priceFilterChecked === true) {
      if (filterParameters.lowerBound === 0 && filterParameters.upperBound === this.maxVal) {
        filterParameters.priceFilterChecked = false;
        priceFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.lowerBound !== 0 || filterParameters.upperBound !== this.maxVal) {
        priceFilterBtnBackground.style.backgroundColor = '#274f6b';
        return;
      }
    } else {
      if (filterParameters.lowerBound === 0 && filterParameters.upperBound === this.maxVal) {
        priceFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.lowerBound !== 0 || filterParameters.upperBound !== this.maxVal) {
        filterParameters.priceFilterChecked = true;
        priceFilterBtnBackground.style.backgroundColor = '#274f6b';
      }
    }
  }

  updateCategoryFilterUI() {
    const catFilterBtnBackground = document.querySelector('.cat-f > label');
    const defaultColor = '#7490a2';

    if (filterParameters.categoryFilterChecked === true) {
      if (typeof filterParameters.category === 'undefined') {
        filterParameters.categoryFilterChecked = false;
        catFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (typeof filterParameters.category !== 'undefined') {
        catFilterBtnBackground.style.backgroundColor = '#274f6b';
        return;
      }
    } else {
      if (typeof filterParameters.category === 'undefined') {
        catFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (typeof filterParameters.category !== 'undefined') {
        filterParameters.categoryFilterChecked = true;
        catFilterBtnBackground.style.backgroundColor = '#274f6b';
      }
    }
  }

  // Add similar methods for other filters...
  updateFabricFilterUI() {
    const fabricFilterBtnBackground = document.querySelector('.fabric-f > label');
    const defaultColor = '#7490a2';

    if (filterParameters.fabricFilterChecked === true) {
      if (filterParameters.fabricArr.length === 0) {
        filterParameters.fabricFilterChecked = false;
        fabricFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.fabricArr.length > 0) {
        fabricFilterBtnBackground.style.backgroundColor = '#274f6b';
        return;
      }
    } else {
      if (filterParameters.fabricArr.length === 0) {
        fabricFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.fabricArr.length > 0) {
        filterParameters.fabricFilterChecked = true;
        fabricFilterBtnBackground.style.backgroundColor = '#274f6b';
      }
    }
  }

  updateColorFilterUI() {
    const colorFilterBtnBackground = document.querySelector('.color-f > label');
    const defaultColor = '#7490a2';

    if (filterParameters.colorFilterChecked === true) {
      if (filterParameters.colorArr.length === 0) {
        filterParameters.colorFilterChecked = false;
        colorFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.colorArr.length > 0) {
        colorFilterBtnBackground.style.backgroundColor = '#274f6b';
        return;
      }
    } else {
      if (filterParameters.colorArr.length === 0) {
        colorFilterBtnBackground.style.backgroundColor = defaultColor;
        return;
      } else if (filterParameters.colorArr.length > 0) {
        filterParameters.colorFilterChecked = true;
        colorFilterBtnBackground.style.backgroundColor = '#274f6b';
      }
    }
  }

  updateInStockFilterUI() {
    const inStockFilter = document.querySelector('.toggler label input');
    if (inStockFilter) {
      inStockFilter.checked = filterParameters.inStockVal;
    }
  }

  updateSortUI() {
    // Update sort dropdown to reflect current sort settings
    let y, i, k, ki, s, h, sl, t;
    // The original <select> element
    s = document.querySelector('form.product-index > .custom-select select');     
    k = Array.from(s.options);
    ki = k.findIndex(item => {
      return (item.dataset.sortField === filterParameters.sortField &&
      item.dataset.sortDir === filterParameters.sortDirection);
    });
    // The number of <option> elements
    sl = s.length;
    // The 'div.select-selected' element
    h = s.nextElementSibling;
    try {
      h.innerHTML = k[ki].innerHTML;
    } catch (err) {
      window.location.href = window.location.origin + '/store.html';
    }  
    y = document.querySelector('form.product-index > .custom-select .select-items .same-as-selected');
    // removes the last <div class="same-as-selected">option items</div>... element  
    y.removeAttribute("class");
    t = document.querySelector('form.product-index > .custom-select .select-items');
    Array.from(t.children).forEach( (item) => {
      // select the selected option in original <select> element
      if (k[ki].innerHTML == item.innerHTML) {
        // sets the last <div class="same-as-selected">option items</div>... element
        item.setAttribute("class", "same-as-selected");    
      };
    });
  
    // Update sort dropdown to reflect current sort settings
    const sortSelect = document.querySelector('.custom-select select');
    if (sortSelect) {
      for (let option of sortSelect.options) {
        if (option.getAttribute('data-sort-field') === filterParameters.sortField &&
            option.getAttribute('data-sort-dir') === filterParameters.sortDirection) {
          sortSelect.value = option.value;
          break;
        }
      }
    }
  }

  updatePerPageUI() {
    // Update sort dropdown to reflect current sort settings
    let y, i, k, ki, s, h, sl, t;
    // The original <select> element
    s = document.querySelector('form.product-per-page > .custom-select select');     
    k = Array.from(s.options);
    ki = k.findIndex(item => Number(item.value) === filterParameters.pageSize);
    // The number of <option> elements
    sl = s.length;
    // The 'div.select-selected' element 
    h = s.nextElementSibling;
    // h.innerHTML = k[ki].innerHTML;
    try {
      h.innerHTML = k[ki].innerHTML;
    } catch (err) {
      window.location.href = window.location.origin + '/store.html';
    }
    y = document.querySelector('form.product-per-page > .custom-select .select-items .same-as-selected'); 
    // removes the last <div class="same-as-selected">option items</div>... element 
    y.removeAttribute("class");
    t = document.querySelector('form.product-per-page > .custom-select .select-items');
    Array.from(t.children).forEach( (item) => {
      // select the selected option in original <select> element
      if (k[ki].innerHTML == item.innerHTML) {
        // sets the last <div class="same-as-selected">option items</div>... element      
        item.setAttribute("class", "same-as-selected");
      };
    });
  }

  updateKeywordSearchUI() {
    const searchedKeywordContainer = document.querySelector('.searched-value');
    const keywordContainer = document.querySelector('.searched-value > div > p');
    const keywordEraser = document.querySelector('.searched-value > div > p > i');
    let keyword;
    if (new URLSearchParams(window.location.search).get('keyword') !== null) {
      keyword = new URLSearchParams(window.location.search).get('keyword');
    } else {
      keyword = undefined;
    }
    if (typeof keyword !== 'undefined') {
      keywordContainer.setAttribute('data-search-value', keyword);
      searchedKeywordContainer.style.display = 'flex';
    } else {
      searchedKeywordContainer.style.display = 'none';
      keywordContainer.removeAttribute('data-search-value');
    }
  }
}

// Debounced Promise Function

const createLatestOnlyAsync = function (asyncFn) {
  let latestCallId = 0;

  return async function(...args) {
    const callId = ++latestCallId;
    
    try {
      const result = await asyncFn(...args);
      
      // Only resolve if this is the most recent call
      if (callId === latestCallId) {
        return result;
      }
      
      // Ignore result if outdated
      return Promise.reject({ aborted: true });
      
    } catch (error) {
      if (callId === latestCallId) {
        throw error;
      }
      // Ignore errors from outdated calls
      return Promise.reject({ aborted: true });
    }
  };
};

const debouncedRender = createLatestOnlyAsync(async (data) => { 
  const newPromise = await new Promise(resolve => setTimeout(() => {
      resolve(data);
  }, Math.floor(Math.random() * 4001)));
  return newPromise;
});

// Products Renderer

const renderProducts = async function (products) {
  // console.log(productsToRender);
  const productsDiv = document.querySelector(".products");
  const productsContainer = document.querySelector(".products > .products-container");
  const summaryTextA = document.querySelector('.summary-products > .texts > span:first-child');
  const summaryTextB = document.querySelector('.summary-products > .texts > span:last-child');
  const pagination = document.querySelector('.pagination');
  
  // temporary elements fade
  const itemCounts = productsContainer.childElementCount;
  productsContainer.innerHTML = '';
  productsContainer.classList.add('fade');
  //console.log(itemCounts)
  if (itemCounts > 1) {
    for (let i = 1; i <= itemCounts; i++) {
      const tempEl = document.createElement('div');
      tempEl.className = "c-temp rounded-6";
      tempEl.innerHTML = `
          <div class="img-cont">
            <p></p>
          </div>
          <div class="product-cont">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
      `;
      productsContainer.appendChild(tempEl);
    }
  } else {
    for (let i = 1; i <= filterParameters.pageSize; i++) {
      const tempEl = document.createElement('div');
      tempEl.className = "c-temp rounded-6";
      tempEl.innerHTML = `
          <div class="img-cont">
            <p></p>
          </div>
          <div class="product-cont">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
      `;
      productsContainer.appendChild(tempEl);
    }
  }
  const existedLoaderAnimationEl = productsDiv.querySelector('.loader');
  if (existedLoaderAnimationEl) {
    productsDiv.removeChild(existedLoaderAnimationEl);
  }
  const newLoaderAnimationEl = document.createElement('div');
  newLoaderAnimationEl.className = "loader";
  productsDiv.appendChild(newLoaderAnimationEl);

  // pagination
  {
    let currentPage = summaryTotal.currentPageNumber = filterParameters.page;
    let currentPageViewing = currentPage;
    let buttonItemCount;
    let pageBtns = [];
    let i, j;
    const updateButtons = () => {
      const paginationBtns = document.querySelector('.pagination').children;
      paginationBtns[0].disabled = currentPageViewing === 1;
      paginationBtns[pageBtns.length-1].disabled = paginationBtns[pageBtns.length-1].previousElementSibling.disabled === true;
    };

    if (summaryTotal.totalPagesCount <= 5) {
      buttonItemCount = summaryTotal.totalPagesCount;
      // pageBtns = Array(buttonItemCount + 2);
      for (i = 1; i <= buttonItemCount; i++) {
        const pageEl = document.createElement('button')
        // pagination buttons
        pageEl.innerText = i;
        pageEl.className = "persianNum";
        pageEl.setAttribute('data-page', `${i}`);
        if (parseInt(pageEl.getAttribute('data-page')) == currentPageViewing) {
          pageEl.className += " active";
          pageEl.disabled = true;
        }
        pageEl.addEventListener('click', (e) => {
          const paginationBtns = document.querySelector('.pagination').children;
          for (j = 1; j <= paginationBtns.length - 1; j++) {
            paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
          }
          currentPageViewing = parseInt(e.target.getAttribute('data-page'));
          summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
          updateButtons();

          // update URL
          const newUrl = updateURLFromFilterParameters();
          historyManager.saveState(newUrl, true);

          runFilteringInSequence(filterParameters);
          window.scrollTo(0, 0);
        });
        pageBtns.push(pageEl);
      }
    } else {
      buttonItemCount = 5;
      // pageBtns = Array(buttonItemCount);
      if (currentPageViewing <= 3) {
        for (i = 1; i <= 5; i++) {
          const pageEl = document.createElement('button')
          // pagination buttons
          pageEl.innerText = i;
          pageEl.className = "persianNum";
          pageEl.setAttribute('data-page', `${i}`);
          if (parseInt(pageEl.getAttribute('data-page')) == currentPageViewing) {
            pageEl.className += " active";
            pageEl.disabled = true;
          }
          pageEl.addEventListener('click', (e) => {
            const paginationBtns = document.querySelector('.pagination').children;
            for (j = 1; j <= paginationBtns.length - 1; j++) {
              paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
            }
            currentPageViewing = parseInt(e.target.getAttribute('data-page'));
            summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
            updateButtons();

            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);
            
            runFilteringInSequence(filterParameters);
            window.scrollTo(0, 0);
          });
          pageBtns.push(pageEl);
        }
      } else if (currentPageViewing <= summaryTotal.totalPagesCount - 2) {
        for (i = currentPageViewing - 2; i <= currentPageViewing + 2; i++) {
          const pageEl = document.createElement('button')
          // pagination buttons
          pageEl.innerText = i;
          pageEl.className = "persianNum";
          pageEl.setAttribute('data-page', `${i}`);
          if (parseInt(pageEl.getAttribute('data-page')) == currentPageViewing) {
            pageEl.className += " active";
            pageEl.disabled = true;
          }
          pageEl.addEventListener('click', (e) => {
            const paginationBtns = document.querySelector('.pagination').children;
            for (j = 1; j <= paginationBtns.length - 1; j++) {
              paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
            }
            currentPageViewing = parseInt(e.target.getAttribute('data-page'));
            summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
            updateButtons();

            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);
            
            runFilteringInSequence(filterParameters);
            window.scrollTo(0, 0);
          });
          pageBtns.push(pageEl);
        }
      } else {
        for (i = summaryTotal.totalPagesCount - 4; i <= summaryTotal.totalPagesCount; i++) {
          const pageEl = document.createElement('button')
          // pagination buttons
          pageEl.innerText = i;
          pageEl.className = "persianNum";
          pageEl.setAttribute('data-page', `${i}`);
          if (parseInt(pageEl.getAttribute('data-page')) == currentPageViewing) {
            pageEl.className += " active";
            pageEl.disabled = true;
          }
          pageEl.addEventListener('click', (e) => {
            const paginationBtns = document.querySelector('.pagination').children;
            for (j = 1; j <= paginationBtns.length - 1; j++) {
              paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
            }
            currentPageViewing = parseInt(e.target.getAttribute('data-page'));
            summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
            updateButtons();

            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);
            
            runFilteringInSequence(filterParameters);
            window.scrollTo(0, 0);
          });
          pageBtns.push(pageEl);
        }
      }
    }
    // previous button
    {
      const pageEl = document.createElement('button');
      pageEl.innerText = "\u276E";
      pageEl.classList.add('side');
      pageEl.classList.add('prev');
      pageEl.addEventListener('click', (e) => {
        if (currentPageViewing > 0) {
            const paginationBtns = document.querySelector('.pagination');
            e.target.disabled = false;
            currentPageViewing--;
            for (j = 1; j <= paginationBtns.length - 1; j++) {
              paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
            }
            paginationBtns.querySelector(`button[data-page='${currentPageViewing}']`).className += " active";
            summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
            updateButtons();

            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);

            runFilteringInSequence(filterParameters);
            window.scrollTo(0, 0);
        }
      });
      pageBtns.unshift(pageEl);
    }
    // next button
    {
      const pageEl = document.createElement('button');
      pageEl.innerText = "\u276F";
      pageEl.classList.add('side');
      pageEl.classList.add('next');
      pageEl.addEventListener('click', (e) => {
        if (currentPageViewing < summaryTotal.totalPagesCount) {
            const paginationBtns = document.querySelector('.pagination');
            e.target.disabled = false;
            currentPageViewing++;
            for (j = 1; j <= paginationBtns.length - 1; j++) {
              paginationBtns[j].className = paginationBtns[j].className.replace(" active", "");
            }
            paginationBtns.querySelector(`button[data-page='${currentPageViewing}']`).className += " active";
            summaryTotal.currentPageNumber = filterParameters.page = currentPageViewing;
            updateButtons();

            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);

            runFilteringInSequence(filterParameters);
            window.scrollTo(0, 0);
        }
      });
      pageBtns.push(pageEl);
    }
    
    pagination.innerHTML = '';
    for (i = 0; i < pageBtns.length; i++) {
        pagination.appendChild(pageBtns[i]);
    };
    persianNum();
    updateButtons();
  }
  
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

  let userFavArr;
  if (typeof username !== 'undefined') {
    userFavArr = await favGetter();
  }

  // renderer function
  const renderer = function(productsToRender) {
    {
      if (productsToRender.length == 0) {
        productsContainer.innerHTML = `<span class="no-match-found">متاسفانه کالایی با مشخصات مورد نظر یافت نشد.</span>`;
        summaryTextA.innerText = "";
        summaryTextA.className = "";
        summaryTextB.innerHTML = "";
        pagination.innerHTML = '<div></div>';
      } else {
        productsContainer.innerHTML = "";
        summaryTextA.className = "divider-left";
        if (summaryTotal.currentPageNumber == 1) {
          // in first page
          summaryTextA.innerText = "در حال نمایش موارد " + `${1}` + "  " + "تا" + "  " +
           `${summaryTotal.currentPagesProductsCount}` + " از مجموع " + `${summaryTotal.totalMatchesCount}` + " كالا" ;
        } else if (summaryTotal.currentPageNumber > 1) {
          const skippedQuantity = summaryTotal.skippedProducts + 1;
          // in any page other than first one
          summaryTextA.innerText = "در حال نمایش موارد " + `${skippedQuantity}` + "  " + "تا" + "  " +
           `${summaryTotal.currentPagesProductsCount}` + " از مجموع " + `${summaryTotal.totalMatchesCount}` + " كالا" ;
        }
        summaryTextB.innerText = `صفحه ${summaryTotal.currentPageNumber} از ${summaryTotal.totalPagesCount}`;

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
            productsContainer.appendChild(productEl);
        };
      };
    }
    // go to product page by clicking on product image
    document.querySelectorAll('.image-product img').forEach(elm => {
      elm.addEventListener('click', (e) => {
        e.preventDefault();
        const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
        const thisPageUrl = new URL(window.location);
        console.log(thisPageUrl.href)
        redirectToProduct(ProductId);
      });
    });
    // go to product page by clicking on product name
    document.querySelectorAll('.product-action .p-name').forEach(elm => {
      elm.addEventListener('click', (e) => {
        e.preventDefault();
        const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
        redirectToProduct(ProductId);
      });
    });
    // go to product page by clicking on show-product button
    document.querySelectorAll('a.show-product').forEach(elm => {
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
      // localStorage.setItem('productItemLink', JSON.stringify(pId));
      // localStorage.setItem('productStorePageLink', JSON.stringify(url));
      window.location.href = window.location.origin + '/product.html?productID=' + pId;
    }
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
    // favorite button functionality
    document.querySelectorAll('.favorites-btn input').forEach(elm => {
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
        if (username) {
          if (e.currentTarget.checked) {
            throttledChecked(e.currentTarget);
          } else {
            throttledNotChecked(e.currentTarget);
          }
        }
      };
    });
    // setting event listener on add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
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
              return new Promise((resolve, reject) => {
                  productRequest.onsuccess = (event) => resolve(event.target.result);
                  productRequest.onerror = (event) => reject(event.target.error);
              });
            } catch (error) {
              console.error('Error loading product:', error);
            }
          }
        }
        let loadProducts = productObject();
        // Retrieving product from database and set it to the variable
        product = await loadProducts(id);
        //
        const orderTime = Date.now();
        
        let materialSelectedValue, 
            fabricSelectedValue, 
            colorSelectedValue,
            considerMaterial = false,
            considerFabric = false,
            considerColor = false,
            selectedProductObj;
        // Checks whether the option to be selected is existed or not.
        if (currentTarget.parentElement.querySelector('fieldset.material-selection')) {
          // setting integer|NaN to the existed option's corresponding Value instead of undefined
          materialSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.material-selection').dataset.selectedMaterialValue);
          considerMaterial = true;
        };
        if (currentTarget.parentElement.querySelector('fieldset.fabric-selection')) {
          // setting integer|NaN to the existed option's corresponding Value instead of undefined
          fabricSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.fabric-selection').dataset.selectedFabricValue);
          considerFabric = true;
        };
        if (currentTarget.parentElement.querySelector('fieldset.color-selection')) {
          // setting integer|NaN to the existed option's corresponding Value instead of undefined
          colorSelectedValue = parseInt(currentTarget.parentElement.querySelector('fieldset.color-selection').dataset.selectedColorValue);
          considerColor = true;
        };
        console.log(materialSelectedValue, fabricSelectedValue, colorSelectedValue);
        if (considerMaterial ||
            considerFabric ||
            considerColor) {
          // Checks whether the option to be selected and the corresponding variable have Not received a numeric value -received a NaN
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
    document.querySelectorAll('.sold-out').forEach(button => {
      button.addEventListener('click', function(e) {
        window.location.href = window.location.origin + "/contactus.html";
      })
    });
    // reset button functionality
    document.querySelectorAll('.post-act-contents > .reset-btn').forEach( button => {
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
    // remove loading animation
    productsContainer.classList.remove('fade');
    productsDiv.removeChild(newLoaderAnimationEl);
    // separate numbers by three
    const orderPrice = document.querySelectorAll(".order-price");
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
    const operation = await debouncedRender(products);
    if (!operation) {
      throw new Error(`error!`);
    }
    renderer(products);
  } catch (e) {
    throw e;
  }
};

// Filtering Workers Executers

const filteringTotalWorkerObjectFunc = function(data) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject("Your browser doesn't support worker API");
      return;
    }

    if (typeof filteringTotalWorkerObject == "undefined") {
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
        console.log("Total Worker results:", event.data);
        
        // Process the data
        const totalProducts = event.data;
        const { totalMatches, totalPages } = totalProducts;
        console.log("Total Counter received from worker", totalProducts);

        // Update summary object
        summaryTotal.totalMatchesCount = totalMatches;
        summaryTotal.totalPagesCount = totalPages;
        console.log('Products counted');
        
        // Clean up
        filteringTotalWorkerObject.terminate();
        console.log('Worker Terminated');
        filteringTotalWorkerObject = undefined;
        
        // Resolve the promise with the results
        resolve(totalProducts);
      }
    };
  });
};

const filteringWorkerObjectFunc = function(data) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject("Your browser doesn't support worker API");
      return;
    }

    if (typeof filteringWorkerObject == "undefined") {
      filteringWorkerObject = new Worker("./assets/js/filterWorker.js");
    }
    filteringWorkerObject.postMessage(data);
    console.log("Message posted to worker");

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
        const {
          products, 
          skip, 
          total, 
          page, 
          pageSize, 
          totalPages
          } = filteredProducts;

        // Update summary object
        summaryTotal.skippedProducts = skip;
        summaryTotal.currentPagesProductsCount = total;
        summaryTotal.currentPageNumber = totalPages;      // pages till now
        console.log("Message received from worker", filteredProducts);
        
        // Render results and Clean up
        renderProducts(products);
        console.log('Products rendered');
        filteringWorkerObject.terminate();
        console.log('Worker Terminated');
        filteringWorkerObject = undefined;
        
        // Resolve the promise with the results
        resolve(products);
      }
    };
  });
};

// Usage: Run both filtering functions in order
const runFilteringInSequence = async function (data) {
  try {
    const workerResult = await filteringTotalWorkerObjectFunc(data);
    console.log("workerResult completed with:", workerResult);
    // This runs only after workerResult's promise resolves
    filteringWorkerObjectFunc(data);
  } catch (error) {
    console.error("Error occurred:", error);
  }
};

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

// Initialize history manager
let historyManager = null;

// setting max price values
pageLoad.then((database) => {
  new Promise((resolve, reject) => {
    let arrNum = [];
    for (let i = 0; i < database.products.length; i++) {
      arrNum.push(database.products[i].price);
    }
    let max = -Infinity;
    let min = +Infinity;
    for (let i = 0; i < arrNum.length; i++) {
      if (arrNum[i] > max) {
        max = arrNum[i];
      }
      if (arrNum[i] < min) {
        min = arrNum[i];
      }
    }
    // Set max attribute
    filterParameters.upperBound = max;
    historyManager = new HistoryManager(max);
    resolve(database);
  });
});

// Price Filter Range and Input Implementing

document.addEventListener('DOMContentLoaded', function() {
  const priceFilterBtnBack = document.querySelector('.price-f > label');       // Filter window Button background
  const priceFilterBtnBackColor = window.getComputedStyle(priceFilterBtnBack)  // priceFilterBtnBack color
    .getPropertyValue("background-color");
  const priceFilterBtn = document.querySelector('.price-f > label > input');   // Filter window Button
  const priceFilterForm = document.querySelector('.price-f form');             // Filter form element
  const minPriceInput = document.getElementById('min-price');                  // input element
  const maxPriceInput = document.getElementById('max-price');                  // input element
  const minSlider = document.getElementById('min-slider');                     // range element
  const maxSlider = document.getElementById('max-slider');                     // range element
  const sliderTrack = document.querySelector('.slider-track');                 // track of ranges
  const fromResult = document.querySelector('.from-result');
  const toResult = document.querySelector('.to-result');
  const closeBtn = document.querySelector('.price-filter .close-btn');
  const resetBtn = document.querySelector('.price-filter .reset-btn');
  
  // Set initial values
  let minPrice = 0;
  let maxPrice = 0;
  let minVal = 0;
  let maxVal = 0;

  let sliderTrackColorConst = 0;

  // Update slider and inputs
  function updateValues() {
    minPrice = parseInt(minSlider.value);
    maxPrice = parseInt(maxSlider.value);
    
    // Ensure min doesn't exceed max and vice versa
    if (minPrice > maxPrice) {
      minPrice = maxPrice;
      minSlider.value = minPrice;
    }
    
    if (maxPrice < minPrice) {
      maxPrice = minPrice;
      maxSlider.value = maxPrice;
    }
    
    // Update input fields
    minPriceInput.value = minPrice;
    maxPriceInput.value = maxPrice;

    // Update Persian Words of Numbers
    fromResult.textContent = numberToPersianWords(minPriceInput.value);
    toResult.textContent = numberToPersianWords(maxPriceInput.value);
    
    // Update slider track color
    sliderTrack.style.background = `
      linear-gradient(to left, 
      #ddd ${minPrice/sliderTrackColorConst}%, 
      rgb(77 112 136) ${minPrice/sliderTrackColorConst}%, 
      rgb(77 112 136) ${maxPrice/sliderTrackColorConst}%, 
      #ddd ${maxPrice/sliderTrackColorConst}%)`;
    
  };

  // Event listeners for sliders
  minSlider.addEventListener('input', function() {
    updateValues();
  });

  maxSlider.addEventListener('input', function() {
    updateValues();
  });

  // Event listeners for input fields
  minPriceInput.addEventListener('change', function(e) {
    thisValue = (this.value === '') ? minVal : this.value;
    minSlider.value = thisValue;
    updateValues();
  });

  maxPriceInput.addEventListener('change', function() {
    thisValue = (this.value === '') ? maxVal : this.value;
    maxSlider.value = thisValue;
    updateValues();
  });

  // Handle main filer box widow show/hide & animations
  
  const priceFilterBoxBtnFunc = function() {
    if (priceFilterBtn.checked) {
        //opening phase
        priceFilterForm.style.animation = '';
        priceFilterForm.style.webkitAnimation = '';
        priceFilterForm.style.animation = 'fade-in-filter 0.4s linear';
        priceFilterForm.style.webkitAnimation = 'fade-in-filter 0.4s linear';
        priceFilterForm.style.display = 'block';
      } else {
        // closing phase
        priceFilterForm.style.animation = '';
        priceFilterForm.style.webkitAnimation = '';
        priceFilterForm.style.animation = 'fade-out-filter 0.35s ease';
        priceFilterForm.style.webkitAnimation = 'fade-out-filter 0.35s ease';
    }
  };

  closeBtn.addEventListener('click', () => {
    priceFilterBtn.checked = false;
    priceFilterBoxBtnFunc();
  });

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    priceFilterForm.reset();
    fromResult.textContent = numberToPersianWords(0);
    toResult.textContent = numberToPersianWords(maxVal);
    sliderTrack.style.background = `
      linear-gradient(to left, 
      #ddd 0%, 
      rgb(77 112 136) 0%, 
      rgb(77 112 136) 100%, 
      #ddd 100%)`;
    setTimeout(() => {
      minPriceInput.value = minVal;
      maxPriceInput.value = maxVal;
      updateValues();
    }, 3000);
  });

  // consider filters
  const considerFilters = function () {
    if (priceFilterBtn.checked) {
      if (filterParameters.priceFilterChecked) {
        minSlider.value = filterParameters.lowerBound;
        maxSlider.value = filterParameters.upperBound;
        updateValues();
      } else {
        minSlider.value = minVal;
        maxSlider.value = maxVal;
        updateValues();
      }
    }
  };

  document.addEventListener('mousedown', (e) => {
    if (!priceFilterBtn.parentElement.contains(e.target) && !priceFilterForm.contains(e.target)) {
        priceFilterBtn.checked = false;
        priceFilterBoxBtnFunc();
    }
  });   
                     
  priceFilterForm.addEventListener('animationend',(e) => {
    if (e.animationName === 'fade-out-filter') {
        priceFilterForm.style.display = 'none';
    }
  });

  priceFilterBtn.parentElement.addEventListener('click', priceFilterBoxBtnFunc);
  priceFilterBtn.addEventListener('change', priceFilterBoxBtnFunc);
  priceFilterBtn.addEventListener('change', considerFilters);

  // Initialize
  updateValues();

  pageLoad.then((database) => {
    new Promise((resolve, reject) => {
      let arrNum = [];
      for (let i = 0; i < database.products.length; i++) {
        arrNum.push(database.products[i].price);
      }
      let max = -Infinity;
      let min = +Infinity;
      for (let i = 0; i < arrNum.length; i++) {
        if (arrNum[i] > max) {
          max = arrNum[i];
        }
        if (arrNum[i] < min) {
          min = arrNum[i];
        }
      }
      // Set max attribute
      maxSlider.setAttribute('max',max);
      maxSlider.setAttribute('value',max);
      minSlider.setAttribute('max',max);
      minSlider.value = 0;
      maxSlider.value = max;
      sliderTrackColorConst = max * 0.01;
      maxVal = max;
      historyManager.maxVal = max;
      filterParameters.upperBound = maxVal;

      // Filter implementer buttons
    
      const submitFilterBtn = document.querySelector('div.submit-filter.submit-price-f > button');
      const clearFilterBtn = document.querySelector('div.clear-filter.submit-price-f > button');
      
      submitFilterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterParameters.lowerBound = (minPriceInput.value !== '') ? parseInt(minPriceInput.value) : minVal;
        filterParameters.upperBound = (maxPriceInput.value !== '') ? parseInt(maxPriceInput.value) : maxVal;
        filterParameters.priceFilterChecked = true;
        closeBtn.click();
        if (filterParameters.lowerBound !== 0 || filterParameters.upperBound !== maxVal) {
          priceFilterBtnBack.style.backgroundColor = '#274f6b';
        } else {
          priceFilterBtnBack.style.backgroundColor = priceFilterBtnBackColor;
        }
        // historyManager.updatePriceFilterUI();        // Update UI
        filterParameters.page = 1;
        // update URL
        const newUrl = updateURLFromFilterParameters();
        historyManager.saveState(newUrl, true);
        runFilteringInSequence(filterParameters);
      });
    
      clearFilterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterParameters.lowerBound = minVal;
        filterParameters.upperBound = maxVal;
        filterParameters.priceFilterChecked = false;
        resetBtn.click();
        updateValues();
        closeBtn.click();
        priceFilterBtnBack.style.backgroundColor = priceFilterBtnBackColor;
        // historyManager.updatePriceFilterUI();        // Update UI
        filterParameters.page = 1;
        // update URL
        const newUrl = updateURLFromFilterParameters();
        historyManager.saveState(newUrl, true);
        runFilteringInSequence(filterParameters);
      });

      updateValues();
      resolve(database);
    });
  });
});

// Converting a Number to Persian Words

function numberToPersianWords(n) {
  if (isNaN(n)) return 'عدد نامعتبر';
  n = parseInt(n, 10);
    if (n === 0) return "صفر";
    if (n < 0) return "منفی " + numberToPersianWords(-n);
    
    const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", 
                 "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
    const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
    const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
    const magnitudes = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
    
    function convertChunk(num) {
        if (num === 0) return "";
        if (num < 20) return ones[num];
        if (num < 100) {
            return tens[Math.floor(num / 10)] + 
                   (num % 10 !== 0 ? " و " + ones[num % 10] : "");
        }
        return hundreds[Math.floor(num / 100)] + 
               (num % 100 !== 0 ? " و " + convertChunk(num % 100) : "");
    }
    
    // Split number into chunks of 3 digits
    const chunks = [];
    let num = n;
    while (num > 0) {
        chunks.push(num % 1000);
        num = Math.floor(num / 1000);
    }
    
    // Process each chunk
    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk !== 0) {
            let chunkWords = convertChunk(chunk);
            if (i > 0) chunkWords += " " + magnitudes[i];
            parts.push(chunkWords);
        }
    }
    
    // Combine parts in reverse order (Persian reading order)
    return parts.reverse().join(" و ");
}

// Category filter implementing

document.addEventListener('DOMContentLoaded', function() {
  const catFilterBtn = document.querySelector('.cat-f > label > input');       // Filter window Button
  const catFilterBtnBackground = document.querySelector('.cat-f > label');     // Filter window Button Background
  const catFilterBtnBackgroundColor = window.getComputedStyle(catFilterBtnBackground)  // FilterBtnBack color
    .getPropertyValue("background-color");
  const catFilterForm = document.querySelector('.cat-f form');                 // Filter form element
  const catFilters = catFilterForm.querySelector(".category-filter ul");
  const closeBtn = document.querySelector('.category-filter .close-btn');
  const resetBtn = document.querySelector('.category-filter .reset-btn');

  pageLoad.then((database) => {
    const catListAll = database.categories;
    new Promise((resolve, reject) => {
      let catList =[];
      for (let i = 0; i < catListAll.length - 1; i++) {
          catList.push({id: catListAll[i].id, name: catListAll[i].name});
      }
      catFilters.innerHTML = catList.map((catf) => `
          <li data-categoryId="${catf.id}">
            <label>${catf.name}
              <input type="radio" name="category" value="${catf.id}">
            </label>
          </li>`
      ).join('');
      resolve(database);
    })
  });

  // Handle main filer box widow show/hide & animations
  const catFilterBoxBtnFunc = function() {
    if (catFilterBtn.checked) {
        catFilterForm.style.animation = '';
        catFilterForm.style.webkitAnimation = '';
        catFilterForm.style.animation = 'fade-in-filter 0.4s linear';
        catFilterForm.style.webkitAnimation = 'fade-in-filter 0.4s linear';
        catFilterForm.style.display = 'block';
    } else {
        catFilterForm.style.animation = '';
        catFilterForm.style.webkitAnimation = '';
        catFilterForm.style.animation = 'fade-out-filter 0.35s ease';
        catFilterForm.style.webkitAnimation = 'fade-out-filter 0.35s ease';
    }
  };

  closeBtn.addEventListener('click', () => {
    catFilterBtn.checked = false;
    catFilterBoxBtnFunc();
  });

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    catFilterForm.reset();
  });

  // consider filters
  const considerFilters = function (e) {
    if (catFilterBtn.checked) {
      if (filterParameters.categoryFilterChecked) {
        const selectedValue = filterParameters.category;
        const inp = e.target.parentElement.nextElementSibling.querySelector(`input[value='${selectedValue}']`);
        if (inp) inp.checked = true;
      } else {
        catFilterForm.reset();
      }
    }
  };
  // 'click' event is counted as 'mouseup', so I put 'mousedown' here
  document.addEventListener('mousedown', (e) => {
    if (!catFilterBtn.parentElement.contains(e.target) && !catFilterForm.contains(e.target)) {
        catFilterBtn.checked = false;
        catFilterBoxBtnFunc();
    }
  });   
                     
  catFilterForm.addEventListener('animationend',(e) => {
    if (e.animationName === 'fade-out-filter') {
        catFilterForm.style.display = 'none';
    }
  });

  catFilterBtn.parentElement.addEventListener('click', catFilterBoxBtnFunc);
  catFilterBtn.addEventListener('change', catFilterBoxBtnFunc);
  catFilterBtn.addEventListener('change', considerFilters);

  // Filter implementer buttons

  const categoryFilterSetter = document.querySelector(".submit-filter.submit-category-f > button");
  const categoryFilterClear = document.querySelector(".clear-filter.submit-category-f > button");

  categoryFilterSetter.addEventListener('click', (e) => {
    e.preventDefault();
    const inp = e.target.parentElement.previousElementSibling.querySelector('input:checked');
    const id = inp?.getAttribute('value');
    filterParameters.category = (typeof id == "undefined") ? undefined : parseInt(id);
    filterParameters.categoryFilterChecked = true;
    if (filterParameters.category !== undefined) {
        catFilterBtnBackground.style.backgroundColor = '#274f6b';
      } else {
        catFilterBtnBackground.style.backgroundColor = catFilterBtnBackgroundColor;
    }
    // historyManager.updatePriceFilterUI();    // Update UI
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    closeBtn.click();
  });

  categoryFilterClear.addEventListener('click', (e) => {
    e.preventDefault();
    filterParameters.category = undefined;
    filterParameters.categoryFilterChecked = false;
    catFilterBtnBackground.style.backgroundColor = catFilterBtnBackgroundColor;
    // historyManager.updatePriceFilterUI();    // Update UI
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    resetBtn.click();
    closeBtn.click();
  });
  
});

// Fabric filter implementing

document.addEventListener('DOMContentLoaded', function() {
  const fabricFilterBtn = document.querySelector('.fabric-f > label > input');   // Filter window Button
  const fabricFilterBtnBackground = document.querySelector('.fabric-f > label'); // Filter window Button Background
  const fabricFilterBtnBackgroundColor = window.getComputedStyle(fabricFilterBtnBackground)  // FilterBtnBack color
    .getPropertyValue("background-color");
  const fabricFilterForm = document.querySelector('.fabric-f form');             // Filter form element
  const fabricFilters = fabricFilterForm.querySelector(".fabric-filter ul");
  const closeBtn = document.querySelector('.fabric-filter .close-btn');
  const resetBtn = document.querySelector('.fabric-filter .reset-btn');

  pageLoad.then((database) => {
    const fabricListAll = database.fabrics;
    new Promise((resolve, reject) => {
      let fabricList =[];
      for (let i = 0; i < fabricListAll.length; i++) {
          fabricList.push({id: fabricListAll[i].id, name: fabricListAll[i].name});
      }
      fabricFilters.innerHTML = fabricList.map((fabricf) => `
          <li data-fabricId="${fabricf.id}">
            <label>${fabricf.name}
              <input type="checkbox" name="fabric" value="${fabricf.id}">
            </label>
          </li>`
      ).join('');
      resolve(database);
    })
  });

  // Handle main filer box widow show/hide & animations
  const fabricFilterBoxBtnFunc = function() {
    if (fabricFilterBtn.checked) {
        fabricFilterForm.style.animation = '';
        fabricFilterForm.style.webkitAnimation = '';
        fabricFilterForm.style.animation = 'fade-in-filter 0.4s linear';
        fabricFilterForm.style.webkitAnimation = 'fade-in-filter 0.4s linear';
        fabricFilterForm.style.display = 'block';
    } else {
        fabricFilterForm.style.animation = '';
        fabricFilterForm.style.webkitAnimation = '';
        fabricFilterForm.style.animation = 'fade-out-filter 0.35s ease';
        fabricFilterForm.style.webkitAnimation = 'fade-out-filter 0.35s ease';
    }
  };

  closeBtn.addEventListener('click', () => {
    fabricFilterBtn.checked = false;
    fabricFilterBoxBtnFunc();
  });

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fabricFilterForm.reset();
  });

  // consider filters
  const considerFilters = function (e) {
    if (fabricFilterBtn.checked) {
      if (filterParameters.fabricFilterChecked) {
        fabricFilterForm.reset();
        const selectedValueArr = filterParameters.fabricArr;
        selectedValueArr.forEach( v => {
          const inp = e.target.parentElement.nextElementSibling.querySelector(`input[value='${v}']`);
          inp.checked = true;
        });
      } else {
        fabricFilterForm.reset();
      }
    }
  };

  document.addEventListener('mousedown', (e) => {
    if (!fabricFilterBtn.parentElement.contains(e.target) && !fabricFilterForm.contains(e.target)) {
        fabricFilterBtn.checked = false;
        fabricFilterBoxBtnFunc();
    }
  });   
                     
  fabricFilterForm.addEventListener('animationend',(e) => {
    if (e.animationName === 'fade-out-filter') {
        fabricFilterForm.style.display = 'none';
    }
  });

  fabricFilterBtn.parentElement.addEventListener('click', fabricFilterBoxBtnFunc);
  fabricFilterBtn.addEventListener('change', fabricFilterBoxBtnFunc);
  fabricFilterBtn.addEventListener('change', considerFilters);

  // Filter implementer buttons

  const fabricFilterSetter = document.querySelector(".submit-filter.submit-fabric-f > button");
  const fabricFilterClear = document.querySelector(".clear-filter.submit-fabric-f > button");

  fabricFilterSetter.addEventListener('click', (e) => {
    e.preventDefault();
    let ids = [];
    const inp = Array.from(e.target.parentElement.previousElementSibling.querySelectorAll('input:checked'));
    const id = inp.forEach((el) => ids.push(parseInt(el.getAttribute('value'))));
    filterParameters.fabricArr = ids;
    filterParameters.fabricFilterChecked = true;
    if (filterParameters.fabricArr[0] !== undefined) {
        fabricFilterBtnBackground.style.backgroundColor = '#274f6b';
      } else {
        fabricFilterBtnBackground.style.backgroundColor = fabricFilterBtnBackgroundColor;
    }
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    closeBtn.click();
  });
  fabricFilterClear.addEventListener('click', (e) => {
    e.preventDefault();
    filterParameters.fabricArr = [];
    filterParameters.fabricFilterChecked = false;
    fabricFilterBtnBackground.style.backgroundColor = fabricFilterBtnBackgroundColor;
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    resetBtn.click();
    closeBtn.click();
  });
  
});

// Color filter implementing

document.addEventListener('DOMContentLoaded', function() {
  const colorFilterBtn = document.querySelector('.color-f > label > input');               // Filter window Button
  const colorFilterBtnBackground = document.querySelector('.color-f > label');             // Filter window Button color
  const colorFilterBtnBackgroundColor = window.getComputedStyle(colorFilterBtnBackground)  // FilterBtnBack color
    .getPropertyValue("background-color");
  const colorFilterForm = document.querySelector('.color-f form');                         // Filter form element
  const colorFilters = colorFilterForm.querySelector(".color-filter ul");
  const closeBtn = document.querySelector('.color-filter .close-btn');
  const resetBtn = document.querySelector('.color-filter .reset-btn');

  pageLoad.then((database) => {
    const colorListAll = database.colors;
    new Promise((resolve, reject) => {
      let colorList =[];
      for (let i = 0; i < colorListAll.length; i++) {
          colorList.push({id: colorListAll[i].id, name: colorListAll[i].name});
      }
      colorFilters.innerHTML = colorList.map((colorf) => `
          <li data-colorId="${colorf.id}">
            <label>${colorf.name}
              <input type="checkbox" name="color" value="${colorf.id}">
            </label>
          </li>`
      ).join('');
      resolve(database);
    })
  });

  // Handle main filer box widow show/hide & animations
  const colorFilterBoxBtnFunc = function() {
    if (colorFilterBtn.checked) {
        colorFilterForm.style.animation = '';
        colorFilterForm.style.webkitAnimation = '';
        colorFilterForm.style.animation = 'fade-in-filter 0.4s linear';
        colorFilterForm.style.webkitAnimation = 'fade-in-filter 0.4s linear';
        colorFilterForm.style.display = 'block';
    } else {
        colorFilterForm.style.animation = '';
        colorFilterForm.style.webkitAnimation = '';
        colorFilterForm.style.animation = 'fade-out-filter 0.35s ease';
        colorFilterForm.style.webkitAnimation = 'fade-out-filter 0.35s ease';
    }
  };

  closeBtn.addEventListener('click', (e) => {
    colorFilterBtn.checked = false;
    colorFilterBoxBtnFunc();
  });

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    colorFilterForm.reset();
  });

  // consider filters
  const considerFilters = function (e) {
    if (colorFilterBtn.checked) {
      if (filterParameters.colorFilterChecked) {
        colorFilterForm.reset();
        const selectedValueArr = filterParameters.colorArr;
        selectedValueArr.forEach( v => {
          const inp = e.target.parentElement.nextElementSibling.querySelector(`input[value='${v}']`);
          inp.checked = true;
        });
      } else {
        colorFilterForm.reset();
      }
    }
  };

  document.addEventListener('mousedown', (e) => {
    if (!colorFilterBtn.parentElement.contains(e.target) && !colorFilterForm.contains(e.target)) {
        colorFilterBtn.checked = false;
        colorFilterBoxBtnFunc();
    }
  });   
                     
  colorFilterForm.addEventListener('animationend',(e) => {
    if (e.animationName === 'fade-out-filter') {
        colorFilterForm.style.display = 'none';
    }
  });

  colorFilterBtn.parentElement.addEventListener('click', colorFilterBoxBtnFunc);
  colorFilterBtn.addEventListener('change', colorFilterBoxBtnFunc);
  colorFilterBtn.addEventListener('change', considerFilters);

  // Filter implementer buttons

  const colorFilterSetter = document.querySelector(".submit-filter.submit-color-f > button");
  const colorFilterClear = document.querySelector(".clear-filter.submit-color-f > button");

  colorFilterSetter.addEventListener('click', (e) => {
    e.preventDefault();
    let ids = [];
    const inp = Array.from(e.target.parentElement.previousElementSibling.querySelectorAll('input:checked'));
    const id = inp.forEach((el) => ids.push(parseInt(el.getAttribute('value'))));
    filterParameters.colorArr = ids;
    filterParameters.colorFilterChecked = true;
    if (filterParameters.colorArr[0] !== undefined) {
        colorFilterBtnBackground.style.backgroundColor = '#274f6b';
      } else {
        colorFilterBtnBackground.style.backgroundColor = colorFilterBtnBackgroundColor;
    }
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    closeBtn.click();
  });

  colorFilterClear.addEventListener('click', (e) => {
    e.preventDefault();
    filterParameters.colorArr = [];
    filterParameters.colorFilterChecked = false;
    colorFilterBtnBackground.style.backgroundColor = colorFilterBtnBackgroundColor;
    filterParameters.page = 1;
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    runFilteringInSequence(filterParameters);
    
    resetBtn.click();
    closeBtn.click();
  });
  
});

// inStock products filtering

document.addEventListener('DOMContentLoaded', function() {
  const inStockFilterToggler = document.querySelector('.toggler label');
  const throttledFunction = throttle(inStock, 3000); 
  inStockFilterToggler.addEventListener('click', (e) => {
    e.preventDefault();
    throttledFunction(e);
  });

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

  function inStock(e) {
    if (!e.currentTarget.querySelector('input').checked) {
      e.currentTarget.querySelector('input').checked = true;
      filterParameters.inStockVal = true;
      filterParameters.inStockFilterChecked = true;
      filterParameters.page = 1;
      // update URL
      const newUrl = updateURLFromFilterParameters();
      historyManager.saveState(newUrl, true);
      runFilteringInSequence(filterParameters);
      
    } else {
      e.currentTarget.querySelector('input').checked = false;
      filterParameters.inStockVal = false;
      filterParameters.inStockFilterChecked = false;
      filterParameters.page = 1;
      // update URL
      const newUrl = updateURLFromFilterParameters();
      historyManager.saveState(newUrl, true);
      runFilteringInSequence(filterParameters);
      
    };
  }
});

// Sorter element custom select

{
  const closeAllSelect = function(elmnt) {
    /*a function that will close all select boxes in the document, except the current select box:*/
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
            if (s[s.selectedIndex].getAttribute('data-page-size')) {
              filterParameters.pageSize = parseInt(s[s.selectedIndex]?.getAttribute('data-page-size'));
            } else {
              throw undefined;
            };
          } catch (e) {
            filterParameters.sortField = s[s.selectedIndex]?.getAttribute('data-sort-field');
            filterParameters.sortDirection = s[s.selectedIndex]?.getAttribute('data-sort-dir');
          } finally {
            filterParameters.page = 1;
            // update URL
            const newUrl = updateURLFromFilterParameters();
            historyManager.saveState(newUrl, true);
            runFilteringInSequence(filterParameters);
          };
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
  
    /*if the user clicks anywhere outside the select box,
  then close all select boxes:*/
  document.addEventListener("click", closeAllSelect);

}

pageLoad.finally(() => {
  if (localStorage.getItem('storeItemLink') && localStorage.getItem('storeItemLink') !== undefined) {
    // Search by stored category
    const category = JSON.parse(localStorage.getItem('storeItemLink'));
    filterParameters.category = parseInt(category);
    filterParameters.categoryFilterChecked = true;
    localStorage.removeItem('storeItemLink');
    const catFilterBtnBackground = document.querySelector('.cat-f > label');
    if (filterParameters.category !== undefined) {
        catFilterBtnBackground.style.backgroundColor = '#274f6b';
      } else {
        catFilterBtnBackground.style.backgroundColor = 'rgb(116, 144, 162)';
    }
    // update URL
    const newUrl = updateURLFromFilterParameters();
    historyManager.saveState(newUrl, true);
    return runFilteringInSequence(filterParameters);
  };
  if ((new URLSearchParams(window.location.search).get('keyword') !== null) ||
      (localStorage.getItem('searchData') && localStorage.getItem('searchData') !== undefined)) {
    // Search by stored keyword
    const searchedKeywordContainer = document.querySelector('.searched-value');
    const keywordContainer = document.querySelector('.searched-value > div > p');
    const keywordEraser = document.querySelector('.searched-value > div > p > i');
    let keyword;
    if (new URLSearchParams(window.location.search).get('keyword') !== null) {
      keyword = new URLSearchParams(window.location.search).get('keyword');
    } else {
      keyword = JSON.parse(localStorage.getItem('searchData'));
    }
    filterParameters.keyword = keyword;
    const newUrl = updateURLFromFilterParameters();
    keywordContainer.setAttribute('data-search-value', keyword);
    searchedKeywordContainer.style.display = 'flex';
    const urlFilters = parseURLToFilterParameters();
    Object.assign(filterParameters, urlFilters);
    historyManager.updateUIFromState();
    historyManager.logState('Initialized from URL', filterParameters);
    historyManager.updateCurrentState(newUrl);
    keywordEraser.onclick = () => {
      searchedKeywordContainer.style.display = 'none';
      keywordContainer.removeAttribute('data-search-value');
      filterParameters.keyword = undefined;
      filterParameters.page = 1;
      // update URL
      const newUrl = updateURLFromFilterParameters();
      historyManager.saveState(newUrl, true);
      return runFilteringInSequence(filterParameters);
    }
    localStorage.removeItem('searchData');
  };
  // Initialize from URL if parameters exist
  if (window.location.search) {
    const urlFilters = parseURLToFilterParameters();
    Object.assign(filterParameters, urlFilters);
    historyManager.updateUIFromState();
    historyManager.logState('Initialized from URL', filterParameters);
    historyManager.updateCurrentState();
  };
  runFilteringInSequence(filterParameters);
});

pageLoad.catch((err) => {    
  console.error(err);
});

// converting a single number to persian number
function persianNum() {
  const num = Array.from(document.querySelectorAll(".persianNum"));
  num.forEach((e) => {
    e.textContent = toPersianNumbers(e.textContent);
  });
}
document.addEventListener('DOMContentLoaded', persianNum);

function updateURLFromFilterParameters() {
  const newUrl = new URL(window.location);
  
  Object.entries(filterParameters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      newUrl.searchParams.delete(key);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        newUrl.searchParams.set(key, value.join(','));
      } else {
        newUrl.searchParams.delete(key);
      }
    } else {
      newUrl.searchParams.set(key, value.toString());
    }
  });
  
  return newUrl;
}

function parseURLToFilterParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const newParams = {...filterParameters};

  Object.keys(newParams).forEach(key => {
    let value;
    if (key === 'category') {
      if (urlParams.get(key) === null) {
        value = undefined;
      } else if (typeof Number(urlParams.get(key)) !== 0) {
        if (Number(urlParams.get(key)) < 0 ) value = undefined;
        if (Number(urlParams.get(key)) < 14 ) value = Number(urlParams.get(key));
      }
    } else if (key === 'upperBound') {
      if (urlParams.get(key) === null) {
        value = filterParameters.upperBound;
      } else if (urlParams.get(key) === Infinity) {
        value = filterParameters.upperBound;
      } else {
        value = urlParams.get(key);
      }
    } else {
      value = urlParams.get(key);
    }
    if (typeof value !== 'undefined') {
      if (value !== null) {
        if (Array.isArray(newParams[key])) {
          newParams[key] = value.split(',').map(v => {
            const num = Number(v);
            return isNaN(num) ? v : num;
          });
        } else if (typeof newParams[key] === 'number') {
          newParams[key] = Number(value);
        } else if (typeof newParams[key] === 'boolean') {
          newParams[key] = value === 'true';
        } else {
          newParams[key] = value;
        }
      }
    }
  });
 
  return newParams;
}
