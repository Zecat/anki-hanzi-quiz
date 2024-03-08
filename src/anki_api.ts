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

export const fetchMedia = (filename:string) => fetch(`${getAnkiPrefix()}/${filename}`)
