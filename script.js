const qrList = document.getElementById('qrList');
let video = document.getElementById('preview');
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');

function startScanner() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();
      requestAnimationFrame(scan);
    });
}

function scan() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      saveToCookie(code.data);
    }
  }
  requestAnimationFrame(scan);
}

function saveToCookie(data) {
  let stored = getStoredQRCodes();
  if (!stored.includes(data)) {
    stored.push(data);
    document.cookie = `qrcodes=${JSON.stringify(stored)};path=/`;
    updateList();
  }
}

function getStoredQRCodes() {
  let match = document.cookie.match(/(?:^|; )qrcodes=([^;]*)/);
  return match ? JSON.parse(decodeURIComponent(match[1])) : [];
}

function updateList() {
  qrList.innerHTML = '';
  getStoredQRCodes().forEach(code => {
    let li = document.createElement('li');
    li.textContent = code;
    qrList.appendChild(li);
  });
}

function exportToExcel() {
  let codes = getStoredQRCodes();
  let ws = XLSX.utils.aoa_to_sheet([["Código QR"], ...codes.map(code => [code])]);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "QRCodes");
  XLSX.writeFile(wb, "qrcodes.xlsx");
}

function startBarcodeScanner() {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#preview'), // o mesmo vídeo do QR
        constraints: {
          facingMode: "environment"
        },
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      },
    }, function(err) {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });
  
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      if (code) {
        addToList(code); // função que adiciona na lista, a mesma que você já usa pro QR
        Quagga.stop(); // para leitura depois de detectar (opcional)
      }
    });
  }
  

updateList();
