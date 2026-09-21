import * as XLSX from 'xlsx';
import { Incident, ExcelColumnMapping, SeverityLevel, IncidentStatus, UserProfile } from '../types';

export interface ParsedExcelResult {
  sheetNames: string[];
  data: Record<string, any>[];
  headers: string[];
}

export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('No se pudo leer el archivo seleccionado');
        }

        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('El archivo Excel no contiene hojas de cálculo');
        }

        const firstSheetName = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of objects with raw values
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        // Extract headers from the first row or sheet range
        let headers: string[] = [];
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
        } else {
          // If empty, inspect range
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell && cell.v) headers.push(String(cell.v).trim());
          }
        }

        resolve({
          sheetNames,
          data: jsonData,
          headers,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function autoDetectMapping(headers: string[]): Partial<ExcelColumnMapping> {
  const mapping: Partial<ExcelColumnMapping> = {};

  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  for (const header of headers) {
    const h = clean(header);

    // Alumno / Estudiante
    if (!mapping.studentName && (h.includes('alumno') || h.includes('estudiante') || h.includes('nombre') || h.includes('apellidos') || h === 'student')) {
      mapping.studentName = header;
    }
    // Curso / Grupo
    else if (!mapping.studentGroup && (h.includes('curso') || h.includes('grupo') || h.includes('clase') || h.includes('nivel') || h.includes('aula'))) {
      mapping.studentGroup = header;
    }
    // Fecha
    else if (!mapping.date && (h.includes('fecha') || h.includes('dia') || h === 'date')) {
      mapping.date = header;
    }
    // Hora / Franja
    else if (!mapping.timeSlot && (h.includes('hora') || h.includes('sesion') || h.includes('franja') || h.includes('tramo') || h.includes('periodo'))) {
      mapping.timeSlot = header;
    }
    // Asignatura / Materia
    else if (!mapping.subject && (h.includes('asignatura') || h.includes('materia') || h.includes('modulo') || h.includes('subject'))) {
      mapping.subject = header;
    }
    // Profesor
    else if (!mapping.teacherName && (h.includes('profesor') || h.includes('docente') || h.includes('tutor') || h.includes('maestro') || h.includes('teacher'))) {
      mapping.teacherName = header;
    }
    // Conducta / Categoria
    else if (!mapping.category && (h.includes('conducta') || h.includes('categoria') || h.includes('falta') || h.includes('tipo') || h.includes('infraccion') || h.includes('motivo'))) {
      mapping.category = header;
    }
    // Gravedad
    else if (!mapping.severity && (h.includes('gravedad') || h.includes('severidad') || h.includes('sancion_tipo') || h.includes('nivel') || h.includes('calificacion'))) {
      mapping.severity = header;
    }
    // Descripcion / Hechos
    else if (!mapping.description && (h.includes('descripcion') || h.includes('hecho') || h.includes('detalle') || h.includes('observacion') || h.includes('suceso') || h.includes('comentario'))) {
      mapping.description = header;
    }
    // Ubicación / Lugar
    else if (!mapping.location && (h.includes('lugar') || h.includes('ubicacion') || h.includes('espacio'))) {
      mapping.location = header;
    }
    // Medida inmediata
    else if (!mapping.immediateMeasure && (h.includes('medida') || h.includes('accion') || h.includes('sancion') || h.includes('correccion') || h.includes('consecuencia'))) {
      mapping.immediateMeasure = header;
    }
    // Estado
    else if (!mapping.status && (h.includes('estado') || h.includes('situacion') || h.includes('status'))) {
      mapping.status = header;
    }
    // Familia notificada
    else if (!mapping.familyNotified && (h.includes('familia') || h.includes('notificad') || h.includes('avisad') || h.includes('comunicad'))) {
      mapping.familyNotified = header;
    }
  }

  return mapping;
}

function normalizeSeverity(val: any): SeverityLevel {
  if (!val) return 'Leve';
  const str = String(val).toLowerCase().trim();
  if (str.includes('muy grave') || str.includes('critica') || str.includes('grave 2') || str.includes('3')) {
    return 'Muy Grave';
  }
  if (str.includes('grave') || str.includes('alta') || str.includes('2')) {
    return 'Grave';
  }
  return 'Leve';
}

function normalizeStatus(val: any): IncidentStatus {
  if (!val) return 'Abierta';
  const str = String(val).toLowerCase().trim();
  if (str.includes('cerr') || str.includes('resuelt') || str.includes('finaliz')) return 'Cerrada';
  if (str.includes('cumplid') || str.includes('complet')) return 'Medida cumplida';
  if (str.includes('seguim') || str.includes('proceso') || str.includes('mediac')) return 'En seguimiento';
  return 'Abierta';
}

function normalizeDate(val: any): string {
  if (!val) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  // If DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }
  // If already YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return s.substring(0, 10);
}

export function convertRowsToIncidents(
  rows: Record<string, any>[],
  mapping: ExcelColumnMapping,
  currentUser: UserProfile
): Incident[] {
  const result: Incident[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const studentName = mapping.studentName ? String(row[mapping.studentName] || '').trim() : '';
    if (!studentName) continue; // Skip completely empty rows

    const studentGroup = mapping.studentGroup ? String(row[mapping.studentGroup] || '1º ESO').trim() : '1º ESO';
    const date = mapping.date ? normalizeDate(row[mapping.date]) : new Date().toISOString().split('T')[0];
    const timeSlot = mapping.timeSlot ? String(row[mapping.timeSlot] || '1ª Hora').trim() : '1ª Hora (08:00 - 09:00)';
    const subject = mapping.subject ? String(row[mapping.subject] || 'General').trim() : 'General';
    const teacherName = mapping.teacherName ? String(row[mapping.teacherName] || currentUser.name).trim() : currentUser.name;
    const category = mapping.category ? String(row[mapping.category] || 'Conducta disruptiva').trim() : 'Conducta disruptiva';
    const severity = mapping.severity ? normalizeSeverity(row[mapping.severity]) : 'Leve';
    const description = mapping.description ? String(row[mapping.description] || 'Incidencia registrada').trim() : (category || 'Sin descripción');
    const location = mapping.location ? String(row[mapping.location] || 'Aula').trim() : 'Aula habitual';
    const immediateMeasure = mapping.immediateMeasure ? String(row[mapping.immediateMeasure] || 'Amonestación verbal').trim() : 'Amonestación verbal';
    const status = mapping.status ? normalizeStatus(row[mapping.status]) : 'Abierta';
    
    let familyNotified = false;
    if (mapping.familyNotified) {
      const fnVal = String(row[mapping.familyNotified]).toLowerCase();
      familyNotified = fnVal === 'si' || fnVal === 'sí' || fnVal === 'true' || fnVal === '1' || fnVal === 'yes';
    }

    const timestamp = new Date().toISOString();

    result.push({
      id: `imp-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      studentName,
      studentGroup,
      date,
      timeSlot,
      subject,
      teacherName,
      teacherRole: currentUser.role || 'Profesor',
      category,
      severity,
      description,
      location,
      immediateMeasure,
      status,
      familyNotified,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return result;
}

export function exportIncidentsToExcel(incidents: Incident[], filename = 'registro_conductas_aula.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Incidencias detalladas
  const incidentRows = incidents.map((inc, i) => ({
    'Nº': i + 1,
    'Fecha': inc.date,
    'Hora': inc.timeSlot,
    'Alumno': inc.studentName,
    'Curso / Grupo': inc.studentGroup,
    'Asignatura': inc.subject,
    'Profesor Registrante': inc.teacherName,
    'Conducta / Falta': inc.category,
    'Gravedad': inc.severity,
    'Descripción de los Hechos': inc.description,
    'Lugar': inc.location,
    'Medida Aplicada': inc.immediateMeasure,
    'Estado': inc.status,
    'Familia Notificada': inc.familyNotified ? 'Sí' : 'No',
    'Notas Dirección': inc.directivoNotes || '',
  }));

  const wsIncidents = XLSX.utils.json_to_sheet(incidentRows);
  XLSX.utils.book_append_sheet(wb, wsIncidents, 'Incidencias');

  // Sheet 2: Resumen por Alumno
  const studentMap = new Map<string, { group: string; total: number; leves: number; graves: number; muyGraves: number }>();
  incidents.forEach(inc => {
    const existing = studentMap.get(inc.studentName) || {
      group: inc.studentGroup,
      total: 0,
      leves: 0,
      graves: 0,
      muyGraves: 0,
    };
    existing.total += 1;
    if (inc.severity === 'Leve') existing.leves += 1;
    if (inc.severity === 'Grave') existing.graves += 1;
    if (inc.severity === 'Muy Grave') existing.muyGraves += 1;
    studentMap.set(inc.studentName, existing);
  });

  const studentSummaryRows = Array.from(studentMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([studentName, data]) => ({
      'Alumno': studentName,
      'Curso / Grupo': data.group,
      'Total Incidencias': data.total,
      'Faltas Leves': data.leves,
      'Faltas Graves': data.graves,
      'Faltas Muy Graves': data.muyGraves,
      'Nivel de Alerta': data.muyGraves > 0 || data.graves >= 2 || data.total >= 4 ? 'ALERTA / REINCIDENTE' : 'SEGUIMIENTO NORMAL',
    }));

  const wsSummary = XLSX.utils.json_to_sheet(studentSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Alumnos');

  // Sheet 3: Resumen por Curso
  const courseMap = new Map<string, number>();
  incidents.forEach(inc => {
    const count = courseMap.get(inc.studentGroup) || 0;
    courseMap.set(inc.studentGroup, count + 1);
  });
  const courseRows = Array.from(courseMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({
      'Curso / Grupo': group,
      'Total Incidencias': count,
      'Porcentaje': `${((count / (incidents.length || 1)) * 100).toFixed(1)}%`,
    }));
  const wsCourses = XLSX.utils.json_to_sheet(courseRows);
  XLSX.utils.book_append_sheet(wb, wsCourses, 'Resumen_Cursos');

  // Generate file
  XLSX.writeFile(wb, filename);
}

export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const sampleRows = [
    {
      'Alumno': 'Juan Pérez Lozano',
      'Curso': '2º ESO A',
      'Fecha': '2026-09-15',
      'Hora': '1ª Hora (08:00 - 09:00)',
      'Asignatura': 'Matemáticas',
      'Profesor': 'Carlos Ruiz',
      'Conducta': 'Interrupción sistemática de la clase',
      'Gravedad': 'Leve',
      'Descripcion': 'Interrumpe al profesor reiteradamente haciendo comentarios fuera de lugar y ruidos con el estuche.',
      'Lugar': 'Aula habitual',
      'Medida': 'Amonestación verbal y cambio de sitio a la primera fila.',
      'Estado': 'Medida cumplida',
      'Familia Notificada': 'No',
    },
    {
      'Alumno': 'Lucía Fernández Ramos',
      'Curso': '3º ESO B',
      'Fecha': '2026-09-15',
      'Hora': '3ª Hora (10:00 - 11:00)',
      'Asignatura': 'Lengua Castellana',
      'Profesor': 'Elena Morales',
      'Conducta': 'Falta de respeto o desobediencia al profesor',
      'Gravedad': 'Grave',
      'Descripcion': 'Se niega a entregar el teléfono móvil y contesta de forma despectiva a la profesora.',
      'Lugar': 'Aula habitual',
      'Medida': 'Envío a jefatura de estudios y parte disciplinario.',
      'Estado': 'En seguimiento',
      'Familia Notificada': 'Sí',
    },
    {
      'Alumno': 'Pedro Morales Gil',
      'Curso': '1º ESO C',
      'Fecha': '2026-09-16',
      'Hora': 'Recreo (11:00 - 11:30)',
      'Asignatura': 'Guardia / Recreo',
      'Profesor': 'Javier Navarro',
      'Conducta': 'Comportamiento peligroso o agresión física',
      'Gravedad': 'Muy Grave',
      'Descripcion': 'Pelea física con empujones y golpes en el patio tras una discusión por un partido de fútbol.',
      'Lugar': 'Patio de recreo',
      'Medida': 'Intervención de profesores de guardia y comparecencia urgente ante Directivo.',
      'Estado': 'Abierta',
      'Familia Notificada': 'Sí',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Incidencias');
  XLSX.writeFile(wb, 'plantilla_control_conductas_aula.xlsx');
}
