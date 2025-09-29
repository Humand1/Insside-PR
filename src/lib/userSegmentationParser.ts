import * as XLSX from 'xlsx';
import { UserSegmentation, SegmentedEmployee } from './types';

export class UserSegmentationParser {
  private userMap: Map<string, UserSegmentation> = new Map();

  /**
   * Procesa un archivo Excel de segmentaciones de usuarios
   */
  async processFile(file: File): Promise<{
    users: UserSegmentation[];
    segmentations: string[];
    warnings: string[];
  }> {
    try {
      const workbook = await this.readExcelFile(file);
      const result = await this.processWorkbook(workbook);
      
      return {
        users: Array.from(this.userMap.values()),
        segmentations: result.segmentations,
        warnings: result.warnings
      };
    } catch (error) {
      throw new Error(`Error procesando archivo de segmentaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Lee el archivo Excel
   */
  private async readExcelFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Procesa el workbook completo
   */
  private async processWorkbook(workbook: XLSX.WorkBook): Promise<{
    segmentations: string[];
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const segmentations = new Set<string>();

    // Procesar cada hoja
    for (const sheetName of workbook.SheetNames) {
      try {
        const sheet = workbook.Sheets[sheetName];
        const sheetResult = await this.processSheet(sheet, sheetName);
        
        warnings.push(...sheetResult.warnings);
        sheetResult.segmentations.forEach(seg => segmentations.add(seg));
      } catch (error) {
        warnings.push(`Error procesando hoja "${sheetName}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return {
      segmentations: Array.from(segmentations),
      warnings
    };
  }

  /**
   * Procesa una hoja individual
   */
  private async processSheet(sheet: XLSX.WorkSheet, sheetName: string): Promise<{
    segmentations: string[];
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const segmentations = new Set<string>();

    try {
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (!jsonData || jsonData.length === 0) {
        warnings.push(`La hoja "${sheetName}" está vacía`);
        return { segmentations: [], warnings };
      }

      // Detectar estructura de la hoja
      const structure = this.analyzeSheetStructure(jsonData as any[][], sheetName);
      
      if (structure.isValid) {
        // Procesar datos de usuarios
        const users = this.extractUsers(jsonData as any[][], structure);
        
        // Agregar usuarios al mapa
        users.forEach(user => {
          this.userMap.set(user.id, user);
        });

        // Extraer segmentaciones disponibles
        structure.segmentationColumns.forEach(col => {
          segmentations.add(col);
        });
      } else {
        warnings.push(`La hoja "${sheetName}" no tiene una estructura válida de usuarios`);
      }
    } catch (error) {
      warnings.push(`Error procesando hoja "${sheetName}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return {
      segmentations: Array.from(segmentations),
      warnings
    };
  }

  /**
   * Analiza la estructura de la hoja para detectar columnas de usuarios y segmentaciones
   */
  private analyzeSheetStructure(data: any[][], sheetName: string): {
    isValid: boolean;
    userColumns: string[];
    segmentationColumns: string[];
    dataStartRow: number;
  } {
    if (!data || data.length < 2) {
      return {
        isValid: false,
        userColumns: [],
        segmentationColumns: [],
        dataStartRow: 0
      };
    }

    const headers = data[0] as string[];
    const userColumns: string[] = [];
    const segmentationColumns: string[] = [];

    // Detectar columnas de usuario (identificadores únicos)
    const userColumnPatterns = [
      'usuario', 'user', 'id', 'email', 'correo', 'mail',
      'nombre', 'name', 'apellido', 'surname', 'fullname', 'nombre y apellido'
    ];

    // Detectar columnas de segmentación
    const segmentationPatterns = [
      'area', 'área', 'department', 'departamento',
      'subarea', 'sub área', 'subarea', 'sub-area', 'sub area',
      'ubicacion', 'ubicación', 'location', 'sede',
      'region', 'región', 'zona', 'zone',
      'cargo', 'position', 'rol', 'role',
      'nivel', 'level', 'categoria', 'category'
    ];

    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      
      // Verificar si es columna de usuario
      if (userColumnPatterns.some(pattern => lowerHeader.includes(pattern))) {
        userColumns.push(header);
      }
      
      // Verificar si es columna de segmentación
      if (segmentationPatterns.some(pattern => lowerHeader.includes(pattern))) {
        segmentationColumns.push(header);
      }
    });

    return {
      isValid: userColumns.length > 0,
      userColumns,
      segmentationColumns,
      dataStartRow: 1
    };
  }

  /**
   * Extrae usuarios de los datos de la hoja
   */
  private extractUsers(data: any[][], structure: any): UserSegmentation[] {
    const users: UserSegmentation[] = [];
    const headers = data[0] as string[];

    for (let i = structure.dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const user = this.createUserFromRow(row, headers, structure);
        if (user) {
          users.push(user);
        }
      } catch (error) {
        console.warn(`Error procesando fila ${i + 1}:`, error);
      }
    }

    return users;
  }

  /**
   * Crea un usuario desde una fila de datos
   */
  private createUserFromRow(row: any[], headers: string[], structure: any): UserSegmentation | null {
    const userData: any = {};

    // Mapear datos de la fila
    headers.forEach((header, index) => {
      if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
        const normalizedHeader = header.toLowerCase().trim();
        userData[normalizedHeader] = row[index];
        // También mantener el header original para casos específicos
        userData[header] = row[index];
      }
    });

    // Extraer identificador único (prioridad: email > usuario > nombre)
    let userId = '';
    if (userData.email) {
      userId = userData.email;
    } else if (userData.usuario) {
      userId = userData.usuario;
    } else if (userData.nombre) {
      userId = userData.nombre;
    }

    if (!userId) {
      return null; // Sin identificador único
    }

    // Crear objeto de usuario
    const user: UserSegmentation = {
      id: userId,
      name: this.extractName(userData),
      area: userData.area || userData.área || userData['Area'],
      subArea: userData.subarea || userData['sub área'] || userData['sub-area'] || userData['Sub Area'],
      location: userData.ubicacion || userData.ubicación || userData.location || userData['Ubicación']
    };

    return user;
  }

  /**
   * Extrae el nombre completo del usuario
   */
  private extractName(userData: any): string {
    // Prioridad: "nombre y apellido" > nombre + apellido > nombre > name > fullname
    if (userData['nombre y apellido']) {
      return userData['nombre y apellido'].trim();
    } else if (userData.nombre && userData.apellido) {
      return `${userData.nombre} ${userData.apellido}`.trim();
    } else if (userData.nombre) {
      return userData.nombre.trim();
    } else if (userData.name) {
      return userData.name.trim();
    } else if (userData.fullname) {
      return userData.fullname.trim();
    } else {
      return 'Sin nombre';
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  getUserById(id: string): UserSegmentation | undefined {
    return this.userMap.get(id);
  }

  /**
   * Obtiene todos los usuarios
   */
  getAllUsers(): UserSegmentation[] {
    return Array.from(this.userMap.values());
  }

  /**
   * Obtiene usuarios por segmentación
   */
  getUsersBySegmentation(segmentationType: string, value: string): UserSegmentation[] {
    return Array.from(this.userMap.values()).filter(user => {
      switch (segmentationType.toLowerCase()) {
        case 'area':
        case 'área':
          return user.area === value;
        case 'subarea':
        case 'sub área':
        case 'sub-area':
          return user.subArea === value;
        case 'ubicacion':
        case 'ubicación':
        case 'location':
          return user.location === value;
        default:
          return false;
      }
    });
  }

  /**
   * Obtiene valores únicos de una segmentación
   */
  getSegmentationValues(segmentationType: string): string[] {
    const values = new Set<string>();
    
    Array.from(this.userMap.values()).forEach(user => {
      let value = '';
      switch (segmentationType.toLowerCase()) {
        case 'area':
        case 'área':
          value = user.area || '';
          break;
        case 'subarea':
        case 'sub área':
        case 'sub-area':
          value = user.subArea || '';
          break;
        case 'ubicacion':
        case 'ubicación':
        case 'location':
          value = user.location || '';
          break;
      }
      
      if (value && value.trim() !== '') {
        values.add(value);
      }
    });

    return Array.from(values).sort();
  }
}
