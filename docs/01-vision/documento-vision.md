# Documento de Vision

## 1. Informacion General

- Proyecto: Plataforma SaaS de Reclutamiento y Portal de Empleos
- Cliente: Recruitment Solutions
- Version: 1.0
- Fecha: 2026-05-09
- Estado: Borrador base aprobado para diseno y planificacion

## 2. Proposito del Documento

Este documento describe la vision del producto de software solicitado por Recruitment Solutions, definiendo el problema de negocio, los objetivos del sistema, los actores involucrados, el alcance funcional de la primera etapa y las restricciones tecnicas conocidas. Su proposito es alinear a negocio, analisis, diseno, desarrollo y validacion sobre una misma direccion de trabajo.

## 3. Descripcion del Problema

Recruitment Solutions requiere una plataforma web que permita a multiples empresas administrar sus procesos de reclutamiento en un modelo SaaS. Actualmente, los procesos de captacion, evaluacion y seguimiento de candidatos suelen ser manuales, dispersos o dependientes de herramientas no integradas, lo que dificulta la trazabilidad, la colaboracion entre reclutadores y el seguimiento consistente del pipeline de seleccion.

Adicionalmente, las empresas necesitan publicar vacantes, recibir postulaciones, evaluar candidatos mediante cuestionarios y scorecards, y ejecutar comunicaciones automatizadas durante el proceso de seleccion.

## 4. Oportunidad de Negocio

La solucion propuesta permitira a Recruitment Solutions ofrecer un servicio reusable y escalable para distintas companias, centralizando la gestion del reclutamiento en una sola plataforma. Esto crea una oportunidad clara de monetizacion por membresia, estandarizacion de procesos y diferenciacion por automatizacion operativa.

## 5. Objetivos del Negocio

1. Comercializar una plataforma SaaS orientada a procesos de reclutamiento multiempresa.
2. Reducir tiempos operativos en la gestion de vacantes y candidatos.
3. Estandarizar pipelines de contratacion por empresa.
4. Mejorar la trazabilidad del proceso de seleccion.
5. Centralizar publicaciones, postulaciones, evaluaciones y comunicaciones.
6. Permitir crecimiento futuro del producto hacia una solucion integral de reclutamiento.

## 6. Objetivos del Sistema

1. Permitir que usuarios autenticados operen segun su rol y compania activa.
2. Soportar operacion multiempresa para un mismo usuario.
3. Gestionar posiciones vacantes con atributos configurables.
4. Registrar candidatos globales y multiples postulaciones por posicion.
5. Administrar pipelines y etapas de seleccion por compania.
6. Asignar cuestionarios y scorecards durante el proceso.
7. Automatizar envios de correo por cambio de etapa mediante una API externa.
8. Permitir publicacion de vacantes en un portal de empleo.
9. Exponer una capa de APIs REST como entregable principal de la primera fase.

## 7. Stakeholders

1. Recruitment Solutions
   Proveedor y propietario del producto SaaS.
2. Empresas clientes
   Organizaciones que contratan la membresia y usan la plataforma.
3. Administradores de compania
   Configuran la operacion de su empresa dentro del sistema.
4. Reclutadores
   Gestionan vacantes, candidatos, etapas, evaluaciones y comunicaciones.
5. Aspirantes o candidatos
   Consultan vacantes y aplican a posiciones publicadas.
6. Equipo de desarrollo
   Diseña, implementa, prueba y despliega la solucion.
7. Equipo academico o evaluador
   Revisa cumplimiento del requerimiento y calidad del entregable.

## 8. Usuarios y Necesidades

### 8.1 Administrador

Necesita gestionar la informacion de la compania, usuarios, pipelines, cuestionarios, scorecards y configuraciones generales del proceso de reclutamiento.

### 8.2 Reclutador

Necesita crear y publicar posiciones, revisar candidatos, mover postulaciones a traves del pipeline, adjuntar documentos, evaluar candidatos y disparar acciones del proceso.

### 8.3 Aspirante

Necesita explorar vacantes publicadas, completar formularios de postulacion y recibir comunicaciones relacionadas con su proceso.

## 9. Alcance del Producto

La solucion completa contempla una aplicacion web para administracion interna de reclutamiento y un portal publico de empleos. Sin embargo, para la primera etapa del proyecto se implementara unicamente el backend mediante APIs REST, dejando el frontend como parte del diseno funcional y arquitectonico.

### 9.1 Alcance funcional incluido

1. Gestion de companias.
2. Gestion de usuarios y membresias multiempresa.
3. Gestion de equipos de reclutamiento.
4. Gestion de pipelines y etapas.
5. Gestion de cuestionarios.
6. Gestion de scorecards.
7. Creacion, consulta y actualizacion de posiciones.
8. Consulta y actualizacion de candidatos.
9. Registro de postulaciones por posicion.
10. Movimiento de candidatos a traves de etapas.
11. Envio sincronico de correos por API externa con reporte de fallo sin revertir el cambio principal.
12. Gestion de documentos a traves de un servicio externo con acceso protegido por Bearer token.
13. Publicacion de posiciones para portal de empleo.

### 9.2 Alcance funcional no incluido en la primera fase

1. Implementacion completa del frontend React.
2. Exportacion avanzada de reportes gerenciales.
3. Integraciones con bolsas de empleo externas.
4. Automatizacion asincrona mediante colas o workers.
5. Analitica avanzada o inteligencia de reclutamiento.

## 10. Caracteristicas principales del producto

1. Plataforma SaaS multiempresa.
2. JWT para autenticacion.
3. Usuarios con acceso a multiples companias.
4. Candidatos globales con multiples postulaciones.
5. Pipelines configurables por compania.
6. Pipeline default: Applied, Feedback, Interviewing, Made Offer, Disqualified, Hired.
7. Posiciones con atributos estructurados y atributos personalizados seguros.
8. Cuestionarios y scorecards para evaluacion.
9. Correos via servicio externo.
10. Archivos via servicio externo.

## 11. Reglas del negocio relevantes

1. Un usuario puede operar en multiples companias.
2. La autorizacion debe validarse contra la compania activa.
3. El candidato existe globalmente en el sistema.
4. Un candidato puede aplicar a multiples posiciones.
5. El avance por etapas pertenece a la postulacion, no al candidato global.
6. Una posicion pertenece a una compania.
7. Cada posicion puede asociarse a un pipeline, scorecard y cuestionario por defecto.
8. Si falla el envio del correo durante un cambio de etapa, el cambio principal debe persistirse y reportarse el fallo.
9. Los archivos deben descargarse mediante autenticacion Bearer y no mediante URL publica.
10. Los atributos personalizados marcados como `secure` deben cifrarse en reposo.

## 12. Requerimientos de alto nivel

1. El sistema debe exponer endpoints para companias, posiciones y candidatos conforme al enunciado base, normalizando el diseno REST cuando sea necesario.
2. El sistema debe permitir crear posiciones con campos obligatorios y atributos personalizados.
3. El sistema debe permitir registrar candidatos y postulaciones asociadas a una posicion.
4. El sistema debe permitir mover postulaciones entre etapas y registrar historial.
5. El sistema debe asignar cuestionarios y scorecards a candidatos durante el proceso.
6. El sistema debe integrarse con un servicio externo para almacenamiento de archivos.
7. El sistema debe integrarse con un servicio externo para correo sincronico.

## 13. Restricciones tecnicas

1. Backend con FastAPI.
2. Frontend previsto con React y Tailwind.
3. Base de datos MySQL.
4. Autenticacion con JWT.
5. Integraciones de correo y archivos mediante APIs externas.
6. Entrega inicial centrada en backend.

## 14. Supuestos

1. Las companias tendran pipelines, cuestionarios y scorecards propios.
2. Las posiciones podran publicarse en el portal de empleo desde la misma plataforma.
3. Los servicios externos de correo y archivos disponen de mecanismos de autenticacion basados en token o credenciales de API.
4. La primera fase no requiere mensajeria asincrona.
5. La validacion de acceso a archivos se resolvera desde el backend antes de entregar o intermediar la descarga.

## 15. Riesgos iniciales

1. Dependencia operativa de APIs externas para correo y archivos.
2. Latencia adicional por envio sincronico de correo.
3. Riesgo de modelar incorrectamente candidato y postulacion si no se mantiene la separacion del dominio.
4. Riesgo de seguridad si no se implementa correctamente el cifrado de atributos seguros.
5. Riesgo de crecimiento del alcance si se intenta implementar frontend completo en esta fase.

## 16. Criterios de exito

1. El backend permite gestionar companias, posiciones, candidatos y postulaciones conforme al alcance.
2. El sistema soporta usuarios con multiples companias activas.
3. El flujo de pipeline se ejecuta con trazabilidad de etapas.
4. Las integraciones externas funcionan con manejo controlado de errores.
5. La documentacion producida permite continuar hacia implementacion y entrega formal.

## 17. Conclusion

La plataforma propuesta resuelve una necesidad real de organizacion y escalabilidad en procesos de reclutamiento multiempresa. La primera etapa debe enfocarse en establecer un backend solido, bien modelado y preparado para integrarse posteriormente con una interfaz web robusta. La calidad del modelado del dominio, especialmente en la separacion entre candidato y postulacion, sera determinante para el exito del producto.
