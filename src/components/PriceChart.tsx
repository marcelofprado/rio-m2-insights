import { useMemo } from 'react'
import { Chart, registerables } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { groupByMonth } from '../api/itbi'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

Chart.register(...registerables)

export default function PriceChart({ records, street }: { records: any[]; street: string }) {
  const filtered = records.filter((r) => r.address && r.address.toLowerCase().includes(street.toLowerCase()))
  const byMonth = groupByMonth(filtered)

  const last24 = useMemo(() => {
    const end = new Date()
    const months: string[] = []
    for (let i = 23; i >= 0; i--) months.push(format(subMonths(end, i), 'yyyy-MM'))

    const values = months.map((m) => {
      const items = byMonth[m] || []
      const prices = items.map((it: any) => it.m2Price).filter((v: any) => typeof v === 'number' && isFinite(v))
      // Since data is already aggregated, use average instead of median
      return prices.length ? prices.reduce((sum, val) => sum + val, 0) / prices.length : null
    })

    // For transaction counts, sum up the transactionCount field
    const counts = months.map((m) => {
      const items = byMonth[m] || []
      return items.reduce((sum: number, item: any) => sum + (item.transactionCount || 0), 0)
    })

    // Debug logging
    console.log('Chart data for', street)
    console.log('Filtered records:', filtered.length)
    console.log('Months with data:', months.filter((_, i) => values[i] !== null).length)
    const validValues = values.filter(v => v !== null) as number[]
    if (validValues.length > 0) {
      console.log('Price range:', Math.min(...validValues), '-', Math.max(...validValues))
    }

    return { months, values, counts }
  }, [byMonth, filtered.length, street])

  const chartData = {
    labels: last24.months.map((m) => format(new Date(m + '-01'), 'MMM yyyy', { locale: ptBR })),
    datasets: [
      {
        type: 'line' as const,
        label: 'R$/m²',
        data: last24.values.map((v) => (v === null ? null : Math.round(v))),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        spanGaps: true,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar' as const,
        label: 'Transações',
        data: last24.counts,
        backgroundColor: 'rgba(147, 51, 234, 0.3)',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  }

  const opts: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 13,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.type === 'line') {
                label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
              } else {
                label += context.parsed.y + ' transação' + (context.parsed.y !== 1 ? 'ões' : '');
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return 'R$ ' + value.toLocaleString('pt-BR');
          },
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Preço por m²',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Transações',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-800">Análise de Tendência de Preços</h3>
        <p className="text-sm sm:text-base text-slate-600 mt-1 truncate">{street}</p>
      </div>
      <div className="h-64 sm:h-80 md:h-96">
        <Line data={chartData} options={opts} />
      </div>
    </div>
  )
}
