-- phpMyAdmin SQL Dump
-- version 4.4.14
-- http://www.phpmyadmin.net
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-06-2024 a las 23:47:25
-- Versión del servidor: 5.6.26
-- Versión de PHP: 5.6.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `social_futbol`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

CREATE TABLE IF NOT EXISTS `mensajes` (
  `id` int(11) NOT NULL,
  `fecha` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `archivo` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `mensajes`
--

INSERT INTO `mensajes` (`id`, `fecha`, `mensaje`, `archivo`, `usuario_id`) VALUES
(22, '2024-06-04 00:34:17', 'hola, soy 4', NULL, 4),
(23, '2024-06-05 19:18:43', 'Hola, bienvenido a Social Fútbol', NULL, 1),
(24, '2024-06-05 19:23:10', 'Hola, sale mi nombre?', NULL, 4),
(25, '2024-06-07 19:15:32', 'Hola, sigamos trabajando en esto', NULL, 1),
(29, '2024-06-07 20:43:32', 'ahora sí se puede ver la imagen de perfil y el nombre de usuario en el header', NULL, 4),
(33, '2024-06-09 13:49:23', 'Qué pena la lesión de Mayoral, hubiera ido a la Eurocopa seguro', NULL, 1),
(34, '2024-06-09 13:52:03', '', '1717933923450.jpg', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE IF NOT EXISTS `usuarios` (
  `userId` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `imagen_perfil` varchar(255) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`userId`, `nombre`, `email`, `password`, `imagen_perfil`) VALUES
(1, 'jph', '', '$2b$10$GyCcwZ3VcAdXsqk0Z61/BuvDPf8X3eN1dNEW1wJtdBAPCTOlHc6Vi', 'goku.jpg'),
(4, 'jorge', NULL, '$2b$10$xb3cgYrBNRAsBRqZOWC0Fe57bIdB9UeaRtiJiQLwkQsiPEi//woY2', 'bachira.jpg'),
(5, 'forzaGeta', NULL, '$2b$10$uBrKmDMP4dfCQoKebvD/e.tY/d2Q5iv4TtPTFwnbJFVsCXSeNThuS', ''),
(6, 'Daniel', NULL, '$2b$10$PFnyoDK7qks9kD2dhMX7FOJEYZgCiuteDA.ZsDxCAbTAVHUq2SHwW', '1718219296780.jpg');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_usuario` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35;
--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD CONSTRAINT `fk_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`userId`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
