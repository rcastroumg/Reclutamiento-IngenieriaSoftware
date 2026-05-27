# Modelado de Procesos de Negocio BPMN

## 1. Objetivo

Documentar los procesos centrales del negocio asociados al sistema de reclutamiento SaaS, identificando actores, flujo principal, puntos de decision e integraciones externas. El modelado se presenta en forma textual y mediante diagramas Mermaid con enfoque BPMN simplificado.

## 2. Procesos modelados

1. Creacion y publicacion de vacante
2. Postulacion de candidato
3. Gestion del pipeline de seleccion

## 3. Actores involucrados

1. Administrador
2. Reclutador
3. Candidato
4. Sistema de reclutamiento
5. API externa de correo
6. API externa de archivos

## 4. Proceso: Creacion y publicacion de vacante

Descripcion:
El reclutador crea una posicion definiendo atributos obligatorios, pipeline, scorecard, cuestionario y configuracion de publicacion. Posteriormente cambia el estado o publica la vacante para exponerla en el portal de empleo.

Archivo asociado: `bpmn-publicacion-vacante.mmd`

## 5. Proceso: Postulacion de candidato

Descripcion:
Un candidato consulta una vacante publicada, completa un formulario, adjunta informacion y el sistema registra o reutiliza su perfil global, generando una postulacion asociada a la posicion y la compania.

Archivo asociado: `bpmn-postulacion-candidato.mmd`

## 6. Proceso: Gestion del pipeline de seleccion

Descripcion:
El reclutador revisa una postulacion, la mueve entre etapas, asigna cuestionarios, registra scorecards y el sistema intenta enviar correos sincronicos en etapas configuradas. Si el correo falla, el cambio del negocio se mantiene y se registra el incidente.

Archivo asociado: `bpmn-reclutamiento.mmd`

## 7. Observaciones relevantes

1. El cambio de etapa pertenece a la postulacion y no al candidato global.
2. Las notificaciones por correo son sincronicas, pero su fallo no revierte la operacion principal.
3. La gestion documental depende de un servicio externo y el acceso debe protegerse con Bearer token.
4. Los procesos fueron modelados para apoyar el diseno del backend y del portal de empleo, aunque la implementacion inicial sea backend only.
