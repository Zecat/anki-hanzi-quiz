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

const getAnkiPrefix = () => {
      return platform === Platform.Desktop ?
        "" :
        platform === Platform.Android ?
        "" :
        "."
}
console.log(getAnkiPrefix)

export const fetchMedia = (filename:string) =>{
//return fetch(`${getAnkiPrefix()}/${filename}`)
  return fetch(`http://192.168.1.18:3000/${filename}`)
}
