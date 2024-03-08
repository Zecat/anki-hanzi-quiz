//import { fetchMedia } from "./anki_api";
//
//export default class HanziDictionary {
    //_dict: any; // TODO typing
    //_dictMediaFilename = "_hanzi_dictionary.json";
    //_indexDBName = "hanzi_dictionary";
    //_storeName = "characters";
    //_indexDBVersion = 1;
    //_objectStore: any; // TODO typing
    //_dictPromise: Promise<any>;
    //_dbPromise: Promise<any>;
//
    //constructor() {
        //if (this._objectStore) {
            //this._dbPromise = Promise.resolve(this._objectStore)
        //}
        //if (this._dict) {
            //this._dictPromise = Promise.resolve(this._dict);
            //return this._dict;
        //}
        //this._dbPromise =  new Promise((dbResolve:any, dbReject:any) => {
        //this._dictPromise = fetchMedia(this._dictMediaFilename)
            //.then((response) => {
                //if (!response.ok) {
                    //throw new Error("Network response was not ok");
                //}
                //return response.json();
            //})
            //.catch((error) => {
                //console.error(
                    //"There was a problem with the fetch operation:",
                    //error,
                //);
            //});
        //this._dictPromise
            //.then((dict) => {
                //this._dict = dict;
                //this.ensureIndexDB(dbResolve, dbReject);
            //})
            //.catch((err) => console.warn(err));
        //})
    //}
//
    ////async ensureDictionary() {
    ////    if (this._dict) {
    ////        this._dictPromise = Promise.resolve(this._dict)
    ////        return this._dict;
    ////    }
    ////    this._dictPromise = fetchMedia(this._dictMediaFilename)
    ////        .then((response) => {
    ////            if (!response.ok) {
    ////                throw new Error("Network response was not ok");
    ////            }
    ////            return response.json();
    ////        })
    ////        .catch((error) => {
    ////            console.error(
    ////                "There was a problem with the fetch operation:",
    ////                error,
    ////            );
    ////        });
    ////    this._dict = await this._dictPromise
    ////    return this._dict;
    ////}
//
    //async populateData(objectStore: any, data: any) {
        //// The object store is empty, so populate the data
//
        //// Iterate over the array and add each object to the object store
        ////const data = [
        ////  {"character":"龹","definition":"Form of 卷 used as a phonetic component","pinyin":["quǎn"],"decomposition":"⿻？丿","radical":"丿","matches":[null,null,null,null,[1],null]},
        ////  {"character":"龺","definition":"sunlight; the rays of the sun","pinyin":["gān"],"decomposition":"⿳十日十","radical":"日","matches":[[0],[0],[1],[1],[1],[1],[2],[2]]}
        ////];
//
        //(await data).forEach((obj: any) => {
            //const request = objectStore.add(obj);
            //request.onerror = function (event: any) {
                //console.error(
                    //"Error adding object:",
                    //(event.target as IDBRequest).error,
                //);
            //};
        //});
//
        ////transaction.oncomplete = function () {
        ////    console.log("Objects added successfully");
        ////};
    //}
//
    //get(char:string) {
        //return new Promise((resolve, reject) => {
            //const db = await this._dbPromise
            //// Retrieve the entry based on its key
            //const getRequest = db.get(char);
//
            //getRequest.onsuccess =  (event:any)=> {
                //const entry = event.target.result;
                //if (entry) {
                    //console.log("Entry retrieved:", entry);
                    //resolve(entry);
                //} else {
                    //console.log("Entry not found");
                    //resolve(entry);
                //}
            //};
//
            //getRequest.onerror =  (event:any)=> {
                //console.error("Error retrieving entry:", event.target.error);
                //reject(event.target.error);
            //};
        //});
    //}
//
    //async ensureIndexDB(dbResolve, dbReject) {
        //const request = indexedDB.open(this._indexDBName, this._indexDBVersion);
//
        //request.onerror = (event) => {
            //console.error(
                //"Error opening database:",
                //(event.target as IDBOpenDBRequest).error,
            //);
            //dbReject()
        //};
//
        //request.onupgradeneeded = (event: any) => {
            //const db = (event.target as IDBOpenDBRequest).result;
            //db.createObjectStore(this._storeName, {
                //keyPath: "character",
            //});
        //};
//
        //request.onsuccess = async (event: any) => {
            //const db = (event.target as IDBOpenDBRequest).result;
            //const transaction = db.transaction([this._storeName], "readwrite");
            //this._objectStore = transaction.objectStore(this._storeName);
//
            //const countRequest = this._objectStore.count();
//
            //countRequest.onsuccess = () => {
                //const count = countRequest.result;
                //if (count === 0) {
                    //await this.populateData(this._objectStore, this._dictPromise);
                //} else {
                    //console.log(
                        //"Database is not empty, no need to populate data",
                    //);
                //}
                //dbResolve(this._objectStore)
            //};
//
            ////request.onsuccess = (event) => {
            ////    const db = (event.target as IDBOpenDBRequest).result;
//
            ////    // Increment definition on page reload
            ////    function incrementDefinition() {
            ////        const transaction = db.transaction([storeName], "readwrite");
            ////        const store = transaction.objectStore(storeName);
            ////        const getRequest = store.get(1);
//
            ////        getRequest.onsuccess = (event) => {
            ////            const data = (
            ////                event.target as IDBRequest<{
            ////                    character: number;
            ////                    definition: number;
            ////                }>
            ////            ).result;
            ////            if (data) {
            ////                //data.value++;
            ////                const updateRequest = store.put(data);
            ////                updateRequest.onsuccess = () => {
            ////                    //console.log("Incremented value:", data.value);
            ////                };
            ////                updateRequest.onerror = function (event) {
            ////                    console.error(
            ////                        "Error updating value:",
            ////                        (event.target as IDBRequest).error,
            ////                    );
            ////                };
            ////            } else {
            ////                // Initialize value if not present
            ////                store.add({ value: 1 });
            ////            }
            ////        };
//
            ////        getRequest.onerror = function (event) {
            ////            console.error(
            ////                "Error getting value:",
            ////                (event.target as IDBRequest).error,
            ////            );
            ////        };
            ////    }
//
            ////    incrementValue();
            ////};
        //};
    //}
//}
