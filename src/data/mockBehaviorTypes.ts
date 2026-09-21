import { BehaviorType } from '../types';

export const INITIAL_BEHAVIOR_TYPES: BehaviorType[] = [
  // Conductas Disruptivas (Puntuación Negativa)
  {
    id: 'bt-dis-01',
    name: 'Interrupción sistemática de la clase',
    type: 'disruptiva',
    points: -5,
    description: 'Hablar sin pedir turno, hacer ruidos molestos o distraer a otros compañeros.',
  },
  {
    id: 'bt-dis-02',
    name: 'Retraso injustificado a clase',
    type: 'disruptiva',
    points: -5,
    description: 'Llegada tarde a clase sin justificante oficial.',
  },
  {
    id: 'bt-dis-03',
    name: 'Negativa a trabajar o traer material',
    type: 'disruptiva',
    points: -10,
    description: 'No traer libros o cuadernos de forma reiterada o negarse a realizar las tareas.',
  },
  {
    id: 'bt-dis-04',
    name: 'Uso indebido de móvil o tecnología',
    type: 'disruptiva',
    points: -10,
    description: 'Utilizar el teléfono móvil, auriculares o dispositivos sin autorización en el aula.',
  },
  {
    id: 'bt-dis-05',
    name: 'Falta de respeto o desobediencia al profesor',
    type: 'disruptiva',
    points: -15,
    description: 'Desafiar al docente, contestaciones irrespetuosas o desobediencia manifiesta.',
  },
  {
    id: 'bt-dis-06',
    name: 'Insultos o burlas reiteradas a compañeros',
    type: 'disruptiva',
    points: -20,
    description: 'Comportamiento vejatorio, burlas, exclusión deliberada o agresión verbal.',
  },
  {
    id: 'bt-dis-07',
    name: 'Abandono del aula sin permiso',
    type: 'disruptiva',
    points: -20,
    description: 'Salir de clase o de las instalaciones del centro sin la debida autorización.',
  },
  {
    id: 'bt-dis-08',
    name: 'Deterioro intencionado de mobiliario escolar',
    type: 'disruptiva',
    points: -25,
    description: 'Pintar mesas, dañar equipos informáticos o deteriorar material común.',
  },
  {
    id: 'bt-dis-09',
    name: 'Agresión física o conducta peligrosa',
    type: 'disruptiva',
    points: -50,
    description: 'Peleas, empujones violentos o acciones que atenten contra la integridad física.',
  },

  // Conductas Positivas (Puntuación Positiva)
  {
    id: 'bt-pos-01',
    name: 'Participación destacada y constructiva',
    type: 'positiva',
    points: 5,
    description: 'Aportaciones de gran valor a los debates y explicaciones de clase.',
  },
  {
    id: 'bt-pos-02',
    name: 'Trabajo constante y esfuerzo notable',
    type: 'positiva',
    points: 5,
    description: 'Dedicación diaria, realización impecable de actividades y puntualidad.',
  },
  {
    id: 'bt-pos-03',
    name: 'Compañerismo y ayuda mutua',
    type: 'positiva',
    points: 10,
    description: 'Apoyar a compañeros con dificultades de aprendizaje o en situación de vulnerabilidad.',
  },
  {
    id: 'bt-pos-04',
    name: 'Resolución pacífica o mediación de conflictos',
    type: 'positiva',
    points: 15,
    description: 'Intervenir positivamente para calmar tensiones entre iguales y fomentar la convivencia.',
  },
  {
    id: 'bt-pos-05',
    name: 'Iniciativa y creatividad en proyectos',
    type: 'positiva',
    points: 10,
    description: 'Proponer ideas innovadoras y liderar trabajos cooperativos con espíritu de equipo.',
  },
  {
    id: 'bt-pos-06',
    name: 'Cuidado ejemplar de espacios y material',
    type: 'positiva',
    points: 5,
    description: 'Mantener el aula limpia y ordenada o colaborar voluntariamente en tareas de mantenimiento.',
  },
];
