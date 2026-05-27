# Modelo de Datos

## 1. Objetivo

Describir el modelo conceptual de datos del sistema de reclutamiento, identificando entidades principales, relaciones y decisiones clave de modelado para soportar un SaaS multiempresa con candidatos globales y multiples postulaciones.

## 2. Decision central del modelo

La decision de modelado mas importante es separar `Candidate` de `Application`.

1. `Candidate` representa a la persona como entidad global del sistema.
2. `Application` representa la postulacion del candidato a una posicion concreta dentro de una compania.

Esta separacion permite que un mismo candidato aplique a multiples posiciones y evita mezclar el perfil global con el estado de un proceso especifico.

## 3. Entidades principales

### Seguridad y organizacion

1. `User`
2. `Company`
3. `UserCompanyMembership`
4. `Team`
5. `TeamMember`

### Configuracion de reclutamiento

6. `Pipeline`
7. `PipelineStage`
8. `Questionnaire`
9. `QuestionnaireQuestion`
10. `ScorecardTemplate`
11. `ScorecardCriterion`

### Operacion del reclutamiento

12. `Position`
13. `PositionCustomAttribute`
14. `Candidate`
15. `CandidateEducation`
16. `CandidateWorkHistory`
17. `Application`
18. `ApplicationStageHistory`

### Evaluacion e integraciones

19. `QuestionnaireAssignment`
20. `QuestionnaireResponse`
21. `ApplicationScorecard`
22. `ApplicationScorecardItem`
23. `ApplicationDocument`
24. `NotificationLog`

## 4. Relaciones clave

1. Un `User` puede pertenecer a multiples `Company` mediante `UserCompanyMembership`.
2. Una `Company` puede tener multiples `Pipeline`, `Questionnaire`, `ScorecardTemplate`, `Team` y `Position`.
3. Un `Pipeline` posee multiples `PipelineStage`.
4. Una `Position` pertenece a una `Company` y referencia un `Pipeline`.
5. Una `Position` puede tener multiples `Application`.
6. Un `Candidate` puede tener multiples `Application`.
7. Una `Application` referencia su `PipelineStage` actual.
8. Una `Application` registra multiples entradas en `ApplicationStageHistory`.
9. Una `Application` puede tener multiples `QuestionnaireAssignment`, `ApplicationScorecard` y `ApplicationDocument`.

## 5. Reglas de integridad

1. La etapa actual de una `Application` debe pertenecer al pipeline de la `Position` asociada.
2. Solo un usuario con membresia valida puede operar sobre datos de la compania activa.
3. Una `Application` no debe existir sin `Candidate`, `Position` y `Company` validos.
4. Los atributos personalizados con bandera `secure` deben persistirse cifrados.
5. Los documentos solo deben exponer referencias externas controladas por el backend.

## 6. Consideraciones de implementacion en MySQL

1. Usar `utf8mb4`.
2. Usar tablas relacionales para atributos personalizados en lugar de depender exclusivamente de JSON.
3. Crear indices por `company_id`, `position_id`, `candidate_id`, `current_stage_id` y combinaciones frecuentes de consulta.
4. Mantener columnas de auditoria para trazabilidad operativa.

## 7. Diagrama asociado

El diagrama entidad relacion se documenta en `diagrama-er.mmd`.
