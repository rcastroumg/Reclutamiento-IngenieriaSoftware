# Product Backlog

## 1. Enfoque de Priorizacion

Se utiliza una organizacion jerarquica por temas, epicas, historias de usuario y tareas tecnicas. La prioridad se clasifica en Alta, Media y Baja. La estimacion de historias se expresa en Story Points usando una escala tipo Fibonacci: 1, 2, 3, 5, 8, 13.

## 2. Temas del Producto

1. Seguridad y acceso
2. Gestion organizacional
3. Configuracion del proceso de reclutamiento
4. Gestion de posiciones vacantes
5. Gestion de candidatos y postulaciones
6. Evaluacion de candidatos
7. Integraciones externas
8. Portal de empleo

## 3. Backlog por Tema, Epica e Historia

### Tema 1. Seguridad y acceso

#### Epica 1.1 Autenticacion y contexto multiempresa

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-01 | Como usuario quiero iniciar sesion con credenciales seguras para acceder al sistema segun mis permisos. | Alta | 5 |
| HU-02 | Como usuario quiero ver las companias a las que pertenezco para operar en el contexto correcto. | Alta | 3 |
| HU-03 | Como usuario quiero seleccionar mi compania activa para ejecutar acciones en el contexto adecuado. | Alta | 3 |
| HU-04 | Como administrador quiero que cada endpoint valide mi membresia a la compania activa para proteger la informacion. | Alta | 8 |

#### Tareas tecnicas asociadas

1. Implementar emision y validacion de JWT.
2. Implementar refresh token.
3. Crear dependencia de FastAPI para compania activa.
4. Implementar control de acceso por rol y membresia.

### Tema 2. Gestion organizacional

#### Epica 2.1 Gestion de companias y equipos

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-05 | Como administrador quiero consultar la informacion de una compania para administrar su configuracion. | Alta | 2 |
| HU-06 | Como usuario quiero listar las companias disponibles para mi cuenta para cambiar de contexto facilmente. | Alta | 2 |
| HU-07 | Como administrador quiero agrupar reclutadores en equipos para distribuir procesos de seleccion. | Media | 5 |

#### Tareas tecnicas asociadas

1. Modelar `companies`, `memberships`, `teams` y `team_members`.
2. Exponer endpoints de consulta de companias.
3. Exponer CRUD basico de equipos.

### Tema 3. Configuracion del proceso de reclutamiento

#### Epica 3.1 Pipelines y etapas

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-08 | Como administrador quiero definir pipelines para adaptar el proceso de seleccion de mi empresa. | Alta | 5 |
| HU-09 | Como reclutador quiero consultar las etapas de un pipeline para operar correctamente sobre una vacante. | Alta | 3 |
| HU-10 | Como sistema quiero disponer de un pipeline default con etapas base para inicializar nuevas posiciones. | Alta | 2 |

#### Epica 3.2 Cuestionarios y scorecards

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-11 | Como administrador quiero crear cuestionarios predefinidos para evaluar candidatos. | Alta | 5 |
| HU-12 | Como administrador quiero configurar scorecards para estandarizar evaluaciones. | Alta | 5 |
| HU-13 | Como reclutador quiero asignar cuestionarios a candidatos durante el proceso de seleccion. | Alta | 5 |

#### Tareas tecnicas asociadas

1. Crear modelo de pipelines y stages.
2. Configurar pipeline default.
3. Modelar cuestionarios, preguntas, scorecards y criterios.
4. Exponer endpoints de consulta y asignacion.

### Tema 4. Gestion de posiciones vacantes

#### Epica 4.1 Creacion y administracion de posiciones

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-14 | Como reclutador quiero crear una posicion con datos estructurados para iniciar un proceso de reclutamiento. | Alta | 8 |
| HU-15 | Como reclutador quiero actualizar una posicion para reflejar cambios del proceso o de la vacante. | Alta | 5 |
| HU-16 | Como reclutador quiero cambiar el estado de una posicion para controlar su ciclo de vida. | Alta | 3 |
| HU-17 | Como reclutador quiero listar posiciones filtrando por estado para gestionar la carga operativa. | Alta | 3 |
| HU-18 | Como administrador quiero definir atributos personalizados por posicion para cubrir necesidades particulares de negocio. | Media | 5 |

#### Tareas tecnicas asociadas

1. Modelar `positions` y `position_custom_attributes`.
2. Implementar validacion de enums para `type`, `experience` y `education`.
3. Implementar cifrado en reposo para atributos `secure`.
4. Crear endpoints de consulta, creacion y actualizacion.

### Tema 5. Gestion de candidatos y postulaciones

#### Epica 5.1 Registro y mantenimiento de candidatos

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-19 | Como reclutador quiero consultar un candidato global para reutilizar su perfil en distintos procesos. | Alta | 3 |
| HU-20 | Como reclutador quiero actualizar la informacion base del candidato para mantener su perfil vigente. | Media | 3 |
| HU-21 | Como reclutador quiero registrar informacion de educacion del candidato para enriquecer su perfil. | Media | 3 |

#### Epica 5.2 Postulaciones y seguimiento

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-22 | Como reclutador quiero agregar un candidato a una posicion para gestionar su postulacion. | Alta | 8 |
| HU-23 | Como reclutador quiero listar candidatos de una posicion para dar seguimiento a mis procesos. | Alta | 3 |
| HU-24 | Como reclutador quiero mover una postulacion entre etapas del pipeline para reflejar el avance del candidato. | Alta | 8 |
| HU-25 | Como reclutador quiero mover un candidato de una posicion a otra cuando corresponda operativamente. | Media | 5 |
| HU-26 | Como sistema quiero registrar historial de etapas por postulacion para asegurar trazabilidad. | Alta | 5 |

#### Tareas tecnicas asociadas

1. Separar entidades `candidates` y `applications`.
2. Modelar historial de etapas.
3. Implementar reglas de transicion de etapas.
4. Implementar endpoints de consulta y movimiento.

### Tema 6. Evaluacion de candidatos

#### Epica 6.1 Respuestas y scorecards

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-27 | Como reclutador quiero enviar un cuestionario a un candidato para continuar su evaluacion. | Alta | 5 |
| HU-28 | Como candidato quiero responder un cuestionario para avanzar en mi proceso de seleccion. | Alta | 5 |
| HU-29 | Como reclutador quiero registrar scorecards para evaluar objetivamente a un candidato. | Alta | 5 |
| HU-30 | Como reclutador quiero consultar cuestionarios asignados a una postulacion para verificar su estado. | Media | 3 |

#### Tareas tecnicas asociadas

1. Modelar asignaciones y respuestas.
2. Crear endpoints de envio y guardado de respuestas.
3. Crear endpoints de scorecards.

### Tema 7. Integraciones externas

#### Epica 7.1 Gestion documental y notificaciones

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-31 | Como reclutador quiero adjuntar documentos a un candidato para consolidar informacion de soporte. | Alta | 5 |
| HU-32 | Como reclutador quiero adjuntar el curriculum de un candidato existente para completar su expediente. | Alta | 3 |
| HU-33 | Como sistema quiero descargar archivos solo para usuarios autenticados y autorizados para proteger informacion sensible. | Alta | 5 |
| HU-34 | Como sistema quiero enviar correos sincronicos al cambiar ciertas etapas para comunicar el avance del proceso. | Alta | 8 |
| HU-35 | Como reclutador quiero recibir aviso cuando falle el correo pero sin perder el cambio principal del proceso. | Alta | 5 |

#### Tareas tecnicas asociadas

1. Crear adaptador de almacenamiento externo.
2. Crear adaptador de correo externo.
3. Implementar logs de notificacion.
4. Asegurar que el backend controle la descarga de archivos mediante Bearer token.

### Tema 8. Portal de empleo

#### Epica 8.1 Publicacion y postulacion publica

| ID | Historia de Usuario | Prioridad | SP |
|---|---|---|---|
| HU-36 | Como reclutador quiero publicar una posicion para que sea visible en el portal de empleo. | Media | 5 |
| HU-37 | Como aspirante quiero ver vacantes publicadas para decidir a cuales aplicar. | Media | 3 |
| HU-38 | Como aspirante quiero completar un formulario de postulacion para aplicar a una vacante. | Media | 5 |

#### Tareas tecnicas asociadas

1. Definir contrato de publicacion de vacante.
2. Definir datos minimos del formulario publico.
3. Exponer endpoints publicos controlados para portal de empleo.

## 4. Resumen de Priorizacion MVP

Para el MVP backend de la primera etapa se priorizan las siguientes historias:

1. HU-01 a HU-04
2. HU-05, HU-06
3. HU-08 a HU-18
4. HU-19 a HU-35

Las historias HU-36 a HU-38 quedan como parte del diseno funcional y de una posible siguiente ola de implementacion si el alcance academico lo permite.
