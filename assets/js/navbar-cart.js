
// Creating nested style sheets and attach to Dom using JSS - Alternative to document.adoptedStyleSheets;

const jss = window.jss.default;
const preset = window.jssPresetDefault.default;
jss.setup(preset());

const cartStyles = {
  cartContainer: {
      zIndex: '200',
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      transition: '0.5s',
  
      '&>.cart-overlay': {
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          inset: '0',
          zIndex: '-1',
          transition: '0.5s',
          position: 'absolute',
          opacity: '0',
      },
    
      '&.open': {
          pointerEvents: 'fill',
    
          '&>.cart-overlay': {
              opacity: '1',
          },
      },
    
      '&>.cart': {
          position: 'absolute',
          zIndex: '201',
          left: '0',
          top: '0',
          bottom: '0',
          height: '100%',
          width: '350px',
          transform: 'scaleX(0)',
          transformOrigin: '-50% 50%',
          display: 'flex',
          flexDirection: 'column',
          transition: '0.5s',
          pointerEvents: 'none',
          backgroundColor: '#FFF',
      
          '&.open': {
              transform: 'scaleX(1)',
              pointerEvents: 'fill',
          },
      
          '&>.cart-wrapper': {
              padding: '16px 0px',
              minHeight: '100%',
              minWidth: '100%',
              overflow: 'auto',
              overscrollBehavior: 'none',
              display: 'flex',
              flexDirection: 'column',
    
              '&>.cart-header': {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '3px solid #eee',
                  paddingBottom: '18px',
                  paddingRight: '12px',
                  paddingLeft: '12px',
                  position: 'relative',
                  flex: '0 0 auto',
    
                  '&>.cart-title': {
                      fontSize: '22px',
                      height: '35px',
                  },
    
                  '&>.left-buttons': {
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      height: '35px',
    
                      '&>i': {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          cursor: 'pointer',
    
                          '&:active': {
                              cursor: 'pointer',
                          },
      
                          '&:hover': {
                              color: '#ed4093',
                              transition: 'all 0.4s',
                          },
                      },
    
                      '&> #trash-cart': {
                          fontSize: '20px',
    
                          '&::after': {
                              content: '"خالی کردن سبد"',
                              fontFamily: 'Estedad-Reg',
                              fontWeight: '100',
                              fontSize: '13px',
                          },
                      },
    
                      '&> #close-cart': {
                          fontSize: '20px',
    
                          '&::after': {
                              content: '"بستن"',
                              fontFamily: 'Estedad-Reg',
                              fontWeight: '100',
                              fontSize: '13px',
                          },
                      },
                  },
              },
    
              '&> .cart-body': {
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  flex: '1 1 100%',
    
                  '&> .cart-orders': {
                      minHeight: '300px',
                      borderBottom: '3px solid #eee',
                      paddingBottom: '18px',
                      position: 'relative',
                      flex: '1 1 auto',

                      '&> div.orders-wrapper': {
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          bottom: '0',
                          left: '0',
                          maxHeight: '100%',
                          overflow: 'auto',
                          overflowX: 'hidden',
                          scrollbarWidth: 'thin',
                          overscrollBehavior: 'none',

                          '&> ul.orders-list': {
                              paddingRight: '12px',
                              paddingLeft: '6px',

                              '&> .user-order': {
                                  paddingTop: '20px',
        
                                  '&:hover > .product-name > span': {
                                    paddingRight: '12px',
                                  },
        
                                  '&:hover > .product-name': {
                                    backgroundColor: '#b2dbf4',
                                    borderRadius: '4px',
                                  },
            
                                  '&:not(:last-child)': {
                                      borderBottom: '3px solid #eee',
                                  },
            
                                  '&> .product-name': {
                                      display: 'block',
                                      fontSize: '16px',
                                      marginBottom: '6px',
                                      transition: '0.5s',
                                      cursor: 'pointer',
                                                                 
                                      '&> span': {
                                          fontWeight: '600',
                                          transition: '0.5s',
                                      },
                                  },
            
                                  '&> .product-order': {
                                      fontFamily: 'Estedad',
                                      fontSize: '16px',
                                      display: 'flex',
                                      height: '48px',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
            
                                      '&> .product-price': {
            
                                          '&> .special-sell': {
                                              display: 'flex',
                                              gap: '10px',
                                              alignItems: 'center',
            
                                              '&> .discount-value': {
                                                  width: '35px',
                                                  height: '30px',
                                                  backgroundColor: '#ffc6c6',
                                                  color: '#da1c1c',
                                                  display: 'flex',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  textAlign: 'center',
                                                  borderRadius: '4px',
                                              
                                                  '&::after': {
                                                      content: '"%"',
                                                  },
                                                  
                                              },
            
                                              '&> div': {
                                                  display: 'flex',
                                                  justifyContent: 'center',
                                                  flexDirection: 'column',
            
                                                  '&> .price-gross': {
                                                      fontSize: '13px',
                                                      color: '#878787',
                                                      position: 'relative',
                                                      width: 'fit-content',
            
                                                      '&::after': {
                                                          content: '""',
                                                          display: 'block',
                                                          width: '100%',
                                                          position: 'absolute',
                                                          top: '42%',
                                                          height: '2px',
                                                          borderBottom: '2px solid',
                                                      },
                                                  },
            
                                                  '&> .price-net': {
            
                                                      '&::after': {
                                                          content: " تومان",
                                                          fontSize: '14px',
                                                          color: '#878787',
                                                      },
                                                  },
                                              },
                                          },
            
                                          '&> .normal-sell': {
            
                                              '&> .price-net': {
            
                                                  '&::after': {
                                                      content: '" تومان"',
                                                      fontSize: '14px',
                                                      color: '#878787',
                                                  },
                                              },
                                          },
                                      },
            
                                      '&> .product-quantity': {
                                          display: 'flex',
                                          alignItems: 'center',
                                          height: '40px',
            
                                          '&> span': {
                                              width: '55px',
                                              display: 'inline-flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                          },
            
                                          '&> .quantity-btn': {
                                              fontSize: '16px',
                                              width: '24px',
                                              height: '24px',
                                              borderRadius: '4px',
                                              backgroundColor: '#265271',
                                              color: '#fff',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                          },
                                      },
                                  },
                              },

                              '&> .empty-cart': {
                                  minWidth: '100%',
                                  display: 'block',
                                  position: 'absolute',
                                  top: '40%',
                                  fontSize: '18px',
                                  color: 'rgb(39, 79, 107)',
                                  marginBlock: 'auto',
                                  marginInline: 'auto',
                                  textAlign: 'center',
                              },
                          },
                      },
                  },
    
                  '&> .cart-invoice-content': {
                      padding: '20px 12px',
                      display: 'flex',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px',
                      color: '#908f8f',
                      borderBottom: '3px solid #eee',
                      flex: '0 0 auto',
    
                      '&> div': {
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontFamily: 'Estedad',
                          fontSize: '16px',
    
                          '&> span:first-child': {
                              fontSize: '14px',
                          },
      
                          '&> span:last-child': {

                              '&.price-count': {
                                minWidth: '156px',
                                width: 'fit-content',
                                fontVariantNumeric: 'tabular-nums',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                              },
                              
                              '&.price-count::after': {
                                  content: '" تومان"',
                                  fontSize: '14px',
                                  color: '#878787',
                              },
                          },
                      },

                      '&> div.cart-benefit:has(> span[data-benefit-value="0"])': {
                          display: 'none',
                      },
    
                      '&> div.cart-overall': {
                          color: '#222',
                      },
                  },
    
                  '&> .cart-action': {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '16px',
                      paddingRight: '12px',
                      paddingLeft: '12px',
                      flex: '0 0 auto',
    
                      '&> button': {
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '210px',
                          textAlign: 'center',
                          height: '48px',
                          borderRadius: '6px',
                          fontSize: '16px',

                          '&:disabled': {
                              backgroundColor: '#9a9898',
                              color: 'rgb(190, 190, 190)',

                              '&::before': {
                                  opacity: '0',
                              },

                              '&:hover': {
                                  '&::after': {
                                      opacity: '0',
                                  },
                              },
                          },
                        
                          '&:hover': {
                              '&::after': {
                                  width: '150%',
                                  height: '150%',
                                  opacity: '1',
                              },
                          },
                      },
    
                      '&> .cart-show': {
                          backgroundColor: '#ffffff',
                          border: '2px solid var(--background-panel)',

                          '&> a': {
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: '100%',
                              textAlign: 'center',
                              height: '100%',
                              borderRadius: '6px',
                              fontSize: '16px',
                          },
                      },
    
                      '&> .cart-checkout': {
                          backgroundColor: 'var(--background-panel)',
                          border: '2px solid var(--background-panel)',
                          color: '#fff',
                          position: 'relative',

                          '&>.loader': {
                              visibility: 'hidden',
                              scale: '0.6',
                              position: 'absolute',
                              left: '38%',
                              top: '-5%',
                              width: '50px',
                              aspectRatio: '1',
                              display: 'grid',
                              borderRadius: '50%',
                              background: 'linear-gradient(0deg ,rgb(0 0 0/50%) 30%,#0000 0 70%,rgb(0 0 0/100%) 0) 50%/8% 100%,linear-gradient(90deg,rgb(0 0 0/25%) 30%,#0000 0 70%,rgb(0 0 0/75% ) 0) 50%/100% 8%',
                              backgroundRepeat: 'no-repeat',
                              animation: 'l23 1s infinite steps(12)',

                              '&::before, &::after': {
                                 content: "",
                                 gridArea: '1/1',
                                 borderRadius: '50%',
                                 background: 'inherit',
                                 opacity: '0.915',
                                 transform: 'rotate(30deg)',
                              },

                              '&::after': {
                                 opacity: '0.83',
                                 transform: 'rotate(60deg)',
                              },
                          },
                      },
                  },
              },
          },
      },
  },
};

const cartStyleSheet = jss.createStyleSheet(cartStyles).attach();
const cartClasses = cartStyleSheet.classes;

const badgeStyleSheet = `
  .cartCount {
    position: absolute;
    font-family: 'Estedad';
    background-color: #ff9401;
    width: 22px;
    height: 22px;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    text-align: center;
    top: -7px;
    right: -10px;
    z-index: 1;
    &:has(> span[data-value='0']) {
      display: none;
    }
    &>span {
      color: #fff !important;
      font-size: 14px !important;
    }
  }
`;

const styleBadge = new CSSStyleSheet();
styleBadge.replaceSync(badgeStyleSheet);


document.addEventListener('DOMContentLoaded', () => {

  // Adding cart side bar element to DOM

  document.getElementById('navbar1').insertAdjacentHTML("afterend", `
    <div class="cart-container">
      <div class="cart">
        <div class="cart-wrapper">
          <div class="cart-header">
            <span class="cart-title" data-count="">سبد خرید</span>
            <div class="left-buttons">
              <i class="las la-trash" id="trash-cart"></i>
              <i class="las la-times" id="close-cart"></i>
            </div>
          </div>
          <div class="cart-body">
            <div class="cart-orders">
              <div class="orders-wrapper">
                <ul class="orders-list">
                    <!-- sample order -->
                    <div class="user-order" data-product-id="" data-added-timestamp="">
                      <div class="product-name">
                        <span>نام کالا</span>
                      </div>
                      <div class="product-order">
                        <div class="product-price">
                          <!-- Or <div class="special-sell">
                            <span class="discount-value">20</span>
                            <div>
                              <span class="price-gross price-count">100000000</span>
                              <span class="price-net price-count">100000000</span>
                            </div>
                          </div>-->
                          
                          <div class="normal-sell">
                            <span class="price-net price-count">100000000</span>
                          </div>
                        </div>
                        <div class="product-quantity">
                          <button class="quantity-btn minus">
                            <i class="las la-minus"></i>
                          </button>
                          <span>20</span>
                          <button class="quantity-btn plus">
                            <i class="las la-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                </ul>
              </div>
            </div>
            <div class="cart-invoice-content">
              <!-- Sample contents -->
              <div class="cart-total">
                <span>مجموع</span>
                <span class="price-count">1000000</span>
              </div>
              <div class="cart-tax">
                <span>مالیات</span>
                <span class="price-count">1000000</span>
              </div>
              <div class="cart-shipping">
                <span>هزینه ارسال</span>
                <span class="price-count">100000</span>
              </div>
              <div class="cart-benefit">
                <span>سود شما از این خرید</span>
                <span class="price-count">1000000</span>
              </div>
              <div class="cart-overall">
                <span>قابل پرداخت</span>
                <span class="price-count">1000000</span>
              </div>
            </div>
            <div class="cart-action">
              <button class="cart-show">
                <a href="/checkout.html">
                  مشاهده مجموع کل سبد خرید
                </a>
              </button>
              <button class="cart-checkout" id="cart-immediate-payment">
                تسویه و ثبت سفارش
                <div class="loader"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="cart-overlay"></div>
    </div>
  `);

  // Cart Side Bar

  const cartContainer = document.querySelector(".cart-container");
  const cartOverlay = document.querySelector(".cart-overlay");
  const cartEl = document.querySelector("div.cart");
  const shadowRootNav = document.getElementById('navbar1').shadowRoot;
  const navCartBtn = document.getElementById('navbar1').shadowRoot.getElementById('nav-cart');
  const closeCartBtn = document.getElementById('close-cart');
  const emptyCartBtn = document.getElementById('trash-cart');

  const closeCart = function (event) {
      cartEl.classList.toggle("open");
      cartContainer.classList.toggle("open");
      cart();
      if (window.location.href.includes('checkout.html')) cartBill();
  };

  const emptyCart = function (ev) {
    let db = null;
    const request = indexedDB.open(`${username}`, 1);
    request.onsuccess = (e) => {
      db = e.target.result;
      const cartTX = db.transaction('cart', 'readwrite');
      const store = cartTX.objectStore('cart');
      const countReq = store.count();
      countReq.onsuccess = (e) => {
        if (e.target.result === 0) {
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
        const clearRequest = store.clear();
        clearRequest.onsuccess = (event) => console.log('The user cart has need cleared.');
        clearRequest.onerror = (event) => reject(event.target.error);
        cart();
        if (window.location.href.includes('checkout.html')) cartBill();
        cartChannel.postMessage("cart-updated");
      };
    };
    request.onerror = (event) => reject(event.target.error);
    return;
  }

  // Apply cartStyleSheet JSS classes to the cart-container
  cartContainer.className = cartClasses.cartContainer; 

  // cart badge element
  const cartBadge = document.createElement('div');
  cartBadge.innerHTML = `<span data-value='0'>0</span>`;

  // Apply styles to shadow DOM
  shadowRootNav.adoptedStyleSheets = [...shadowRootNav.adoptedStyleSheets, styleBadge];
  // Apply the class for cart badge element
  cartBadge.className = "cartCount";

  // Adding cart badge to shadow Dom
  navCartBtn.appendChild(cartBadge); 

  // cart open/close buttons
  navCartBtn.addEventListener('click', closeCart);
  closeCartBtn.addEventListener('click', closeCart);
  emptyCartBtn.addEventListener('click', emptyCart);

  cartOverlay.addEventListener("click", function (e) {
    e.stopPropagation();
    closeCart();
  });

  document.addEventListener('databaseSuccessReady', cart);
  document.addEventListener('databaseSuccessReady', function() {
    if (window.location.href.includes('checkout.html')) cartBill();
  });

  (async () => {
    try {
      let dbOpenReq = window.indexedDB.open(`${username}`, 1);
      dbOpenReq.addEventListener('success', (e) => {
        let db = e.target.result;
        if (db.objectStoreNames.contains("profile")) {
          cart();
          if (window.location.href.includes('checkout.html')) cartBill();
        } else {
          loginHandler();
        }
      });
    } catch (err) {
      console.log(err);
    }
  })();

});

// Cart BroadcastChannel
const cartChannel = new BroadcastChannel('cart-sync');
cartChannel.onmessage = (e) => {
  if (e.data === 'cart-updated') {
    console.log('cart-update-in-progress')
    cart();
    if (window.location.href.includes('checkout.html')) cartBill();
  }
};
cartChannel.onmessageerror = (e) => {
    console.log('cart-update-error', e.data)
};

// Cart contents functionality
async function cart() {
  if (productsDBReadySuccessEventDispatched !== true) {
    setTimeout(() => cart(), 100);
    return;
  };
  // Cart element recently added to the 'navbar1'
  const cartEl = document.querySelector("div.cart");
  const cartOrdersEl = document.querySelector('.cart-orders > div.orders-wrapper > ul.orders-list');
  const cartInvoiceContainer = document.querySelector(".cart-invoice-content");
  const cartActionContainer = document.querySelector(".cart-action");
  const cartCounterBadge = document.getElementById('navbar1').shadowRoot.querySelector('.cartCount');
  const shadowRootNav = document.getElementById('navbar1').shadowRoot;
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
    getPrice: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      return this.products[index].discountedPrice;
    },
    sellText: function(idNum) {
      let index = this.products.findIndex(item => Number(item.id) == Number(idNum));
      // Checking  if the product is in the "ويژه" category
      if (this.products[index].categoriesId.includes(8)) {
        return `
            <div class="special-sell">
                <span class="discount-value">${this.products[index].discount}</span>
                <div>
                    <span class="price-gross price-count order-price-dot">${this.products[index].price}</span>
                    <span class="price-net price-count order-price-dot">${this.products[index].discountedPrice}</span>
                </div>
            </div>`;
      } else {
          return `
              <div class="normal-sell">
                  <span class="price-net price-count order-price-dot">${this.products[index].price}</span>
              </div>`;
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
        // Checking if the product is in the "ويژه" category
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
      <div class="user-order" data-product-id="${products.id}" data-added-timestamp="${products.date}">
        <div class="product-name">
          <span>${productsObject?.getName(products.id)} ${materialText(products)} ${fabricText(products)} ${colorText(products)} </span>
        </div>
        <div class="product-order">
          <div class="product-price">
            ${productsObject?.sellText(products.id)}
          </div>
          <div class="product-quantity" data-stock-quantity="${productsObject?.quantity(products.id)}">
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
        </div>
      </div>
    `
  });
  cartOrdersEl.innerHTML = await innerHTMLTextArr.join('');
  // go to product page by clicking on product name
  cartOrdersEl.querySelectorAll('.product-name').forEach(elm => {
    elm.addEventListener('click', (e) => {
      e.preventDefault();
      const ProductId = Number(e.currentTarget.closest('[data-product-id]').dataset.productId);
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
      if (cartArr.length === 0) {
        cartInvoiceContainer.querySelectorAll('span:last-child.price-count')
          .forEach(item => {
            item.style.minWidth = 'unset';
            item.style.display = 'block';
          });
      }
      cart();
      if (window.location.href.includes('checkout.html')) cartBill();
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
              notificationS(
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
      cart();
      if (window.location.href.includes('checkout.html')) cartBill();
      cartChannel.postMessage("cart-updated");
    });
  });
  cartCounterBadge.innerHTML = `<span data-value='${count}'>${toPersianNumbers(count)}</span>`;
  
  new Promise((res, rej) => {
    cartTotalLastValue = cartInvoiceContainer.querySelector('div.cart-total span.price-count')?.textContent;
    cartTaxLastValue = cartInvoiceContainer.querySelector('div.cart-tax span.price-count')?.textContent;
    cartShippingLastValue = cartInvoiceContainer.querySelector('div.cart-shipping span.price-count')?.textContent;
    cartBenefitLastValue = cartInvoiceContainer.querySelector('div.cart-benefit span[data-benefit-value]')?.textContent;
    cartOverallLastValue = cartInvoiceContainer.querySelector('div.cart-overall span.price-count')?.textContent;
    cartInvoiceContainer.innerHTML = '';
    let cartInvoiceContainerInnerHTML = `
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
        <span>سود شما از این خرید</span>
        <span class="price-count" data-benefit-value="${calculateBenefit()}">${cartBenefitLastValue || 0}</span>
      </div>
      <div class="cart-overall">
        <span>قابل پرداخت</span>
        <span class="price-count">${cartOverallLastValue || 0}</span>
      </div>
    `;
    cartInvoiceContainer.insertAdjacentHTML('afterbegin', cartInvoiceContainerInnerHTML);
    cartTotal = cartInvoiceContainer.querySelector('div.cart-total span.price-count');
    cartTax = cartInvoiceContainer.querySelector('div.cart-tax span.price-count');
    cartShipping = cartInvoiceContainer.querySelector('div.cart-shipping span.price-count');
    cartBenefit = cartInvoiceContainer.querySelector('div.cart-benefit span[data-benefit-value]');
    cartOverall = cartInvoiceContainer.querySelector('div.cart-overall span.price-count');
    res();
  })
   .then(() => {
     animateCounter(cartTotal, (cartTotalLastValue) ? cartTotalLastValue : 1, total);
     animateCounter(cartTax, (cartTaxLastValue) ? cartTaxLastValue : 1, total * 0.1);
     animateCounter(cartShipping, (cartShippingLastValue) ? cartShippingLastValue : 1, Math.min(total * 0.1, cartArr.length * 750000));
     animateCounter(cartBenefit, (cartBenefitLastValue) ? cartBenefitLastValue : 1, calculateBenefit());
     animateCounter(cartOverall, (cartOverallLastValue) ? cartOverallLastValue : 1, calculateTotal());

     const submitAndPayButton = cartActionContainer.querySelector('button#cart-immediate-payment');
     submitAndPayButton.onclick = submitOrdersAndPayImmediately;

     async function submitOrdersAndPayImmediately() {
      
       if (typeof username === 'undefined' || username === 'notRegisteredUser') {
        notificationS(
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
            notificationS(
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
       const userDefaultAddress = await addressGetter();
       if (typeof userDefaultAddress === 'undefined') {
            notificationS(
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
          notificationS(
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
                 deliveryAddress = userDefaultAddress,
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
         cartActionContainer.querySelector('.loader').style.visibility = 'visible';
         let purchaseOperation = await settingPurchaseTransaction();
         let creditUpdateOperation = await settingNewCreditBalance();
         let updateLastPurchaseDateOperation = await settingUserLastBuy();
         let UpdateOrdersOverallQuantityOperation = await settingOrderQuantity();
       })()
        .then(() => {
          notificationS(
            "سفارش شما ثبت گردید. با تشکر از خرید شما!",
            "&bigstar;",
            "#13ff46ff",
            "#000000ff",
            "#1f88ffff",
            "payment-accomplished-01",
            "notif-success"
          );
          document.getElementById('trash-cart').click();
          setTimeout(() => {
            submitAndPayButton.disabled = false;
            cartActionContainer.querySelector('.loader').style.visibility = 'hidden';
            if (window.location.href.includes('dashboard')) window.history.go();
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
            const userNotes = (document.getElementById("suggestion")) ? document.getElementById("suggestion").querySelector('textarea').value : "";
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
        async function addressGetter() {
          return new Promise((resolve, reject) => {
            let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
            dbOpenRequest.addEventListener('success', async (e) => {
              let db = e.target.result;
              let addressTX = db.transaction('address', 'readonly');
              let addressStore = addressTX.objectStore('address');
              let addressCountRequest = addressStore.count();
              addressCountRequest.onsuccess = (ev) => {
                if (ev.target.result === 0) {
                  resolve(undefined);
                } else {
                  let cursorRequest = addressStore.openCursor();
                  cursorRequest.onsuccess = function(event) {                       
                      if (event.target.result) {                                                
                          let resultObj = event.target.result.value;
                          if (resultObj.default === true) {
                            resolve(resultObj.exact);
                          }
                          event.target.result.continue();                                       
                      } else {                                                                    
                          resolve(undefined);
                      }
                  };
                  cursorRequest.onerror = function(event) {
                      console.error("Cursor request failed:", event.target.error);
                  };
                };
              };
            });
          });
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
    cartOrdersEl.innerHTML = '<div class="empty-cart">سبد خرید شما در حال حاضر خالی است.</div>';
    cartInvoiceContainer.querySelectorAll('span:last-child.price-count')
      .forEach(item => {
        item.style.minWidth = 'unset';
        item.style.display = 'initial';
      });
  }

  if (cartArr.length !== 0) {
    cartInvoiceContainer.querySelectorAll('span:last-child.price-count')
      .forEach(item => {
        item.style.minWidth = '156px';
        item.style.display = 'flex';
      });
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
  
  function notificationS(
    msg = "testing", 
    icon = "&check;", 
    bkgc = "#fff", 
    txtc = "#000", 
    iconc = "#1f1", 
    CSSStylesheetId, 
    notifPrimaryClass = "notif-style-sheet"
  ) {
    const existNotifStylesheets = Array.from(shadowRootNav.querySelectorAll(`.${notifPrimaryClass}`));
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
         z-index: 3000;
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
         }`;
    const notifEl = document.createElement("div");
    notifEl.id = notifElId;
    notifEl.className = `notif-wrapper-${notifElId}`;
    notifEl.innerHTML = `
    <!-- Notification body -->
    <div class="notif-content-${notifElId}">
      <button class="notif-close-${notifElId}" onclick="document.getElementById('navbar1').shadowRoot.querySelector('.notif-wrapper-${notifElId}').style.display = 'none'">
        <span>&times;</span>
      </button>
      <div class="notif-msg-wrapper-${notifElId}">
        <i class="notif-icon-${notifElId}">${notifIcon}</i>
        <span class="notif-msg-${notifElId}">${notifMsg}</span>
      </div>
    </div>
    `;
    shadowRootNav.appendChild(notifCSSStylesheetEl);
    shadowRootNav.appendChild(notifEl);
    console.log(notifMsg);
    // Remove after 5 seconds
    setTimeout(notifRemover, 5450);
    function notifRemover() {
      const notifCSSEl = shadowRootNav.querySelector(`#${notifCSSStylesheetElId}`);
      shadowRootNav.removeChild(notifCSSEl);
      const notif = shadowRootNav.querySelector(`#${notifElId}`);
      shadowRootNav.removeChild(notif);
    }
  }
};
