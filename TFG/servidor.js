var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var express = require('express');
var multer = require('multer');
var mysql = require('mysql2');
var bcrypt = require('bcrypt');
var session = require('express-session')
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

// Configurar el middleware de sesión
app.use(session({
    secret: 'mi_secreto_super_secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Asegúrate de usar 'secure: true' en producción con HTTPS
}));

// Configurar middleware para parsear cuerpos de solicitudes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Función para guardar mensajes en la base de datos
function guardarMensajesDB(mensaje) {
    const query = 'INSERT INTO mensajes (fecha, mensaje, archivo, usuario_id) VALUES (?, ?, ?, ?)';
    conexion.execute(query, [mensaje.fecha, mensaje.mensaje, mensaje.archivo, mensaje.usuario_id], (err, results) => {
        if (err) {
            console.error('Error al insertar el mensaje:', err);
            return;
        }
        console.log('Mensaje guardado en la base de datos:', results);
    });
}

// Función para obtener mensajes de la base de datos
function obtenerMensajesDB(req, callback) {
    const userId = req.session.usuario ? req.session.usuario.id : null;
    const query = 'SELECT mensajes.id, mensajes.mensaje, mensajes.archivo, mensajes.usuario_id, usuarios.nombre as usuario_nombre, usuarios.imagen_perfil, usuarios.userId FROM mensajes INNER JOIN usuarios ON mensajes.usuario_id = usuarios.userID ORDER BY mensajes.fecha DESC';
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los mensajes:', err);
            return;
        }
        // Añadir una marca para indicar si el mensaje pertenece al usuario actual
        const mensajes = results.map(mensaje => {
            //            console.log("ID de usuario del mensaje:", mensaje.usuario_id);
            //            console.log("ID de usuario actual:", userId);
            return{
                ...mensaje,
                esPropietario: mensaje.usuario_id === userId
            };
        });
        //        console.log(mensajes);
        callback(mensajes);
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

// Ruta principal para servir el archivo HTML
app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile('cliente.html', function(err, data) {
        if (err) throw err;
        res.end(data);
    });
});

// Ruta para recibir los mensajes del cliente
app.get('/recibe', (req, res) => {
    console.log('Usuario actual:', req.session.usuario);
    obtenerMensajesDB(req, (mensajes) => {
        res.json(mensajes);
    });
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    const { nombre, password, userId, imagen_perfil} = req.body;
    const query = 'SELECT * FROM usuarios WHERE nombre = ?';
    conexion.execute(query, [nombre], (err, results) => {
        if (err) {
            console.error('Error al buscar el usuario:', err);
            res.status(500).send('Error al buscar el usuario');
            return;
        }
        if (results.length === 0) {
            res.status(401).send('Usuario no encontrado');
            return;
        }
        const usuario = results[0];
        bcrypt.compare(password, usuario.password, (err, result) => {
            if (err) {
                console.error('Error al comparar contraseñas:', err);
                res.status(500).send('Error al comparar contraseñas');
                return;
            }
            if (result) {
                req.session.usuario = {
                    id: usuario.userId,
                    nombre: usuario.nombre,
                    imagen_perfil: usuario.imagen_perfil,
                };
                console.log('Usuario inició sesión:', req.session.usuario);
                console.log('ID de usuario:', usuario.userId);
                res.json({ message: 'Inicio de sesión exitoso',userId: usuario.userId, username: usuario.nombre, userImage: usuario.imagen_perfil });
            } else {
                res.status(401).send('Contraseña incorrecta');
            }
        });
    });
});

// Ruta para manejar el registro de usuarios
app.post('/registro',upload.single('imagen_perfil'), (req, res) => {
    const { username, password } = req.body;
     const imagenPerfil = req.file ? req.file.filename : null;
    
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error al encriptar la contraseña:', err);
            res.status(500).json({ success: false, message: 'Error al encriptar la contraseña' });
            return;
        }
        const query = 'INSERT INTO usuarios (nombre, password, imagen_perfil) VALUES (?, ?, ?)';
        conexion.execute(query, [username, hash, imagenPerfil], (err, results) => {
            if (err) {
                console.error('Error al registrar el usuario:', err);
                res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
                return;
            }
            res.json({ success: true, message: 'Registro exitoso' });
        });
    });
});

// Ruta para manejar la publicación de mensajes
app.post('/envia', upload.single('file'), (req, res) => {
    const { mensaje, userId, nombre, imagenPerfil } = req.body;
    const archivo = req.file ? req.file.filename : null;
    const fecha = new Date();

    const nuevoMensaje = {
        usuario_id: userId, // Asociar el mensaje con el usuario actual
        fecha: fecha,
        mensaje: mensaje,
        archivo: archivo,
        nombre: nombre,
        imagen_perfil: imagenPerfil
    };
    guardarMensajesDB(nuevoMensaje);
    res.json({ message: 'Mensaje enviado' });
});

// Ruta para eliminar un mensaje
app.post('/eliminar-mensaje', function(req, res) {
    var mensajeID = req.body.mensajeID;
    var userId = req.session.usuario.id;

    // Realizar una consulta SQL para verificar si el mensaje pertenece al usuario actual
    conexion.query('SELECT usuario_id FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
        if (error) {
            console.error("Error al verificar el propietario del mensaje:", error);
            res.status(500).json({ success: false, message: "Error al verificar el propietario del mensaje" });
            return;
        }

        if (results.length > 0 && results[0].usuario_id === userId) {
            // El mensaje pertenece al usuario actual, proceder a eliminarlo
            conexion.query('DELETE FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
                if (error) {
                    console.error("Error al eliminar el mensaje:", error);
                    res.status(500).json({ success: false, message: "Error al eliminar el mensaje" });
                } else {
                    console.log("Mensaje eliminado exitosamente");
                    res.json({ success: true, message: "Mensaje eliminado exitosamente" });
                }
            });
        } else {
            // El mensaje no pertenece al usuario actual
            res.status(403).json({ success: false, message: "No tienes permiso para eliminar este mensaje" });
        }
    });
});

// Ruta para editar un mensaje
app.post('/editar-mensaje', upload.single('file'), function(req, res) {
    var mensajeID = req.body.id;
    var nuevoMensaje = req.body.mensaje;
    var archivo = req.file ? req.file.filename : null;
    var userId = req.session.usuario.id;

        // Console.log para verificar los valores de mensajeID y nuevoMensaje
    console.log("Valor de mensajeID:", mensajeID);
    console.log("Valor de nuevoMensaje:", nuevoMensaje);
    
    // Realizar una consulta SQL para verificar si el mensaje pertenece al usuario actual
    conexion.query('SELECT usuario_id FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
        if (error) {
            console.error("Error al verificar el propietario del mensaje:", error);
            res.status(500).json({ success: false, message: "Error al verificar el propietario del mensaje" });
            return;
        }
            var query = 'UPDATE mensajes SET mensaje = ?';
            var queryParams = [nuevoMensaje];

            if (archivo) {
                query += ', archivo = ?';
                queryParams.push(archivo);
            }
            query += ' WHERE id = ?';
            queryParams.push(mensajeID);
        
         console.log("Consulta SQL a la base de datos:", query);

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
});

//Ruta para obtener mensaje por id
app.get('/obtener-mensaje/:mensajeID', function(req, res) {
    var mensajeID = req.params.mensajeID;

    // Realizar una consulta SQL para obtener el mensaje con el ID proporcionado
    conexion.query('SELECT id, mensaje, archivo, usuario_id FROM mensajes WHERE id = ?', [mensajeID], function(error, results, fields) {
        if (error) {
            console.error("Error al obtener el mensaje por ID:", error);
            res.status(500).json({ success: false, message: "Error al obtener el mensaje por ID" });
        } else {
            if (results.length > 0) {
                // Devolver el primer resultado (debería ser único) como el mensaje encontrado
                var mensaje = results[0];
                // Comprobar si el mensaje pertenece al usuario actual
                const userId = req.session.usuario ? req.session.usuario.id : null;
                const esPropietario = mensaje.usuario_id === userId;
                // Incluir la propiedad esPropietario en la respuesta
                mensaje.esPropietario = esPropietario;
                // Enviar el mensaje junto con la información de si el usuario es el propietario
                res.json({ mensaje: mensaje, esPropietario: esPropietario });
            } else {
                res.status(404).json({ success: false, message: "Mensaje no encontrado" });
            }
        }
    });
});

// Rutas para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/img', express.static(path.join(__dirname, 'img')));

server.listen(8080, function() {
    console.log('Servidor corriendo en http://localhost:8080');
});
