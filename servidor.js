var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var express = require('express');
var multer = require('multer');
var mysql = require('mysql2');
var mensajes = [];

var app = express();
var server = http.createServer(app);

// Conexión a la base de datos MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'social_futbol'
};

const conexion = mysql.createConnection(dbConfig);

conexion.connect((err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL.');
});

// Función para guardar mensajes en la base de datos
function guardarMensajesDB(mensaje) {
    const query = 'INSERT INTO mensajes (fecha, mensaje, archivo) VALUES (?, ?, ?)';
    conexion.execute(query, [mensaje.fecha, mensaje.mensaje, mensaje.archivo], (err, results) => {
        if (err) {
            console.error('Error al insertar el mensaje:', err);
            return;
        }
        console.log('Mensaje guardado en la base de datos:', results);
    });
}

// Función para cargar mensajes desde la base de datos
function cargarMensajesDB(callback) {
    const query = 'SELECT * FROM mensajes ORDER BY ID DESC';
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los mensajes:', err);
            return;
        }
        mensajes = results;
        callback();
    });
}

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
    cargarMensajesDB(() => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(mensajes));
    });
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

    let nuevoMensaje = {
        fecha: fechaFormateada,
        mensaje: mensaje,
        archivo: archivo
    };

    mensajes.push(nuevoMensaje);
    guardarMensajesDB(nuevoMensaje);

    console.table(mensajes);
    res.json({ mensaje: "Mensaje recibido" });
});

// Ruta para eliminar un mensaje
app.post('/eliminar-mensaje', function(req, res) {
    var mensajeID = req.body.mensajeID;

    // Realizar una consulta SQL para eliminar el mensaje con el ID proporcionado
    conexion.query('DELETE FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
        if (error) {
            console.error("Error al eliminar el mensaje:", error);
            res.status(500).json({ success: false, message: "Error al eliminar el mensaje" });
        } else {
            console.log("Mensaje eliminado exitosamente");
            // Enviar la respuesta después de completar la eliminación
            res.json({ success: true, message: "Mensaje eliminado exitosamente" });
        }
    });
});

// Ruta para editar un mensaje
app.post('/editar-mensaje', upload.single('file'), function(req, res) {
    var mensajeID = req.body.id;
    var nuevoMensaje = req.body.mensaje;
    var archivo = req.file ? req.file.filename : null;

    var query = 'UPDATE mensajes SET mensaje = ?';
    var queryParams = [nuevoMensaje];

    if (archivo) {
        query += ', archivo = ?';
        queryParams.push(archivo);
    }
    query += ' WHERE id = ?';
    queryParams.push(mensajeID);

    conexion.query(query, queryParams, function(error, results, fields) {
        if (error) {
            console.error("Error al actualizar el mensaje:", error);
            res.status(500).json({ success: false, message: "Error al actualizar el mensaje" });
        } else {
            console.log("Mensaje actualizado exitosamente");
            res.json({ success: true, message: "Mensaje actualizado exitosamente" });
        }
    });
});

//Ruta para obtener mensaje por id
app.get('/obtener-mensaje/:mensajeID', function(req, res) {
    var mensajeID = req.params.mensajeID;

    // Realizar una consulta SQL para obtener el mensaje con el ID proporcionado
    conexion.query('SELECT * FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
        if (error) {
            console.error("Error al obtener el mensaje por ID:", error);
            res.status(500).json({ success: false, message: "Error al obtener el mensaje por ID" });
        } else {
            if (results.length > 0) {
                // Devolver el primer resultado (debería ser único) como el mensaje encontrado
                var mensaje = results[0];
                res.json(mensaje);
            } else {
                res.status(404).json({ success: false, message: "Mensaje no encontrado" });
            }
        }
    });
});

server.listen(8080, function() {
    console.log('Servidor corriendo en http://localhost:8080');
});
