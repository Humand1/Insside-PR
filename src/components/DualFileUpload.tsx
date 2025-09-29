'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelParser } from '@/lib/excelParser';
import { UserSegmentationParser } from '@/lib/userSegmentationParser';
import { ProcessedData, UserSegmentation } from '@/lib/types';

interface DualFileUploadProps {
  onDataProcessed: (data: ProcessedData, segmentations: UserSegmentation[]) => void;
  onError: (error: string) => void;
  onWarning: (warning: string) => void;
}

export default function DualFileUpload({ onDataProcessed, onError, onWarning }: DualFileUploadProps) {
  const [step, setStep] = useState<'evaluations' | 'segmentations' | 'processing'>('evaluations');
  const [evaluationFile, setEvaluationFile] = useState<File | null>(null);
  const [segmentationFile, setSegmentationFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Configurar dropzones
  const evaluationDropzone = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setEvaluationFile(acceptedFiles[0]);
        setStep('segmentations');
      }
    },
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
  });

  const segmentationDropzone = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSegmentationFile(acceptedFiles[0]);
        setStep('processing');
      }
    },
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
  });

  const processFiles = async () => {
    if (!evaluationFile || !segmentationFile) return;

    setIsProcessing(true);
    setProcessingStatus('Procesando archivo de evaluaciones...');

    try {
      // Procesar archivo de evaluaciones
      const evaluationParser = new ExcelParser();
      const evaluationResult = await evaluationParser.processFile(evaluationFile);

      if (!evaluationResult.success) {
        throw new Error(`Error procesando evaluaciones: ${evaluationResult.errors.map(e => e.message).join(', ')}`);
      }

      setProcessingStatus('Procesando archivo de segmentaciones...');

      // Procesar archivo de segmentaciones
      const segmentationParser = new UserSegmentationParser();
      const segmentationResult = await segmentationParser.processFile(segmentationFile);

      setProcessingStatus('Integrando datos...');

      // Integrar segmentaciones al parser de evaluaciones
      evaluationParser.integrateUserSegmentations(segmentationResult.users);

      // Reprocesar con segmentaciones integradas
      const finalResult = await evaluationParser.processFile(evaluationFile);

      if (!finalResult.success) {
        throw new Error(`Error en procesamiento final: ${finalResult.errors.map(e => e.message).join(', ')}`);
      }

      // Mostrar advertencias
      [...finalResult.warnings, ...segmentationResult.warnings].forEach(warning => {
        onWarning(warning.message);
      });

      setProcessingStatus('Completado');
      
      // Notificar datos procesados
      onDataProcessed(finalResult.data!, segmentationResult.users);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const resetUpload = () => {
    setStep('evaluations');
    setEvaluationFile(null);
    setSegmentationFile(null);
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const renderDropzone = (title: string, description: string, onDrop: (files: File[]) => void, file: File | null) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
      <div className="space-y-4">
        <div className="text-2xl text-gray-400">📊</div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-gray-500">{description}</p>
        
        {file && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-700 font-medium">{file.name}</span>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-400">
          Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Análisis 360° con Segmentaciones</h1>
        <p className="text-gray-600">Sube tus archivos de evaluaciones y segmentaciones de usuarios</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step === 'evaluations' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'evaluations' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">Evaluaciones</span>
        </div>
        
        <div className={`w-8 h-0.5 ${step === 'segmentations' || step === 'processing' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        
        <div className={`flex items-center space-x-2 ${step === 'segmentations' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'segmentations' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">Segmentaciones</span>
        </div>
        
        <div className={`w-8 h-0.5 ${step === 'processing' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        
        <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="font-medium">Procesar</span>
        </div>
      </div>

      {/* Step 1: Evaluations */}
      {step === 'evaluations' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Paso 1: Archivo de Evaluaciones</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">📋 Formato esperado:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Hojas con nombres como "Autoevaluación", "Evaluación Descendente", etc.</li>
              <li>• Columnas: Nombre del evaluado, Área, Estado, Puntajes por competencia</li>
              <li>• Formatos soportados: .xlsx, .xls</li>
            </ul>
          </div>
          
          <div {...evaluationDropzone.getRootProps()} className="cursor-pointer">
            <input {...evaluationDropzone.getInputProps()} />
            {renderDropzone(
              'Archivo de Evaluaciones 360°',
              'Sube el archivo Excel con los datos de evaluaciones de desempeño',
              () => {},
              evaluationFile
            )}
          </div>
        </div>
      )}

      {/* Step 2: Segmentations */}
      {step === 'segmentations' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Paso 2: Archivo de Segmentaciones</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">🏢 Formato esperado:</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Columnas: Usuario, Nombre, Área, Sub Área, Ubicación</li>
              <li>• Permite filtrar por diferentes segmentaciones organizacionales</li>
              <li>• Se mapea automáticamente con los usuarios de las evaluaciones</li>
            </ul>
          </div>
          
          <div {...segmentationDropzone.getRootProps()} className="cursor-pointer">
            <input {...segmentationDropzone.getInputProps()} />
            {renderDropzone(
              'Archivo de Segmentaciones',
              'Sube el archivo Excel con las segmentaciones de usuarios',
              () => {},
              segmentationFile
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('evaluations')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Paso 3: Procesar Archivos</h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">📁 Archivos seleccionados:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📊</span>
                <span className="text-sm text-gray-700">{evaluationFile?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">🏢</span>
                <span className="text-sm text-gray-700">{segmentationFile?.name}</span>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">{processingStatus}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep('segmentations')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Volver
            </button>
            
            <button
              onClick={processFiles}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Procesando...' : 'Procesar Archivos'}
            </button>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(step === 'processing' || (evaluationFile && segmentationFile)) && (
        <div className="text-center">
          <button
            onClick={resetUpload}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            🔄 Empezar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
