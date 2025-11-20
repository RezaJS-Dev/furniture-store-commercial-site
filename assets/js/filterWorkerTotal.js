function openDB(db, v) {
  return new Promise((resolve, reject)=>{
    const DBOpenRequest = indexedDB.open(db, v);
    DBOpenRequest.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    DBOpenRequest.onerror = (event) => reject(event.target.error);
  });
}

self.onmessage = async (e) => {
  const { 
    lowerBound = 0,
    upperBound,
    category = undefined,
    colorArr = [],
    fabricArr = [],
    inStockVal = false,
    sortField = 'idIDX',
    sortDirection = 'desc',
    //page = 1,
    pageSize = 8,
    keyword = undefined,
    ...rest
  } = e.data;

  try {
  
    const db = await openDB('db', 1);
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index(sortField);
    
    const direction = sortDirection === 'desc' ? 'prev' : 'next';
    
    let counter = 0;    // Safety limit & to count how many found
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, direction);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (!cursor) {
          const summaryTotal = {
            totalMatches: counter,
            totalPages: Math.ceil(counter / pageSize)
          };
          resolve(summaryTotal);
          postMessage(summaryTotal);
          return;
        };
        
        const product = cursor.value;
        let match = true;
        
        // Apply filters
        if (keyword !== undefined &&
          !product.name.toLowerCase().includes(keyword.toLowerCase()) && 
          !product.description.toLowerCase().includes(keyword.toLowerCase()) &&
          !product.productDetails.toLowerCase().includes(keyword.toLowerCase())) {
            match = false;
        };
        if (match && category !== undefined && !product.categoriesId.includes(category)) {
          match = false;
        };
        if (match && product.discountedPrice > upperBound || product.discountedPrice < lowerBound) {
          match = false;
        };
        if (match && colorArr.length > 0 && !colorArr.every(color => product.colorId.includes(color))) {
          match = false;
        };
        if (match && fabricArr.length > 0 && !fabricArr.every(fabric => product.fabricId.includes(fabric))) {
          match = false;
        };
        if (match && inStockVal && !product.inStock) {
          match = false;
        };
        
        if (match) {
          counter++;
          
          // Skip records until we reach our page
          // It must place here to consider the filtered objects
          // and the arrangement of products in page one
        };
        
        // Stop if we have enough results or processed enough records plus Safety limit
        if (counter >= 10000) { 
          const summaryTotal = {
            totalMatches: counter,
            totalPages: Math.ceil(counter / pageSize)
          };
          resolve(summaryTotal);
  		    postMessage(summaryTotal);
          return;
        };
        cursor.continue();
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    postMessage({
      success: false,
      error: error.message
    });
  };
};

self.onerror = (error) => {
  console.error("Total Filter Worker error:", error);
  postMessage({ success: false, error: error.message });
};