// Este archivo contiene código JavaScript que añade interactividad al sitio web, como la manipulación del DOM y la respuesta a eventos del usuario.

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('myButton');
    const output = document.getElementById('output');

    button.addEventListener('click', () => {
        output.textContent = '¡Hola! Has hecho clic en el botón.';
    });
});