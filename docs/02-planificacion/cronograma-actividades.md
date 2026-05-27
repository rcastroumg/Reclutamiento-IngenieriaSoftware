# Planificacion y Cronograma de Actividades

## 1. Objetivo de la Planificacion

Definir una secuencia de trabajo realista para el analisis, diseno e implementacion inicial del sistema de reclutamiento, priorizando la capa backend, la calidad del modelado del dominio y la produccion de los entregables documentales del proyecto.

## 2. Estrategia de Trabajo

Se propone una planificacion iterativa por fases. Las primeras fases consolidan analisis y diseno; las siguientes se enfocan en implementacion del backend y preparacion del frontend para una etapa posterior.

## 3. Fases del Proyecto

| Fase | Nombre | Duracion estimada |
|---|---|---|
| F1 | Analisis y vision del producto | 1 semana |
| F2 | Requerimientos detallados y backlog | 1 semana |
| F3 | Diseno del negocio y arquitectura | 1 semana |
| F4 | Infraestructura base backend | 1 semana |
| F5 | Modulos core de reclutamiento | 2 semanas |
| F6 | Evaluacion e integraciones externas | 2 semanas |
| F7 | Validacion, documentacion final y cierre | 1 semana |

## 4. Actividades por Fase

### F1 Analisis y vision del producto

1. Revisar requerimientos fuente.
2. Consolidar decisiones de negocio y tecnologia.
3. Elaborar documento de vision.
4. Definir alcance de la primera etapa.

### F2 Requerimientos detallados y backlog

1. Identificar temas, epicas e historias.
2. Estimar historias de usuario.
3. Definir criterios de aceptacion.
4. Priorizar MVP.

### F3 Diseno del negocio y arquitectura

1. Modelar procesos BPMN.
2. Construir modelo E-R.
3. Elaborar arquitectura C4.
4. Definir contratos API a alto nivel.

### F4 Infraestructura base backend

1. Inicializar proyecto FastAPI.
2. Configurar MySQL y migraciones.
3. Configurar seguridad JWT.
4. Implementar manejo de errores y configuracion.

### F5 Modulos core de reclutamiento

1. Companias y membresias.
2. Pipelines y etapas.
3. Posiciones.
4. Candidatos.
5. Postulaciones e historial de etapas.

### F6 Evaluacion e integraciones externas

1. Cuestionarios y respuestas.
2. Scorecards.
3. Integracion de almacenamiento de archivos.
4. Integracion de correo sincronico.
5. Logs de notificacion.

### F7 Validacion, documentacion final y cierre

1. Revisar cobertura funcional del backend.
2. Consolidar documentacion.
3. Preparar entregable formal.
4. Revisar riesgos abiertos y siguientes pasos.

## 5. Dependencias Clave

1. El backlog depende del documento de vision.
2. BPMN, E-R y C4 dependen de reglas del negocio y backlog ya consolidados.
3. La implementacion de postulaciones depende del modelado correcto entre `Candidate` y `Application`.
4. La integracion de correo depende de la definicion de eventos por etapa.
5. La integracion documental depende de la especificacion de autorizacion Bearer y politica de descarga.

## 6. Cronograma Tentativo

| Semana | Actividades principales | Entregables |
|---|---|---|
| 1 | Vision del producto y alcance | Documento de Vision |
| 2 | Historias, backlog, criterios, estimacion | Product Backlog |
| 3 | BPMN, E-R, C4, mockups | Diseno del negocio y arquitectura |
| 4 | Base FastAPI, MySQL, JWT | Infraestructura inicial |
| 5 | Companias, pipelines, posiciones | Modulos core I |
| 6 | Candidatos, postulaciones, etapas | Modulos core II |
| 7 | Cuestionarios, scorecards, archivos, correo | Integraciones y evaluacion |
| 8 | Validacion, ajustes y documento final | Entrega consolidada |

## 7. Hitos

1. H1 Documento de vision aprobado.
2. H2 Backlog y criterios de aceptacion aprobados.
3. H3 Diseno BPMN, E-R y C4 completado.
4. H4 Base tecnica del backend operativa.
5. H5 Gestion de posiciones y postulaciones funcional.
6. H6 Integraciones externas operativas.
7. H7 Documentacion final consolidada.

## 8. Riesgos de Planificacion

1. Retrabajo por cambios de alcance.
2. Retrasos por dependencia de APIs externas.
3. Retrasos por ajustes al modelo de datos.
4. Riesgo de sobrecarga si se intenta implementar frontend completo en la misma etapa.

## 9. Medidas de Mitigacion

1. Mantener backlog priorizado por MVP.
2. Disenar adaptadores desacoplados para servicios externos.
3. Validar pronto el modelo de dominio y el E-R.
4. Proteger el alcance de la primera fase enfocandolo en backend.

## 10. Conclusiones

La planificacion propuesta prioriza primero la claridad del negocio y del dominio, y luego la implementacion. Esto reduce el riesgo de construir APIs sobre supuestos incorrectos y mejora la calidad del entregable final.
