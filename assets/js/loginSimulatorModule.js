
// Dispatch event when DB is ready
const dbReadySuccessEvent = new CustomEvent('databaseSuccessReady');
// Dispatch event when DB is ready
const dbReadyUpgradeEvent = new CustomEvent('databaseUpgradeReady');

loginHandler();

// login notification
async function loginHandler() {
  if ((sessionStorage.getItem('authenticated') !== null) ||
      (localStorage.getItem('authenticated') !== null)
  ) {
    try {
      // Parse the authentication data from sessionStorage
      const authentication = function () {
        if (sessionStorage.getItem('authenticated')) {
          return JSON.parse(sessionStorage.getItem('authenticated'));
        } else {
          return JSON.parse(localStorage.getItem('authenticated'));
        }
      }
      let authenticated = authentication();
      let usernameLogged = authenticated.username;
      username = usernameLogged;
      // Open the IndexedDB database
      let authenticatedUser;
      await openDB();
      const requestUsers = indexedDB.open('users', 1);
      requestUsers.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('validUsers')) {
          const store = db.createObjectStore('validUsers', { keyPath: 'username' });
        }
      };
      requestUsers.onerror = () => reject(requestUsers.error);
      requestUsers.onsuccess = (e) => {
        let db = e.target.result;
        const transaction = db.transaction(['validUsers'], 'readonly');
        const store = transaction.objectStore('validUsers');
        // Fetch the full user data from IndexedDB using the key `username`
        const request = store.get(username); 
        request.onerror = () => reject(request.error);
        request.onsuccess = (e) => {
          authenticatedUser = e.target.result; // Will be undefined if not found
  
          // Check if the user was actually found in the database
          if (authenticatedUser) {
            notification(
              `${authenticatedUser.name} عزیز! خوش آمدید.`, 
              "&bigstar;", 
              "#25789eff", 
              "#fff", 
              "#fffb1fff", 
              "check-user-login-01", 
              "notif-info"
            );
          } else {
            if (sessionStorage.getItem('authenticated')) {
              sessionStorage.removeItem('authenticated');
            }
            if (localStorage.getItem('authenticated')) {
              localStorage.removeItem('authenticated');
            }
            username = undefined;
            handleUnauthenticatedUser();
            throw('unauthenticated User!');
          }
          console.log(authenticatedUser)
          const {name, createdAt} = authenticatedUser;
          const userInteraction = {
            profile: {
              name: name,
              email: (/(?:^09\d{9}$)/.test(username)) ? undefined : username,
              phone: (/(?:^09\d{9}$)/.test(username)) ? username : undefined,
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
            let dbOpenRequest = window.indexedDB.open(`${username}`,1);
            dbOpenRequest.addEventListener('upgradeneeded', (e) => {
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
            dbOpenRequest.addEventListener('success', (e) => {
              document.addEventListener('databaseUpgradeReady', updateProfileNewUser);
              document.dispatchEvent(dbReadyUpgradeEvent);
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
                        document.dispatchEvent(dbReadySuccessEvent);
                        console.log('User Credit added.');
                      };
                      creditBalanceRequest.onerror = (err) => console.warn(err);
                    } else {
                      document.dispatchEvent(dbReadySuccessEvent);
                    }
                  };
                  creditBalanceCountRequest.onerror = (err) => console.warn(err);
                });
                dbOpenReq.addEventListener('error', (err) => console.warn(err));
              }
            });
            dbOpenRequest.addEventListener('error', (err) => {
              console.log('Error occurred while trying to open db');
              console.warn(err);
            });
          }
          initUserProfile();
        }; 
      }
      
    } catch (error) {
      // Handle errors (e.g., show a message, redirect to an error page)
      console.error("An error occurred while fetching user data:", error);
    }
  } else {
    handleUnauthenticatedUser();
  };

  function handleUnauthenticatedUser() {
    // Unauthenticated user
    notification(
      "برای استفاده از امکانات سایت لطفا ثبت نام کنید.", 
      "&bigstar;", 
      "#25789eff", 
      "#fff", 
      "#fffb1fff", 
      "check-user-login-01", 
      "notif-info"
    );
    username = 'notRegisteredUser';
    {
      const userInteraction = {
        profile: {
          name: 'notRegisteredUser',
          email: "-",
          phone: "-",
          registrationDate: undefined,
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
      // opening indexedDB for user
      function initNotRegisteredUserProfile() {
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
        let dbOpenRequest = window.indexedDB.open(`${username}`, 1);
        function makeTX(storeName, mode) {
          let tx = db.transaction(storeName, mode);
          tx.onerror = (err) => console.warn(err);
          return tx;
        }
        // event listeners
        dbOpenRequest.addEventListener('upgradeneeded', (e) => {
          db = e.target.result;
          let oldVersion = e.oldVersion;
          let newVersion = e.newVersion;
          console.log('User database updated from version', oldVersion, 'to', newVersion);
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
        dbOpenRequest.addEventListener('success', (e) => {
          let db = e.target.result;
          if (!db.objectStoreNames.contains("profile")) {
            new Promise((res,rej) => {
              res(window.indexedDB.deleteDatabase(`${username}`));
            })
            .then(() => initNotRegisteredUserProfile());
            return;
          };
          let profileTX = db.transaction(['profile','creditBalance'], 'readwrite');
          profileTX.oncomplete = () => console.log('notRegisteredUser profile creation on progress.');
          profileTX.onerror = (err) => console.warn(err);
          //
          let profileStore = profileTX.objectStore('profile');
          let profileRequest = profileStore.count();
          profileRequest.onsuccess = (ev) => {
            if (ev.target.result === 0) {
              let req = profileStore.add(userInteraction.profile);
              req.onsuccess = (ev) => console.log('notRegisteredUser profile created.');
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
                document.dispatchEvent(dbReadySuccessEvent);
                console.log('notRegisteredUser Credit added.');
              };
              creditBalanceRequest.onerror = (err) => console.warn(err);
            } else {
              document.dispatchEvent(dbReadySuccessEvent);
            }
          };
          creditBalanceCountRequest.onerror = (err) => console.warn(err);
          
        });
        dbOpenRequest.addEventListener('error', (err) => {
          console.log('Error occurred while trying to open db');
          console.warn(err);
        });
      }
      initNotRegisteredUserProfile();
    }
  }

}


  

