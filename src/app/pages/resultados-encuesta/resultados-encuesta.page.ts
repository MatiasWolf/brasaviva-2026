import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonFooter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { SupabaseService } from '../../core/services/supabase.service';
import { MensajeModalService } from '../../core/services/mensaje-modal.service';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { MensajeModalComponent } from '../../shared/components/mensaje-modal/mensaje-modal.component';
import { traducirErrorSupabase } from '../../core/utils/traducir-error.util';
import { Encuesta } from '../../core/models/encuesta.model';

type SegmentoMétrica = 'comida' | 'atencion' | 'espera' | 'destacado' | 'recomienda';

const ORDEN_SEGMENTOS: SegmentoMétrica[] = ['comida', 'atencion', 'espera', 'destacado', 'recomienda'];

@Component({
  selector: 'app-resultados-encuesta',
  templateUrl: './resultados-encuesta.page.html',
  styleUrls: ['./resultados-encuesta.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonFooter,
    BaseChartDirective,
    SpinnerLogoComponent,
    MensajeModalComponent
  ]
})
export class ResultadosEncuestaPage implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly mensajeModal = inject(MensajeModalService);
  private readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly segmentoActual = signal<SegmentoMétrica>('comida');
  readonly totalEncuestas = signal<number>(0);

  readonly indiceSegmento = computed(() => ORDEN_SEGMENTOS.indexOf(this.segmentoActual()) + 1);
  readonly totalSegmentos = ORDEN_SEGMENTOS.length;

  // Paleta de colores unificada con la marca Brasa Viva
  private readonly colorDorado = '#ffd485';
  private readonly colorMarronMedio = '#4d200f';
  private readonly colorGlow = '#ffaa55';
  private readonly colorTextoClaro = '#fff1dc';

  // 1. Configuración Gráfico de Comida (Barras)
  chartComidaData: ChartConfiguration<'bar'>['data'] = { labels: ['1★', '2★', '3★', '4★', '5★'], datasets: [] };
  chartComidaOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: this.colorTextoClaro, font: { weight: 'bold' } },
        title: { display: true, text: 'Puntaje (Estrellas)', color: this.colorTextoClaro, font: { size: 12, weight: 'bold' } }
      },
      y: { 
        grid: { color: 'rgba(43, 20, 8, 0.12)' }, 
        ticks: { color: this.colorTextoClaro, stepSize: 1 },
        title: { display: true, text: 'Cantidad de Votos', color: this.colorTextoClaro, font: { size: 12, weight: 'bold' } }
      }
    }
  };
  // 2. Configuración Gráfico de Atención (Línea)
  chartAtencionData: ChartConfiguration<'line'>['data'] = { labels: ['1', '2', '3', '4', '5'], datasets: [] };
  chartAtencionOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { color: 'rgba(43, 20, 8, 0.06)' }, 
        ticks: { color: this.colorTextoClaro, font: { weight: 'bold' } },
        title: { display: true, text: 'Calificación', color: this.colorTextoClaro, font: { size: 12, weight: 'bold' } }
      },
      y: { 
        grid: { color: 'rgba(43, 20, 8, 0.12)' }, 
        ticks: { color: this.colorTextoClaro, stepSize: 1 },
        title: { display: true, text: 'Cantidad de Clientes', color: this.colorTextoClaro, font: { size: 12, weight: 'bold' } }
      }
    }
  };

  // 3. Configuración Gráfico de Espera (Dona Completa)
  chartEsperaData: ChartConfiguration<'pie'>['data'] = { labels: ['Corto', 'Adecuado', 'Excesivo'], datasets: [] };
  chartEsperaOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom', 
        labels: { 
          color: this.colorTextoClaro, 
          font: { size: 12, weight: 600 },
          boxWidth: 15,
          padding: 10,
          usePointStyle: true
        } 
      } 
    }
  };

  // 4. Configuración Gráfico de Aspecto Destacado (Área Polar)
  chartDestacadoData: ChartConfiguration<'polarArea'>['data'] = { 
    labels: ['Ambiente', 'Limpieza', 'Precios', 'Comida', 'Atención', 'Ninguno'], 
    datasets: [] 
  };
  chartDestacadoOptions: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom', 
        align: 'start', 
        labels: { 
          color: this.colorTextoClaro, 
          font: { size: 11, weight: 600 },
          boxWidth: 12,
          padding: 6,
          usePointStyle: true
        } 
      } 
    },
    scales: {
      r: {
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        angleLines: { color: 'rgba(0, 0, 0, 0.08)' },
        ticks: { 
          backdropColor: 'transparent', 
          color: this.colorTextoClaro,
          z: 10 }
      }
    }
  };

  // 5. Configuración Gráfico de Recomendación (Dona Semi-Circular / Medidor)
  chartRecomiendaData: ChartConfiguration<'doughnut'>['data'] = { labels: ['Recomienda', 'No Recomienda'], datasets: [] };
  chartRecomiendaOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    circumference: 180, // Dibuja solo medio círculo (arco superior)
    rotation: -90,      // Lo orienta como un velocímetro tradicional
    plugins: { 
      legend: { 
        position: 'bottom', 
        align: 'start',  // Alinea las referencias a la izquierda de la tarjeta
        labels: { 
          color: this.colorTextoClaro, 
          font: { size: 12, weight: 600 },
          boxWidth: 12,
          padding: 8,
          usePointStyle: true // Cambia a circulitos prolijos tipo viñeta
        } 
      } 
    }
  };

  constructor() {
    addIcons({ 'chevron-back-outline': chevronBackOutline, 'chevron-forward-outline': chevronForwardOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarYProcesarEstadísticas();
  }

  graficoAnterior(): void {
    const indice = ORDEN_SEGMENTOS.indexOf(this.segmentoActual());
    this.segmentoActual.set(ORDEN_SEGMENTOS[Math.max(0, indice - 1)]);
  }

  graficoSiguiente(): void {
    const indice = ORDEN_SEGMENTOS.indexOf(this.segmentoActual());
    this.segmentoActual.set(ORDEN_SEGMENTOS[Math.min(ORDEN_SEGMENTOS.length - 1, indice + 1)]);
  }

  private async cargarYProcesarEstadísticas(): Promise<void> {
    try {
      this.cargando.set(true);

      const { data: encuestas, error } = await this.supabaseService.client
        .from('encuestas')
        .select('*');

      if (error) throw error;

      const lista = (encuestas ?? []) as Encuesta[];

      if (lista.length === 0) {
        this.mensajeModal.error('Todavía no hay encuestas registradas en el sistema para calcular métricas.', 'Sin datos');
        void this.router.navigate(['/home'], { replaceUrl: true });
        return;
      }

      this.totalEncuestas.set(lista.length);

      this.procesarComida(lista);
      this.procesarAtencion(lista);
      this.procesarEspera(lista);
      this.procesarDestacado(lista);
      this.procesarRecomendacion(lista);

    } catch (error) {
      console.error('Error al calcular estadísticas:', error);
      const msg = traducirErrorSupabase(error);
      this.mensajeModal.error(msg, 'Error de reportes');
    } finally {
      this.cargando.set(false);
    }
  }

  private procesarComida(encuestas: Encuesta[]): void {
    const conteo = [0, 0, 0, 0, 0];
    encuestas.forEach(e => {
      const p = Math.round(e.puntaje_comida || e.puntaje_comida);
      if (p >= 1 && p <= 5) conteo[p - 1]++;
    });

    this.chartComidaData.datasets = [{
      data: conteo,
      backgroundColor: this.colorDorado,
      borderColor: this.colorGlow,
      borderWidth: 1,
      borderRadius: 6
    }];
  }

  private procesarAtencion(encuestas: Encuesta[]): void {
    const conteo = [0, 0, 0, 0, 0];
    encuestas.forEach(e => {
      const p = Math.round(e.puntaje_atencion);
      if (p >= 1 && p <= 5) conteo[p - 1]++;
    });

    this.chartAtencionData.datasets = [{
      data: conteo,
      borderColor: this.colorDorado,
      backgroundColor: 'rgba(255, 212, 133, 0.15)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: this.colorGlow
    }];
  }

  private procesarEspera(encuestas: Encuesta[]): void {
    let corto = 0, adecuado = 0, excesivo = 0;
    encuestas.forEach(e => {
      if (e.tiempo_espera === 'corto') corto++;
      if (e.tiempo_espera === 'adecuado') adecuado++;
      if (e.tiempo_espera === 'excesivo') excesivo++;
    });

    const total = encuestas.length;
  // Inyectamos totales y porcentajes en las leyendas inferiores
    this.chartEsperaData.labels = [
      `Corto: ${corto} (${Math.round((corto / total) * 100)}%)`,
      `Adecuado: ${adecuado} (${Math.round((adecuado / total) * 100)}%)`,
      `Excesivo: ${excesivo} (${Math.round((excesivo / total) * 100)}%)`
    ];

    this.chartEsperaData.datasets = [{
      data: [corto, adecuado, excesivo],
      backgroundColor: [this.colorDorado, this.colorGlow, this.colorMarronMedio],
      borderWidth: 0
    }];
  }

  private procesarDestacado(encuestas: Encuesta[]): void {
    const conteo: Record<string, number> = { ambiente: 0, limpieza: 0, precios: 0, comida: 0, atencion: 0, ninguno: 0 };
    encuestas.forEach(e => {
      if (conteo[e.aspecto_destacado] !== undefined) conteo[e.aspecto_destacado]++;
    });

    const total = encuestas.length;

    // Inyectamos de forma simétrica totales y porcentajes calculados en cada etiqueta
    this.chartDestacadoData.labels = [
      `Ambiente: ${conteo['ambiente']} (${Math.round((conteo['ambiente'] / total) * 100)}%)`,
      `Limpieza: ${conteo['limpieza']} (${Math.round((conteo['limpieza'] / total) * 100)}%)`,
      `Precios: ${conteo['precios']} (${Math.round((conteo['precios'] / total) * 100)}%)`,
      `Comida: ${conteo['comida']} (${Math.round((conteo['comida'] / total) * 100)}%)`,
      `Atención: ${conteo['atencion']} (${Math.round((conteo['atencion'] / total) * 100)}%)`,
      `Ninguno: ${conteo['ninguno']} (${Math.round((conteo['ninguno'] / total) * 100)}%)`
    ];

    this.chartDestacadoData.datasets = [{
      data: [conteo['ambiente'], conteo['limpieza'], conteo['precios'], conteo['comida'], conteo['atencion'], conteo['ninguno']],
      // Usamos la misma combinación de colores que ya tenías configurada en tu SCSS
      backgroundColor: [this.colorDorado, this.colorGlow, this.colorMarronMedio, '#35170b', '#805238', '#c0784d'],
      borderWidth: 0
    }];
  }

  private procesarRecomendacion(encuestas: Encuesta[]): void {
    let si = 0, no = 0;
    encuestas.forEach(e => {
      if (e.recomienda) si++; else no++;
    });

    const total = encuestas.length;

    // Inyectamos de forma limpia los totales y porcentajes en las leyendas de abajo
    this.chartRecomiendaData.labels = [
      `Sí: ${si} (${Math.round((si / total) * 100)}%)`,
      `No: ${no} (${Math.round((no / total) * 100)}%)`
    ];

    this.chartRecomiendaData.datasets = [{
      data: [si, no],
      backgroundColor: [this.colorDorado, this.colorGlow],
      borderColor: this.colorMarronMedio,
      borderWidth: 1
    }];
  }
}