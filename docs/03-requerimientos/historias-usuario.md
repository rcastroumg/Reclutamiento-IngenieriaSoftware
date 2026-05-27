# Historias de Usuario y Criterios de Aceptacion

## 1. Historias de Usuario Priorizadas

### HU-01 Iniciar sesion

Como usuario quiero iniciar sesion con mis credenciales para acceder a la plataforma segun mis permisos.

#### Criterios de aceptacion

1. Dado un usuario valido, cuando envia credenciales correctas, entonces el sistema devuelve un JWT valido.
2. Dado un usuario invalido, cuando envia credenciales incorrectas, entonces el sistema rechaza la autenticacion.
3. Dado un usuario inactivo, cuando intenta iniciar sesion, entonces el sistema bloquea el acceso.

### HU-03 Seleccionar compania activa

Como usuario quiero seleccionar la compania activa para operar en el contexto correcto.

#### Criterios de aceptacion

1. Dado un usuario con multiples membresias, cuando consulta sus companias, entonces el sistema devuelve solo aquellas a las que pertenece.
2. Dado un usuario con membresia activa, cuando envia una compania valida en el contexto de la solicitud, entonces el sistema permite operar en dicha compania.
3. Dado un usuario sin membresia sobre una compania, cuando intenta usarla como contexto, entonces el sistema rechaza la operacion.

### HU-14 Crear posicion

Como reclutador quiero crear una posicion con campos obligatorios y configuraciones asociadas para iniciar un proceso de reclutamiento.

#### Criterios de aceptacion

1. La posicion debe requerir como minimo `name`, `description`, `type` y `location`.
2. `type` solo acepta los valores permitidos por el negocio.
3. `experience` y `education` deben validarse contra sus catalogos definidos.
4. Si se envian `custom_attributes`, cada atributo debe incluir `name`, `value` y `secure`.
5. Si `secure` es verdadero, el valor debe persistirse cifrado.

### HU-17 Listar posiciones por estado

Como reclutador quiero listar posiciones filtrando por estado para administrar mis vacantes activas y cerradas.

#### Criterios de aceptacion

1. El endpoint debe permitir filtrar por estado.
2. Solo deben devolverse posiciones de la compania activa.
3. La respuesta debe incluir informacion resumida util para listado.

### HU-22 Agregar candidato a una posicion

Como reclutador quiero agregar un candidato a una posicion para crear una postulacion y darle seguimiento.

#### Criterios de aceptacion

1. Si el candidato ya existe globalmente, el sistema debe reutilizarlo.
2. Si el candidato no existe, el sistema debe permitir crearlo y asociarlo a la postulacion.
3. La postulacion debe quedar ligada a la posicion y a la compania correspondiente.
4. La postulacion debe iniciar en la etapa inicial del pipeline configurado.

### HU-24 Mover postulacion entre etapas

Como reclutador quiero mover una postulacion entre etapas para reflejar el avance del candidato.

#### Criterios de aceptacion

1. El sistema debe validar que la etapa destino pertenezca al pipeline de la posicion.
2. El sistema debe registrar la transicion en historial.
3. Si la etapa activa una notificacion, el sistema debe intentar enviarla sincronamente.
4. Si el correo falla, el cambio de etapa debe persistirse y el fallo debe registrarse.

### HU-27 Enviar cuestionario

Como reclutador quiero enviar un cuestionario a una postulacion para recopilar informacion adicional del candidato.

#### Criterios de aceptacion

1. Solo pueden asignarse cuestionarios disponibles para la compania activa.
2. La asignacion debe quedar registrada con estado inicial.
3. El sistema debe permitir recuperar cuestionarios asignados a la postulacion.

### HU-29 Registrar scorecard

Como reclutador quiero registrar scorecards para evaluar a un candidato de forma objetiva.

#### Criterios de aceptacion

1. La evaluacion debe asociarse a una postulacion especifica.
2. Debe registrarse el evaluador que ingreso la scorecard.
3. La respuesta debe permitir almacenar puntaje total y detalle por criterio.

### HU-31 Adjuntar documentos

Como reclutador quiero adjuntar documentos a un candidato para consolidar informacion del proceso.

#### Criterios de aceptacion

1. El backend debe enviar el archivo al servicio externo de almacenamiento.
2. Solo debe persistirse la referencia al archivo externo y sus metadatos necesarios.
3. El sistema debe validar autenticacion y autorizacion para consultar documentos.

### HU-33 Descargar archivos con acceso protegido

Como sistema quiero permitir la descarga de archivos solo a usuarios autenticados y autorizados para proteger informacion sensible.

#### Criterios de aceptacion

1. La descarga debe requerir Bearer token.
2. El sistema debe validar membresia y permisos antes de entregar el recurso.
3. El servicio no debe exponer URLs publicas directas sin control.

### HU-34 Enviar correos por cambio de etapa

Como sistema quiero enviar correos sincronicos al ocurrir eventos de etapa para notificar al candidato.

#### Criterios de aceptacion

1. Deben existir plantillas o tipos de notificacion para Interviewing, Feedback, Made Offer y Hired.
2. El sistema debe invocar la API externa de correo en el flujo de negocio.
3. Si la API responde error, el sistema debe registrar el incidente y reportarlo sin revertir el cambio principal.

## 2. Observaciones de Modelado

1. Las historias relacionadas con etapas, scorecards y cuestionarios se aplican sobre `Application`, no sobre `Candidate` como entidad global.
2. Los campos `company_id` y `position_id` listados en el requerimiento del candidato deben interpretarse como contexto de la postulacion.
3. La capa REST final debe normalizar ciertas rutas del enunciado para representar correctamente el dominio.
