import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  parseExcelFile,
  autoDetectMapping,
  convertRowsToIncidents,
  downloadSampleExcelTemplate,
} from '../utils/excelHelper';
import { ExcelColumnMapping, Incident, UserProfile } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (incidents: Incident[], mode: 'append' | 'replace') => void;
  currentUser: UserProfile;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currentUser,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ExcelColumnMapping>>({});
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setFile(selectedFile);

      const parsed = await parseExcelFile(selectedFile);
      if (parsed.data.length === 0) {
        throw new Error('La hoja seleccionada está vacía. Asegúrese de que tenga encabezados y filas de datos.');
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.data);
      setSheetNames(parsed.sheetNames);

      // Auto-detect columns
      const detected = autoDetectMapping(parsed.headers);
      setMapping(detected);

      setStep('mapping');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (field: keyof ExcelColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const executeImport = () => {
    if (!mapping.studentName) {
      setErrorMsg('Debe seleccionar la columna correspondiente al Nombre del Alumno.');
      return;
    }

    const fullMapping: ExcelColumnMapping = {
      studentName: mapping.studentName || '',
      studentGroup: mapping.studentGroup || '',
      date: mapping.date || '',
      timeSlot: mapping.timeSlot || '',
      subject: mapping.subject || '',
      teacherName: mapping.teacherName || '',
      category: mapping.category || '',
      severity: mapping.severity || '',
      description: mapping.description || '',
      location: mapping.location || '',
      immediateMeasure: mapping.immediateMeasure || '',
      status: mapping.status || '',
      familyNotified: mapping.familyNotified || '',
    };

    const newIncidents = convertRowsToIncidents(rawRows, fullMapping, currentUser);

    if (newIncidents.length === 0) {
      setErrorMsg('No se pudieron extraer incidencias válidas. Revise el mapeo de columnas.');
      return;
    }

    onImportComplete(newIncidents, importMode);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setStep('upload');
    setErrorMsg(null);
    onClose();
  };

  const previewIncidents = rawRows.length > 0 && mapping.studentName
    ? convertRowsToIncidents(rawRows.slice(0, 4), {
        studentName: mapping.studentName || '',
        studentGroup: mapping.studentGroup || '',
        date: mapping.date || '',
        timeSlot: mapping.timeSlot || '',
        subject: mapping.subject || '',
        teacherName: mapping.teacherName || '',
        category: mapping.category || '',
        severity: mapping.severity || '',
        description: mapping.description || '',
        location: mapping.location || '',
        immediateMeasure: mapping.immediateMeasure || '',
        status: mapping.status || '',
        familyNotified: mapping.familyNotified || '',
      }, currentUser)
    : [];

  return (
    <div
      id="modal-excel-import"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Transformar Hoja Excel en la Aplicación
              </h2>
              <p className="text-xs text-slate-700">
                Sube tu hoja (.xlsx, .xls o .csv) para importar tus alumnos e incidencias registradas
              </p>
            </div>
          </div>
          <button
            id="btn-close-excel-import"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Upload Zone */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Arrastra aquí tu hoja de Excel o haz clic para seleccionarla
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Formatos compatibles: .xlsx, .xls y archivos delimitados por comas (.csv)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Examinar archivos
                </button>
              </div>

              {/* Template download & instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      ¿Cómo debe estar estructurado el Excel?
                    </p>
                    <p className="text-slate-700">
                      No necesitas nombres exactos: nuestro detector inteligente mapeará automáticamente columnas como Alumno, Curso, Fecha, Conducta, Gravedad y Medida.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-download-excel-template"
                  onClick={downloadSampleExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Descargar Plantilla Modelo</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mapping & Configuration */}
          {step === 'mapping' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Archivo cargado: <span className="font-mono text-emerald-700">{file?.name}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Se han detectado {rawRows.length} registros y {headers.length} columnas en la hoja.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setStep('upload');
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Confirmar Mapeo de Columnas de tu Excel
                </h3>
                <p className="text-xs text-slate-700 mb-4">
                  Asocia las columnas de tu hoja con los campos de la aplicación. Las coincidencias detectadas automáticamente ya están seleccionadas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Student Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nombre del Alumno * <span className="text-red-500 font-normal">(Requerido)</span>
                    </label>
                    <select
                      value={mapping.studentName || ''}
                      onChange={(e) => handleMappingChange('studentName', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Seleccionar columna --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Group */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Curso / Grupo
                    </label>
                    <select
                      value={mapping.studentGroup || ''}
                      onChange={(e) => handleMappingChange('studentGroup', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- No incluir / Valor por defecto --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Fecha de la Incidencia
                    </label>
                    <select
                      value={mapping.date || ''}
                      onChange={(e) => handleMappingChange('date', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Fecha de hoy por defecto --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category / Conducta */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Tipo de Conducta / Motivo
                    </label>
                    <select
                      value={mapping.category || ''}
                      onChange={(e) => handleMappingChange('category', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Seleccionar columna --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Gravedad (Leve, Grave, Muy Grave)
                    </label>
                    <select
                      value={mapping.severity || ''}
                      onChange={(e) => handleMappingChange('severity', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Asignar Leve por defecto --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Descripción de los Hechos
                    </label>
                    <select
                      value={mapping.description || ''}
                      onChange={(e) => handleMappingChange('description', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Mismo que conducta --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Profesor / Docente Registrante
                    </label>
                    <select
                      value={mapping.teacherName || ''}
                      onChange={(e) => handleMappingChange('teacherName', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Usar usuario actual ({currentUser.name}) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Immediate Measure */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Medida o Sanción Aplicada
                    </label>
                    <select
                      value={mapping.immediateMeasure || ''}
                      onChange={(e) => handleMappingChange('immediateMeasure', e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- No incluir / Amonestación --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Destino de los Datos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-white border-emerald-500 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Añadir a las incidencias existentes
                      </span>
                      <span className="text-[11px] text-slate-700">
                        Conserva lo que ya tienes registrado y suma estas {rawRows.length} filas.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-white border-amber-500 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Reemplazar completamente
                      </span>
                      <span className="text-[11px] text-slate-700">
                        Inicia la aplicación con exclusivamente los datos de este archivo Excel.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Preview of first converted rows */}
              {previewIncidents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      Vista previa de los primeros registros a importar:
                    </span>
                    <span className="text-[11px] text-slate-700">
                      Mostrando {previewIncidents.length} de {rawRows.length} registros
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Alumno</th>
                          <th className="p-2.5">Curso</th>
                          <th className="p-2.5">Fecha</th>
                          <th className="p-2.5">Conducta</th>
                          <th className="p-2.5">Gravedad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {previewIncidents.map((inc, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{inc.studentName}</td>
                            <td className="p-2.5 text-slate-600">{inc.studentGroup}</td>
                            <td className="p-2.5 text-slate-600">{inc.date}</td>
                            <td className="p-2.5 text-slate-700 truncate max-w-[200px]">{inc.category}</td>
                            <td className="p-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  inc.severity === 'Muy Grave'
                                    ? 'bg-red-100 text-red-800'
                                    : inc.severity === 'Grave'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inc.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {step === 'mapping' && (
            <button
              type="button"
              id="btn-confirm-import-excel"
              onClick={executeImport}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Importar {rawRows.length} Registros a la Aplicación</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
