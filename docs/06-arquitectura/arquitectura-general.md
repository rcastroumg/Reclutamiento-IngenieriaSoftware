# Arquitectura del Sistema

## 1. Objetivo

Describir la arquitectura de alto nivel del sistema de reclutamiento utilizando el modelo C4 para representar contexto, contenedores y componentes principales del backend.

## 2. Estilo arquitectonico

Se propone una arquitectura web en capas con responsabilidades bien separadas:

1. Capa de presentacion
2. Capa de APIs
3. Capa de aplicacion
4. Capa de dominio
5. Capa de persistencia
6. Capa de integraciones externas

## 3. Decisiones arquitectonicas clave

1. Backend principal con FastAPI.
2. Frontend desacoplado con React y Tailwind.
3. Base de datos MySQL.
4. JWT para autenticacion.
5. Contexto multiempresa resuelto mediante compania activa validada en backend.
6. Candidato global separado de Application.
7. Integracion de correo sincronico via API externa.
8. Integracion de archivos via API externa con descarga autorizada por Bearer token.

## 4. Contenedores principales

1. Aplicacion Web React
2. API Backend FastAPI
3. Base de Datos MySQL
4. Servicio externo de correo
5. Servicio externo de almacenamiento

## 5. Componentes principales del backend

1. Routers REST
2. Dependencias de seguridad y compania activa
3. Servicios de aplicacion
4. Repositorios
5. Modelos ORM
6. Cliente de correo externo
7. Cliente de archivos externo
8. Servicio de notificaciones

## 6. Riesgos y tradeoffs

1. El envio sincronico de correo simplifica la implementacion inicial, pero aumenta latencia y dependencia operativa.
2. El almacenamiento externo reduce carga local, pero exige manejo robusto de autenticacion y errores.
3. La validacion multiempresa en backend es indispensable para evitar fugas de informacion.

## 7. Diagramas asociados

1. `c4-contexto.mmd`
2. `c4-contenedores.mmd`
3. `c4-componentes-backend.mmd`
