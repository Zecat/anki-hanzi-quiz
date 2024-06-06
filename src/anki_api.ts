

enum Platform {
  Desktop,
  Android,
  Web
}

declare let pycmd: any, AnkiDroidJS: any;

let platform: Platform;
if (typeof pycmd !== "undefined")
      platform = Platform.Desktop
else if (typeof AnkiDroidJS !== "undefined")
      platform = Platform.Android
else
      platform = Platform.Web

let api:any
if (platform === Platform.Android) {
  var jsApiContract = { version: "0.0.3", developer: 'toto@gmail.com' };
  api = new AnkiDroidJS(jsApiContract);
}

//-1 = unknown
//0 = new
//1 = learning
//2 = review
//3 = relearning
export const getAnkiCardType = async () => {
 if (!api)
   return -1
  else{
    let ret =  await api.ankiGetCardType()
    return ret.value
  }
}

const getAnkiPrefix = () => {
  return platform === Platform.Web ? "." : ""
}

export const getMediaUrl = (filename:string) =>{
  return `${getAnkiPrefix()}/${filename}`
}

export const fetchMedia = (filename:string) =>{
return fetch(getMediaUrl(filename))
}
