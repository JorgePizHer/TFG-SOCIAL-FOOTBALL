var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var express = require('express');
var multer = require('multer');
var mensajes = [];

var app = express();
var server = http.createServer(app);

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        let mime = file.mimetype;
        
        // Verificar si el tipo MIME del archivo es de video
        if (mime && mime.startsWith('video/')) {
            // Agregar la extensión .mp4 solo para archivos de video
            ext = '.mp4';
        }
        
        cb(null, Date.now() + ext);
    }
});

let upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());

// Ruta principal para servir el archivo HTML
app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile('cliente.html', function(err, data) {
        if (err) throw err;
        res.end(data);
    });
});

// Ruta para recibir los mensajes
app.get('/recibe', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(mensajes));
});

// Ruta para enviar los mensajes y archivos
app.post('/envia', upload.single('file'), function(req, res) {
    var mensaje = req.body.mensaje;
    var archivo = req.file ? req.file.filename : null;
    var mifecha = new Date();
    var mes = mifecha.getMonth() + 1;
    var fechaFormateada = mifecha.getDate() + "-" +
        mes + "-" +
        mifecha.getFullYear() + "-" +
        mifecha.getHours() + ":" +
        mifecha.getMinutes() + ":" +
        mifecha.getSeconds();

    mensajes.push({
        fecha: fechaFormateada,
        mensaje: mensaje,
        archivo: archivo
    });

    console.table(mensajes);
    res.json({ mensaje: "Mensaje recibido" });
});

server.listen(8080, function() {
    console.log('Servidor corriendo en http://localhost:8080');
});