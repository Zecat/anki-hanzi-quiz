import { fetchMedia } from "./anki_api";
//import { openDB } from 'idb';
import storage from "localforage";

import {state} from "./state"
declare const window: any;

export type Matches = number[][] | null[];
export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    etymology: {
        type: string;
        semantic: string;
        hint: string;
    };
    radical: string;
    matches: Matches
};

export default class HanziDictionary {
    _dictMediaFilename = "hanzi_dictionary_2.json";
    _dbName = "hanzi_dictionary";
    _storeName = "characters";
    _dbVersion = 1;
    dictReady: Promise<any>
    data: any

    //_dataStoredPromise: Promise<any>;

    async fetchDictionary() {
        return fetchMedia(this._dictMediaFilename)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Dictionnary fetch request was not ok");
                }
                //response.text().then(a => state.toto = `data: ${a.substring(0, 100)}`)
                return response.json();
            })
            .catch((err) => {
                throw new Error("Dictionary fetch request failed: " + err);
            });
    }

//async  main() {
//  // Open the IndexedDB database
//  const db = await openDB('yolo', 1, {
//    upgrade(db) {
//      // Create an object store
//      db.createObjectStore('myStore');
//      //store.put(0, 'mydigit'); // Initialize 'mydigit' key with value 0
//    },
//  });
//   let v:number|null= await (await db).get('myStore', 'digit');
//    console.log("====",v)
//   v = v? v+1 : 1;
//    console.log("====",v)
//    await (await db).put('myStore', v, 'digit');
//    state.toto = window.location.href + "val"+v
//
//  // Start a transaction
//  //const tx = db.transaction('myStore', 'readwrite');
//  //const store = tx.objectStore('myStore');
//
//  //// Retrieve the current value stored under the key "mydigit"
//  //let currentValue = await store.get('mydigit');
//
//  //// If the value exists, increment it. If it doesn't exist, set it to 1.
//  //let newValue = currentValue ? currentValue + 1 : 1;
//
//  //// Store the updated value back into the database
//  //await store.put(newValue, 'mydigit');
//
//  //// Commit the transaction
//  //await tx.done;
//
//  //// Log the retrieved and updated value to the console
//  //console.log("Value stored successfully: " + newValue);
//  //  state.toto = "val"+newValue
//}
//async main() {
//  try {
//    // Retrieve the current value stored under the key "mydigit"
//    const currentValue:number|null = await storage.getItem('mydigit');
//
//    // If the value exists, increment it. If it doesn't exist, set it to 1.
//    const newValue = currentValue ? currentValue + 1 : 1;
//
//    // Store the updated value back into the database
//    await storage.setItem('mydigit', newValue);
//
//    // Log the retrieved and updated value to the console
//    console.log("Value stored successfully: " + newValue);
//      state.toto = "value"+newValue
//  } catch (error) {
//    // Handle errors
//    console.error("Error:", error);
//      state.toto = "err" + error
//  }
//}
async  getFile() {
  // Open file picker and destructure the result the first handle
  const [fileHandle] = await window.showOpenFilePicker();
  const file = await fileHandle.getFile();
  return file;
}

    constructor() {

        this.dictReady = this.fetchDictionary().then((data:any) => {this.data = data})
//        this.fetchDictionary().then((data:any) => {
//            console.log(data)
//                                if (!Array.isArray(data))
//                                    throw new Error(
//                                        "The dictionary must contain a JSON array",
//                                    );
//            state.toto = data[0].definition
//})
        //storage.config({
        //    driver: storage.INDEXEDDB, // Use IndexedDB as the storage backend
        //    name: this._dbName, // Name of the database
        //    version: this._dbVersion, // Version of the database
        //    storeName: this._storeName, // Name of the data store
        //});
//        setTimeout(()=> {
//
//this.getFile();
//        },2000)
        //this._dataStoredPromise = new Promise((resolve: any, reject: any) => {
        //    storage
        //        .length()
        //        .then((len) => {

        //            state.toto = `len: ${len}`
        //            if (len) resolve();
        //            else {
        //                this.fetchDictionary()//.then(resolve).catch(reject)
        //                    .then((data: any) => {
        //                        if (!Array.isArray(data))
        //                            throw new Error(
        //                                "The dictionary must contain a JSON array",
        //                            );
        //                        this.populateData(data)
        //                            .then(resolve)
        //                            .catch(reject);
        //                    })
        //                    .catch(reject);
        //            }
        //        })
        //        .catch(reject);
        //});
    }

    async populateData(data: any) {
        const promises = data.map((obj: any) => {
            const character = obj.character;
            if (!character) {
                console.warn("Ignoring entry, it has no character: ", obj);
                return Promise.resolve();
            }
//            if (i > 100) {
//                setTimeout(()=> {
//                storage.getItem("一").then((a:any) => state.toto = a.definition)
//},1000)
//                return
//            }
            return storage.setItem(character, obj);
        });

        return Promise.all(promises).then(()=>state.toto="DONE")
    }

getEmptyItem() :CharDataItem {
    return {
    character: "",
    definition: "",
    pinyin: [],
    decomposition: "",
    etymology: {
        type: "",
        semantic: "",
        hint: "",
    },
    radical: "",
    matches: []
    };
}

    async get(char: string): Promise<CharDataItem> {
        await this.dictReady
        console.log(char)
        return {...this.data[char], character: char} || this.getEmptyItem()
        // try {
        //    await this._dataStoredPromise;
        //} catch (err) {
        //    console.warn("An error occured: ", err);
        //    state.toto = `ERR ${err}`
        //    return this.getEmptyItem();
        //}
        //const item = await storage.getItem(char);
        //// TODO catch err
        //if (item == null)
        //    return this.getEmptyItem();
        //return item as CharDataItem
    }
}
