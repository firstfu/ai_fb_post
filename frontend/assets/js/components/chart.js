/**
 * 圖表組件 - 基於 Chart.js 的數據視覺化
 */

class ChartManager {
  constructor() {
    this.charts = new Map();
    this.defaultColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

    if (typeof Chart === "undefined") {
      console.warn("Chart.js 未載入");
      this.isAvailable = false;
    } else {
      this.isAvailable = true;
      this.configureDefaults();
    }
  }

  configureDefaults() {
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = "#64748B";
  }

  createLineChart(canvas, options = {}) {
    const element = this.getCanvasElement(canvas);
    if (!element) return null;

    const config = {
      type: "line",
      data: options.data || { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options.options,
      },
    };

    const chart = new Chart(element, config);
    this.charts.set(element.id || this.generateId(), chart);
    return chart;
  }

  createBarChart(canvas, options = {}) {
    const element = this.getCanvasElement(canvas);
    if (!element) return null;

    const config = {
      type: "bar",
      data: options.data || { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options.options,
      },
    };

    const chart = new Chart(element, config);
    this.charts.set(element.id || this.generateId(), chart);
    return chart;
  }

  createPieChart(canvas, options = {}) {
    const element = this.getCanvasElement(canvas);
    if (!element) return null;

    const defaultOptions = {
      type: "pie",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: this.defaultColors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
        },
      },
    };

    const config = Utils.mergeObjects(defaultOptions, options);
    const chart = new Chart(element, config);

    this.charts.set(element.id || this.generateId(), chart);
    return chart;
  }

  createDoughnutChart(canvas, options = {}) {
    const element = this.getCanvasElement(canvas);
    if (!element) return null;

    const defaultOptions = {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: this.defaultColors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
        },
      },
    };

    const config = Utils.mergeObjects(defaultOptions, options);
    const chart = new Chart(element, config);

    this.charts.set(element.id || this.generateId(), chart);
    return chart;
  }

  createAreaChart(canvas, options = {}) {
    const defaultOptions = {
      data: {
        datasets: [
          {
            fill: true,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderColor: "#3B82F6",
            tension: 0.4,
          },
        ],
      },
    };

    const config = Utils.mergeObjects(defaultOptions, options);
    return this.createLineChart(canvas, config);
  }

  updateChart(chart, newData) {
    const chartInstance = this.getChart(chart);
    if (!chartInstance) return;

    if (newData.labels) {
      chartInstance.data.labels = newData.labels;
    }

    if (newData.datasets) {
      chartInstance.data.datasets = newData.datasets;
    }

    chartInstance.update();
  }

  addDataPoint(chart, label, values) {
    const chartInstance = this.getChart(chart);
    if (!chartInstance) return;

    chartInstance.data.labels.push(label);

    chartInstance.data.datasets.forEach((dataset, index) => {
      dataset.data.push(values[index] || 0);
    });

    chartInstance.update();
  }

  removeDataPoint(chart, index) {
    const chartInstance = this.getChart(chart);
    if (!chartInstance) return;

    chartInstance.data.labels.splice(index, 1);

    chartInstance.data.datasets.forEach(dataset => {
      dataset.data.splice(index, 1);
    });

    chartInstance.update();
  }

  getChart(chart) {
    if (typeof chart === "string") {
      return this.charts.get(chart);
    }
    return chart;
  }

  destroyChart(chart) {
    const chartInstance = this.getChart(chart);
    if (chartInstance) {
      chartInstance.destroy();
      for (const [id, instance] of this.charts) {
        if (instance === chartInstance) {
          this.charts.delete(id);
          break;
        }
      }
    }
  }

  destroyAll() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  getCanvasElement(canvas) {
    if (!this.isAvailable) return null;

    let element = typeof canvas === "string" ? $(canvas)[0] : canvas instanceof jQuery ? canvas[0] : canvas;

    return element && element.tagName === "CANVAS" ? element : null;
  }

  generateId() {
    return "chart-" + Math.random().toString(36).substr(2, 9);
  }

  exportChart(chart, format = "png") {
    const chartInstance = this.getChart(chart);
    if (!chartInstance) return null;

    return chartInstance.toBase64Image(`image/${format}`, 1.0);
  }

  downloadChart(chart, filename = "chart", format = "png") {
    const dataUrl = this.exportChart(chart, format);
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
  }
}

/**
 * 圖表工廠類
 */
class ChartFactory {
  static autoCreate(container, data, options = {}) {
    const manager = new ChartManager();

    const canvas = document.createElement("canvas");
    canvas.id = `chart-${Utils.generateId()}`;
    container.appendChild(canvas);

    const chartType = options.type || this.detectChartType(data);

    switch (chartType) {
      case "line":
        return manager.createLineChart(canvas, { data, ...options });
      case "bar":
        return manager.createBarChart(canvas, { data, ...options });
      case "pie":
        return manager.createPieChart(canvas, { data, ...options });
      case "doughnut":
        return manager.createDoughnutChart(canvas, { data, ...options });
      case "area":
        return manager.createAreaChart(canvas, { data, ...options });
      default:
        return manager.createLineChart(canvas, { data, ...options });
    }
  }

  static detectChartType(data) {
    if (!data.datasets || data.datasets.length === 0) {
      return "line";
    }

    const dataset = data.datasets[0];

    if (data.datasets.length === 1 && data.labels && data.labels.length <= 8) {
      return "pie";
    }

    if (data.datasets.length > 1) {
      return "line";
    }

    return "bar";
  }

  static async createFromAPI(container, apiUrl, options = {}) {
    try {
      const response = await API.get(apiUrl);

      if (response.success && response.data) {
        return this.autoCreate(container, response.data, options);
      } else {
        console.error("無法從 API 獲取圖表數據:", response);
        return null;
      }
    } catch (error) {
      console.error("載入圖表數據失敗:", error);
      return null;
    }
  }
}

window.ChartManager = ChartManager;
window.ChartFactory = ChartFactory;

window.Charts = new ChartManager();
