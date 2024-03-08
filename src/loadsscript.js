
    //if (!globalThis.ExternalScriptsLoaded) {
    //  for (script of scripts) {
    //    loadScript(script)
    //  }
    //  // guard to prevent further imports on Desktop & AnkiMobile
    //  globalThis.ExternalScriptsLoaded = true
    //}

//var scripts = [{
//        name: "Popper",
//        url: "_popper.min.js",
//        init: null
//    },
//    {
//        name: "PTR",
//        url: "_pulltorefresh.umd.min.js",
//        init: initPTR // <- function that is executed after load
//    },
//]
//
//
//async function loadScript(script) {
//    const scriptPromise = import (`${getAnkiPrefix()}/${script.url}`)
//    scriptPromise
//        .then(() => {
//                console.log(`Loaded ${script.name}.`)
//                if (script.init) script.init()
//            },
//            (error) => console.log(`An error occured while loading ${script.name}:`, error)
//        )
//        .catch((error) =>
//            console.log(`An error occured while executing ${script.name}:`, error)
//        );
//
//    if (globalThis.onUpdateHook) {
//        onUpdateHook.push(() => scriptPromise)
//    }
