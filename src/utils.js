
export function createElement(html) {
    var elDiv = document.createElement('div') //it creates a stupid parent div, fix it
    elDiv.innerHTML = html
    return elDiv.children[0]
}

//could have similar interface then fetch: let response = await fetch(url); let arraybuffer = await(response.arrayBuffer())
export function fetchOnProgress(url, onProgress, responseType = 'arraybuffer') {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.responseType = responseType
        xhr.addEventListener('progress', e => onProgress(e.loaded / e.total))
        xhr.addEventListener('loadend', () => resolve(xhr)) //or' load'
        xhr.addEventListener('error', () => reject(xhr))
        xhr.addEventListener('abort', () => reject(xhr))
        xhr.open('GET', url)
        xhr.send()
        window.XHR = xhr
    })
}
