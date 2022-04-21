// create variable to hold db connection
let db;
// establish a connection to indexedDB database and set it to version 1
const request = indexedDB.open('budget-tracker',1);

request.onupgradeneeded = function(event) {
  // save a reference to the database 
  const db = event.target.result;
  // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts 
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  if(navigator.onLine) {
    uploadData();
  }
};
request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// on submit of data when there is no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions 
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access the object store for `new_transaction`
  const dataObjectStore = transaction.objectStore('new_transaction');

  // add record to your store with add method
  dataObjectStore.add(record);
}

function uploadData() {
  // open a transaction on your pending db
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access your pending object store
  const dataObjectStore = transaction.objectStore('new_transaction');

  // get all records from store and set to a variable
  const getAll = dataObjectStore.getAll();

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const dataObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          dataObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadData);
