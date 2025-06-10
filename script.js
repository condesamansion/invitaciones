document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario");
  const qrContainer = document.getElementById("qrContainer");
  const canvasFinal = document.getElementById("canvasFinal");
  const descargarQR = document.getElementById("descargarQR");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const resetBtn = document.getElementById("resetBtn");

  formulario.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const entregadoPor = document.getElementById("entregadoPor").value.trim();
    const beneficios = document.getElementById("beneficios").value.trim();
    const notas = document.getElementById("notas").value.trim();
    const fecha = document.getElementById("fecha").value;
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre || !entregadoPor || !beneficios || !fecha || !telefono) {
      alert("Por favor, completá todos los campos obligatorios.");
      return;
    }

    const params = new URLSearchParams({ nombre, entregadoPor, beneficios, notas, fecha });
    const baseUrl = `${window.location.origin}${window.location.pathname.replace("index.html", "")}`;
    const urlQR = `${baseUrl}invitacion.html?${params.toString()}`;

    const qr = new QRCodeStyling({
      width: 596,
      height: 596,
      type: "canvas",
      data: urlQR,
      image: "img/logo.png",
      dotsOptions: {
        color: "#000000",
        type: "dots"
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4
      }
    });

    const qrTempDiv = document.createElement("div");
    qr.append(qrTempDiv);

    setTimeout(async () => {
      const canvasQR = qr._canvas._canvas;
      const qrImage = new Image();
      qrImage.src = canvasQR.toDataURL("image/png");

      qrImage.onload = async () => {
        const ctx = canvasFinal.getContext("2d");

        const fondo = new Image();
        fondo.src = "img/fondo.jpg";

        fondo.onload = async () => {
          ctx.clearRect(0, 0, canvasFinal.width, canvasFinal.height);
          ctx.drawImage(fondo, 0, 0, 899, 1274);

          ctx.font = "900 54px Montserrat";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(nombre.toUpperCase(), 899 / 2, 468);

          ctx.drawImage(qrImage, 151, 582, 596, 596);

          const dataUrl = canvasFinal.toDataURL("image/jpeg");
          const blob = dataURLtoBlob(dataUrl);
          const tempUrl = URL.createObjectURL(blob);
          descargarQR.href = tempUrl;

          try {
            const linkDrive = await subirQRADrive(dataUrl, nombre.toLowerCase().replace(/\s+/g, "-"));
            const fechaFormateada = fecha.split("-").reverse().join("/");
            const mensaje = `Hola! Esta es tu invitación para Condesa 👑\n\nConsta de "${beneficios}" para la noche del ${fechaFormateada}.\n\nTe invitó: ${entregadoPor}.\n\nDescargá tu QR desde aquí y mostralo en puerta:\n${linkDrive}`;

            whatsappBtn.href = `https://wa.me/54${telefono}?text=${encodeURIComponent(mensaje)}`;
            qrContainer.style.display = "block";
          } catch (error) {
            console.error("Error al subir a Drive:", error);
            alert("No se pudo subir la imagen a Drive.");
          }
        };
      };
    }, 1000);
  });

  resetBtn.addEventListener("click", () => {
    formulario.reset();
    qrContainer.style.display = "none";
    const ctx = canvasFinal.getContext("2d");
    ctx.clearRect(0, 0, canvasFinal.width, canvasFinal.height);
  });

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  async function subirQRADrive(dataUrl, nombreQR) {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAqY78WQsc4HmFFY-tNYVovoL-pl3aIeJpmnvG9bgc_Z6iXHdoxxs08398bZaP7Q1nyQ/exec";

    const formData = new FormData();
    formData.append("image", dataUrl);
    formData.append("name", nombreQR);

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new Blob([JSON.stringify({ image: dataUrl, name: nombreQR })], { type: "text/plain" })
    });

    const json = await response.json();
    if (json.status === "ok") {
      return json.url;
    } else {
      throw new Error("Error al subir a Drive: " + json.message);
    }
  }
});
